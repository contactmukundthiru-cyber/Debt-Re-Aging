# Quick Start Guide

**Credit Report Analyzer v1.0.0**

Get up and running in 5 minutes.

---

## Step 1: Install (Choose One)

### Option A: Windows (Easiest)

1. [Download the ZIP file](https://github.com/contactmukundthiru-cyber/Debt-Re-Aging/archive/refs/heads/main.zip)
2. Unzip it anywhere on your computer
3. Double-click `START_APP.bat`
4. Wait for dependencies to install (first time only, takes 2-3 minutes)
5. Browser opens automatically - you're done!

**First time?** You need Python installed. Get it free from [python.org](https://python.org) - make sure to check "Add to PATH" during install.

### Option B: Command Line

```bash
git clone https://github.com/contactmukundthiru-cyber/Debt-Re-Aging.git
cd Debt-Re-Aging
pip install -r requirements.txt
streamlit run app/main.py
```

### Option C: Docker

```bash
git clone https://github.com/contactmukundthiru-cyber/Debt-Re-Aging.git
cd Debt-Re-Aging
docker-compose up
```
Open http://localhost:8501

**Note:** For OCR to work, install Tesseract:
- Windows: [Download here](https://github.com/UB-Mannheim/tesseract/wiki)
- Mac: `brew install tesseract`
- Linux: `sudo apt install tesseract-ocr`

---

## Step 2: Try a Sample Case

1. Click **"Sample 1"** or **"Sample 2"** in the sidebar
2. Click through each step to see how it works
3. Generate a test dispute packet

---

## Step 3: Process a Real Case

| Step | What You Do |
|------|-------------|
| **1. Upload** | Drop in a PDF or photo of the credit report |
| **2. Review** | Check the extracted text, fix any OCR errors |
| **3. Verify** | Review the parsed fields (dates, balances, creditor) |
| **4. Check** | See what issues were found |
| **5. Generate** | Download your dispute letters |

---

## Key Things to Know

| What | Details |
|------|---------|
| **Privacy** | 100% local - no data sent anywhere |
| **Not Legal Advice** | Always consult an attorney |
| **Date Format** | Use YYYY-MM-DD (e.g., 2024-01-15) |
| **Best Results** | Use clear, high-resolution images |

---

## Additional Features

### For Organizations
- **Case Manager**: Save and load cases with unique IDs
- **Deadline Tracker**: Monitor 30-day response deadlines
- **Analytics Dashboard**: Track success rates and patterns
- **Batch Mode**: Process multiple cases at once

### For Consumers
- **Client Portal**: Simplified 4-step guided process
- **Spanish Support**: Switch language in sidebar

### Advanced
- **Multi-Account Analysis**: Parse entire credit reports
- **Cross-Bureau Analysis**: Compare across bureaus
- **REST API**: Integrate with your CMS

---

## Common Issues

| Problem | Solution |
|---------|----------|
| OCR text is garbled | Use a higher-resolution scan |
| Dates not recognized | Enter them manually in YYYY-MM-DD format |
| Fields missing | Add them manually in Step 3 |
| "Python not found" | Install Python from python.org, check "Add to PATH" |

---

## Need Help?

- See **Help / About** in the sidebar
- Email: contactmukundthiru1@gmail.com
- GitHub: [github.com/contactmukundthiru-cyber](https://github.com/contactmukundthiru-cyber)
- Portfolio: [contactmukundthiru-cyber.github.io/Personal-Portfolio](https://contactmukundthiru-cyber.github.io/Personal-Portfolio/)

---

*Built by [Mukund Thiru](https://contactmukundthiru-cyber.github.io/Personal-Portfolio/) - free tool for consumers and the organizations that serve them*
