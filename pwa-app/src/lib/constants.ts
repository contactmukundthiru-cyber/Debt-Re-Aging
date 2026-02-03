export const APP_VERSION = '5.0.0';

export const FIELD_CONFIG = [

  { key: 'originalCreditor', label: 'Original Creditor', section: 'account', help: 'The company that originally extended credit' },
  { key: 'furnisherOrCollector', label: 'Current Furnisher', section: 'account', help: 'Who is currently reporting this account' },
  { key: 'accountNumber', label: 'Account Number', section: 'account', help: 'The unique identifier for this account' },
  { key: 'accountType', label: 'Account Type', section: 'account', help: 'e.g., Collection, Charge-off, Credit Card' },
  { key: 'accountStatus', label: 'Status', section: 'account', help: 'Current account status (Open, Closed, Paid)' },
  { key: 'paymentHistory', label: 'Payment History', section: 'account', help: 'Payment status codes (OK, 30, 60, 90, CO)' },
  { key: 'currentValue', label: 'Current Stated Value', section: 'values', help: 'The numerical value currently reported' },
  { key: 'initialValue', label: 'Initial Stated Value', section: 'values', help: 'The starting numerical value' },
  { key: 'creditLimit', label: 'Value Limit', section: 'values', help: 'The maximum permissible value' },
  { key: 'dateOpened', label: 'Date Opened', section: 'dates', isDate: true, help: 'When the account was first opened' },
  { key: 'dofd', label: 'Date of First Delinquency', section: 'dates', isDate: true, required: true, help: 'CRITICAL: When the account first became 30+ days late. Determines 7-year reporting window.' },
  { key: 'chargeOffDate', label: 'Charge-Off Date', section: 'dates', isDate: true, help: 'When the creditor wrote off the debt' },
  { key: 'dateLastPayment', label: 'Last Payment', section: 'dates', isDate: true, help: 'Most recent payment date. Affects statute of limitations.' },
  { key: 'dateReportedOrUpdated', label: 'Last Reported', section: 'dates', isDate: true, help: 'When this information was last updated' },
  { key: 'estimatedRemovalDate', label: 'Est. Removal Date', section: 'dates', isDate: true, help: 'When it should fall off your report' },
];

export const STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];

export const ACCOUNT_TYPES = ['Collection', 'Charge-off', 'Credit Card', 'Installment Loan', 'Medical', 'Mortgage', 'Auto Loan', 'Student Loan', 'Personal Loan', 'Utility'];

export const STATUSES = ['Open', 'Closed', 'Paid', 'Settled', 'Transferred', 'Sold', 'Charged Off', 'In Collections'];

export const BUREAU_ADDRESSES = {
  experian: {
    name: 'Experian',
    address: 'P.O. Box 4500',
    city: 'Allen',
    state: 'TX',
    zip: '75013'
  },
  equifax: {
    name: 'Equifax Information Services LLC',
    address: 'P.O. Box 740256',
    city: 'Atlanta',
    state: 'GA',
    zip: '30374'
  },
  transunion: {
    name: 'TransUnion LLC',
    address: 'P.O. Box 2000',
    city: 'Chester',
    state: 'PA',
    zip: '19016'
  }
};

export const ANALYSIS_TABS = [
  { id: 'overview', label: 'Executive Summary' },
  { id: 'metro2', label: 'Compliance Audit' },
  { id: 'statutes', label: 'Statute Tracker' },
  { id: 'liability', label: 'Liability Assets' },
  { id: 'actions', label: 'Action Protocol' },
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
