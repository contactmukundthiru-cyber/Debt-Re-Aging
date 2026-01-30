/**
 * Internationalization (i18n) System
 * Full Spanish and English support
 */

export type Language = 'en' | 'es';

export interface TranslationStrings {
  // Navigation
  nav: {
    home: string;
    analyze: string;
    results: string;
    documents: string;
    help: string;
    settings: string;
  };

  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    submit: string;
    download: string;
    print: string;
    close: string;
    yes: string;
    no: string;
    none: string;
    unknown: string;
    required: string;
    optional: string;
  };

  // Steps
  steps: {
    upload: string;
    uploadDesc: string;
    extract: string;
    extractDesc: string;
    verify: string;
    verifyDesc: string;
    analyze: string;
    analyzeDesc: string;
    export: string;
    exportDesc: string;
  };

  // Upload
  upload: {
    title: string;
    subtitle: string;
    dropzone: string;
    dropzoneActive: string;
    supportedFormats: string;
    pasteText: string;
    pasteTextPlaceholder: string;
    loadSample: string;
    analyzeButton: string;
    privacyNotice: string;
    processingPdf: string;
    processingOcr: string;
    processingText: string;
  };

  // Fields
  fields: {
    originalCreditor: string;
    currentFurnisher: string;
    accountType: string;
    accountStatus: string;
    paymentHistory: string;
    currentBalance: string;
    originalAmount: string;
    creditLimit: string;
    dateOpened: string;
    dofd: string;
    dofdHelp: string;
    chargeOffDate: string;
    lastPayment: string;
    lastReported: string;
    removalDate: string;
    consumerName: string;
    consumerAddress: string;
    consumerState: string;
  };

  // Results
  results: {
    title: string;
    subtitle: string;
    caseStrength: string;
    riskLevel: string;
    disputeStrength: string;
    litigationPotential: string;
    violationsFound: string;
    highSeverity: string;
    mediumSeverity: string;
    lowSeverity: string;
    noViolations: string;
    noViolationsDesc: string;
  };

  // Violations
  violations: {
    title: string;
    severity: string;
    explanation: string;
    whyMatters: string;
    suggestedEvidence: string;
    legalCitations: string;
  };

  // Patterns
  patterns: {
    title: string;
    significance: string;
    description: string;
    recommendation: string;
    noPatterns: string;
  };

  // Timeline
  timeline: {
    title: string;
    accountOpened: string;
    lastPayment: string;
    firstDelinquency: string;
    chargeOff: string;
    removalDate: string;
    noEvents: string;
  };

  // Actions
  actions: {
    title: string;
    immediate: string;
    standard: string;
    optional: string;
    reason: string;
  };

  // Documents
  documents: {
    title: string;
    subtitle: string;
    bureauLetter: string;
    bureauLetterDesc: string;
    validationLetter: string;
    validationLetterDesc: string;
    cfpbComplaint: string;
    cfpbComplaintDesc: string;
    caseSummary: string;
    caseSummaryDesc: string;
    evidencePackage: string;
    evidencePackageDesc: string;
    attorneyPackage: string;
    attorneyPackageDesc: string;
    disclaimer: string;
  };

  // Countdowns
  countdowns: {
    title: string;
    reportingRemoval: string;
    solExpiration: string;
    disputeDeadline: string;
    responseDeadline: string;
    expired: string;
    daysRemaining: string;
    monthsRemaining: string;
    yearsRemaining: string;
  };

  // Score Impact
  scoreImpact: {
    title: string;
    currentRange: string;
    potentialRange: string;
    improvement: string;
    factors: string;
    confidence: string;
    disclaimer: string;
  };

  // Help
  help: {
    title: string;
    whatIsDofd: string;
    sevenYearRule: string;
    reaging: string;
    statutes: string;
    disputeProcess: string;
    glossary: string;
    faq: string;
  };

  // Errors
  errors: {
    fileUploadFailed: string;
    parsingFailed: string;
    invalidDate: string;
    networkError: string;
    unknownError: string;
  };
}

