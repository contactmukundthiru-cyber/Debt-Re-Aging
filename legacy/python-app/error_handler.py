"""
Comprehensive Error Handler Module
Provides user-friendly error messages and recovery guidance

Designed to help non-technical users understand and resolve issues.
"""

import traceback
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, Callable
from functools import wraps
from dataclasses import dataclass
from enum import Enum


# Setup logging
LOG_DIR = Path(__file__).parent.parent / 'logs'
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    filename=LOG_DIR / f'errors_{datetime.now().strftime("%Y%m%d")}.log',
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger('debt_reaging')


class ErrorCategory(Enum):
    """Categories of errors for appropriate handling."""
    FILE_ERROR = "file_error"
    OCR_ERROR = "ocr_error"
    PARSING_ERROR = "parsing_error"
    NETWORK_ERROR = "network_error"
    PERMISSION_ERROR = "permission_error"
    VALIDATION_ERROR = "validation_error"
    GENERATION_ERROR = "generation_error"
    SYSTEM_ERROR = "system_error"
    USER_ERROR = "user_error"


@dataclass
class ErrorInfo:
    """Structured error information."""
    category: ErrorCategory
    title: str
    message: str
    suggestion: str
    technical_details: Optional[str] = None
    can_retry: bool = True
    show_support: bool = False


