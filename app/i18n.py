"""
Internationalization (i18n) Module
Multi-language support for the Debt Re-Aging Case Factory

Supports: English (default), Spanish
"""

from typing import Dict, Optional
from dataclasses import dataclass
import json
from pathlib import Path

# Language codes
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'es': 'Español'
}

DEFAULT_LANGUAGE = 'en'


@dataclass
class TranslationSet:
    """Container for all UI translations."""

    # Application chrome
    app_title: str
    app_subtitle: str
    disclaimer_text: str
    credit_text: str

    # Navigation
    nav_single_case: str
    nav_cross_bureau: str
    nav_batch_mode: str
    nav_metrics: str
    nav_settings: str

    # Workflow steps
    step_1_title: str
    step_1_description: str
    step_2_title: str
    step_2_description: str
    step_3_title: str
    step_3_description: str
    step_4_title: str
    step_4_description: str
    step_5_title: str
    step_5_description: str

    # Field labels
    field_original_creditor: str
    field_furnisher: str
    field_account_type: str
    field_account_status: str
    field_balance: str
    field_date_opened: str
    field_date_reported: str
    field_dofd: str
    field_removal_date: str
    field_bureau: str

    # Buttons
    btn_continue: str
    btn_back: str
    btn_upload: str
    btn_run_checks: str
    btn_generate: str
    btn_download: str
    btn_reset: str
    btn_start_new: str

    # Messages
    msg_upload_success: str
    msg_extraction_error: str
    msg_no_issues: str
    msg_issues_found: str
    msg_packet_generated: str

    # Help text
    help_dofd: str
    help_removal_date: str
    help_fcra: str
    help_fdcpa: str
    help_sol: str
    help_furnisher: str
    help_reaging: str

    # Errors
    error_invalid_date: str
    error_file_type: str
    error_extraction_failed: str
    error_ocr_quality: str


# English translations
TRANSLATIONS_EN = TranslationSet(
    # Application chrome
    app_title="Debt Re-Aging Case Factory",
    app_subtitle="Timeline Inconsistency Detection + Dispute Packet Generator",
    disclaimer_text="This tool is NOT legal advice. It is designed to help identify potential timeline inconsistencies in credit reports for informational purposes only. Always consult with a qualified attorney for legal matters.",
    credit_text="Built by Mukund Thiru — student-led research & systems project.",

    # Navigation
    nav_single_case="Single Case",
    nav_cross_bureau="Cross-Bureau Analysis",
    nav_batch_mode="Batch Mode (Alpha)",
    nav_metrics="Metrics Dashboard",
    nav_settings="Settings",

    # Workflow steps
    step_1_title="Document Upload",
    step_1_description="Upload a credit report snippet in PDF or high-resolution image format. The system will perform multi-stage OCR and extraction for timeline analysis.",
    step_2_title="Extraction Review",
    step_2_description="Review the raw extraction output. Edits made here will influence the downstream parsing logic. Verify data integrity before proceeding.",
    step_3_title="Field Verification",
    step_3_description="The system has mapped raw text to structured fields. Audit each entry below. Confidence scores reflect the statistical likelihood of OCR accuracy.",
    step_4_title="Logic Checks",
    step_4_description="Executing automated heuristics to detect re-aging, SOL violations, and reporting inconsistencies.",
    step_5_title="Packet Generation",
    step_5_description="Compilation of legal dispute documentation. The generated packet contains standardized Markdown and data files for professional submission.",

    # Field labels
    field_original_creditor="Original Creditor",
    field_furnisher="Furnisher/Collector",
    field_account_type="Account Type",
    field_account_status="Account Status",
    field_balance="Current Balance",
    field_date_opened="Date Opened",
    field_date_reported="Date Reported/Updated",
    field_dofd="Date of First Delinquency (DOFD)",
    field_removal_date="Estimated Removal Date",
    field_bureau="Credit Bureau",

    # Buttons
    btn_continue="Continue",
    btn_back="Back",
    btn_upload="Upload Document",
    btn_run_checks="Run Checks",
    btn_generate="Generate Packet",
    btn_download="Download",
    btn_reset="Reset / Start Over",
    btn_start_new="Start New Case",

    # Messages
    msg_upload_success="Document uploaded and text extracted successfully!",
    msg_extraction_error="Error extracting text from document.",
    msg_no_issues="No obvious timeline inconsistencies detected!",
    msg_issues_found="potential issue(s) found",
    msg_packet_generated="Packet generated successfully!",

    # Help text
    help_dofd="The Date of First Delinquency is when you first fell behind on payments and never caught up. This date determines when the account must be removed from your credit report (7 years from DOFD for most items).",
    help_removal_date="The date when this account should be automatically removed from your credit report. For most negative items, this is 7 years from the Date of First Delinquency.",
    help_fcra="The Fair Credit Reporting Act (FCRA) is a federal law that regulates how credit bureaus collect and use your information. It gives you rights to dispute inaccurate information.",
    help_fdcpa="The Fair Debt Collection Practices Act (FDCPA) prohibits debt collectors from using abusive, unfair, or deceptive practices. It includes rules about how debts can be reported.",
    help_sol="The Statute of Limitations (SOL) is the time period during which a creditor can sue you for a debt. This varies by state and type of debt. Note: SOL is different from the credit reporting period.",
    help_furnisher="A furnisher is any company that reports your account information to credit bureaus. This includes original creditors, collection agencies, and debt buyers.",
    help_reaging="Debt re-aging is an illegal practice where a collector manipulates dates to make a debt appear more recent, extending how long it stays on your credit report.",

    # Errors
    error_invalid_date="Please enter a valid date in YYYY-MM-DD format.",
    error_file_type="Unsupported file type. Please upload a PDF, PNG, JPG, or JPEG file.",
    error_extraction_failed="Failed to extract text from the document. Try a higher resolution image or clearer scan.",
    error_ocr_quality="Low OCR quality detected. For better results, try: uploading a higher resolution image, ensuring good lighting, or scanning instead of photographing."
)


