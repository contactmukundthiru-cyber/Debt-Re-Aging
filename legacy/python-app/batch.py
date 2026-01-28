"""
Batch processing for multiple accounts.

Allows processing multiple tradelines from a single credit report
or multiple credit reports at once.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import zipfile

from app.parser import parse_credit_report, CreditReportParser
from app.rules import run_rules, RuleEngine
from app.generator import generate_dispute_packet
from app.utils import generate_case_id


@dataclass
class AccountEntry:
    """Represents a single account/tradeline."""
    account_id: str
    raw_text: str
    fields: Dict[str, Any]
    flags: List[Dict[str, Any]]
    verified: bool = False


@dataclass
class BatchResult:
    """Results from batch processing."""
    batch_id: str
    timestamp: str
    total_accounts: int
    accounts_with_flags: int
    total_flags: int
    high_severity_count: int
    medium_severity_count: int
    low_severity_count: int
    accounts: List[AccountEntry]
    output_path: Optional[str] = None


class BatchProcessor:
    """
    Process multiple accounts in batch mode.
    """

    def __init__(self):
        self.parser = CreditReportParser()
        self.rule_engine = RuleEngine()

    def split_into_accounts(self, full_text: str) -> List[str]:
        """
        Split a full credit report into individual account sections.

        Args:
            full_text: Full extracted text from credit report

        Returns:
            List of text sections, one per account
        """
        # Common account separators/headers
        separators = [
            '\n\nACCOUNT',
            '\n\nTRADELINE',
            '\n\nCOLLECTION',
            '\n\n---',
            '\n\n___',
            '\n\nCreditor:',
            '\n\nCreditor Name:',
            '\n\nAccount Number:',
        ]

        # Try to split by separators
        sections = [full_text]

        for sep in separators:
            new_sections = []
            for section in sections:
                parts = section.split(sep)
                for i, part in enumerate(parts):
                    if i > 0:
                        part = sep.strip() + part  # Add separator back
                    if part.strip():
                        new_sections.append(part.strip())
            if len(new_sections) > len(sections):
                sections = new_sections

        # Filter out very short sections (likely not real accounts)
        sections = [s for s in sections if len(s) > 100]

        return sections if sections else [full_text]

    def process_account(self, text: str, account_id: str) -> AccountEntry:
        """
        Process a single account section.

        Args:
            text: Account text
            account_id: Unique account identifier

        Returns:
            AccountEntry with parsed fields and flags
        """
        # Parse the text
        parsed = self.parser.parse(text)
        fields = parsed.to_dict()

        # Convert to simple value dict for rule checking
        simple_fields = {}
        for key, data in fields.items():
            simple_fields[key] = data.get('value')

        # Run rules
        flags = run_rules(simple_fields)

        return AccountEntry(
            account_id=account_id,
            raw_text=text,
            fields=fields,
            flags=flags,
            verified=False
        )

    def process_batch(
        self,
        texts: List[str],
        auto_split: bool = False
    ) -> BatchResult:
        """
        Process multiple account texts.

        Args:
            texts: List of account text sections
            auto_split: If True, try to split each text into multiple accounts

        Returns:
            BatchResult with all processed accounts
        """
        batch_id = f"BATCH-{generate_case_id()[3:]}"
        accounts = []

        # Optionally split texts into more accounts
        if auto_split:
            expanded_texts = []
            for text in texts:
                sections = self.split_into_accounts(text)
                expanded_texts.extend(sections)
            texts = expanded_texts

        # Process each account
        for i, text in enumerate(texts):
            account_id = f"{batch_id}-{i+1:03d}"
            account = self.process_account(text, account_id)
            accounts.append(account)
            
        # Run batch-level rules (like DU1)
        simple_account_list = []
        for acc in accounts:
            simple_acc = {k: v.get('value') for k, v in acc.fields.items()}
            simple_account_list.append(simple_acc)
            
        batch_flags = self.rule_engine.check_batch_rules(simple_account_list)
        
        # Apply batch flags back to individual accounts
        for flag in batch_flags:
            involved_indices = flag.pop('involved_indices', [])
            for idx in involved_indices:
                if idx < len(accounts):
                    accounts[idx].flags.append(flag)

        # Calculate summary stats
        accounts_with_flags = sum(1 for a in accounts if a.flags)
        total_flags = sum(len(a.flags) for a in accounts)
        high_severity = sum(
            sum(1 for f in a.flags if f.get('severity') == 'high')
            for a in accounts
        )
        medium_severity = sum(
            sum(1 for f in a.flags if f.get('severity') == 'medium')
            for a in accounts
        )
        low_severity = sum(
            sum(1 for f in a.flags if f.get('severity') == 'low')
            for a in accounts
        )

        return BatchResult(
            batch_id=batch_id,
            timestamp=datetime.now().isoformat(),
            total_accounts=len(accounts),
            accounts_with_flags=accounts_with_flags,
            total_flags=total_flags,
            high_severity_count=high_severity,
            medium_severity_count=medium_severity,
            low_severity_count=low_severity,
            accounts=accounts
        )

    def generate_batch_packet(
        self,
        batch_result: BatchResult,
        verified_accounts: List[Dict[str, Any]],
        consumer_info: Optional[Dict[str, str]] = None,
        output_dir: Optional[str] = None
    ) -> str:
        """
        Generate dispute packets for all accounts in batch.

        Args:
            batch_result: BatchResult from process_batch
            verified_accounts: List of verified field dictionaries
            consumer_info: Optional consumer information
            output_dir: Output directory

        Returns:
            Path to the batch ZIP file
        """
        if output_dir is None:
            repo_root = Path(__file__).resolve().parents[2]
            output_dir = repo_root / 'output'

        batch_dir = Path(output_dir) / batch_result.batch_id
        batch_dir.mkdir(parents=True, exist_ok=True)

        all_files = {}

        # Generate packet for each flagged account
        for i, account in enumerate(batch_result.accounts):
            if not account.flags:
                continue

            # Get verified fields for this account
            if i < len(verified_accounts):
                verified = verified_accounts[i]
            else:
                verified = {k: v.get('value') for k, v in account.fields.items()}

            # Generate individual packet
            result = generate_dispute_packet(
                verified_fields=verified,
                flags=account.flags,
                consumer_info=consumer_info,
                case_id=account.account_id,
                output_dir=str(batch_dir)
            )

            all_files[account.account_id] = result['generated_files']

        # Create batch summary
        summary = self._create_batch_summary(batch_result)
        summary_path = batch_dir / 'batch_summary.md'
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary)

        # Create master ZIP
        zip_path = Path(output_dir) / f"{batch_result.batch_id}_complete.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add summary
            zipf.write(summary_path, f"{batch_result.batch_id}/batch_summary.md")

            # Add all account files
            for account_id, files in all_files.items():
                for filename, filepath in files.items():
                    arcname = f"{batch_result.batch_id}/{account_id}/{filename}"
                    zipf.write(filepath, arcname)

        batch_result.output_path = str(zip_path)
        return str(zip_path)

    def _create_batch_summary(self, batch_result: BatchResult) -> str:
        """Create a markdown summary for the batch."""
        summary = f"""# Batch Processing Summary

