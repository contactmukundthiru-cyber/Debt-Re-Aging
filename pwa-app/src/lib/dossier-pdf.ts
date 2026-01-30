import { jsPDF } from 'jspdf';
import { DeltaResult, SeriesInsight, SeriesSnapshot } from './delta';

const sectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, 14, y);
  doc.setDrawColor(220);
  doc.line(14, y + 2, 196, y + 2);
  return y + 8;
};

const safeText = (value?: string) => value || '—';

const parseBalance = (value?: string) => {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildConfidenceScore = (insights: SeriesInsight[], readiness = 0) => {
  const high = insights.filter(item => item.severity === 'high').length;
  const medium = insights.filter(item => item.severity === 'medium').length;
  return Math.min(100, Math.round(high * 12 + medium * 7 + readiness * 0.5));
};

export function exportComparisonDossierPdf(
  deltas: DeltaResult[],
  insights: SeriesInsight[],
  snapshots: SeriesSnapshot[],
  filename = 'forensic_comparison_dossier.pdf',
  evidenceReadiness = 0
) {
  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Forensic Comparison Dossier', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);

  let y = 32;

  y = sectionTitle(doc, 'Forensic Findings Summary', y);
  doc.setFontSize(9);
  const confidence = buildConfidenceScore(insights, evidenceReadiness);
  const highCount = insights.filter(item => item.severity === 'high').length;
  const mediumCount = insights.filter(item => item.severity === 'medium').length;
  const lowCount = insights.filter(item => item.severity === 'low').length;
  doc.text(`Confidence Score: ${confidence}%`, 14, y);
  y += 5;
  doc.text(`High Severity: ${highCount} | Medium: ${mediumCount} | Low: ${lowCount}`, 14, y);
  y += 6;

  y = sectionTitle(doc, 'Snapshot Timeline', y);
  doc.setFontSize(9);
  snapshots.forEach(snapshot => {
    if (y > 270) { doc.addPage(); y = 18; }
    doc.text(
      `${snapshot.label} | DOFD ${safeText(snapshot.dofd)} | Removal ${safeText(snapshot.removal)} | Balance ${safeText(snapshot.balance)} | Status ${safeText(snapshot.status)}`,
      14,
      y
    );
    y += 5;
  });

  y += 6;
  y = sectionTitle(doc, 'Balance Drift Chart', y);
  const balances = snapshots.map(snapshot => parseBalance(snapshot.balance));
  const maxBalance = Math.max(1, ...balances);
  const chartHeight = 24;
  const chartY = y + chartHeight;
  const barWidth = Math.max(6, Math.min(16, Math.floor(160 / Math.max(1, balances.length))));
  balances.forEach((value, idx) => {
    const barHeight = Math.max(2, Math.round((value / maxBalance) * chartHeight));
    const x = 16 + idx * (barWidth + 4);
    doc.setFillColor(79, 70, 229);
    doc.rect(x, chartY - barHeight, barWidth, barHeight, 'F');
  });
  y = chartY + 8;

  y = sectionTitle(doc, 'Series Insights', y);
  doc.setFontSize(9);
  if (insights.length === 0) {
    doc.text('No series anomalies detected.', 14, y);
    y += 6;
  } else {
    insights.forEach(insight => {
      if (y > 260) { doc.addPage(); y = 18; }
      doc.setFont('helvetica', 'bold');
      doc.text(`[${insight.severity.toUpperCase()}] ${insight.title}`, 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const wrapped = doc.splitTextToSize(insight.summary, 180);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 4;
      insight.evidence.forEach(ev => {
        doc.text(`• ${ev}`, 18, y);
        y += 4;
      });
      y += 2;
    });
  }

  y += 2;
  y = sectionTitle(doc, 'Delta Changes', y);
  doc.setFontSize(9);
  if (deltas.length === 0) {
    doc.text('No field-level deltas detected.', 14, y);
  } else {
    const headers = ['Field', 'Before', 'After', 'Impact'];
    doc.setFont('helvetica', 'bold');
    doc.text(headers[0], 14, y);
    doc.text(headers[1], 70, y);
    doc.text(headers[2], 120, y);
    doc.text(headers[3], 170, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    deltas.forEach(delta => {
      if (y > 260) { doc.addPage(); y = 18; }
      doc.text(delta.field, 14, y);
      doc.text(String(delta.oldValue).slice(0, 18), 70, y);
      doc.text(String(delta.newValue).slice(0, 18), 120, y);
      doc.text(delta.impact, 170, y);
      y += 5;
    });
  }

  doc.save(filename);
}

export function buildComparisonDossierPdfBlob(
  deltas: DeltaResult[],
  insights: SeriesInsight[],
  snapshots: SeriesSnapshot[],
  evidenceReadiness = 0
): Blob {
  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Forensic Comparison Dossier', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);

  let y = 32;

  y = sectionTitle(doc, 'Forensic Findings Summary', y);
  doc.setFontSize(9);
  const confidence = buildConfidenceScore(insights, evidenceReadiness);
  const highCount = insights.filter(item => item.severity === 'high').length;
  const mediumCount = insights.filter(item => item.severity === 'medium').length;
  const lowCount = insights.filter(item => item.severity === 'low').length;
  doc.text(`Confidence Score: ${confidence}%`, 14, y);
  y += 5;
  doc.text(`High Severity: ${highCount} | Medium: ${mediumCount} | Low: ${lowCount}`, 14, y);
  y += 6;

  y = sectionTitle(doc, 'Snapshot Timeline', y);
  doc.setFontSize(9);
  snapshots.forEach(snapshot => {
    if (y > 270) { doc.addPage(); y = 18; }
    doc.text(
      `${snapshot.label} | DOFD ${safeText(snapshot.dofd)} | Removal ${safeText(snapshot.removal)} | Balance ${safeText(snapshot.balance)} | Status ${safeText(snapshot.status)}`,
      14,
      y
    );
    y += 5;
  });

  y += 6;
  y = sectionTitle(doc, 'Balance Drift Chart', y);
  const balances = snapshots.map(snapshot => parseBalance(snapshot.balance));
  const maxBalance = Math.max(1, ...balances);
  const chartHeight = 24;
  const chartY = y + chartHeight;
  const barWidth = Math.max(6, Math.min(16, Math.floor(160 / Math.max(1, balances.length))));
  balances.forEach((value, idx) => {
    const barHeight = Math.max(2, Math.round((value / maxBalance) * chartHeight));
    const x = 16 + idx * (barWidth + 4);
    doc.setFillColor(79, 70, 229);
    doc.rect(x, chartY - barHeight, barWidth, barHeight, 'F');
  });
  y = chartY + 8;

  y = sectionTitle(doc, 'Series Insights', y);
  doc.setFontSize(9);
  if (insights.length === 0) {
    doc.text('No series anomalies detected.', 14, y);
    y += 6;
  } else {
    insights.forEach(insight => {
      if (y > 260) { doc.addPage(); y = 18; }
      doc.setFont('helvetica', 'bold');
      doc.text(`[${insight.severity.toUpperCase()}] ${insight.title}`, 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const wrapped = doc.splitTextToSize(insight.summary, 180);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 4;
      insight.evidence.forEach(ev => {
        doc.text(`• ${ev}`, 18, y);
        y += 4;
      });
      y += 2;
    });
  }

  y += 2;
  y = sectionTitle(doc, 'Delta Changes', y);
  doc.setFontSize(9);
  if (deltas.length === 0) {
    doc.text('No field-level deltas detected.', 14, y);
  } else {
    const headers = ['Field', 'Before', 'After', 'Impact'];
    doc.setFont('helvetica', 'bold');
    doc.text(headers[0], 14, y);
    doc.text(headers[1], 70, y);
    doc.text(headers[2], 120, y);
    doc.text(headers[3], 170, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    deltas.forEach(delta => {
      if (y > 260) { doc.addPage(); y = 18; }
      doc.text(delta.field, 14, y);
      doc.text(String(delta.oldValue).slice(0, 18), 70, y);
      doc.text(String(delta.newValue).slice(0, 18), 120, y);
      doc.text(delta.impact, 170, y);
      y += 5;
    });
  }

  return doc.output('blob');
}