const translations: Record<Language, TranslationStrings> = {
  en: {
    nav: {
      home: 'Home',
      analyze: 'Analyze',
      results: 'Results',
      documents: 'Documents',
      help: 'Help',
      settings: 'Settings'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      download: 'Download',
      print: 'Print',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      none: 'None',
      unknown: 'Unknown',
      required: 'Required',
      optional: 'Optional'
    },
    steps: {
      upload: 'Upload',
      uploadDesc: 'Upload Report',
      extract: 'Extract',
      extractDesc: 'Review Text',
      verify: 'Verify',
      verifyDesc: 'Confirm Data',
      analyze: 'Analyze',
      analyzeDesc: 'View Results',
      export: 'Export',
      exportDesc: 'Get Documents'
    },
    upload: {
      title: 'Analyze Your Credit Report',
      subtitle: 'Upload any format — PDF, image, or text. Our forensic engine detects FCRA/FDCPA violations and illegal debt re-aging.',
      dropzone: 'Drop file or click to browse',
      dropzoneActive: 'Drop your file here',
      supportedFormats: 'PDF, PNG, JPG, TXT supported',
      pasteText: 'Paste Text',
      pasteTextPlaceholder: 'Paste the account section from your credit report here...',
      loadSample: 'Load Sample Data',
      analyzeButton: 'Analyze Report',
      privacyNotice: '100% Private: All processing happens in your browser. Your data never leaves your device.',
      processingPdf: 'Extracting PDF text...',
      processingOcr: 'Running OCR...',
      processingText: 'Reading file...'
    },
    fields: {
      originalCreditor: 'Original Creditor',
      currentFurnisher: 'Current Furnisher',
      accountType: 'Account Type',
      accountStatus: 'Status',
      paymentHistory: 'Payment History',
      currentBalance: 'Current Balance',
      originalAmount: 'Original Amount',
      creditLimit: 'Credit Limit',
      dateOpened: 'Date Opened',
      dofd: 'Date of First Delinquency',
      dofdHelp: 'CRITICAL: When the account first became 30+ days late. Determines 7-year reporting window.',
      chargeOffDate: 'Charge-Off Date',
      lastPayment: 'Last Payment',
      lastReported: 'Last Reported',
      removalDate: 'Est. Removal Date',
      consumerName: 'Full Name',
      consumerAddress: 'Address',
      consumerState: 'State'
    },
    results: {
      title: 'Analysis Results',
      subtitle: 'violations detected',
      caseStrength: 'Case Strength',
      riskLevel: 'Risk Level',
      disputeStrength: 'Dispute Strength',
      litigationPotential: 'Litigation Potential',
      violationsFound: 'Violations Found',
      highSeverity: 'High Severity',
      mediumSeverity: 'Medium',
      lowSeverity: 'Low',
      noViolations: 'No Obvious Violations',
      noViolationsDesc: 'Manual review by a professional is still recommended.'
    },
    violations: {
      title: 'Violations',
      severity: 'Severity',
      explanation: 'Explanation',
      whyMatters: 'Why This Matters',
      suggestedEvidence: 'Suggested Evidence',
      legalCitations: 'Legal Citations'
    },
    patterns: {
      title: 'Patterns',
      significance: 'Significance',
      description: 'Description',
      recommendation: 'Recommendation',
      noPatterns: 'No significant patterns detected.'
    },
    timeline: {
      title: 'Timeline',
      accountOpened: 'Account Opened',
      lastPayment: 'Last Payment',
      firstDelinquency: 'Date of First Delinquency',
      chargeOff: 'Charge-Off',
      removalDate: 'Est. Removal Date',
      noEvents: 'No timeline events to display.'
    },
    actions: {
      title: 'Action Items',
      immediate: 'Immediate Action',
      standard: 'Standard',
      optional: 'Optional',
      reason: 'Reason'
    },
    documents: {
      title: 'Download Documents',
      subtitle: 'Generate legally-compliant dispute letters based on your analysis.',
      bureauLetter: 'Bureau Dispute Letter',
      bureauLetterDesc: 'For Experian, Equifax, TransUnion',
      validationLetter: 'Debt Validation Request',
      validationLetterDesc: 'FDCPA §809(b) compliant',
      cfpbComplaint: 'CFPB Complaint',
      cfpbComplaintDesc: 'Ready for submission',
      caseSummary: 'Case Summary',
      caseSummaryDesc: 'Complete forensic report',
      evidencePackage: 'Evidence Package',
      evidencePackageDesc: 'Court-ready documentation',
      attorneyPackage: 'Attorney Package',
      attorneyPackageDesc: 'For legal consultation',
      disclaimer: 'These documents are templates for educational purposes. Consult with a qualified attorney before taking legal action.'
    },
    countdowns: {
      title: 'Important Deadlines',
      reportingRemoval: '7-Year Reporting Limit',
      solExpiration: 'Statute of Limitations',
      disputeDeadline: 'Dispute Filing Deadline',
      responseDeadline: '30-Day Investigation Deadline',
      expired: 'EXPIRED',
      daysRemaining: 'days remaining',
      monthsRemaining: 'months remaining',
      yearsRemaining: 'years remaining'
    },
    scoreImpact: {
      title: 'Credit Score Impact',
      currentRange: 'Current Estimated Range',
      potentialRange: 'Potential Range After Removal',
      improvement: 'Estimated Improvement',
      factors: 'Contributing Factors',
      confidence: 'Analysis Confidence',
      disclaimer: 'This is an estimate only. Actual results vary based on your complete credit profile.'
    },
    help: {
      title: 'Help & Resources',
      whatIsDofd: 'What is DOFD?',
      sevenYearRule: '7-Year Rule',
      reaging: 'What is Re-Aging?',
      statutes: 'Statute of Limitations',
      disputeProcess: 'Dispute Process',
      glossary: 'Glossary',
      faq: 'FAQ'
    },
    errors: {
      fileUploadFailed: 'Failed to upload file. Please try again.',
      parsingFailed: 'Failed to parse credit report. Please check the format.',
      invalidDate: 'Invalid date format. Please use YYYY-MM-DD.',
      networkError: 'Network error. Please check your connection.',
      unknownError: 'An unknown error occurred. Please try again.'
    }
  },

  es: {
    nav: {
      home: 'Inicio',
      analyze: 'Analizar',
      results: 'Resultados',
      documents: 'Documentos',
      help: 'Ayuda',
      settings: 'Configuración'
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      back: 'Atrás',
      next: 'Siguiente',
      submit: 'Enviar',
      download: 'Descargar',
      print: 'Imprimir',
      close: 'Cerrar',
      yes: 'Sí',
      no: 'No',
      none: 'Ninguno',
      unknown: 'Desconocido',
      required: 'Requerido',
      optional: 'Opcional'
    },
    steps: {
      upload: 'Subir',
      uploadDesc: 'Subir Informe',
      extract: 'Extraer',
      extractDesc: 'Revisar Texto',
      verify: 'Verificar',
      verifyDesc: 'Confirmar Datos',
      analyze: 'Analizar',
      analyzeDesc: 'Ver Resultados',
      export: 'Exportar',
      exportDesc: 'Obtener Documentos'
    },
    upload: {
      title: 'Analice Su Informe de Crédito',
      subtitle: 'Suba cualquier formato — PDF, imagen o texto. Nuestro motor forense detecta violaciones de FCRA/FDCPA y re-envejecimiento ilegal de deudas.',
      dropzone: 'Suelte el archivo o haga clic para buscar',
      dropzoneActive: 'Suelte su archivo aquí',
      supportedFormats: 'PDF, PNG, JPG, TXT soportados',
      pasteText: 'Pegar Texto',
      pasteTextPlaceholder: 'Pegue la sección de la cuenta de su informe de crédito aquí...',
      loadSample: 'Cargar Datos de Ejemplo',
      analyzeButton: 'Analizar Informe',
      privacyNotice: '100% Privado: Todo el procesamiento ocurre en su navegador. Sus datos nunca salen de su dispositivo.',
      processingPdf: 'Extrayendo texto del PDF...',
      processingOcr: 'Ejecutando OCR...',
      processingText: 'Leyendo archivo...'
    },
    fields: {
      originalCreditor: 'Acreedor Original',
      currentFurnisher: 'Proveedor Actual',
      accountType: 'Tipo de Cuenta',
      accountStatus: 'Estado',
      paymentHistory: 'Historial de Pagos',
      currentBalance: 'Saldo Actual',
      originalAmount: 'Monto Original',
      creditLimit: 'Límite de Crédito',
      dateOpened: 'Fecha de Apertura',
      dofd: 'Fecha de Primera Morosidad',
      dofdHelp: 'CRÍTICO: Cuando la cuenta se atrasó más de 30 días por primera vez. Determina el período de reporte de 7 años.',
      chargeOffDate: 'Fecha de Cancelación',
      lastPayment: 'Último Pago',
      lastReported: 'Última Actualización',
      removalDate: 'Fecha Est. de Eliminación',
      consumerName: 'Nombre Completo',
      consumerAddress: 'Dirección',
      consumerState: 'Estado'
    },
    results: {
      title: 'Resultados del Análisis',
      subtitle: 'violaciones detectadas',
      caseStrength: 'Fortaleza del Caso',
      riskLevel: 'Nivel de Riesgo',
      disputeStrength: 'Fortaleza de Disputa',
      litigationPotential: 'Potencial de Litigio',
      violationsFound: 'Violaciones Encontradas',
      highSeverity: 'Alta Severidad',
      mediumSeverity: 'Media',
      lowSeverity: 'Baja',
      noViolations: 'Sin Violaciones Obvias',
      noViolationsDesc: 'Se recomienda revisión manual por un profesional.'
    },
    violations: {
      title: 'Violaciones',
      severity: 'Severidad',
      explanation: 'Explicación',
      whyMatters: 'Por Qué Importa',
      suggestedEvidence: 'Evidencia Sugerida',
      legalCitations: 'Citas Legales'
    },
    patterns: {
      title: 'Patrones',
      significance: 'Significancia',
      description: 'Descripción',
      recommendation: 'Recomendación',
      noPatterns: 'No se detectaron patrones significativos.'
    },
    timeline: {
      title: 'Línea de Tiempo',
      accountOpened: 'Cuenta Abierta',
      lastPayment: 'Último Pago',
      firstDelinquency: 'Fecha de Primera Morosidad',
      chargeOff: 'Cancelación',
      removalDate: 'Fecha Est. de Eliminación',
      noEvents: 'No hay eventos de línea de tiempo para mostrar.'
    },
    actions: {
      title: 'Acciones a Tomar',
      immediate: 'Acción Inmediata',
      standard: 'Estándar',
      optional: 'Opcional',
      reason: 'Razón'
    },
    documents: {
      title: 'Descargar Documentos',
      subtitle: 'Genere cartas de disputa legalmente conformes basadas en su análisis.',
      bureauLetter: 'Carta de Disputa al Buró',
      bureauLetterDesc: 'Para Experian, Equifax, TransUnion',
      validationLetter: 'Solicitud de Validación de Deuda',
      validationLetterDesc: 'Conforme a FDCPA §809(b)',
      cfpbComplaint: 'Queja CFPB',
      cfpbComplaintDesc: 'Lista para enviar',
      caseSummary: 'Resumen del Caso',
      caseSummaryDesc: 'Informe forense completo',
      evidencePackage: 'Paquete de Evidencia',
      evidencePackageDesc: 'Documentación para tribunal',
      attorneyPackage: 'Paquete para Abogado',
      attorneyPackageDesc: 'Para consulta legal',
      disclaimer: 'Estos documentos son plantillas con fines educativos. Consulte con un abogado calificado antes de tomar acción legal.'
    },
    countdowns: {
      title: 'Fechas Límite Importantes',
      reportingRemoval: 'Límite de Reporte de 7 Años',
      solExpiration: 'Prescripción Legal',
      disputeDeadline: 'Fecha Límite de Disputa',
      responseDeadline: 'Plazo de Investigación de 30 Días',
      expired: 'VENCIDO',
      daysRemaining: 'días restantes',
      monthsRemaining: 'meses restantes',
      yearsRemaining: 'años restantes'
    },
    scoreImpact: {
      title: 'Impacto en Puntaje de Crédito',
      currentRange: 'Rango Estimado Actual',
      potentialRange: 'Rango Potencial Después de Eliminación',
      improvement: 'Mejora Estimada',
      factors: 'Factores Contribuyentes',
      confidence: 'Confianza del Análisis',
      disclaimer: 'Esto es solo una estimación. Los resultados reales varían según su perfil crediticio completo.'
    },
    help: {
      title: 'Ayuda y Recursos',
      whatIsDofd: '¿Qué es DOFD?',
      sevenYearRule: 'Regla de 7 Años',
      reaging: '¿Qué es Re-Envejecimiento?',
      statutes: 'Prescripción Legal',
      disputeProcess: 'Proceso de Disputa',
      glossary: 'Glosario',
      faq: 'Preguntas Frecuentes'
    },
    errors: {
      fileUploadFailed: 'Error al subir el archivo. Por favor intente de nuevo.',
      parsingFailed: 'Error al analizar el informe de crédito. Por favor verifique el formato.',
      invalidDate: 'Formato de fecha inválido. Por favor use AAAA-MM-DD.',
      networkError: 'Error de red. Por favor verifique su conexión.',
      unknownError: 'Ocurrió un error desconocido. Por favor intente de nuevo.'
    }
  }
};