**Batch ID:** {batch_result.batch_id}
**Processed:** {batch_result.timestamp}

---

## Overview

| Metric | Value |
|--------|-------|
| Total Accounts Processed | {batch_result.total_accounts} |
| Accounts with Flags | {batch_result.accounts_with_flags} |
| Total Flags Identified | {batch_result.total_flags} |
| High Severity Flags | {batch_result.high_severity_count} |
| Medium Severity Flags | {batch_result.medium_severity_count} |
| Low Severity Flags | {batch_result.low_severity_count} |

---

## Account Details

"""

        for account in batch_result.accounts:
            creditor = account.fields.get('furnisher_or_collector', {}).get('value', 'Unknown')
            flag_count = len(account.flags)
            status = "Flagged" if flag_count > 0 else "No Issues"

            summary += f"""### {account.account_id}

- **Creditor:** {creditor}
- **Status:** {status}
- **Flags:** {flag_count}

"""
            if account.flags:
                for flag in account.flags:
                    summary += f"  - [{flag.get('severity', 'unknown').upper()}] {flag.get('rule_name', 'Unknown')}\n"

            summary += "\n"

        summary += """---

*This summary was generated by Debt Re-Aging Case Factory*
*Built by Mukund Thiru — student-led research & systems project*
"""

        return summary


def process_multiple_files(
    file_contents: List[Tuple[str, bytes]],
    auto_split: bool = True
) -> BatchResult:
    """
    Process multiple uploaded files.

    Args:
        file_contents: List of (filename, bytes) tuples
        auto_split: Whether to split files into multiple accounts

    Returns:
        BatchResult
    """
    from app.extraction import extract_text_from_bytes

    texts = []
    for filename, content in file_contents:
        text, method = extract_text_from_bytes(content, filename)
        if method != "error":
            texts.append(text)

    processor = BatchProcessor()
    return processor.process_batch(texts, auto_split=auto_split)
