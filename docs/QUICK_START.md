# Quick Start Guide

**Debt Re-Aging Case Factory v1.0.0**

Get up and running in 5 minutes.

---

## Step 1: Install (Choose One)

### Option A: Docker (Easiest)
```bash
docker-compose up
```
Open http://localhost:8501

### Option B: Python
```bash
pip install -r requirements.txt
streamlit run app/main.py
```

**Note:** Also install Tesseract OCR:
- Windows: [Download here](https://github.com/UB-Mannheim/tesseract/wiki)
- Mac: `brew install tesseract`
- Linux: `sudo apt install tesseract-ocr`

---

## Step 2: Try a Sample Case

1. Click **"Sample 1"** or **"Sample 2"** in the sidebar
2. Click through each step to see how it works
3. Generate a test packet

---

## Step 3: Process a Real Case

1. **Upload** - Select a PDF or image of a credit report section
2. **Review** - Check the extracted text, fix any OCR errors
3. **Verify** - Review and correct the parsed fields (dates must be YYYY-MM-DD)
4. **Check** - Review any flags identified
5. **Generate** - Download the dispute packet ZIP

---

## Key Things to Know

| What | Details |
|------|---------|
| **Privacy** | 100% local - no data sent anywhere |
| **Not Legal Advice** | Always consult an attorney |
| **Date Format** | Use YYYY-MM-DD (e.g., 2024-01-15) |
| **Best Results** | Use clear, high-resolution images |

---

## Common Issues

| Problem | Solution |
|---------|----------|
| OCR text is garbled | Use a higher-resolution scan |
| Dates not recognized | Enter them manually in YYYY-MM-DD format |
| Fields missing | Add them manually in Step 3 |

---

## Need Help?

- See **Help / About** in the sidebar
- Email: contactmukundthiru1@gmail.com
- GitHub: https://github.com/contactmukundthiru-cyber

---

*Built by Mukund Thiru — student-led research project*
