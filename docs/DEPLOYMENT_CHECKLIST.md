# Deployment Checklist

Use this checklist when deploying the Debt Re-Aging Case Factory at your organization.

---

## Pre-Deployment

### Technical Requirements
- [ ] Verify workstations have Python 3.8+ OR Docker installed
- [ ] Verify 4GB+ RAM available on target machines
- [ ] Verify 1GB+ disk space available
- [ ] Identify IT contact for support

### Organizational Requirements
- [ ] Identify pilot users (2-5 staff members)
- [ ] Identify project lead/coordinator
- [ ] Review tool with compliance/legal team
- [ ] Determine data handling procedures
- [ ] Set pilot timeline (recommend 2-4 weeks)

---

## Installation

### For Each Workstation

**Option A: Docker Installation**
- [ ] Install Docker Desktop
- [ ] Download project files
- [ ] Run `docker-compose up`
- [ ] Verify http://localhost:8501 loads

**Option B: Python Installation**
- [ ] Install Python 3.8+
- [ ] Install Tesseract OCR
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Run: `streamlit run app/main.py`
- [ ] Verify app loads in browser

### Verification Tests
- [ ] Load Sample Case 1 - verify it displays
- [ ] Load Sample Case 2 - verify it displays
- [ ] Generate a test packet - verify ZIP downloads
- [ ] Open generated files - verify they're readable

---

## Staff Training

### Training Session Agenda (30-45 minutes)
- [ ] Explain what debt re-aging is (5 min)
- [ ] Demo the 5-step workflow (10 min)
- [ ] Walk through Sample Case 1 together (10 min)
- [ ] Review the Help/About section (5 min)
- [ ] Q&A (10 min)

### Training Materials to Distribute
- [ ] Quick Start Guide (QUICK_START.md)
- [ ] FAQ document (FAQ.md)
- [ ] Pilot tracking spreadsheet

### Staff Should Understand
- [ ] How to upload a document
- [ ] How to correct extracted fields
- [ ] What each flag means
- [ ] How to download the packet
- [ ] That this is NOT legal advice
- [ ] Who to contact for help

---

## Pilot Launch

### Week 1: Setup & Training
- [ ] Complete all installations
- [ ] Conduct training sessions
- [ ] Process first 2-3 cases with supervision

### Weeks 2-3: Active Pilot
- [ ] Staff process cases independently
- [ ] Track metrics for each case:
  - Processing time
  - Number of manual corrections
  - Flags identified
  - Flag accuracy assessment
- [ ] Hold brief check-in meetings

### Week 4: Evaluation
- [ ] Compile pilot metrics
- [ ] Gather staff feedback
- [ ] Document issues encountered
- [ ] Decide on broader deployment

---

## Post-Pilot

### If Continuing Use
- [ ] Roll out to additional staff
- [ ] Establish ongoing support process
- [ ] Schedule periodic check-ins
- [ ] Plan for updates

### Feedback to Share
- [ ] Complete feedback form
- [ ] Send to contactmukundthiru1@gmail.com
- [ ] Include anonymized metrics if possible

---

## Security Checklist

- [ ] Tool installed on secure workstations only
- [ ] Exported packets stored in secure location
- [ ] Access limited to authorized staff
- [ ] Data retention policy applied to outputs
- [ ] Staff trained on data handling procedures

---

## Contacts

| Role | Contact |
|------|---------|
| Tool Creator | Mukund Thiru (contactmukundthiru1@gmail.com) |
| Your IT Contact | __________________________ |
| Your Project Lead | __________________________ |
| Your Legal Contact | __________________________ |

---

## Notes

_________________________________

_________________________________

_________________________________

---

*Deployment Checklist v1.0.0*
