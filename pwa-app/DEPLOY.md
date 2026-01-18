# Deploying Forensic Credit Analyzer (Institutional Edition)

This application is engineered for secure, zero-knowledge deployment. It runs entirely in the client's browser ("Local-First Architecture"), meaning no sensitive consumer PII (Personally Identifiable Information) is ever transmitted to a server database.

## Trusted Deployment Options

### Option 1: One-Click Vercel Deployment (Recommended)
This is the fastest way to get your organization's instance running on a secure, global CDN.

1. **Fork or Clone** this repository to your organization's GitHub account.
2. Click the button below to deploy your private fork:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)  
*(Note: Select your forked repository when prompted)*

3. Vercel will automatically detect the Next.js framework configuration.
4. **Environment Variables**: No sensitive API keys are required for the core forensic engine.

### Option 2: Docker / On-Premise
For air-gapped or strictly regulated environments:

```bash
# Build the institutional container
docker build -t forensic-analyzer .

# Run locally on port 3000
docker run -p 3000:3000 forensic-analyzer
```

## Whitelabeling & Branding

You can customize the application's identity to match your firm or agency without touching complex code.

Open `src/config/branding.ts` and update the following:

```typescript
export const BRANDING = {
  appName: 'Your Firm Name Forensic Tool',
  organizationName: 'Your Legal Team',
  organizationUrl: 'https://yourfirm.com',
  // ...
};
```

Commit these changes, and Vercel will automatically redeploy with your new branding.

## Security Architecture

*   **Zero-Knowledge**: PDF extraction and Metro 2® auditing happen in the browser's WebAssembly thread.
*   **No Database**: All case data is stored in the device's `IndexedDB` (encrypted at rest by the OS).
*   **Audit Trail**: The application generates a cryptographic hash of every forensic report for chain-of-custody verification.

## Support

For technical integration support or custom Metro 2® mapping rules, contact the development team.
