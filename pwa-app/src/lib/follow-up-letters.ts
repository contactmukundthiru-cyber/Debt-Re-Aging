import { CreditFields, RuleFlag } from './rules';
import { ConsumerInfo } from './generator';

export function buildReminderEmail(creditor: string, nextAction: string, dueDate: string): string {
  return [
    `Subject: Dispute Response Deadline Reminder - ${creditor}`,
    '',
    'Hello,',
    '',
    `This is a reminder that the response deadline for the dispute against ${creditor} is approaching.`,
    `Next action: ${nextAction}`,
    `Due date: ${dueDate}`,
    '',
    'Please ensure all responses are delivered within the statutory timeframe.',
    '',
    'Thank you.',
  ].join('\n');
}

export function buildNoResponseEmail(creditor: string): string {
  return [
    `Subject: Failure to Respond Within Statutory Deadline - ${creditor}`,
    '',
    'Hello,',
    '',
    `The statutory response deadline for the dispute against ${creditor} has passed without a response.`,
    'This is a request for immediate escalation and confirmation of compliance.',
    '',
    'Please advise on next steps and provide a written response as soon as possible.',
    '',
    'Thank you.'
  ].join('\n');
}

export function buildMOVRequest(fields: Partial<CreditFields>, consumer: ConsumerInfo): string {
  const bureau = fields.furnisherOrCollector || fields.originalCreditor || 'the bureau';
  return [
    'METHOD OF VERIFICATION REQUEST',
    '',
    `Date: ${new Date().toLocaleDateString()}`,
    `Consumer: ${consumer.name || '[NAME]'}`,
    `Address: ${consumer.address || '[ADDRESS]'}`,
    `State: ${consumer.state || '[STATE]'}`,
    '',
    `To: ${bureau}`,
    '',
    'I am requesting the method of verification (MOV) for the investigation of the disputed account. Please provide:',
    '1) The name, address, and phone number of any furnisher contacted.',
    '2) A description of the procedures used to verify the information.',
    '3) The dates and methods of all communications used to verify the account.',
    '',
    'This request is made pursuant to FCRA §611(a)(7).',
    '',
    'Sincerely,',
    consumer.name || '[NAME]',
  ].join('\n');
}

export function buildNoResponseNotice(
  fields: Partial<CreditFields>,
  consumer: ConsumerInfo,
  disputeFiledDate?: string
): string {
  const bureau = fields.furnisherOrCollector || fields.originalCreditor || 'the bureau';
  return [
    'NOTICE OF FAILURE TO INVESTIGATE',
    '',
    `Date: ${new Date().toLocaleDateString()}`,
    `Consumer: ${consumer.name || '[NAME]'}`,
    `Address: ${consumer.address || '[ADDRESS]'}`,
    `State: ${consumer.state || '[STATE]'}`,
    '',
    `To: ${bureau}`,
    '',
    `This notice concerns a dispute filed on ${disputeFiledDate || '[DATE FILED]'}.`,
    'The statutory response deadline has passed without a response. This failure is a violation of FCRA §611.',
    '',
    'Please provide immediate confirmation of deletion or a full investigative response.',
    '',
    'Sincerely,',
    consumer.name || '[NAME]',
  ].join('\n');
}

export function buildCFPBOutline(
  fields: Partial<CreditFields>,
  consumer: ConsumerInfo,
  flags: RuleFlag[]
): string {
  const violations = flags.slice(0, 5).map(flag => `- ${flag.ruleName} (${flag.ruleId})`).join('\n');
  return [
    'CFPB COMPLAINT OUTLINE',
    '',
    `Consumer: ${consumer.name || '[NAME]'}`,
    `Account: ${fields.originalCreditor || fields.furnisherOrCollector || '[ACCOUNT]'}`,
    '',
    'Summary of issue:',
    'The bureau/furnisher failed to conduct a reasonable investigation or correct inaccurate reporting within the statutory timeframe.',
    '',
    'Key violations:',
    violations || '- [LIST VIOLATIONS]',
    '',
    'Requested resolution:',
    '- Immediate deletion or correction of inaccurate information',
    '- Written confirmation of investigative procedures',
    '- Compliance confirmation within 15 days',
  ].join('\n');
}
