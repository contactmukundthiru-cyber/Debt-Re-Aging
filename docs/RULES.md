# Debt Re-Aging & Credit Accuracy Rules

This document describes the rules used by the Debt Re-Aging Case Factory to detect potential violations of the Fair Credit Reporting Act (FCRA) and Fair Debt Collection Practices Act (FDCPA).

---

## Rule A1: Removal Date Exceeds 8 Years from Date Opened
**Severity:** HIGH
**Description:** The estimated removal date is more than 8 years after the reported date opened.
**Why It Matters:** Under the FCRA, most negative items must be removed 7 years from the date of first delinquency (DOFD). An 8-year gap from opening often indicates improper re-aging.

---

## Rule A2: Removal Inconsistent with DOFD + 7 Years
**Severity:** HIGH
**Description:** The estimated removal date does not align with the DOFD plus 7 years and 180 days.
**Why It Matters:** The clock starts at the original delinquency, not when a collector acquires the debt. Discrepancies here are clear indicators of re-aging.

---

## Rule B1: Date Opened More Than 24 Months After DOFD
**Severity:** HIGH
**Description:** The account shows a "date opened" that is more than 2 years after the DOFD.
**Why It Matters:** Classic sign of a collection agency reporting their acquisition date as the original account opening date to illegally extend the reporting period.

---

## Rule B2: No DOFD on Collection Account
**Severity:** MEDIUM
**Description:** A collection account displays a recent open date but hides the Date of First Delinquency (DOFD).
**Why It Matters:** Masking the DOFD makes it impossible for consumers to verify when a debt should fall off their report.

---

## Rule C1: Inconsistent Dates Across Bureaus
**Severity:** MEDIUM
**Description:** Different credit bureaus show materially different removal dates for the exact same debt.
**Why It Matters:** Inaccurate information. At least one bureau is reporting the wrong timeline for the debt.

---

## Rule D1: Balance on Paid/Closed Account
**Severity:** HIGH
**Description:** The account status is "Paid" or "Settled," but a non-zero balance is still being reported.
**Why It Matters:** Furnishers must report a $0 balance once an account is resolved. This error unfairly inflates debt-to-income ratios.

---

## Rule E1: Future Date Violation
**Severity:** HIGH
**Description:** A date (Opened, DOFD, etc.) is reported as being in the future.
**Why It Matters:** Impossible dates indicate a total failure of data integrity by the furnisher and are a clear FCRA accuracy violation.

---

## Rule S1: Beyond Statute of Limitations (SOL)
**Severity:** MEDIUM
**Description:** The debt is older than the state-specific legal limit for filing a lawsuit.
**Why It Matters:** While it can still be reported on a credit report, a collector cannot win a lawsuit against you for a "time-barred" debt if you raise the SOL defense.

---

## Rule DU1: Duplicate Reporting
**Severity:** HIGH
**Description:** The same debt balance is reported by multiple accounts simultaneously.
**Why It Matters:** Usually occurs when a debt is sold but the original creditor fails to zero out their entry. This doubles the negative impact on the consumer's credit score.

---

## Customization
Rules can be extended or modified in `app/rules.py`. The system is designed to be transparent, ensuring every flag comes with a "Why This Matters" explanation.

*Document Version: 1.1.0*
