# Debt Re-Aging Case Factory / Credit Report Analyzer

**PWA (main app): v5.0.0**  
**Python/Streamlit (legacy): v4.4.0**

[![License](https://img.shields.io/badge/License-AXIOM%20NC%20v1.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](.github/workflows/tests.yml)
[![Security](https://img.shields.io/badge/Security-Zero--Trust-green.svg)](docs/SECURITY_WHITEPAPER.md)

A privacy-preserving, local-first tool for detecting potential debt re-aging, Statute of Limitations (SOL) issues, duplicate reporting, and other credit-report inconsistencies—and generating dispute documentation.

**Free for personal and nonprofit use. Commercial use requires a paid license.**

Designed for legal aid organizations, consumer advocacy groups, and pro bono clinics. See `docs/INSTITUTIONAL_HANDOFF.md` for deployment guidance.

**No crippleware**: same code, no artificial limits, no watermarking, no performance degradation—only different permission. See `LICENSE`.

---

## Quick Start (Recommended: PWA)

### Use the hosted web app (no install)

- **Hosted PWA**: `https://contactmukundthiru-cyber.github.io/Debt-Re-Aging/pwa-app/out/`
- **Privacy note**: analysis runs locally in your browser (no client data transmission during analysis).

### Run the PWA locally (developer / offline deployment)

Prereqs: Node.js 18+ (or 20+).

```bash
cd pwa-app
npm install
npm run dev
```

Open `http://localhost:3000`.

To build a static export for deployment:

```bash
cd pwa-app
npm run build
```

Deploy the generated `pwa-app/out/` directory to any static host.

### Run with Docker (Unified Suite)

If you have Docker installed, you can launch the entire suite (Legacy App + Modern PWA) with a single command:

```bash
docker-compose up --build
```

- **Modern PWA**: `http://localhost:3000`
- **Legacy Streamlit App**: `http://localhost:8501`

---

## Alternative: Python/Streamlit app (Legacy)

The Streamlit implementation is kept under `legacy/python-app/` as an alternative UI/runtime.

### Run locally (Linux/macOS/WSL)

```bash
./setup.sh
./start.sh
```

Manual run:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
streamlit run app/main.py
```

---

## What Gets Checked (Examples)

| Category | Example checks |
| :--- | :--- |
| **Timeline / re-aging** | DOFD vs. opened/updated timeline gaps and suspicious resets |
| **Removal timing** | 7 years + 180 days heuristics from DOFD (where applicable) |
| **SOL** | state-specific statute-of-limitations flags (informational) |
| **Duplicates** | likely duplicate tradelines across furnishers/bureaus |
| **Data integrity** | status/balance contradictions; future/impossible dates |

For full rule documentation, see `docs/RULES.md`.

---

## Privacy & Security

- **Local-first**: no telemetry/analytics by project maintainers.
- **PWA**: runs in-browser; analysis is client-side.
- **Docker/isolated deployments**: see `docs/SECURITY_WHITEPAPER.md` and `docs/IT_DEPLOYMENT_GUIDE.md`.

---

## Testing (Python logic)

```bash
./run_tests.sh
```

---

## Docker (Institutional / server deployment)

This repository includes Docker assets. Start with:

```bash
docker-compose up
```

If you run Docker on Linux/WSL and see `Permission denied`, add your user to the `docker` group:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Also ensure the Docker daemon is running (WSL/Linux): `sudo service docker start`

---

## For Organizations

- **Deployment & handoff**: `docs/INSTITUTIONAL_HANDOFF.md`
- **IT guide**: `docs/IT_DEPLOYMENT_GUIDE.md`
- **Security whitepaper**: `docs/SECURITY_WHITEPAPER.md`
- **Training**: `docs/TRAINING_MATERIALS.md`
- **Quick start (staff)**: `docs/QUICK_START.md`

## Commercial licensing (pricing philosophy)

- **Small startup**: low-cost commercial license
- **Larger / regulated company**: higher tier
- **Enterprise**: negotiated

Windows build (legacy desktop executable):

```bash
cd installer
build_windows.bat
```

---

## Disclaimer

**This tool is not legal advice.** It is for informational purposes only. Always consult a qualified attorney for legal matters.

---

## Contact

- **Author**: [Mukund Thiru](https://contactmukundthiru-cyber.github.io/Personal-Portfolio/)
- **Email**: `contactmukundthiru1@gmail.com`
- **GitHub**: `https://github.com/contactmukundthiru-cyber`
