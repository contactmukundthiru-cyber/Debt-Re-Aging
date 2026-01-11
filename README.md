# Debt Re-Aging Case Factory

**Timeline Inconsistency Detection + Dispute Packet Generator**

A privacy-preserving, local-only tool for detecting potential debt re-aging, Statute of Limitations (SOL) violations, and duplicate reporting in credit reports, generating professional dispute documentation.

---

## About This Project

This tool was built by **Mukund Thiru**, a high school student, as part of an independent research project on enforcement gaps in credit reporting.

The tool helps legal aid organizations, consumer advocacy groups, and pro bono clinics identify potential Fair Credit Reporting Act (FCRA) and Fair Debt Collection Practices Act (FDCPA) violations.

---

## Key Features

- **🚀 Advanced OCR (OpenCV)**: Professional image preprocessing (Adaptive Thresholding, Bilateral Filtering) for higher accuracy from mobile photos or scans.
- **⚖️ State SOL Integration**: Built-in database of Statute of Limitations for all 50 states to detect time-barred debts.
- **🧠 Intelligent Rule Engine**: 10+ automated checks for re-aging, duplicate reporting, future dates, and balance inconsistencies.
- **📄 Professional Export**: Generate dispute letters in standardized Markdown, printable HTML, or PDF format.
- **📊 Metrics Dashboard**: Track organization-wide case volume and flag rates locally and privately.
- **👯 Cross-Bureau Analysis**: Compare dates across Experian, Equifax, and TransUnion to find material reporting discrepancies.
- **📂 Session Persistence**: Save your progress as a `.json` file and resume cases later without re-uploading documents.
- **🛡️ Privacy First**: 100% local processing. Includes a "Privacy Mode" to mask PII during reviews and automated cleanup of output files.

---

## Quick Start

### Option 1: Docker (Recommended)

Docker provides a hardened, rootless environment with all dependencies pre-installed.

```bash
# Clone the repository
git clone https://github.com/contactmukundthiru-cyber/Debt-Re-Aging.git
cd Debt-Re-Aging

# Start with Docker
docker-compose up

# Open http://localhost:8501 in your browser
```

### Option 2: Python

```bash
# Clone the repository
git clone https://github.com/contactmukundthiru-cyber/Debt-Re-Aging.git
cd Debt-Re-Aging

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
streamlit run app/main.py
```

---

## What Gets Checked

| Rule ID | Name | Severity |
| :--- | :--- | :--- |
| **A1/A2** | Removal Timeline | High | Detects if removal date exceeds 7 years + 180 days from DOFD. |
| **B1/B2** | Re-aging Detection | High | Detects suspicious "Date Opened" vs. "DOFD" gaps. |
| **S1** | Statute of Limitations | Medium | Checks if the debt is legally time-barred in your state. |
| **DU1** | Duplicate Reporting | High | Detects if the same balance is being reported by multiple entities. |
| **E1** | Future Dates | High | Flags physically impossible future reporting dates. |
| **D1** | Balance Inconsistency | High | Flags non-zero balances on "Paid" or "Closed" accounts. |

---

## Privacy & Security Model

This tool is designed for sensitive legal environments:

- **Isolated Docker**: Container has no network access (`network_mode: "none"`).
- **Non-Root Execution**: Runs as a low-privileged user inside the container.
- **Zero Cloud Leakage**: No telemetry, no analytics, no external API calls.
- **Automated Cleanup**: Output directory is automatically cleared of old case files every 24 hours.

---

## Technical Requirements

- **Python**: 3.8+
- **Tesseract OCR**: Required for image processing (already included in Docker).
- **Memory**: 4GB RAM minimum.

### Dependencies
- **Streamlit**: Web interface
- **OpenCV**: Image preprocessing
- **PyMuPDF**: PDF handling
- **pytesseract**: OCR interface
- **Jinja2**: Document templating
- **python-dateutil**: Robust date arithmetic

---

## Testing

Developers can verify the logic using the built-in test suite:

```bash
# Run logic, sample, and coverage tests
./run_tests.sh
```

---

## Disclaimer

**This tool is NOT legal advice.**

It is designed for informational purposes only. The analysis is based on general principles of the FCRA/FDCPA. Always consult with a qualified attorney for legal matters.

---

## Contact & Credits

- **Author**: Mukund Thiru
- **Email**: contactmukundthiru1@gmail.com
- **GitHub**: https://github.com/contactmukundthiru-cyber

*Built with care for consumers and the organizations that serve them.*