# User-friendly error messages
ERROR_MESSAGES: Dict[str, ErrorInfo] = {
    # File errors
    'file_not_found': ErrorInfo(
        category=ErrorCategory.FILE_ERROR,
        title="File Not Found",
        message="We couldn't find the file you specified.",
        suggestion="Please check that the file exists and try uploading again.",
        can_retry=True
    ),
    'file_too_large': ErrorInfo(
        category=ErrorCategory.FILE_ERROR,
        title="File Too Large",
        message="The file you uploaded is too large for us to process.",
        suggestion="Try uploading a smaller file (under 10MB) or split it into multiple parts.",
        can_retry=True
    ),
    'unsupported_format': ErrorInfo(
        category=ErrorCategory.FILE_ERROR,
        title="Unsupported File Type",
        message="We don't support this file format yet.",
        suggestion="Please upload a PDF, PNG, JPG, or TXT file.",
        can_retry=True
    ),
    'corrupted_file': ErrorInfo(
        category=ErrorCategory.FILE_ERROR,
        title="File Appears Corrupted",
        message="We couldn't read this file. It may be damaged.",
        suggestion="Try re-downloading or re-scanning your credit report and uploading again.",
        can_retry=True
    ),

    # OCR errors
    'ocr_failed': ErrorInfo(
        category=ErrorCategory.OCR_ERROR,
        title="Text Recognition Failed",
        message="We had trouble reading the text in your image.",
        suggestion="Try uploading a clearer image with good lighting. Make sure text is not blurry or cut off.",
        can_retry=True
    ),
    'tesseract_not_found': ErrorInfo(
        category=ErrorCategory.OCR_ERROR,
        title="OCR Engine Not Available",
        message="The text recognition system is not installed.",
        suggestion="If you're running this locally, please install Tesseract OCR. Or try uploading a PDF instead of an image.",
        can_retry=False,
        show_support=True
    ),
    'image_too_small': ErrorInfo(
        category=ErrorCategory.OCR_ERROR,
        title="Image Too Small",
        message="The image resolution is too low to read clearly.",
        suggestion="Please upload a higher resolution image (at least 150 DPI is recommended).",
        can_retry=True
    ),

    # Parsing errors
    'no_text_found': ErrorInfo(
        category=ErrorCategory.PARSING_ERROR,
        title="No Text Found",
        message="We couldn't find any text in your document.",
        suggestion="Make sure you uploaded a credit report document. If it's an image, ensure it's not blank.",
        can_retry=True
    ),
    'invalid_format': ErrorInfo(
        category=ErrorCategory.PARSING_ERROR,
        title="Unexpected Format",
        message="This doesn't look like a standard credit report format.",
        suggestion="We support reports from Experian, Equifax, and TransUnion. Make sure you're uploading the full report.",
        can_retry=True
    ),
    'missing_fields': ErrorInfo(
        category=ErrorCategory.PARSING_ERROR,
        title="Missing Information",
        message="We couldn't find some expected information in the report.",
        suggestion="The document may be incomplete. Try uploading the full credit report, including all pages.",
        can_retry=True
    ),

    # Network errors
    'connection_failed': ErrorInfo(
        category=ErrorCategory.NETWORK_ERROR,
        title="Connection Problem",
        message="We're having trouble connecting to our servers.",
        suggestion="Please check your internet connection and try again in a moment.",
        can_retry=True
    ),
    'timeout': ErrorInfo(
        category=ErrorCategory.NETWORK_ERROR,
        title="Request Timed Out",
        message="The operation took too long to complete.",
        suggestion="Please try again. If this keeps happening, try uploading a smaller file.",
        can_retry=True
    ),

    # Permission errors
    'write_permission': ErrorInfo(
        category=ErrorCategory.PERMISSION_ERROR,
        title="Cannot Save File",
        message="We don't have permission to save files to this location.",
        suggestion="Try running the application as administrator, or check that the output folder is writable.",
        can_retry=False,
        show_support=True
    ),
    'read_permission': ErrorInfo(
        category=ErrorCategory.PERMISSION_ERROR,
        title="Cannot Read File",
        message="We don't have permission to read this file.",
        suggestion="Check that the file is not locked by another program and try again.",
        can_retry=True
    ),

    # Validation errors
    'invalid_date': ErrorInfo(
        category=ErrorCategory.VALIDATION_ERROR,
        title="Invalid Date",
        message="One of the dates entered is not valid.",
        suggestion="Please enter dates in MM/DD/YYYY format.",
        can_retry=True
    ),
    'required_field': ErrorInfo(
        category=ErrorCategory.VALIDATION_ERROR,
        title="Required Information Missing",
        message="Please fill in all required fields before continuing.",
        suggestion="Look for fields marked with * and make sure they're filled in.",
        can_retry=True
    ),
    'invalid_input': ErrorInfo(
        category=ErrorCategory.VALIDATION_ERROR,
        title="Invalid Input",
        message="Some information you entered is not in the expected format.",
        suggestion="Please check your input and try again.",
        can_retry=True
    ),

    # Generation errors
    'template_error': ErrorInfo(
        category=ErrorCategory.GENERATION_ERROR,
        title="Letter Generation Failed",
        message="We had trouble creating your dispute letter.",
        suggestion="Try again. If this keeps happening, make sure all required information is filled in.",
        can_retry=True,
        show_support=True
    ),
    'export_failed': ErrorInfo(
        category=ErrorCategory.GENERATION_ERROR,
        title="Export Failed",
        message="We couldn't export your documents.",
        suggestion="Check that you have enough disk space and try again.",
        can_retry=True
    ),

    # System errors
    'out_of_memory': ErrorInfo(
        category=ErrorCategory.SYSTEM_ERROR,
        title="Out of Memory",
        message="The system ran out of memory processing your request.",
        suggestion="Try closing other applications or uploading a smaller file.",
        can_retry=True
    ),
    'unexpected_error': ErrorInfo(
        category=ErrorCategory.SYSTEM_ERROR,
        title="Unexpected Error",
        message="Something unexpected went wrong.",
        suggestion="Please try again. If this keeps happening, please contact support with the error details below.",
        can_retry=True,
        show_support=True
    ),
}


def get_error_info(error_key: str, technical_details: str = None) -> ErrorInfo:
    """Get error information by key, with fallback to generic error."""
    info = ERROR_MESSAGES.get(error_key, ERROR_MESSAGES['unexpected_error'])
    if technical_details:
        info.technical_details = technical_details
    return info


