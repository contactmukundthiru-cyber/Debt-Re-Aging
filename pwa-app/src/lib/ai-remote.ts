import { CreditFields, RuleFlag, RiskProfile } from './types';
import { PatternInsight, TimelineEvent } from './analytics';

export interface RemoteAIConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  includeFields: boolean;
}

export interface RemoteAIResult {
  summary: string;
  keyRisks: string[];
  recommendedActions: string[];
}

const STORAGE_KEY = 'cra_remote_ai_config';

export function loadRemoteAIConfig(): RemoteAIConfig {
  if (typeof window === 'undefined') {
    return { baseUrl: '', model: '', apiKey: '', includeFields: false };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        baseUrl: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini',
        apiKey: '',
        includeFields: false
      };
    }
    return JSON.parse(stored) as RemoteAIConfig;
  } catch {
    return {
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      apiKey: '',
      includeFields: false
    };
  }
}

export function saveRemoteAIConfig(config: RemoteAIConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearRemoteAIConfig() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function runRemoteAnalysis(
  config: RemoteAIConfig,
  payload: {
    flags: RuleFlag[];
    fields: Partial<CreditFields>;
    patterns: PatternInsight[];
    timeline: TimelineEvent[];
    riskProfile: RiskProfile;
  }
): Promise<RemoteAIResult> {
  const { baseUrl, model, apiKey, includeFields } = config;
  if (!apiKey || !baseUrl) {
    throw new Error('Missing API key or base URL.');
  }

  const trimmedFlags = payload.flags.map(flag => ({
    ruleId: flag.ruleId,
    ruleName: flag.ruleName,
    severity: flag.severity,
    explanation: flag.explanation,
    legalCitations: flag.legalCitations,
    suggestedEvidence: flag.suggestedEvidence
  }));

  const requestPayload = {
    flags: trimmedFlags,
    patterns: payload.patterns,
    timeline: payload.timeline,
    riskProfile: payload.riskProfile,
    fields: includeFields ? payload.fields : undefined
  };

  const system = 'You are a legal forensic analyst. Respond with JSON: {"summary": "...", "keyRisks": ["..."], "recommendedActions": ["..."]}.';
  const user = `Analyze this credit-report dispute case. Provide concise, actionable outputs.\n\n${JSON.stringify(requestPayload, null, 2)}`;

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Remote analysis failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  try {
    const parsed = JSON.parse(content) as RemoteAIResult;
    return {
      summary: parsed.summary || '',
      keyRisks: parsed.keyRisks || [],
      recommendedActions: parsed.recommendedActions || []
    };
  } catch {
    return {
      summary: content || 'No summary returned.',
      keyRisks: [],
      recommendedActions: []
    };
  }
}
