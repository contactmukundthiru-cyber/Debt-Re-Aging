import { Dispute } from './dispute-tracker';

export function buildStatusNote(dispute: Dispute, status: Dispute['status']): string {
  const date = new Date().toLocaleDateString();
  const bureau = dispute.bureau || 'bureau';
  const creditor = dispute.account.creditor;

  switch (status) {
    case 'submitted':
      return `Submitted to ${bureau} on ${date}. Awaiting response from ${creditor}.`;
    case 'investigating':
      return `Investigation started on ${date}. Monitoring ${bureau} response timeline.`;
    case 'response_received':
      return `Response received from ${bureau} on ${date}. Review for accuracy.`;
    case 'escalated':
      return `Escalated on ${date} due to missed response deadline or unresolved inaccuracies.`;
    case 'resolved_favorable':
      return `Resolved favorably on ${date}. Account ${creditor} deletion/correction confirmed.`;
    case 'resolved_unfavorable':
      return `Resolved unfavorably on ${date}. Response verified accuracy; consider escalation.`;
    case 'closed':
      return `Closed on ${date}. Case archived for recordkeeping.`;
    default:
      return dispute.notes || '';
  }
}
