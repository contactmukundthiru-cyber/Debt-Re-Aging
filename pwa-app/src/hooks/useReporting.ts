'use client';

import { useState, useCallback } from 'react';
import { 
  CreditFields, 
  RuleFlag, 
  RiskProfile, 
  ConsumerInfo 
} from '../lib/types';
import { 
  generateBureauLetter, 
  generateValidationLetter, 
  generateCFPBNarrative, 
  generateCaseSummary, 
  generatePDFLetter 
} from '../lib/generator';
import { LetterType } from '../lib/constants';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  generateForensicReportBlob, 
  generatePDFBlob 
} from '../lib/generator';
import { 
  generateCeaseDesistLetter, 
  generateIntentToSueLetter 
} from '../lib/disputes';
import { 
  buildEvidencePackage, 
  formatEvidencePackage 
} from '../lib/evidence-builder';
import { 
  buildAttorneyPackage, 
  formatAttorneyPackage, 
  formatRedactedAttorneyPackage,
  buildOutcomeNarrative
} from '../lib/attorney-export';
import { CaseLaw } from '../lib/caselaw';
import { estimateComplaintStrength } from '../lib/cfpb-complaint';
import { formatCurrency } from '../lib/i18n';

export function useReporting(
  editableFields: CreditFields,
  flags: RuleFlag[],
  riskProfile: RiskProfile | null,
  consumer: ConsumerInfo,
  relevantCaseLaw: CaseLaw[],
  discoveryAnswers: Record<string, string>,
  fileName: string | null,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
) {
  const [selectedLetterType, setSelectedLetterType] = useState<LetterType>('bureau');
  const [editableLetter, setEditableLetter] = useState('');
  const [exportTab, setExportTab] = useState<'letters' | 'attorney' | 'evidence' | 'cfpb'>('letters');
  const [isBundling, setIsBundling] = useState(false);

  const downloadTextFile = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadPdfFile = useCallback((content: string, filename: string) => {
    const blob = generatePDFBlob(content);
    saveAs(blob, filename);
  }, []);

  const downloadDocument = useCallback(async (type: 'bureau' | 'validation' | 'cfpb' | 'summary', format: 'pdf' | 'txt' = 'pdf') => {
    let content = '';
    let filename = '';
    
    switch (type) {
      case 'bureau':
        content = generateBureauLetter(editableFields, flags, consumer);
        filename = `dispute_letter_bureau.${format === 'pdf' ? 'pdf' : 'txt'}`;
        break;
      case 'validation':
        content = generateValidationLetter(editableFields, flags, consumer);
        filename = `debt_validation_request.${format === 'pdf' ? 'pdf' : 'txt'}`;
        break;
      case 'cfpb':
        content = generateCFPBNarrative(editableFields, flags, consumer);
        filename = `cfpb_complaint_narrative.${format === 'pdf' ? 'pdf' : 'txt'}`;
        break;
      case 'summary':
        if (!riskProfile) return;
        content = await generateCaseSummary(editableFields, flags, riskProfile, consumer);
        filename = `case_analysis_summary.${format === 'pdf' ? 'pdf' : 'txt'}`;
        break;
    }

    if (format === 'pdf') {
      generatePDFLetter(content, filename);
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [editableFields, flags, riskProfile, consumer]);

  const downloadForensicReport = useCallback(() => {
    if (!riskProfile) return;
    const blob = generateForensicReportBlob(
      editableFields,
      flags,
      riskProfile,
      relevantCaseLaw,
      consumer,
      discoveryAnswers
    );
    saveAs(blob, 'forensic_investigation_report.pdf');
    showToast('Institutional report generated successfully.', 'success');
  }, [editableFields, flags, riskProfile, relevantCaseLaw, consumer, discoveryAnswers, showToast]);

  const downloadAnalysisJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      fileName,
      consumer,
      fields: editableFields,
      flags,
      riskProfile,
      discoveryAnswers,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'credit-analysis.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [consumer, discoveryAnswers, editableFields, fileName, flags, riskProfile]);

  const buildCaseBundleSections = useCallback(() => {
    const consumerDetails = {
      name: consumer.name || '',
      address: consumer.address || '',
      city: '',
      state: consumer.state || '',
      zip: ''
    };

    return [
      { title: 'Bureau Dispute Letter', content: generateBureauLetter(editableFields, flags, consumer) },
      { title: 'Debt Validation Request', content: generateValidationLetter(editableFields, flags, consumer) },
      { title: 'CFPB Complaint Narrative', content: generateCFPBNarrative(editableFields, flags, consumer) },
      { title: 'Case Summary', content: generateCaseSummary(editableFields, flags, riskProfile!, consumer) },
      { title: 'Cease and Desist Letter', content: generateCeaseDesistLetter(editableFields, consumerDetails, flags.map(f => f.explanation)) },
      { title: 'Intent to Sue Letter', content: generateIntentToSueLetter(editableFields, flags, consumerDetails) },
      { title: 'Evidence Package', content: formatEvidencePackage(buildEvidencePackage(editableFields, flags, riskProfile!, consumerDetails.name, consumerDetails.state)) },
      { title: 'Attorney Package', content: formatAttorneyPackage(buildAttorneyPackage(editableFields, flags, riskProfile!, consumerDetails)) },
      { title: 'Redacted Attorney Package', content: formatRedactedAttorneyPackage(buildAttorneyPackage(editableFields, flags, riskProfile!, consumerDetails)) }
    ];
  }, [consumer, editableFields, flags, riskProfile]);

  const downloadCaseBundle = useCallback(() => {
    const sections = buildCaseBundleSections();
    const bundle = sections
      .map(section => `===== ${section.title} =====\n\n${section.content}`)
      .join('\n\n\n');

    downloadTextFile(bundle, 'credit-case-bundle.txt');
  }, [buildCaseBundleSections, downloadTextFile]);

  const downloadCaseBundleZip = useCallback(async () => {
    if (isBundling) return;
    setIsBundling(true);
    showToast('Preparing case bundle ZIP...', 'info');

    try {
      const sections = buildCaseBundleSections();
      const zip = new JSZip();
      sections.forEach((section) => {
        const safeName = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        zip.file(`${safeName}.txt`, section.content);
      });
      const pdfFolder = zip.folder('pdf');
      if (pdfFolder) {
        sections.forEach((section) => {
          const safeName = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          pdfFolder.file(`${safeName}.pdf`, generatePDFBlob(section.content) as unknown as string);
        });
        if (riskProfile) {
          pdfFolder.file(
            'forensic_investigation_report.pdf',
            generateForensicReportBlob(editableFields, flags, riskProfile, relevantCaseLaw, consumer, discoveryAnswers)
          );
        }
      }
      zip.file('README.txt', [
        'Credit Report Analyzer - Case Bundle',
        `Exported: ${new Date().toLocaleString()}`,
        '',
        'Contents:',
        '- TXT files: human-readable letters and packages',
        '- pdf/: PDF versions of each document',
        '- case-metadata.json: structured data snapshot',
        '',
        'All processing is local to your device.'
      ].join('\n'));
      zip.file('case-metadata.json', JSON.stringify({
        exportedAt: new Date().toISOString(),
        fileName,
        consumer,
        fields: editableFields,
        flags,
        riskProfile,
        discoveryAnswers
      }, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'credit-case-bundle.zip');
      showToast('ZIP ready for download.', 'success');
    } catch (error) {
      console.error('ZIP generation failed:', error);
      showToast('Failed to generate ZIP. Please try again.', 'error');
    } finally {
      setIsBundling(false);
    }
  }, [buildCaseBundleSections, consumer, discoveryAnswers, editableFields, fileName, flags, isBundling, relevantCaseLaw, riskProfile, showToast]);

  return {
    selectedLetterType,
    setSelectedLetterType,
    editableLetter,
    setEditableLetter,
    exportTab,
    setExportTab,
    isBundling,
    downloadDocument,
    downloadTextFile,
    downloadPdfFile,
    downloadForensicReport,
    downloadAnalysisJson,
    downloadCaseBundle,
    downloadCaseBundleZip,
    // Add generators for compatibility
    generateCeaseDesistLetter,
    generateIntentToSueLetter,
    estimateComplaintStrength,
    buildEvidencePackage,
    formatEvidencePackage,
    buildAttorneyPackage,
    formatAttorneyPackage,
    formatRedactedAttorneyPackage,
    buildOutcomeNarrative,
    formatCurrency
  };
}
