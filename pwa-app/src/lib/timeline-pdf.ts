import { jsPDF } from 'jspdf';
import { TimelineEvent } from './analytics';

export interface ClusterSummary {
  startLabel: string;
  endLabel: string;
  size: number;
  spanMonths: number;
  score: number;
}

export function exportTimelinePdf(
  events: TimelineEvent[],
  integrityScore: number,
  bureau?: string,
  clusters: ClusterSummary[] = [],
  filename = 'timeline_analysis.pdf'
) {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Timeline Analysis Snapshot', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);
  if (bureau) {
    doc.text(`Bureau: ${bureau}`, 14, 30);
  }
  doc.text(`Integrity Score: ${integrityScore}%`, 14, 36);
  doc.text(`Total Events: ${events.length}`, 120, 36);

  let y = 44;
  doc.setFont('helvetica', 'bold');
  doc.text('Event Timeline', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  events.forEach(event => {
    if (y > 260) {
      doc.addPage();
      y = 18;
    }
    const dateLabel = new Date(event.date).toLocaleDateString('en-US');
    const flag = event.flagged ? 'FLAG' : '';
    const evidenceCount = event.evidenceSnippets ? Math.min(event.evidenceSnippets.length, 3) : 0;
    const confidence = Math.min(100, (event.type === 'violation' || event.flagged ? 70 : 20) + evidenceCount * 10);
    doc.text(`${dateLabel} | ${event.label} | ${event.type} ${flag} | Evidence ${evidenceCount} | Confidence ${confidence}%`, 14, y);
    y += 5;
  });

  if (events.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('Confidence Trend', 14, y);
    y += 6;
    const confidence = events.map(event => {
      const evidence = event.evidenceSnippets ? Math.min(event.evidenceSnippets.length, 3) : 0;
      const base = event.type === 'violation' || event.flagged ? 70 : 20;
      return Math.min(100, base + evidence * 10);
    });
    const chartHeight = 24;
    const chartY = y + chartHeight;
    const barWidth = Math.max(6, Math.min(16, Math.floor(160 / Math.max(1, confidence.length))));
    confidence.forEach((value, idx) => {
      const barHeight = Math.max(2, Math.round((value / 100) * chartHeight));
      const x = 16 + idx * (barWidth + 4);
      doc.setFillColor(16, 185, 129);
      doc.rect(x, chartY - barHeight, barWidth, barHeight, 'F');
    });
    y = chartY + 8;
  }

  if (clusters.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('Violation Clusters', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    clusters.forEach(cluster => {
      if (y > 260) {
        doc.addPage();
        y = 18;
      }
      doc.text(
        `${cluster.startLabel} → ${cluster.endLabel} | ${cluster.size} events | ${cluster.spanMonths} mo | Score ${cluster.score}`,
        14,
        y
      );
      y += 5;
    });
  }

  doc.save(filename);
}
