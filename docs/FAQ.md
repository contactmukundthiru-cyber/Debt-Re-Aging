# Frequently Asked Questions

## Installation & Setup

### Q: What do I need to run this tool?
**A:** You need either:
- Docker Desktop (recommended), OR
- Python 3.8+ with Tesseract OCR installed

### Q: Why isn't OCR working?
**A:** Tesseract OCR must be installed separately from Python. Download it from:
- Windows: https://github.com/UB-Mannheim/tesseract/wiki
- Mac: `brew install tesseract`
- Linux: `sudo apt-get install tesseract-ocr`

### Q: Can I run this on a shared network drive?
**A:** Yes, but for best performance, install it locally on each workstation.

### Q: Does this work offline?
**A:** Yes! The tool is 100% offline. No internet connection required after installation.

---

## Using the Tool

### Q: What file formats are supported?
**A:** PDF, PNG, JPG, and JPEG files.

### Q: The extracted text is garbled. What should I do?
**A:** Try these in order:
1. Use a higher-resolution scan (300 DPI minimum)
2. Ensure the image is well-lit and not skewed
3. Try using "aggressive" preprocessing in settings
4. If all else fails, manually type the key information

### Q: What date format should I use?
**A:** Always use **YYYY-MM-DD** format (e.g., 2024-01-15). The tool will try to normalize other formats, but YYYY-MM-DD is most reliable.

### Q: A field wasn't extracted. What do I do?
**A:** Simply type the information manually in Step 3 (Verify Fields). All fields are editable.

### Q: What does each flag severity mean?
**A:**
- **HIGH**: Strong indicator of re-aging - prioritize for dispute
- **MEDIUM**: Notable concern - review carefully
- **LOW**: Informational - may or may not warrant action

### Q: Why didn't the tool flag an account I think is re-aged?
**A:** The tool uses specific rule-based checks. If dates don't trigger the rules but you suspect re-aging, use your professional judgment. The tool catches common patterns but isn't exhaustive.

---

## Understanding the Output

### Q: What files are in the generated packet?
**A:**
- `case.yaml` - Machine-readable case data
- `flags.json` - Detected issues
- `packet_summary.md` - Human-readable summary
- `bureau_dispute_letter.md` - Letter to credit bureau
- `furnisher_dispute_letter.md` - Letter to collector/creditor
- `attachments_checklist.md` - Documents to gather

### Q: Are the dispute letters ready to send?
**A:** The letters are templates. You should:
1. Review and customize the content
2. Add your name and address
3. Add specific account numbers
4. Have an attorney review if needed

### Q: What is DOFD?
**A:** Date of First Delinquency - the date you first fell behind on payments and never caught up. This is the date that starts the 7-year credit reporting clock.

---

## Rules & Flags

### Q: What is Rule A1?
**A:** Removal date exceeds 8 years from date opened. This suggests the account may be reported longer than legally allowed.

### Q: What is Rule A2?
**A:** Removal date doesn't align with DOFD + 7 years. The removal date should be approximately 7 years and 180 days after the DOFD.

### Q: What is Rule B1?
**A:** Date opened is more than 24 months after DOFD. This is a classic sign of re-aging - the collector is using their own "open date" instead of the original delinquency date.

### Q: What is Rule B2?
**A:** Missing DOFD on a collection account with a recent open date. Collection accounts must report the DOFD from the original account.

### Q: Can I add custom rules?
**A:** Yes! Technical users can modify `app/rules.py` to add custom rules. See [RULES.md](RULES.md) for documentation.

---

## Privacy & Security

### Q: Is my data safe?
**A:** Yes. The tool:
- Runs 100% locally on your computer
- Makes no network calls
- Stores nothing unless you click "Export"
- Has no analytics or tracking

### Q: Can I use this with client data?
**A:** Yes, but follow your organization's data handling policies. The tool itself is private, but you should still:
- Use secure workstations
- Follow your retention policies
- Store exported packets securely

### Q: Is this HIPAA compliant?
**A:** The tool itself doesn't transmit data, but HIPAA compliance depends on your overall data handling practices. Consult your compliance officer.

---

## Legal Questions

### Q: Is this legal advice?
**A:** **NO.** This tool is for informational purposes only. It helps identify potential issues but is not a substitute for legal counsel.

### Q: Can I rely on the flags for a lawsuit?
**A:** The flags indicate potential issues based on common patterns. Always verify with original documents and consult an attorney before taking legal action.

### Q: What law governs debt re-aging?
**A:** The Fair Credit Reporting Act (FCRA), specifically 15 U.S.C. § 1681c, establishes the 7-year reporting period for most negative items.

---

## Troubleshooting

### Q: The app won't start
**A:** Check that:
1. Python 3.8+ is installed (`python --version`)
2. All dependencies are installed (`pip install -r requirements.txt`)
3. Tesseract is installed and in your PATH

### Q: I get a "module not found" error
**A:** Run `pip install -r requirements.txt` again to ensure all dependencies are installed.

### Q: The app is very slow
**A:** Large images take longer to process. Try:
1. Cropping to just the relevant section
2. Reducing image resolution (but not below 200 DPI)
3. Using PDF format if available

### Q: Where are my exported files?
**A:** By default, exported files are saved to the `output/` folder in the project directory.

---

## Getting Help

### Q: How do I report a bug?
**A:** Open an issue at: https://github.com/contactmukundthiru-cyber/Debt-Re-Aging/issues

### Q: How do I suggest a feature?
**A:** Same place - open a GitHub issue with the "enhancement" label.

### Q: Who maintains this tool?
**A:** [Mukund Thiru](https://contactmukundthiru-cyber.github.io/Personal-Portfolio/) - a student researcher building tools to help consumers fight credit report errors.

---

**Contact:** contactmukundthiru1@gmail.com

**Portfolio:** [contactmukundthiru-cyber.github.io/Personal-Portfolio](https://contactmukundthiru-cyber.github.io/Personal-Portfolio/)

---

*Last updated: January 2025*
