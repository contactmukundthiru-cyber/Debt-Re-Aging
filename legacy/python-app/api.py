"""
REST API Module
Provides programmatic access for integration with case management systems

Supports Legal Server, Salesforce, and custom integrations.
"""

import json
import base64
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from functools import wraps
import hashlib
import secrets

# Configure logging
logger = logging.getLogger(__name__)

# API Configuration
API_VERSION = "1.0"
API_KEYS_FILE = Path(__file__).parent.parent / 'output' / 'settings' / 'api_keys.json'


@dataclass
class APIResponse:
    """Standard API response format."""
    success: bool
    data: Any = None
    error: Optional[str] = None
    timestamp: str = ""
    api_version: str = API_VERSION

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

    def to_dict(self) -> Dict:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


@dataclass
class CaseSubmission:
    """Incoming case submission format."""
    raw_text: Optional[str] = None
    file_base64: Optional[str] = None
    file_name: Optional[str] = None
    consumer_name: Optional[str] = None
    consumer_state: Optional[str] = None
    consumer_address: Optional[str] = None
    metadata: Optional[Dict] = None


class APIKeyManager:
    """Manages API keys for authentication."""

    def __init__(self):
        self._ensure_keys_file()

    def _ensure_keys_file(self):
        """Ensure the API keys file exists."""
        API_KEYS_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not API_KEYS_FILE.exists():
            with open(API_KEYS_FILE, 'w') as f:
                json.dump({'keys': {}}, f)

    def _load_keys(self) -> Dict:
        """Load API keys from file."""
        with open(API_KEYS_FILE, 'r') as f:
            return json.load(f)

    def _save_keys(self, data: Dict):
        """Save API keys to file."""
        with open(API_KEYS_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    def generate_key(self, name: str, permissions: List[str] = None) -> str:
        """Generate a new API key."""
        key = f"dra_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(key.encode()).hexdigest()

        data = self._load_keys()
        data['keys'][key_hash] = {
            'name': name,
            'created': datetime.now().isoformat(),
            'permissions': permissions or ['read', 'write'],
            'last_used': None,
            'request_count': 0
        }
        self._save_keys(data)

        return key

    def validate_key(self, key: str) -> Optional[Dict]:
        """Validate an API key and return its metadata."""
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        data = self._load_keys()

        if key_hash in data['keys']:
            # Update usage stats
            data['keys'][key_hash]['last_used'] = datetime.now().isoformat()
            data['keys'][key_hash]['request_count'] += 1
            self._save_keys(data)
            return data['keys'][key_hash]
        return None

    def revoke_key(self, key: str) -> bool:
        """Revoke an API key."""
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        data = self._load_keys()

        if key_hash in data['keys']:
            del data['keys'][key_hash]
            self._save_keys(data)
            return True
        return False

    def list_keys(self) -> List[Dict]:
        """List all API keys (without the actual keys)."""
        data = self._load_keys()
        return [
            {'name': v['name'], 'created': v['created'],
             'last_used': v['last_used'], 'request_count': v['request_count']}
            for v in data['keys'].values()
        ]


class DebtReagingAPI:
    """
    Main API class for programmatic access to the Debt Re-Aging Case Factory.

    Example usage:
        api = DebtReagingAPI()

        # Submit a case with raw text
        result = api.analyze_text(
            raw_text="Account: ABC Collections\\nDOFD: 01/15/2018...",
            consumer_state="CA"
        )

        # Submit a case with a file
        with open("credit_report.pdf", "rb") as f:
            file_bytes = f.read()
        result = api.analyze_file(file_bytes, "credit_report.pdf")
    """

    def __init__(self):
        from app.parser import parse_credit_report, fields_to_editable_dict
        from app.rules import run_rules
        from app.extraction import extract_text_from_bytes
        from app.generator import generate_dispute_packet
        from app.case_manager import CaseManager, CaseData

        self.parse_credit_report = parse_credit_report
        self.fields_to_editable_dict = fields_to_editable_dict
        self.run_rules = run_rules
        self.extract_text_from_bytes = extract_text_from_bytes
        self.generate_dispute_packet = generate_dispute_packet
        self.case_manager = CaseManager()

    def analyze_text(
        self,
        raw_text: str,
        consumer_name: str = None,
        consumer_state: str = None,
        consumer_address: str = None,
        generate_packet: bool = False
    ) -> APIResponse:
        """
        Analyze raw credit report text.

        Args:
            raw_text: The extracted text from a credit report
            consumer_name: Optional consumer name for letters
            consumer_state: Optional state code for SOL checks
            consumer_address: Optional address for letters
            generate_packet: Whether to generate dispute documents

        Returns:
            APIResponse with analysis results
        """
        try:
            # Parse the text
            parsed = self.parse_credit_report(raw_text)
            fields = self.fields_to_editable_dict(parsed)

            # Prepare for rules
            verified_fields = {k: v.get('value') for k, v in fields.items()}
            if consumer_state:
                verified_fields['state_code'] = consumer_state

            # Run rules
            flags = self.run_rules(verified_fields)

            # Create case record
            case = self.case_manager.create_case()
            case.extracted_text = raw_text
            case.extraction_method = 'api'
            case.verified_fields = fields
            case.flags = [f.to_dict() if hasattr(f, 'to_dict') else f for f in flags]
            case.consumer_name = consumer_name or ''
            case.consumer_state = consumer_state or ''
            case.consumer_address = consumer_address or ''

            # Generate packet if requested
            packet_info = None
            if generate_packet and flags:
                consumer_info = {
                    'name': consumer_name,
                    'state': consumer_state,
                    'address': consumer_address
                } if consumer_name else None

                packet_result = self.generate_dispute_packet(
                    verified_fields=verified_fields,
                    flags=flags,
                    consumer_info=consumer_info
                )
                packet_info = {
                    'case_id': packet_result['case_id'],
                    'files': list(packet_result['generated_files'].keys()),
                    'output_directory': packet_result['output_directory']
                }
                case.packet_path = packet_result['zip_path']

            self.case_manager.save_case(case)

            return APIResponse(
                success=True,
                data={
                    'case_id': case.case_id,
                    'fields': fields,
                    'flags': [f.to_dict() if hasattr(f, 'to_dict') else f for f in flags],
                    'flag_count': len(flags),
                    'high_severity_count': len([f for f in flags
                                               if (f.get('severity') if isinstance(f, dict) else f.severity) == 'high']),
                    'packet': packet_info
                }
            )

        except Exception as e:
            return APIResponse(success=False, error=str(e))

    def analyze_file(
        self,
        file_bytes: bytes,
        filename: str,
        consumer_name: str = None,
        consumer_state: str = None,
        consumer_address: str = None,
        generate_packet: bool = False
    ) -> APIResponse:
        """
        Analyze a credit report file (PDF or image).

        Args:
            file_bytes: Raw file bytes
            filename: Original filename (used to determine file type)
            consumer_name: Optional consumer name
            consumer_state: Optional state code
            consumer_address: Optional address
            generate_packet: Whether to generate dispute documents

        Returns:
            APIResponse with analysis results
        """
        try:
            # Extract text from file
            extracted_text, method = self.extract_text_from_bytes(file_bytes, filename)

            if method == "error":
                return APIResponse(success=False, error=f"Extraction failed: {extracted_text}")

            # Analyze the extracted text
            result = self.analyze_text(
                raw_text=extracted_text,
                consumer_name=consumer_name,
                consumer_state=consumer_state,
                consumer_address=consumer_address,
                generate_packet=generate_packet
            )

            # Add extraction info to response
            if result.success:
                result.data['extraction_method'] = method

            return result

        except Exception as e:
            return APIResponse(success=False, error=str(e))

    def get_case(self, case_id: str) -> APIResponse:
        """Retrieve a case by ID."""
        case = self.case_manager.load_case(case_id)
        if case:
            return APIResponse(success=True, data=asdict(case))
        return APIResponse(success=False, error=f"Case {case_id} not found")

    def list_cases(
        self,
        status: str = None,
        limit: int = 50,
        offset: int = 0
    ) -> APIResponse:
        """List cases with optional filtering."""
        cases = self.case_manager.list_cases(status=status, limit=limit + offset)
        return APIResponse(
            success=True,
            data={
                'cases': cases[offset:offset + limit],
                'total': len(cases),
                'limit': limit,
                'offset': offset
            }
        )

    def update_case_outcome(
        self,
        case_id: str,
        outcome: str,
        notes: str = ""
    ) -> APIResponse:
        """Update the outcome of a case."""
        success = self.case_manager.set_case_outcome(case_id, outcome, notes)
        if success:
            return APIResponse(success=True, data={'case_id': case_id, 'outcome': outcome})
        return APIResponse(success=False, error=f"Failed to update case {case_id}")

    def get_statistics(self) -> APIResponse:
        """Get aggregate statistics."""
        stats = self.case_manager.get_outcome_statistics()
        return APIResponse(success=True, data=stats)

    def download_packet(self, case_id: str) -> APIResponse:
        """Get the packet ZIP file as base64."""
        case = self.case_manager.load_case(case_id)
        if not case:
            return APIResponse(success=False, error=f"Case {case_id} not found")

        if not case.packet_path or not Path(case.packet_path).exists():
            return APIResponse(success=False, error="Packet not generated for this case")

        with open(case.packet_path, 'rb') as f:
            packet_bytes = f.read()

        return APIResponse(
            success=True,
            data={
                'case_id': case_id,
                'filename': f"{case_id}_packet.zip",
                'content_base64': base64.b64encode(packet_bytes).decode('utf-8'),
                'size_bytes': len(packet_bytes)
            }
        )


# Flask/FastAPI integration helpers
def create_flask_blueprint():
    """Create a Flask blueprint for the API."""
    try:
        from flask import Blueprint, request, jsonify
    except ImportError:
        return None

    api_bp = Blueprint('debt_reaging_api', __name__, url_prefix='/api/v1')
    api = DebtReagingAPI()
    key_manager = APIKeyManager()

    def require_api_key(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            key = request.headers.get('X-API-Key')
            if not key:
                return jsonify({'error': 'API key required'}), 401
            if not key_manager.validate_key(key):
                return jsonify({'error': 'Invalid API key'}), 403
            return f(*args, **kwargs)
        return decorated

    @api_bp.route('/analyze', methods=['POST'])
    @require_api_key
    def analyze():
        data = request.json
        if data.get('raw_text'):
            result = api.analyze_text(
                raw_text=data['raw_text'],
                consumer_name=data.get('consumer_name'),
                consumer_state=data.get('consumer_state'),
                consumer_address=data.get('consumer_address'),
                generate_packet=data.get('generate_packet', False)
            )
        elif data.get('file_base64'):
            file_bytes = base64.b64decode(data['file_base64'])
            result = api.analyze_file(
                file_bytes=file_bytes,
                filename=data.get('filename', 'upload.pdf'),
                consumer_name=data.get('consumer_name'),
                consumer_state=data.get('consumer_state'),
                consumer_address=data.get('consumer_address'),
                generate_packet=data.get('generate_packet', False)
            )
        else:
            return jsonify({'error': 'raw_text or file_base64 required'}), 400

        return jsonify(result.to_dict())

    @api_bp.route('/cases', methods=['GET'])
    @require_api_key
    def list_cases():
        result = api.list_cases(
            status=request.args.get('status'),
            limit=int(request.args.get('limit', 50)),
            offset=int(request.args.get('offset', 0))
        )
        return jsonify(result.to_dict())

    @api_bp.route('/cases/<case_id>', methods=['GET'])
    @require_api_key
    def get_case(case_id):
        result = api.get_case(case_id)
        return jsonify(result.to_dict())

    @api_bp.route('/cases/<case_id>/outcome', methods=['PUT'])
    @require_api_key
    def update_outcome(case_id):
        data = request.json
        result = api.update_case_outcome(
            case_id=case_id,
            outcome=data.get('outcome'),
            notes=data.get('notes', '')
        )
        return jsonify(result.to_dict())

    @api_bp.route('/statistics', methods=['GET'])
    @require_api_key
    def statistics():
        result = api.get_statistics()
        return jsonify(result.to_dict())

    return api_bp


# Webhook support for notifications
class WebhookManager:
    """Manages webhooks for external notifications."""

    WEBHOOKS_FILE = Path(__file__).parent.parent / 'output' / 'settings' / 'webhooks.json'

    def __init__(self):
        self._ensure_file()

    def _ensure_file(self):
        self.WEBHOOKS_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not self.WEBHOOKS_FILE.exists():
            with open(self.WEBHOOKS_FILE, 'w') as f:
                json.dump({'webhooks': []}, f)

    def _load(self) -> Dict:
        with open(self.WEBHOOKS_FILE, 'r') as f:
            return json.load(f)

    def _save(self, data: Dict):
        with open(self.WEBHOOKS_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    def register(self, url: str, events: List[str], secret: str = None) -> str:
        """Register a webhook."""
        webhook_id = secrets.token_urlsafe(16)
        data = self._load()
        data['webhooks'].append({
            'id': webhook_id,
            'url': url,
            'events': events,  # e.g., ['case.created', 'case.completed', 'flag.detected']
            'secret': secret or secrets.token_urlsafe(32),
            'created': datetime.now().isoformat(),
            'enabled': True
        })
        self._save(data)
        return webhook_id

    def trigger(self, event: str, payload: Dict):
        """Trigger webhooks for an event."""
        import requests

        data = self._load()
        for webhook in data['webhooks']:
            if not webhook['enabled']:
                continue
            if event not in webhook['events'] and '*' not in webhook['events']:
                continue

            try:
                # Create signature
                signature = hashlib.sha256(
                    (webhook['secret'] + json.dumps(payload)).encode()
                ).hexdigest()

                requests.post(
                    webhook['url'],
                    json={
                        'event': event,
                        'timestamp': datetime.now().isoformat(),
                        'payload': payload
                    },
                    headers={
                        'X-Webhook-Signature': signature,
                        'Content-Type': 'application/json'
                    },
                    timeout=10
                )
            except Exception as e:
                logger.error(f"Webhook delivery failed for {webhook['url']}: {e}")


# Integration examples
INTEGRATION_EXAMPLES = {
    'python': '''
from app.api import DebtReagingAPI

api = DebtReagingAPI()

# Analyze raw text
result = api.analyze_text(
    raw_text="Account: ABC Collections\\nOriginal Creditor: XYZ Bank\\nDOFD: 2018-03-15...",
    consumer_state="CA",
    generate_packet=True
)

if result.success:
    print(f"Case ID: {result.data['case_id']}")
    print(f"Flags found: {result.data['flag_count']}")
''',

    'curl': '''
# Analyze text via API
curl -X POST http://localhost:5000/api/v1/analyze \\
  -H "X-API-Key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "raw_text": "Account: ABC Collections...",
    "consumer_state": "CA",
    "generate_packet": true
  }'

# Get case details
curl http://localhost:5000/api/v1/cases/DRA-20240115-ABC123 \\
  -H "X-API-Key: your_api_key"
''',

    'javascript': '''
const response = await fetch('http://localhost:5000/api/v1/analyze', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    raw_text: 'Account: ABC Collections...',
    consumer_state: 'CA',
    generate_packet: true
  })
});

const result = await response.json();
console.log(`Case ID: ${result.data.case_id}`);
'''
}