let currentLanguage: Language = 'en';

/**
 * Get current language
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Set current language
 */
export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  // Save preference
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred_language', lang);
  }
}

/**
 * Initialize language from stored preference or browser
 */
export function initializeLanguage(): Language {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preferred_language') as Language;
    if (stored && translations[stored]) {
      currentLanguage = stored;
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0] as Language;
    if (translations[browserLang]) {
      currentLanguage = browserLang;
      return browserLang;
    }
  }
  return 'en';
}

/**
 * Get translations for current language
 */
export function t(): TranslationStrings {
  return translations[currentLanguage];
}

/** Recursive type for nested translation objects */
type NestedTranslation = string | { [key: string]: NestedTranslation };

/**
 * Get specific translation by key path
 */
export function translate(path: string): string {
  const parts = path.split('.');
  // Cast to unknown first, then to NestedTranslation to satisfy TypeScript
  let current: NestedTranslation = translations[currentLanguage] as unknown as NestedTranslation;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, NestedTranslation>)[part];
    } else {
      return path; // Return path if not found
    }
  }

  return typeof current === 'string' ? current : path;
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): { code: Language; name: string }[] {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' }
  ];
}

/**
 * Format date in current language
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = currentLanguage === 'es' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format number in current language
 */
export function formatNumber(num: number): string {
  const locale = currentLanguage === 'es' ? 'es-ES' : 'en-US';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}
