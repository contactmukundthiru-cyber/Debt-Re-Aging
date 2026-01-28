# Credit Report Analyzer - Forensic PWA ![Version 5.0.0](https://img.shields.io/badge/version-5.0.0-emerald)

A professional-grade Progressive Web App (PWA) designed for deep forensic analysis of credit reports. It detects sophisticated FCRA/FDCPA violations, illegal debt re-aging, and Metro 2® formatting errors that standard credit repair tools miss.

## 🚀 Key Features

### 🔍 Advanced Forensic Core
- **Liability Radar**: Instantly calculates estimated statutory damages (FCRA/FDCPA) and assigns a "Litigation Readiness" score.
- **Metro 2® Forensic Audit**: Reconstructs the raw data segments used by bureaus to identify deep structural errors and mapping failures often hidden from consumer-facing reports.
- **Pattern Recognition**: AI-enhanced logic detects 25+ complex violation patterns including "Zombie Debt," "Systemic Re-aging," and "Collector Misconduct."

### ♟️ Tactical & Legal Tools
- **Tactical Simulator**: Models the internal decision trees of credit bureaus and collectors to predict the "Path of Least Resistance" for deletion.
- **Master Action Plan**: Automatically generates a prioritized execution roadmap (Immediate, Recommended, Optional) based on the specific forensic profile of the file.
- **Legal Escalation Engine**: Drafts advanced legal documents including Affidavits of Fact and Notices of Intent to Sue (NOI).
- **Statute of Limitations (SOL) Tracker**: State-specific SOL calculations for litigation risk assessment.

### 🛡️ Privacy & Architecture
- **100% Client-Side Processing**: Your sensitive financial data **never** leaves your device. All analysis occurs locally in your browser.
- **Offline Capable**: Fully functional without an internet connection after initial load.
- **No External Tracking**: Zero third-party analytics or data collection.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom forensic-dashboard aesthetics
- **PWA**: `next-pwa` for offline support and installability
- **State**: React Hooks & Context for high-performance local state management

## 📦 Quick Start

### Install & Run Locally

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/credit-report-analyzer-pwa.git

# Install dependencies
cd pwa-app
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start the analyzer.

### Build for Production

```bash
npm run build
```

The static site is exported to the `out/` directory, ready for drag-and-drop deployment to Netlify, Vercel, or any static host.

## 🏛️ For Institutions & Professionals

This tool is architecture-ready for adoption by law firms and credit repair organizations:

1.  **Forensic Diffing**: Compare reports over time to track changes and identify "re-insertion" violations automatically.
2.  **White Label Ready**: Easily customize branding variables in `tailwind.config.js` and `globals.css`.
3.  **Embeddable**: Designed to run within secure iframes or as a standalone client portal.

## ⚠️ Legal Disclaimer

**This software is for educational and informational purposes only.** It does not constitute legal advice. The "Liability Radar" and "Statute Tracker" provide estimates based on general statutory rules and may not reflect specific case law in your jurisdiction. Always consult with a qualified consumer protection attorney for legal matters.

## License

AXIOM Non-Commercial License v1.0. See the repository `LICENSE`.