# Spanish translations
TRANSLATIONS_ES = TranslationSet(
    # Application chrome
    app_title="Fábrica de Casos de Re-envejecimiento de Deudas",
    app_subtitle="Detección de Inconsistencias en Línea de Tiempo + Generador de Paquetes de Disputa",
    disclaimer_text="Esta herramienta NO es asesoría legal. Está diseñada para ayudar a identificar posibles inconsistencias en la línea de tiempo de los informes de crédito solo con fines informativos. Siempre consulte con un abogado calificado para asuntos legales.",
    credit_text="Creado por Mukund Thiru — proyecto de investigación y sistemas dirigido por estudiantes.",

    # Navigation
    nav_single_case="Caso Individual",
    nav_cross_bureau="Análisis Entre Burós",
    nav_batch_mode="Modo por Lotes (Alfa)",
    nav_metrics="Panel de Métricas",
    nav_settings="Configuración",

    # Workflow steps
    step_1_title="Carga de Documento",
    step_1_description="Suba un fragmento de informe de crédito en formato PDF o imagen de alta resolución. El sistema realizará OCR de múltiples etapas y extracción para análisis de línea de tiempo.",
    step_2_title="Revisión de Extracción",
    step_2_description="Revise el resultado de la extracción sin procesar. Las ediciones realizadas aquí influirán en la lógica de análisis posterior. Verifique la integridad de los datos antes de continuar.",
    step_3_title="Verificación de Campos",
    step_3_description="El sistema ha mapeado el texto sin procesar a campos estructurados. Audite cada entrada a continuación. Las puntuaciones de confianza reflejan la probabilidad estadística de precisión del OCR.",
    step_4_title="Verificaciones Lógicas",
    step_4_description="Ejecutando heurísticas automatizadas para detectar re-envejecimiento, violaciones de SOL e inconsistencias en reportes.",
    step_5_title="Generación de Paquete",
    step_5_description="Compilación de documentación de disputa legal. El paquete generado contiene archivos Markdown estandarizados y datos para presentación profesional.",

    # Field labels
    field_original_creditor="Acreedor Original",
    field_furnisher="Proveedor/Cobrador",
    field_account_type="Tipo de Cuenta",
    field_account_status="Estado de Cuenta",
    field_balance="Saldo Actual",
    field_date_opened="Fecha de Apertura",
    field_date_reported="Fecha de Reporte/Actualización",
    field_dofd="Fecha de Primera Morosidad (DOFD)",
    field_removal_date="Fecha Estimada de Eliminación",
    field_bureau="Buró de Crédito",

    # Buttons
    btn_continue="Continuar",
    btn_back="Atrás",
    btn_upload="Cargar Documento",
    btn_run_checks="Ejecutar Verificaciones",
    btn_generate="Generar Paquete",
    btn_download="Descargar",
    btn_reset="Reiniciar / Empezar de Nuevo",
    btn_start_new="Iniciar Nuevo Caso",

    # Messages
    msg_upload_success="¡Documento cargado y texto extraído exitosamente!",
    msg_extraction_error="Error al extraer texto del documento.",
    msg_no_issues="¡No se detectaron inconsistencias obvias en la línea de tiempo!",
    msg_issues_found="problema(s) potencial(es) encontrado(s)",
    msg_packet_generated="¡Paquete generado exitosamente!",

    # Help text
    help_dofd="La Fecha de Primera Morosidad es cuando se atrasó por primera vez en los pagos y nunca se puso al día. Esta fecha determina cuándo se debe eliminar la cuenta de su informe de crédito (7 años desde la DOFD para la mayoría de los artículos).",
    help_removal_date="La fecha en que esta cuenta debe ser eliminada automáticamente de su informe de crédito. Para la mayoría de los artículos negativos, esto es 7 años desde la Fecha de Primera Morosidad.",
    help_fcra="La Ley de Informe Justo de Crédito (FCRA) es una ley federal que regula cómo los burós de crédito recopilan y usan su información. Le da derechos para disputar información inexacta.",
    help_fdcpa="La Ley de Prácticas Justas de Cobro de Deudas (FDCPA) prohíbe que los cobradores de deudas usen prácticas abusivas, injustas o engañosas. Incluye reglas sobre cómo se pueden reportar las deudas.",
    help_sol="El Estatuto de Limitaciones (SOL) es el período de tiempo durante el cual un acreedor puede demandarlo por una deuda. Esto varía según el estado y el tipo de deuda. Nota: SOL es diferente del período de reporte de crédito.",
    help_furnisher="Un proveedor de información es cualquier empresa que reporta la información de su cuenta a los burós de crédito. Esto incluye acreedores originales, agencias de cobranza y compradores de deudas.",
    help_reaging="El re-envejecimiento de deudas es una práctica ilegal donde un cobrador manipula las fechas para hacer que una deuda parezca más reciente, extendiendo cuánto tiempo permanece en su informe de crédito.",

    # Errors
    error_invalid_date="Por favor ingrese una fecha válida en formato AAAA-MM-DD.",
    error_file_type="Tipo de archivo no soportado. Por favor suba un archivo PDF, PNG, JPG o JPEG.",
    error_extraction_failed="No se pudo extraer texto del documento. Intente con una imagen de mayor resolución o un escaneo más claro.",
    error_ocr_quality="Se detectó baja calidad de OCR. Para mejores resultados, intente: subir una imagen de mayor resolución, asegurar buena iluminación, o escanear en lugar de fotografiar."
)


