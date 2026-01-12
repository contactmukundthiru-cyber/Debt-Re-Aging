# Debt Re-Aging Case Factory

**Timeline Inconsistency Detection + Dispute Packet Generator**

A privacy-preserving, local-only tool for detecting potential debt re-aging, Statute of Limitations (SOL) violations, and duplicate reporting in credit reports, generating professional dispute documentation.

---

## About This Project

This tool was built by **Mukund Thiru**, a high school student, as part of an independent research project on enforcement gaps in credit reporting.

The tool helps legal aid organizations, consumer advocacy groups, and pro bono clinics identify potential Fair Credit Reporting Act (FCRA) and Fair Debt Collection Practices Act (FDCPA) violations.

---

## Key Features

### Core Analysis
- **Advanced OCR (OpenCV)**: Professional image preprocessing for higher accuracy from mobile photos or scans
- **State SOL Integration**: Built-in database of Statute of Limitations for all 50 states
- **Intelligent Rule Engine**: 20+ automated checks for re-aging, duplicate reporting, and violations
- **Multi-Account Parser**: Analyze entire credit reports with automatic account segmentation
- **Cross-Bureau Analysis**: Compare dates across Experian, Equifax, and TransUnion

### Professional Output
- **Dispute Letter Generator**: FCRA-compliant letters in Markdown, DOCX, and PDF formats
- **Debt Validation Letters**: FDCPA-compliant validation request letters
- **Case Documentation**: Complete case files with evidence summaries

### Organizational Tools
- **Case Management**: Save, load, and track cases with unique IDs
- **Deadline Tracker**: Monitor 30-day response deadlines with reminders
- **Analytics Dashboard**: Track success rates, patterns, and organizational metrics
- **REST API**: Integrate with Legal Server, Salesforce, or custom CMS

### User Experience
- **Client Portal Mode**: Simplified interface for consumer self-service
- **Multi-Language Support**: English and Spanish interfaces
- **Training Materials**: Built-in tutorials and documentation
- **Privacy First**: 100% local processing, no cloud, automated cleanup

---

## Quick Start

### Option 1: Docker (Recommended)

Docker provides a hardened, rootless environment with all dependencies pre-installed.

```bash
# Clone the repository
git clone https://github.com/contactmukundthiru-cyber/Debt-Re-Aging.git
cd Debt-Re-Aging

# Start with Docker
# (Note: If you get a 'Permission Denied' error, see the Troubleshooting section below)
docker-compose up

# Open http://localhost:8501 in your browser
```

---

## Troubleshooting

### Docker Permission Denied
If you see a `Permission denied` error when running Docker commands on Linux/WSL, your user needs to be added to the `docker` group:

```bash
sudo usermod -aG docker $USER
newgrp docker
```
Also ensure the Docker service is running: `sudo service docker start`

---

### Option 2: Python (Local Setup)

The easiest way to set up the project locally is using the provided setup script:

```bash
# Clone the repository
git clone https://github.com/contactmukundthiru-cyber/Debt-Re-Aging.git
cd Debt-Re-Aging

# Run the setup script
./setup.sh

# Start the application
./start.sh
```

Alternatively, you can set it up manually:

```bash
# Create virtual environment
python3 -m venv venv
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

## For Organizations

### Quick Deployment

```bash
# Windows standalone executable
cd installer
build_windows.bat
# Run dist/DebtReagingCaseFactory/DebtReagingCaseFactory.exe
```

### Integration Options

1. **Standalone Desktop**: Run the Windows executable on staff computers
2. **Shared Server**: Deploy on internal network for team access
3. **API Integration**: Connect to your existing case management system

### Documentation

| Document | Purpose |
|----------|---------|
| [Training Materials](docs/TRAINING_MATERIALS.md) | Staff training guide with video script |
| [Institutional Adoption](docs/INSTITUTIONAL_ADOPTION.md) | Deployment roadmap and ROI analysis |
| [Outreach Templates](docs/OUTREACH_TEMPLATES.md) | Emails, presentations, partnership proposals |

### Success Metrics

Track these KPIs in the Analytics Dashboard:
- Cases processed per month
- Dispute success rate by type
- Average resolution time
- Total debt amount removed from reports

---

## Disclaimer

**This tool is NOT legal advice.**

It is designed for informational purposes only. The analysis is based on general principles of the FCRA/FDCPA. Always consult with a qualified attorney for legal matters.

---

## Contact & Credits

- **Author**: [Mukund Thiru](https://contactmukundthiru-cyber.github.io/Personal-Portfolio/)
- **Email**: contactmukundthiru1@gmail.com
- **GitHub**: https://github.com/contactmukundthiru-cyber

### Mission

This tool exists to help everyday people fight back against unfair credit reporting. Credit report errors cost people jobs, housing, and loans - and most violations go unchallenged because they're hard to detect. This is one step toward fixing that.

*Built with care for consumers and the organizations that serve them.*
