import { CreditFields } from './rules';

export interface DeltaResult {
  field: string;
  oldValue: string;
  newValue: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

/**
 * Compare two credit reports to find forensic differences
 */
export function compareReports(oldReport: CreditFields, newReport: CreditFields): DeltaResult[] {
  const deltas: DeltaResult[] = [];
  const fieldsToCompare: (keyof CreditFields)[] = [
    'dofd', 'dateOpened', 'currentBalance', 'accountStatus', 
    'estimatedRemovalDate', 'chargeOffDate', 'dateLastPayment'
  ];

  for (const field of fieldsToCompare) {
    const oldVal = oldReport[field] || 'Not Reported';
    const newVal = newReport[field] || 'Not Reported';

    if (oldVal !== newVal) {
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      let description = '';

      if (field === 'dofd') {
        impact = 'negative';
        description = `DOFD changed from ${oldVal} to ${newVal}. This is definitive proof of debt re-aging.`;
      } else if (field === 'estimatedRemovalDate') {
        const oldDate = new Date(oldVal);
        const newDate = new Date(newVal);
        if (newDate > oldDate) {
          impact = 'negative';
          description = `Removal date extended by ${Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))} months.`;
        } else {
          impact = 'positive';
          description = `Removal date accelerated. Item will fall off sooner.`;
        }
      } else if (field === 'currentBalance') {
        const oldBal = parseFloat((oldVal as string).replace(/[$,]/g, '')) || 0;
        const newBal = parseFloat((newVal as string).replace(/[$,]/g, '')) || 0;
        if (newBal > oldBal) {
          impact = 'negative';
          description = `Balance increased by $${(newBal - oldBal).toFixed(2)}. Check for illegal fee stacking.`;
        } else if (newBal < oldBal) {
          impact = 'positive';
          description = `Balance decreased. Payments are being applied.`;
        }
      } else if (field === 'accountStatus') {
        if (oldVal.toLowerCase().includes('paid') && newVal.toLowerCase().includes('balance')) {
          impact = 'negative';
          description = `Zombie Debt Alert: Account previously reported as PAID is now reporting a balance.`;
        } else if (oldVal.toLowerCase().includes('discharged') && newVal.toLowerCase().includes('collect')) {
          impact = 'negative';
          description = `Bankruptcy Violation: Discharged debt is being resuscitated for collection.`;
        }
      }

      deltas.push({
        field: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
        oldValue: oldVal as string,
        newValue: newVal as string,
        impact,
        description
      });
    }
  }

  return deltas;
}
