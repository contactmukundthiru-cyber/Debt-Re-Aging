export type ScanMode = 'standard' | 'max';

export interface ScanProfile {
  mode: ScanMode;
  pdfMaxPages: number;
  pdfScale: number;
  ocrScale: number;
  ocrContrast: number;
  ocrThresholdLow: number;
  ocrThresholdHigh: number;
}

export function getScanProfile(mode: ScanMode): ScanProfile {
  if (mode === 'max') {
    return {
      mode,
      pdfMaxPages: 12,
      pdfScale: 2.6,
      ocrScale: 1.6,
      ocrContrast: 1.35,
      ocrThresholdLow: 80,
      ocrThresholdHigh: 175
    };
  }

  return {
    mode,
    pdfMaxPages: 6,
    pdfScale: 2.0,
    ocrScale: 1.0,
    ocrContrast: 1.2,
    ocrThresholdLow: 90,
    ocrThresholdHigh: 160
  };
}

export function normalizeExtractedText(text: string): string {
  if (!text) return '';
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = cleaned.split('\n');
  const rebuilt: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trimEnd() ?? '';
    if (line.endsWith('-') && i + 1 < lines.length) {
      const next = lines[i + 1]?.trimStart() ?? '';
      rebuilt.push(`${line.slice(0, -1)}${next}`);
      i += 1;
      continue;
    }
    rebuilt.push(line);
  }

  return rebuilt.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function scoreTextQuality(text: string): number {
  if (!text) return 0;
  const sample = text.slice(0, 4000);
  const alpha = (sample.match(/[A-Za-z]/g) || []).length;
  const digits = (sample.match(/[0-9]/g) || []).length;
  const total = sample.length || 1;
  const ratio = (alpha + digits) / total;
  const keywordBoost = /account|balance|credit|dofd|delinquen|reported|opened|collector/i.test(sample) ? 0.15 : 0;
  return Math.min(100, Math.round((ratio + keywordBoost) * 100));
}

export function mergeTextVariants(primary: string, secondary: string): string {
  if (!secondary) return primary;
  const primaryLines = primary.split('\n');
  const seen = new Set(primaryLines.map(line => line.trim()).filter(Boolean));
  const merged = [...primaryLines];
  secondary.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (seen.has(trimmed)) return;
    seen.add(trimmed);
    merged.push(line);
  });
  return merged.join('\n').trim();
}