def categorize_exception(exc: Exception) -> str:
    """Categorize an exception to get appropriate error info."""
    exc_type = type(exc).__name__
    exc_msg = str(exc).lower()

    # File errors
    if isinstance(exc, FileNotFoundError):
        return 'file_not_found'
    if isinstance(exc, PermissionError):
        if 'write' in exc_msg or 'save' in exc_msg:
            return 'write_permission'
        return 'read_permission'
    if 'too large' in exc_msg or 'size' in exc_msg:
        return 'file_too_large'

    # OCR errors
    if 'tesseract' in exc_msg:
        return 'tesseract_not_found'
    if 'ocr' in exc_msg or 'recognition' in exc_msg:
        return 'ocr_failed'

    # Network errors
    if 'timeout' in exc_msg:
        return 'timeout'
    if 'connection' in exc_msg or 'network' in exc_msg:
        return 'connection_failed'

    # Memory errors
    if isinstance(exc, MemoryError) or 'memory' in exc_msg:
        return 'out_of_memory'

    # Validation errors
    if 'invalid' in exc_msg and 'date' in exc_msg:
        return 'invalid_date'
    if 'required' in exc_msg:
        return 'required_field'

    # Default
    return 'unexpected_error'


def handle_error(error_key: str = None, exception: Exception = None) -> ErrorInfo:
    """Handle an error and return user-friendly information."""
    if exception:
        # Log the full exception
        logger.error(f"Exception occurred: {type(exception).__name__}: {str(exception)}")
        logger.error(traceback.format_exc())

        # Get error key from exception if not provided
        if not error_key:
            error_key = categorize_exception(exception)

        technical_details = f"{type(exception).__name__}: {str(exception)}"
    else:
        technical_details = None

    return get_error_info(error_key or 'unexpected_error', technical_details)


def safe_execute(func: Callable, error_context: str = "operation") -> Callable:
    """Decorator to safely execute a function with error handling."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            error_info = handle_error(exception=e)
            return {
                'success': False,
                'error': error_info,
                'context': error_context
            }
    return wrapper


def render_error_ui(st, error_info: ErrorInfo):
    """Render error information in Streamlit UI."""
    # Error header
    st.error(f"**{error_info.title}**")

    # Main message
    st.markdown(error_info.message)

    # Suggestion box
    st.info(f"**What to try:** {error_info.suggestion}")

    # Technical details (expandable)
    if error_info.technical_details:
        with st.expander("Technical Details (for support)"):
            st.code(error_info.technical_details)

    # Action buttons
    col1, col2 = st.columns(2)

    with col1:
        if error_info.can_retry:
            if st.button("Try Again", type="primary", use_container_width=True):
                st.rerun()

    with col2:
        if error_info.show_support:
            st.markdown("""
            **Need help?**
            - Check the [Help Guide](#)
            - Report an issue on GitHub
            """)


def validate_file_upload(file_bytes: bytes, filename: str, max_size_mb: int = 10) -> Optional[ErrorInfo]:
    """Validate an uploaded file and return error info if invalid."""
    # Check size
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > max_size_mb:
        return get_error_info('file_too_large',
                             f"File size: {size_mb:.1f}MB, Maximum: {max_size_mb}MB")

    # Check extension
    ext = Path(filename).suffix.lower()
    allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.txt', '.gif', '.bmp'}
    if ext not in allowed_extensions:
        return get_error_info('unsupported_format',
                             f"File type: {ext}")

    # Check if file is empty
    if len(file_bytes) < 100:
        return get_error_info('corrupted_file',
                             "File appears to be empty or too small")

    return None


def validate_required_fields(fields: Dict[str, Any], required: list) -> Optional[ErrorInfo]:
    """Validate that required fields are present."""
    missing = []
    for field in required:
        if field not in fields or not fields[field]:
            missing.append(field)

    if missing:
        return get_error_info('required_field',
                             f"Missing fields: {', '.join(missing)}")

    return None


class ErrorBoundary:
    """Context manager for error handling."""

    def __init__(self, context: str = "operation", st=None):
        self.context = context
        self.st = st
        self.error = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_val:
            self.error = handle_error(exception=exc_val)
            logger.error(f"Error in {self.context}: {exc_val}")

            if self.st:
                render_error_ui(self.st, self.error)

            # Suppress the exception if we handled it
            return True

        return False
