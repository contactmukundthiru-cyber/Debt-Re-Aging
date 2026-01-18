# Credit Report Analyzer - Architecture Documentation

## Overview

The Credit Report Analyzer is a Progressive Web Application (PWA) built with Next.js 14 that helps consumers identify FCRA/FDCPA violations in their credit reports. The application operates entirely client-side with zero data transmission to external servers, ensuring complete privacy.

## Technology Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.x
- **UI**: React 18 with Tailwind CSS
- **PDF Generation**: jsPDF
- **Testing**: Jest with React Testing Library
- **PWA**: next-pwa for offline support

## Architecture Principles

### 1. Zero-Network Architecture
All processing occurs client-side. No user data is ever transmitted to servers. This is enforced through:
- No API endpoints in the application
- LocalStorage for all data persistence
- Service Worker for offline functionality

### 2. Progressive Enhancement
The app works offline and can be installed as a native-like app on any device.

### 3. Type Safety
Strict TypeScript throughout with no `any` types in production code.

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main application (all steps)
│   └── globals.css         # Global styles and Tailwind
│
├── components/
│   ├── layout/             # Layout components
│   │   ├── Header.tsx      # App header
│   │   ├── Footer.tsx      # App footer
│   │   └── ProgressNav.tsx # Step progress indicator
│   │
│   ├── steps/              # Step-based UI components
│   │   ├── Step1Input.tsx      # File upload/text input
│   │   ├── Step2Review.tsx     # Review extracted text
│   │   ├── Step3Verify.tsx     # Verify parsed fields
│   │   ├── Step4Analysis.tsx   # Analysis results dashboard
│   │   ├── Step5Export.tsx     # Document export
│   │   ├── Step6Track.tsx      # Dispute tracking
│   │   └── analysis/           # Tab components for Step 4
│   │       ├── ViolationsTab.tsx
│   │       ├── PatternsTab.tsx
│   │       ├── TimelineTab.tsx
│   │       ├── CaseLawTab.tsx
│   │       └── ...
│   │
│   └── ui/                 # Reusable UI components
│       ├── Toast.tsx       # Toast notifications
│       └── ErrorBoundary.tsx
│
├── lib/                    # Core business logic
│   ├── rules.ts            # FCRA/FDCPA violation rules engine
│   ├── rules-advanced.ts   # Advanced pattern detection
│   ├── parser.ts           # Credit report text parser
│   ├── generator.ts        # Letter/document generators
│   ├── analytics.ts        # Analysis and metrics
│   ├── caselaw.ts          # Case law database
│   ├── caselaw-database.ts # Extended case law
│   ├── pattern-engine.ts   # Pattern recognition
│   ├── damages-calculator.ts # Damage estimation
│   ├── evidence-builder.ts # Evidence package builder
│   ├── dispute-tracker.ts  # Dispute management
│   ├── delta.ts            # Change detection
│   ├── sol.ts              # Statute of limitations
│   ├── storage.ts          # LocalStorage wrapper
│   ├── constants.ts        # App constants
│   └── i18n.ts             # Internationalization
│
├── hooks/                  # Custom React hooks
│   └── useToast.ts         # Toast notification hook
│
├── types/                  # TypeScript type definitions
│   ├── app.d.ts            # Application types
│   └── jest.d.ts           # Jest type augmentations
│
└── __tests__/              # Test files
    ├── rules.test.ts       # Rules engine tests
    ├── parser.test.ts      # Parser tests
    ├── validation.test.ts  # Validation tests
    └── ...
