"""
Input validation and error handling utilities.

Provides validation for dates, fields, and user inputs.
"""

import re
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of a validation check."""
    is_valid: bool
    message: str
    field: Optional[str] = None
    severity: str = "error"  # error, warning, info


class FieldValidator:
    """
    Validates credit report fields.
    """

    def __init__(self):
        # Valid account types
        self.valid_account_types = [
            'collection', 'charge_off', 'closed', 'open', 'other',
            'medical_collection', 'utility_collection', 'student_loan'
        ]

        # Valid bureaus
        self.valid_bureaus = ['Experian', 'Equifax', 'TransUnion', 'Unknown']

        # Date format regex (ISO)
        self.date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$')

    def validate_date(self, date_str: str, field_name: str) -> ValidationResult:
        """
        Validate a date string.

        Args:
            date_str: Date to validate
            field_name: Name of the field being validated

        Returns:
            ValidationResult
        """
        if not date_str or date_str.strip() == '':
            return ValidationResult(
                is_valid=True,  # Empty dates are allowed
                message="Date field is empty",
                field=field_name,
                severity="info"
            )

        # Check format
        if not self.date_pattern.match(date_str):
            return ValidationResult(
                is_valid=False,
                message=f"Date must be in YYYY-MM-DD format (got: {date_str})",
                field=field_name,
                severity="error"
            )

        # Check if valid date
        try:
            parsed = datetime.strptime(date_str, '%Y-%m-%d')

            # Check reasonable date range (1970-2100)
            if parsed.year < 1970 or parsed.year > 2100:
                return ValidationResult(
                    is_valid=False,
                    message=f"Date year {parsed.year} is outside reasonable range (1970-2100)",
                    field=field_name,
                    severity="error"
                )

            # Check if date is in the future (warning for some fields)
            if parsed > datetime.now():
                if field_name in ['date_opened', 'dofd', 'date_reported_or_updated']:
                    return ValidationResult(
                        is_valid=False,
                        message=f"{field_name} cannot be in the future",
                        field=field_name,
                        severity="error"
                    )
                elif field_name == 'estimated_removal_date':
                    return ValidationResult(
                        is_valid=True,
                        message="Removal date is in the future (expected)",
                        field=field_name,
                        severity="info"
                    )

            return ValidationResult(
                is_valid=True,
                message="Date is valid",
                field=field_name,
                severity="info"
            )

        except ValueError:
            return ValidationResult(
                is_valid=False,
                message=f"Invalid date: {date_str}",
                field=field_name,
                severity="error"
            )

    def validate_account_type(self, account_type: str) -> ValidationResult:
        """Validate account type."""
        if not account_type:
            return ValidationResult(
                is_valid=True,
                message="Account type is empty",
                field="account_type",
                severity="warning"
            )

        normalized = account_type.lower().strip()

        if normalized not in self.valid_account_types:
            return ValidationResult(
                is_valid=True,  # Allow custom types
                message=f"Non-standard account type: {account_type}",
                field="account_type",
                severity="warning"
            )

        return ValidationResult(
            is_valid=True,
            message="Account type is valid",
            field="account_type",
            severity="info"
        )

    def validate_bureau(self, bureau: str) -> ValidationResult:
        """Validate credit bureau."""
        if not bureau or bureau == 'Unknown':
            return ValidationResult(
                is_valid=True,
                message="Bureau not specified",
                field="bureau",
                severity="warning"
            )

        if bureau not in self.valid_bureaus:
            return ValidationResult(
                is_valid=False,
                message=f"Unknown bureau: {bureau}. Expected: {', '.join(self.valid_bureaus)}",
                field="bureau",
                severity="error"
            )

        return ValidationResult(
            is_valid=True,
            message="Bureau is valid",
            field="bureau",
            severity="info"
        )

    def validate_creditor_name(self, name: str, field_name: str) -> ValidationResult:
        """Validate creditor/furnisher name."""
        if not name or name.strip() == '':
            return ValidationResult(
                is_valid=True,
                message=f"{field_name} is empty",
                field=field_name,
                severity="warning"
            )

        name = name.strip()

        # Check for suspicious patterns
        if len(name) < 2:
            return ValidationResult(
                is_valid=False,
                message=f"{field_name} is too short",
                field=field_name,
                severity="error"
            )

        if len(name) > 200:
            return ValidationResult(
                is_valid=False,
                message=f"{field_name} is too long",
                field=field_name,
                severity="error"
            )

        # Check for all digits (likely an account number, not a name)
        if name.replace('-', '').replace(' ', '').isdigit():
            return ValidationResult(
                is_valid=False,
                message=f"{field_name} appears to be a number, not a name",
                field=field_name,
                severity="warning"
            )

        return ValidationResult(
            is_valid=True,
            message=f"{field_name} is valid",
            field=field_name,
            severity="info"
        )

    def validate_all_fields(self, fields: Dict[str, Any]) -> List[ValidationResult]:
        """
        Validate all fields.

        Args:
            fields: Dictionary of field values

        Returns:
            List of ValidationResults
        """
        results = []

        # Validate dates
        for date_field in ['date_opened', 'date_reported_or_updated', 'dofd', 'estimated_removal_date']:
            value = fields.get(date_field)
            if isinstance(value, dict):
                value = value.get('value', '')
            results.append(self.validate_date(value or '', date_field))

        # Validate account type
        account_type = fields.get('account_type')
        if isinstance(account_type, dict):
            account_type = account_type.get('value', '')
        results.append(self.validate_account_type(account_type or ''))

        # Validate bureau
        bureau = fields.get('bureau')
        if isinstance(bureau, dict):
            bureau = bureau.get('value', '')
        results.append(self.validate_bureau(bureau or ''))

        # Validate creditor names
        for name_field in ['original_creditor', 'furnisher_or_collector']:
            value = fields.get(name_field)
            if isinstance(value, dict):
                value = value.get('value', '')
            results.append(self.validate_creditor_name(value or '', name_field))

        return results

    def validate_date_logic(self, fields: Dict[str, Any]) -> List[ValidationResult]:
        """
        Validate logical relationships between dates.

        Args:
            fields: Dictionary of field values

        Returns:
            List of ValidationResults for logical checks
        """
        results = []

        def get_value(field_name):
            value = fields.get(field_name)
            if isinstance(value, dict):
                return value.get('value')
            return value

        date_opened = get_value('date_opened')
        dofd = get_value('dofd')
        removal_date = get_value('estimated_removal_date')

        # DOFD should be after or equal to date_opened
        if date_opened and dofd:
            try:
                opened_dt = datetime.strptime(date_opened, '%Y-%m-%d')
                dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')

                if dofd_dt < opened_dt:
                    results.append(ValidationResult(
                        is_valid=True,  # This is actually valid - collection agencies often have this
                        message="DOFD is before date opened (common for collection accounts)",
                        field="dofd",
                        severity="info"
                    ))
            except ValueError:
                pass

        # Removal date should be after DOFD
        if dofd and removal_date:
            try:
                dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
                removal_dt = datetime.strptime(removal_date, '%Y-%m-%d')

                if removal_dt <= dofd_dt:
                    results.append(ValidationResult(
                        is_valid=False,
                        message="Estimated removal date should be after DOFD",
                        field="estimated_removal_date",
                        severity="error"
                    ))
            except ValueError:
                pass

        return results


def validate_fields(fields: Dict[str, Any]) -> Tuple[bool, List[ValidationResult]]:
    """
    Convenience function to validate all fields.

    Args:
        fields: Dictionary of field values

    Returns:
        Tuple of (all_valid, list of results)
    """
    validator = FieldValidator()

    results = validator.validate_all_fields(fields)
    results.extend(validator.validate_date_logic(fields))

    # Check if any errors
    errors = [r for r in results if r.severity == "error" and not r.is_valid]
    all_valid = len(errors) == 0

    return all_valid, results


def get_validation_summary(results: List[ValidationResult]) -> Dict[str, int]:
    """
    Get a summary of validation results.

    Args:
        results: List of ValidationResults

    Returns:
        Dictionary with counts by severity
    """
    summary = {
        'errors': 0,
        'warnings': 0,
        'info': 0,
        'total': len(results)
    }

    for result in results:
        if result.severity == "error" and not result.is_valid:
            summary['errors'] += 1
        elif result.severity == "warning":
            summary['warnings'] += 1
        else:
            summary['info'] += 1

    return summary
