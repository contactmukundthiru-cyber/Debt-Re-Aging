# Pilot Guide for Organizations

This guide helps legal aid organizations and consumer advocacy groups pilot the Credit Report Analyzer.

---

## Getting Started

### Installation Options

**Option A: Windows (Easiest)**
1. Download ZIP from GitHub
2. Double-click `START_APP.bat`
3. Wait for browser to open

**Option B: Docker (Recommended for IT teams)**
```bash
docker-compose up
```
Open http://localhost:8501

**Option C: Python**
```bash
pip install -r requirements.txt
streamlit run app/main.py
```

---

## Phase 1: Familiarization (Day 1)

### Try the Sample Cases
1. Click **"Sample 1"** or **"Sample 2"** in the sidebar
2. Walk through all 5 steps
3. Generate a test dispute packet

### Check System Health
- Go to **Help / About** in the sidebar
- Review the system status check
- Ensure OCR is working (test with an image upload)

### Explore Key Features
- **Privacy Mode**: Masks sensitive data during demonstrations
- **Language**: Switch between English and Spanish
- **Settings**: Configure your organization name and defaults

---

## Phase 2: Testing Real Cases (Weeks 1-2)

### Process 5-10 Cases
1. Start with clear, high-quality scans
2. Verify all extracted text is accurate
3. Confirm key dates are correctly identified
4. Review all flags generated
5. Generate dispute letters

### Track Your Results
- Use the **Case Manager** to save each case
- Use the **Deadline Tracker** to monitor response times
- Note any issues or questions that arise

### Quality Checks
- Have an attorney review generated letters before sending
- Compare tool results with manual analysis on 2-3 cases
- Document any edge cases or unusual situations

---

## Phase 3: Evaluation (Week 3-4)

### Metrics to Review
Access the **Analytics Dashboard** to see:
- Total cases processed
- Flags by type and severity
- Extraction quality scores
- Processing time

### Key Questions
1. Did the tool correctly identify issues?
2. How much time was saved per case?
3. Were the generated letters accurate?
4. What improvements would help?

### Developer Verification (Optional)
Technical staff can verify the core logic:
```bash
./run_tests.sh
```

---

## Phase 4: Decision Point

After the pilot, decide on:

**Full Deployment** - Tool meets your needs
- Train remaining staff
- Integrate into intake workflow
- Set up metrics tracking

**Extended Pilot** - Need more testing
- Process additional cases
- Address specific concerns
- Request customizations

**Not a Fit** - Tool doesn't meet needs
- Please share feedback so we can improve

---

## Feedback

We want to hear from you!

**What to share:**
- Cases where the tool worked well
- Cases where it struggled
- Feature requests
- Bug reports

**Contact:**
- **Email:** contactmukundthiru1@gmail.com
- **GitHub:** [Report Issues](https://github.com/contactmukundthiru-cyber/Debt-Re-Aging/issues)

---

**Developer:** [Mukund Thiru](https://contactmukundthiru-cyber.github.io/Personal-Portfolio/)

---

*Pilot Guide Version: 2.0.0*
