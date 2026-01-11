# Release Notes

## Version 1.0.0 (Initial Release)

**Release Date:** January 2025

### Features

#### Core Functionality
- PDF and image upload support
- OCR text extraction with configurable preprocessing (4 levels: none, light, standard, aggressive)
- Automated field parsing with confidence scores
- Editable field verification interface
- Rule-based timeline consistency checks
- Input validation with helpful error messages
- Dispute packet generation with customizable Jinja2 templates
- Multi-account batch processing support

#### Detection Rules (9 total)
- **A1**: Estimated removal date exceeds 8 years from date opened
- **A2**: Estimated removal date inconsistent with DOFD + 7 years
- **B1**: Date opened more than 24 months after DOFD (classic re-aging indicator)
- **B2**: Missing DOFD on collection account with recent open date
- **C1**: Inconsistent removal dates across bureaus (requires multi-bureau data)
- **D1**: Account reported after statute of limitations expiration
- **D2**: DOFD predates account open date (impossible timeline)
- **D3**: Account age exceeds reasonable maximum (15+ years)
- **E1**: Balance increased after charge-off date

#### State Statute of Limitations Database
- Complete 50-state SOL database for written contracts, oral contracts, promissory notes, and open accounts
- Automatic SOL expiration checking
- State-specific guidance in generated dispute letters

#### Output Generation
- YAML case file for structured data
- JSON flags file for machine processing
- Markdown summary document
- Bureau dispute letter template
- Furnisher dispute letter template
- Attachments checklist
- PDF/HTML export options

#### Privacy & Security
- 100% local processing
- No network calls
- No analytics or tracking
- No data storage unless explicitly exported
- Local-only metrics tracking (optional)

#### User Experience
- Step-by-step 5-stage guided workflow
- 7 sample cases with de-identified data covering various scenarios
- Comprehensive help documentation
- Pilot guide for organizations

#### Testing & Quality
- Unit test suite with 50+ tests
- pytest configuration included
- Tests for utils, parser, and rules modules

#### Organization Handoff Materials
- Quick Start Guide (1-page)
- Comprehensive FAQ with troubleshooting
- Deployment Checklist for IT teams
- Pilot Feedback Form template
- Data Security Policy template

#### Deployment Options
- Docker support with docker-compose
- PyInstaller spec for Windows .exe builds
- Python virtual environment installation
- Detailed installation instructions for Windows, Mac, and Linux

### Sample Cases Included
1. Collection account with re-aging indicators (flags B1, A2)
2. Collection account missing DOFD (flag B2)
3. Properly dated charge-off (clean case, no flags)
4. Multiple red flags - severe re-aging (flags A1, B2)
5. Medical collection with timeline issues (flags B1, A2)
6. Student loan collection (flags B1, A2)
7. Utility collection - borderline case (no flags)

### Known Limitations
- OCR quality depends on image resolution (300 DPI minimum recommended)
- Parser may miss non-standard date formats (use YYYY-MM-DD for best results)
- Some credit report layouts may require manual field entry
- PDF export requires weasyprint (optional dependency)

### Technical Requirements
- Python 3.8+ or Docker
- Tesseract OCR (for image processing)
- 4GB RAM minimum
- 1GB disk space

---

## Version History Template

### Version X.Y.Z

**Release Date:** YYYY-MM-DD

#### Added
- New features

#### Changed
- Modified functionality

#### Fixed
- Bug fixes

#### Deprecated
- Features to be removed

#### Removed
- Deleted features

#### Security
- Security fixes

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible new functionality
- **PATCH** version for backwards-compatible bug fixes

---

## Contributing to Releases

See [CONTRIBUTING.md](CONTRIBUTING.md) for information on how to contribute to this project.
