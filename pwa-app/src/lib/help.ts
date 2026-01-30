/**
 * Comprehensive Help & Guidance System
 * Educational content for credit report analysis
 */

export interface HelpArticle {
  id: string;
  title: string;
  category: 'basics' | 'violations' | 'disputes' | 'legal' | 'glossary';
  content: string;
  relatedArticles?: string[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
  related?: string[];
}

// Help Articles
export const HELP_ARTICLES: Record<string, HelpArticle> = {
  'what-is-dofd': {
    id: 'what-is-dofd',
    title: 'What is Date of First Delinquency (DOFD)?',
    category: 'basics',
    content: `The Date of First Delinquency (DOFD) is the most critical date for negative credit report entries. It determines:

1. **7-Year Reporting Period**: Under FCRA §605, negative information must be removed 7 years from the DOFD, NOT from when a collector purchased the debt.

2. **Definition**: The DOFD is when the account first became 30+ days past due and was never brought current again.

3. **Why It Matters**: Debt collectors often manipulate this date ("re-aging") to extend how long the debt appears on your report.

4. **Red Flags**:
   - DOFD is after the charge-off date (impossible)
   - DOFD is the same as the date a collector opened their account
   - Removal date is more than 7 years from DOFD
   - DOFD changed between credit reports

5. **Your Rights**: Under FCRA §623(a)(5), furnishers MUST report the correct DOFD.`,
    relatedArticles: ['7-year-rule', 'reaging', 'fcra-basics']
  },
  '7-year-rule': {
    id: '7-year-rule',
    title: 'The 7-Year Credit Reporting Rule',
    category: 'basics',
    content: `Under FCRA §605, most negative information must be removed from your credit report after 7 years.

**Key Points:**

1. **Calculation**: The 7 years runs from the DOFD, plus 180 days (6 months) for charge-offs.

2. **What's Covered**:
   - Collections
   - Charge-offs
   - Late payments
   - Repossessions

3. **Exceptions** (longer periods):
   - Bankruptcy: 7-10 years
   - Tax liens: 7 years from payment
   - Student loans (federal): Special rules apply

4. **What Doesn't Restart the Clock**:
   - Collector purchasing the debt
   - Making a payment
   - Acknowledging the debt
   - Debt validation requests

5. **Common Violations**:
   - Reporting beyond 7 years
   - Using a later date to extend reporting
   - "Re-aging" when debt is sold`,
    relatedArticles: ['what-is-dofd', 'reaging', 'statute-of-limitations']
  },
  'reaging': {
    id: 'reaging',
    title: 'What is Debt Re-Aging?',
    category: 'violations',
    content: `Debt re-aging is the illegal practice of manipulating dates to extend how long a debt appears on your credit report.

**How Re-Aging Happens:**

1. **Date Manipulation**: Changing the DOFD to a more recent date
2. **Account Transfer Dates**: Using the date a collector acquired the debt as the DOFD
3. **Activity Date Substitution**: Using "last activity" instead of true DOFD

**Why It's Illegal:**

Re-aging violates:
- FCRA §605 (7-year reporting limit)
- FCRA §623(a)(5) (accurate DOFD reporting)
- FCRA §623(a)(1)(A) (accuracy requirement)

**Detecting Re-Aging:**

1. Compare DOFD across all three bureaus
2. Compare to previous credit reports
3. Check if removal date is 7+ years from DOFD
4. Verify DOFD is BEFORE charge-off date

**Your Recourse:**

- Dispute with credit bureaus
- Pursue federal legal remedies for statutory non-compliance
- Report to CFPB and FTC`,
    relatedArticles: ['what-is-dofd', '7-year-rule', 'dispute-letter']
  },
  'statute-of-limitations': {
    id: 'statute-of-limitations',
    title: 'Statute of Limitations vs Credit Reporting',
    category: 'legal',
    content: `The Statute of Limitations (SOL) and credit reporting period are DIFFERENT:

**Statute of Limitations:**
- Time limit for SUING to collect a debt
- Varies by state (2-10 years)
- Based on date of last payment
- Making a payment can restart SOL

**Credit Reporting Period:**
- Time debt can appear on credit report
- Always 7 years from DOFD (federal law)
- Making a payment does NOT restart this
- Not affected by state laws

**Important:**
- A debt can be "time-barred" (SOL expired) but still on your credit report
- A debt can be off your credit report but still legally collectible

**Key Protection:**
When SOL expires:
- Collector can't sue you
- If they sue anyway, SOL is an affirmative defense
- In some states, suing on time-barred debt violates consumer protection laws`,
    relatedArticles: ['7-year-rule', 'zombie-debt', 'cease-and-desist']
  },
  'dispute-letter': {
    id: 'dispute-letter',
    title: 'How to Write an Effective Dispute Letter',
    category: 'disputes',
    content: `An effective dispute letter is specific, factual, and cites relevant laws.

**Key Elements:**

1. **Identify Yourself**: Full name, address, SSN (last 4), DOB

2. **Identify the Account**: Account number, creditor name, balance

3. **State the Dispute Clearly**: Be specific about what is inaccurate

4. **Cite Evidence**: Reference documents, dates, legal requirements

5. **Demand Action**: Request investigation and correction/deletion

**Do:**
- Send via certified mail with return receipt
- Keep copies of everything
- Include copies (not originals) of supporting documents
- Be factual and concise
- Reference specific FCRA sections

**Don't:**
- Use generic "dispute everything" templates
- Make claims you can't support
- Be emotional or threatening
- Send original documents`,
    relatedArticles: ['dispute-process', 'fcra-basics', 'evidence-gathering']
  },
  'fcra-basics': {
    id: 'fcra-basics',
    title: 'FCRA Basics: Your Rights',
    category: 'legal',
    content: `The Fair Credit Reporting Act (FCRA) gives you important rights:

**Key Rights:**

1. **Accuracy (§607(b), §623)**
   - CRAs must maintain reasonable procedures
   - Furnishers must report accurately

2. **Dispute Rights (§611)**
   - Right to dispute any inaccurate information
   - CRAs must investigate within 30 days
   - Free reinvestigation

3. **Deletion Rights (§605)**
   - Negative info must be deleted after 7 years
   - Bankruptcies after 7-10 years

4. **Access Rights (§612)**
   - Free annual credit report from each bureau
   - Free report after adverse action

5. **Disclosure Rights (§609)**
   - Right to know what's in your file
   - Right to know who accessed your report

**Enforcement:**

- Private legal action
- Statutory liability for non-compliance
- Liability for actual impact
- Accountability for willful violations
- Recovery of attorney's fees`,
    relatedArticles: ['fdcpa-basics', 'dispute-letter', 'suing-under-fcra']
  },
  'fdcpa-basics': {
    id: 'fdcpa-basics',
    title: 'FDCPA Basics: Collector Rules',
    category: 'legal',
    content: `The Fair Debt Collection Practices Act (FDCPA) regulates debt collectors:

**Who It Applies To:**
- Third-party debt collectors
- Debt buyers
- Collection attorneys
- NOT original creditors (usually)

**Prohibited Practices:**

1. **Harassment (§806)**
   - Threats of violence
   - Obscene language
   - Repeated calls to annoy

2. **False Statements (§807)**
   - Misrepresenting debt amount
   - False legal threats
   - Impersonating attorneys

3. **Unfair Practices (§808)**
   - Collecting unauthorized fees
   - Threatening illegal action
   - Communicating by postcard

**Your Rights:**

- Written validation notice within 5 days
- 30 days to dispute in writing
- Cease communication upon request

**Impact:**
- Statutory liability for non-compliance
- Liability for actual impact
- Recovery of attorney's fees`,
    relatedArticles: ['fcra-basics', 'debt-validation', 'cease-and-desist']
  },
  'debt-validation': {
    id: 'debt-validation',
    title: 'Debt Validation: Your Powerful Tool',
    category: 'disputes',
    content: `Debt validation is your right under FDCPA §809(b) to demand proof of a debt.

**When to Use:**
- Within 30 days of first collector contact
- When debt details seem wrong
- When you don't recognize the debt

**What to Request:**

1. Original signed contract/agreement
2. Complete payment history
3. Proof collector owns/can collect debt
4. Calculation of amount claimed
5. Licensing proof (if required by state)

**What Happens:**

- Collector must stop collection until they validate
- If they can't validate, they shouldn't report it
- If they continue without validating, it's an FDCPA violation

**Power Move:**
Many old debts can't be properly validated because:
- Records are lost
- Debt was sold multiple times
- Documentation is incomplete

This often leads to deletion.`,
    relatedArticles: ['fdcpa-basics', 'dispute-process', 'collection-agencies']
  }
};

// Glossary Terms
export const GLOSSARY: Record<string, GlossaryTerm> = {
  dofd: {
    term: 'Date of First Delinquency (DOFD)',
    definition: 'The date an account first became 30+ days past due and was never brought current. Determines when the 7-year reporting period begins.',
    example: 'If you missed your first payment in March 2020 and never caught up, March 2020 is your DOFD.',
    related: ['7-year rule', 'charge-off', 're-aging']
  },
  'charge-off': {
    term: 'Charge-Off',
    definition: 'When a creditor writes off a debt as a loss, typically after 180 days of non-payment. The debt is still owed.',
    example: 'A credit card issuer charges off an account with a 5,000 unit value after 6 months of missed payments.',
    related: ['DOFD', 'collection', 'write-off']
  },
  furnisher: {
    term: 'Furnisher',
    definition: 'Any company that reports information to credit bureaus, including creditors, lenders, and collection agencies.',
    example: 'Your credit card company is a furnisher when it reports your payment history to Experian.',
    related: ['CRA', 'credit bureau', 'data furnisher']
  },
  fcra: {
    term: 'Fair Credit Reporting Act (FCRA)',
    definition: 'Federal law (15 U.S.C. §1681) regulating credit reporting, giving consumers rights to accuracy, privacy, and dispute resolution.',
    example: 'Under FCRA, you can dispute inaccurate information and sue if your rights are violated.',
    related: ['FDCPA', 'credit report', 'dispute']
  },
  fdcpa: {
    term: 'Fair Debt Collection Practices Act (FDCPA)',
    definition: 'Federal law (15 U.S.C. §1692) prohibiting abusive debt collection practices by third-party collectors.',
    example: 'A collector calling you 20 times a day violates FDCPA harassment provisions.',
    related: ['FCRA', 'debt collector', 'validation']
  },
  'statute-of-limitations': {
    term: 'Statute of Limitations (SOL)',
    definition: 'The time period during which a creditor can sue to collect a debt. Varies by state and debt type.',
    example: 'In California, credit card debt has a 4-year SOL from the last payment.',
    related: ['time-barred debt', 'DOFD', '7-year rule']
  },
  'time-barred': {
    term: 'Time-Barred Debt',
    definition: 'A debt where the statute of limitations has expired. The creditor cannot sue to collect, though the debt may still be reported.',
    example: 'A debt from 2015 in a state with a 4-year SOL became time-barred in 2019.',
    related: ['statute of limitations', 'zombie debt']
  },
  'zombie-debt': {
    term: 'Zombie Debt',
    definition: 'Old debt that resurfaces, often purchased by debt buyers who try to collect despite being time-barred or beyond reporting limits.',
    example: 'A collector contacts you about a debt from 2010 that\'s both time-barred and past the 7-year reporting period.',
    related: ['time-barred', 're-aging', 'debt buyer']
  },
  'metro-2': {
    term: 'Metro 2 Format',
    definition: 'Industry standard format for reporting consumer credit data to credit bureaus. Defines required fields and codes.',
    example: 'A furnisher must report the DOFD field in Metro 2 format for collection accounts.',
    related: ['furnisher', 'credit bureau', 'reporting']
  },
  'hard-inquiry': {
    term: 'Hard Inquiry',
    definition: 'A credit check that can affect your score, typically when applying for credit. Stays on report for 2 years.',
    example: 'Applying for a mortgage results in a hard inquiry on your credit report.',
    related: ['soft inquiry', 'credit score', 'authorized']
  }
};

/**
 * Get help article by ID
 */
export function getHelpArticle(id: string): HelpArticle | null {
  return HELP_ARTICLES[id] || null;
}

/**
 * Get articles by category
 */
export function getArticlesByCategory(category: HelpArticle['category']): HelpArticle[] {
  return Object.values(HELP_ARTICLES).filter(a => a.category === category);
}

/**
 * Search help articles
 */
export function searchHelp(query: string): HelpArticle[] {
  const lower = query.toLowerCase();
  return Object.values(HELP_ARTICLES).filter(a =>
    a.title.toLowerCase().includes(lower) ||
    a.content.toLowerCase().includes(lower)
  );
}

/**
 * Get glossary term
 */
export function getGlossaryTerm(term: string): GlossaryTerm | null {
  const key = term.toLowerCase().replace(/\s+/g, '-');
  return GLOSSARY[key] || null;
}

/**
 * Search glossary
 */
export function searchGlossary(query: string): GlossaryTerm[] {
  const lower = query.toLowerCase();
  return Object.values(GLOSSARY).filter(t =>
    t.term.toLowerCase().includes(lower) ||
    t.definition.toLowerCase().includes(lower)
  );
}