# Translation registry
TRANSLATIONS: Dict[str, TranslationSet] = {
    'en': TRANSLATIONS_EN,
    'es': TRANSLATIONS_ES
}


def get_translations(lang_code: str = DEFAULT_LANGUAGE) -> TranslationSet:
    """Get the translation set for a given language code."""
    if lang_code not in TRANSLATIONS:
        lang_code = DEFAULT_LANGUAGE
    return TRANSLATIONS[lang_code]


def get_text(key: str, lang_code: str = DEFAULT_LANGUAGE) -> str:
    """Get a specific translation by key."""
    translations = get_translations(lang_code)
    return getattr(translations, key, f"[Missing: {key}]")


class I18nManager:
    """Manager class for handling internationalization in Streamlit."""

    def __init__(self, default_language: str = DEFAULT_LANGUAGE):
        self.current_language = default_language
        self._translations = get_translations(default_language)

    def set_language(self, lang_code: str):
        """Set the current language."""
        if lang_code in SUPPORTED_LANGUAGES:
            self.current_language = lang_code
            self._translations = get_translations(lang_code)

    def t(self, key: str) -> str:
        """Get translation for a key (shorthand method)."""
        return getattr(self._translations, key, f"[Missing: {key}]")

    @property
    def translations(self) -> TranslationSet:
        """Get the current translation set."""
        return self._translations

    def get_language_options(self) -> Dict[str, str]:
        """Get available language options."""
        return SUPPORTED_LANGUAGES.copy()


# Letter templates in Spanish
SPANISH_LETTER_TEMPLATES = {
    'bureau_dispute': """
# Carta de Disputa al Buró de Crédito

Fecha: {date}

{bureau_name}
{bureau_address}

RE: Disputa de Información Inexacta
Número de Caso: {case_id}

Estimado Departamento de Disputas:

Escribo para disputar formalmente la información inexacta en mi informe de crédito bajo mis derechos según la Ley de Informe Justo de Crédito (FCRA), 15 U.S.C. § 1681.

**Información de la Cuenta en Disputa:**
- Acreedor/Colector: {furnisher}
- Tipo de Cuenta: {account_type}
- Saldo Reportado: {balance}

**Naturaleza de la Disputa:**
{dispute_reasons}

**Acción Solicitada:**
Solicito que investiguen esta cuenta y corrijan o eliminen la información inexacta de mi informe de crédito dentro de los 30 días requeridos por la FCRA.

Por favor envíenme los resultados de su investigación por escrito.

Atentamente,

{consumer_name}
{consumer_address}
""",

    'debt_validation': """
# Carta de Validación de Deuda

Fecha: {date}

{collector_name}
{collector_address}

RE: Solicitud de Validación de Deuda
Referencia de Cuenta: {account_ref}

Estimado Señor/Señora:

Recibí una comunicación de ustedes sobre una supuesta deuda. Bajo mis derechos según la Ley de Prácticas Justas de Cobro de Deudas (FDCPA), 15 U.S.C. § 1692g, solicito formalmente la validación de esta deuda.

Por favor proporcionen:

1. Verificación del monto de la deuda
2. El nombre del acreedor original
3. Prueba de que tienen autorización para cobrar esta deuda
4. Copia de cualquier sentencia (si aplica)
5. Prueba de que el Estatuto de Limitaciones no ha expirado

Hasta que proporcionen la validación adecuada, les solicito que cesen todos los esfuerzos de cobranza y no reporten esta cuenta a los burós de crédito.

Atentamente,

{consumer_name}
{consumer_address}
"""
}
