import { isPDF, extractPDFText, extractPDFTextViaOCR } from './pdf';
import { isImage, performOCR } from './ocr';

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

export async function extractTextFromFile(
  file: File, 
  onProgress: (progress: number) => void,
  scanMode: ScanMode = 'standard',
  maxUploadSizeMB: number = 20
): Promise<string> {
  if (file.size > maxUploadSizeMB * 1024 * 1024) {
    throw new Error(`File exceeds ${maxUploadSizeMB}MB limit`);
  }

  let text = '';
  const profile = getScanProfile(scanMode);
  const scanLabel = scanMode === 'max' ? 'Max Scan' : 'Standard Scan';

  if (isPDF(file)) {
    try {
      const direct = await extractPDFText(file, onProgress);
      const normalized = normalizeExtractedText(direct);
      const quality = scoreTextQuality(normalized);
      text = normalized;

      if (scanMode === 'max' || quality < 55) {
        const ocrText = await extractPDFTextViaOCR(file, onProgress, {
          maxPages: profile.pdfMaxPages,
          scale: profile.pdfScale
        });
        text = mergeTextVariants(text, normalizeExtractedText(ocrText));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('no selectable text')) {
        text = await extractPDFTextViaOCR(file, onProgress, {
          maxPages: profile.pdfMaxPages,
          scale: profile.pdfScale
        });
      } else {
        throw error;
      }
    }
  } else if (isImage(file)) {
    text = await performOCR(file, onProgress, {
      scale: profile.ocrScale,
      contrast: profile.ocrContrast,
      thresholdLow: profile.ocrThresholdLow,
      thresholdHigh: profile.ocrThresholdHigh
    });
  } else {
    text = await file.text();
  }

  const normalized = normalizeExtractedText(text);
  if (!normalized) {
    throw new Error(`No readable text detected in ${file.name}. Try Max Scan or a higher-quality source.`);
  }
  return normalized;
}

export function mergeSourcesText(items: { name: string; size: number; type: string; text: string }[]): string {
  return items
    .map((item) => {
      const meta = `[SOURCE:${item.name} | ${item.type || 'unknown'} | ${Math.round(item.size / 1024)}KB]`;
      return `${meta}\n${normalizeExtractedText(item.text)}`.trim();
    })
    .join('\n\n-----\n\n');
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
