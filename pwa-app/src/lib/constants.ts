export const FIELD_CONFIG = [
  { key: 'originalCreditor', label: 'Original Creditor', section: 'account', help: 'The company that originally extended credit' },
  { key: 'furnisherOrCollector', label: 'Current Furnisher', section: 'account', help: 'Who is currently reporting this account' },
  { key: 'accountType', label: 'Account Type', section: 'account', help: 'e.g., Collection, Charge-off, Credit Card' },
  { key: 'accountStatus', label: 'Status', section: 'account', help: 'Current account status (Open, Closed, Paid)' },
  { key: 'paymentHistory', label: 'Payment History', section: 'account', help: 'Payment status codes (OK, 30, 60, 90, CO)' },
  { key: 'currentBalance', label: 'Current Balance', section: 'amounts', help: 'Amount currently reported as owed' },
  { key: 'originalAmount', label: 'Original Amount', section: 'amounts', help: 'Original debt amount before fees/interest' },
  { key: 'creditLimit', label: 'Credit Limit', section: 'amounts', help: 'Original credit limit if applicable' },
  { key: 'dateOpened', label: 'Date Opened', section: 'dates', isDate: true, help: 'When the account was first opened' },
  { key: 'dofd', label: 'Date of First Delinquency', section: 'dates', isDate: true, required: true, help: 'CRITICAL: When the account first became 30+ days late. Determines 7-year reporting window.' },
  { key: 'chargeOffDate', label: 'Charge-Off Date', section: 'dates', isDate: true, help: 'When the creditor wrote off the debt' },
  { key: 'dateLastPayment', label: 'Last Payment', section: 'dates', isDate: true, help: 'Most recent payment date. Affects statute of limitations.' },
  { key: 'dateReportedOrUpdated', label: 'Last Reported', section: 'dates', isDate: true, help: 'When this information was last updated' },
  { key: 'estimatedRemovalDate', label: 'Est. Removal Date', section: 'dates', isDate: true, help: 'When it should fall off your report' },
];

export const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

export const ACCOUNT_TYPES = ['Collection', 'Charge-off', 'Credit Card', 'Installment Loan', 'Medical', 'Mortgage', 'Auto Loan', 'Student Loan', 'Personal Loan', 'Utility'];

export const STATUSES = ['Open', 'Closed', 'Paid', 'Settled', 'Transferred', 'Sold', 'Charged Off', 'In Collections'];

export const ANALYSIS_TABS = [
  { id: 'violations', label: 'Violations' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'scoreimpact', label: 'Score Impact' },
  { id: 'countdown', label: 'Deadlines' },
  { id: 'collector', label: 'Collector Intel' },
  { id: 'metro2', label: 'Metro 2' },
  { id: 'deltas', label: 'Forensic Diff' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'caselaw', label: 'Case Law' },
  { id: 'breakdown', label: 'Score Breakdown' },
  { id: 'lettereditor', label: 'Letter Editor' },
  { id: 'legalshield', label: 'Legal Shield' },
  { id: 'discovery', label: 'Forensic Discovery' },
  { id: 'lab', label: 'Forensic Lab' },
  { id: 'actions', label: 'Action Items' },
] as const;

export type TabId = typeof ANALYSIS_TABS[number]['id'];
export type Step = 1 | 2 | 3 | 4 | 5 | 6;
export type LetterType = 'bureau' | 'furnisher' | 'validation' | 'cease_desist' | 'intent_to_sue';

export const STEPS = [
  { id: 1, name: 'Input', desc: 'Upload Report' },
  { id: 2, name: 'Extract', desc: 'Review Text' },
  { id: 3, name: 'Verify', desc: 'Confirm Data' },
  { id: 4, name: 'Analyze', desc: 'View Results' },
  { id: 5, name: 'Export', desc: 'Get Documents' },
  { id: 6, name: 'Track', desc: 'Dispute Tracker' },
] as const;
