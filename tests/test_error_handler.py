import pytest
from app.error_handler import handle_error, categorize_exception, validate_file_upload, validate_required_fields, ErrorCategory

def test_categorize_exception():
    assert categorize_exception(FileNotFoundError()) == 'file_not_found'
    assert categorize_exception(PermissionError("write")) == 'write_permission'
    assert categorize_exception(MemoryError()) == 'out_of_memory'
    assert categorize_exception(Exception("invalid date")) == 'invalid_date'
    assert categorize_exception(Exception("unknown")) == 'unexpected_error'

def test_handle_error_with_exception():
    err_info = handle_error(exception=FileNotFoundError("miss"))
    assert err_info.category == ErrorCategory.FILE_ERROR
    assert err_info.title == "File Not Found"
    assert "FileNotFoundError" in err_info.technical_details

def test_validate_file_upload_valid():
    res = validate_file_upload(b"some content" * 100, "test.pdf")
    assert res is None

def test_validate_file_upload_too_large():
    res = validate_file_upload(b"x" * (11 * 1024 * 1024), "test.pdf")
    assert res.title == "File Too Large"

def test_validate_file_upload_wrong_ext():
    res = validate_file_upload(b"x" * 500, "test.exe")
    assert res.title == "Unsupported File Type"

def test_validate_required_fields():
    fields = {"name": "John"}
    res = validate_required_fields(fields, ["name", "state"])
    assert res.title == "Required Information Missing"
    assert "state" in res.technical_details
    
    assert validate_required_fields(fields, ["name"]) is None
