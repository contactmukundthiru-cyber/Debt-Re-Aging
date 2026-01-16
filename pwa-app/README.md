# Credit Report Analyzer - PWA

A Progressive Web App for detecting FCRA/FDCPA violations and illegal debt re-aging in credit reports.

## Features

- **100% Client-Side Processing** - Your data never leaves your device
- **Offline Capable** - Works without internet after first load
- **Installable** - Add to home screen on mobile/desktop
- **FCRA/FDCPA Detection** - 20+ rules for detecting violations
- **Dispute Letter Generation** - Auto-generate bureau and validation letters
- **Risk Assessment** - Score-based analysis of case strength

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **next-pwa** - PWA functionality
- **Tesseract.js** - Client-side OCR (optional)

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/credit-report-analyzer-pwa)

1. Click the button above
2. Connect your GitHub account
3. Deploy!

Your PWA will be live at `https://your-project.vercel.app`

## Manual Deployment

### Prerequisites

- Node.js 18+
- npm or yarn

### Install & Run Locally

```bash
cd pwa-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

The static site is exported to the `out/` directory.

### Deploy to Any Static Host

Since this is a static export, you can deploy to:

- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **Cloudflare Pages**
- **AWS S3 + CloudFront**

Just upload the `out/` directory.

## For Institutions

This app is designed for easy institutional adoption:

### Embedding Options

1. **Direct Link** - Link to the hosted PWA
2. **iframe** - Embed in your site (remove X-Frame-Options header)
3. **White Label** - Fork and customize branding

### Customization

Edit these files to customize:

- `public/manifest.json` - App name, colors, icons
- `src/styles/globals.css` - Colors and styling
- `src/app/layout.tsx` - Metadata and SEO

### API Integration (Optional)

The app is fully client-side, but you can add API endpoints in `src/app/api/` for:

- Saving cases to a database
- Analytics tracking
- User authentication

## Privacy & Security

- **No Server Processing** - All analysis happens in the browser
- **No Data Collection** - We don't track or store user data
- **No External Requests** - Works completely offline
- **Open Source** - Audit the code yourself

## Legal Disclaimer

This tool provides information only and does not constitute legal advice. Users should consult with a qualified attorney for legal matters.

## License

MIT License - Free for personal and institutional use.

## Support

For issues or feature requests, please open a GitHub issue.