```

## Core Modules

### 1. Rules Engine (`lib/rules.ts`)

The rules engine is the heart of the application. It analyzes credit report data to detect FCRA/FDCPA violations.

**Key Functions:**
- `runRules(fields: CreditFields): RuleFlag[]` - Main analysis function
- `calculateRiskProfile(flags: RuleFlag[], fields: CreditFields): RiskProfile` - Risk assessment

**Rule Categories:**
- B-Series: Date/timeline violations (B1, B2, B3)
- D-Series: Status inconsistencies (D1)
- E-Series: Data integrity (E1 - future dates)
- H-Series: Medical debt rules (H1, H2, H3)
- K-Series: Balance violations (K1, K6, K7)
- L-Series: Lexical consistency (L1)
- M-Series: Metro 2 format violations (M2, M3)
- S-Series: Statute of limitations (S1, S2)
- Z-Series: Zombie debt detection (Z1)
- R-Series: Re-aging violations (R1, R2)

### 2. Parser (`lib/parser.ts`)

Extracts structured data from credit report text.

**Key Functions:**
- `parseCreditReport(text: string): ParsedFields` - Main parsing function
- `normalizeDate(dateStr: string): string | null` - Date normalization
- `segmentAccounts(text: string): string[]` - Multi-account segmentation

**Features:**
- Bureau-specific pattern matching (Experian, Equifax, TransUnion)
- Multi-format date parsing
- Confidence scoring for extracted fields

### 3. Generator (`lib/generator.ts`)

Generates dispute letters and legal documents.

**Document Types:**
- Bureau dispute letters
- Debt validation requests
- Cease & desist letters
- Intent to sue letters
- CFPB complaint narratives
- Evidence packages
- Attorney consultation packages

### 4. Pattern Engine (`lib/pattern-engine.ts`)

Advanced pattern recognition for detecting systemic violations.

**Patterns Detected:**
- Re-aging patterns
- Payment harvesting
- Zombie debt collection
- Bureau inconsistencies
- Date manipulation

### 5. Dispute Tracker (`lib/dispute-tracker.ts`)

LocalStorage-based dispute management system.

**Features:**
- Track dispute status
- Deadline monitoring
- Communication logging
- Outcome recording
- Statistics and reporting

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────>│   Parser    │────>│   Rules     │
│   (Step 1)  │     │   (Step 2)  │     │   Engine    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Tracker   │<────│  Generator  │<────│  Analysis   │
│   (Step 6)  │     │  (Step 5)   │     │  (Step 4)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## State Management

The application uses React's built-in state management:

- `useState` for component-local state
- Props drilling for shared state between steps
- LocalStorage for persistence across sessions

**Key State Objects:**
- `step: Step` - Current wizard step (1-6)
- `editableFields: CreditFields` - Parsed credit report fields
- `flags: RuleFlag[]` - Detected violations
- `riskProfile: RiskProfile` - Risk assessment
- `disputes: Dispute[]` - Active disputes

## Security Considerations

### Client-Side Security
- All processing is client-side (no data leaves the browser)
- LocalStorage encryption recommended for production
- No external API calls

### Content Security Policy
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self';
```

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Testing Strategy

### Unit Tests
- Rules engine logic
- Parser functions
- Date normalization
- Validation helpers

### Integration Tests
- Component rendering
- User interactions
- Toast notifications

### Test Coverage Goals
- Core business logic: 80%+
- UI components: 60%+

## Performance Considerations

1. **Code Splitting**: Next.js automatic code splitting
2. **Lazy Loading**: Tab components loaded on demand
3. **PWA Caching**: Service worker caches static assets
4. **Efficient Re-renders**: React.memo where appropriate

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Static Export
```bash
npm run build
# Output in .next/
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Future Enhancements

1. **Multi-Bureau Support**: Compare reports across all three bureaus
2. **OCR Integration**: Direct image/PDF parsing
3. **Machine Learning**: Improved pattern detection
4. **Export Formats**: Additional document formats (DOCX)
5. **API Integration**: Optional CFPB complaint submission

## Contributing

1. Follow TypeScript strict mode
2. No `any` types
3. Write tests for business logic
4. Document complex algorithms
5. Keep components small and focused

## License

Proprietary - All rights reserved
