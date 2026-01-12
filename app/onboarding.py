"""
Onboarding and Tutorial Module
Interactive tutorials and guided tours for new users

Provides step-by-step guidance for first-time users.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Callable
from enum import Enum


class TutorialStep(Enum):
    """Enumeration of tutorial steps."""
    WELCOME = "welcome"
    UNDERSTAND_REAGING = "understand_reaging"
    UPLOAD_DOCUMENT = "upload_document"
    REVIEW_EXTRACTION = "review_extraction"
    VERIFY_FIELDS = "verify_fields"
    RUN_CHECKS = "run_checks"
    GENERATE_PACKET = "generate_packet"
    NEXT_STEPS = "next_steps"


@dataclass
class TutorialContent:
    """Content for a single tutorial step."""
    step: TutorialStep
    title: str
    content: str
    tips: List[str] = field(default_factory=list)
    video_url: Optional[str] = None
    image_path: Optional[str] = None
    action_text: Optional[str] = None


# Tutorial content in English
TUTORIAL_EN: Dict[TutorialStep, TutorialContent] = {
    TutorialStep.WELCOME: TutorialContent(
        step=TutorialStep.WELCOME,
        title="Welcome to the Debt Re-Aging Case Factory!",
        content="""
This tool helps you identify potential illegal manipulation of dates on your credit report
that could be keeping negative items on your report longer than legally allowed.

**What you'll learn:**
1. What debt re-aging is and why it matters
2. How to upload and analyze credit report snippets
3. How to verify extracted information
4. How to generate dispute documentation

**Important:** This tool is NOT legal advice. Always consult with a qualified attorney.
        """,
        tips=[
            "Have your credit report ready before starting",
            "You can use the sample cases to practice first",
            "All processing happens locally - your data stays on your computer"
        ],
        action_text="Let's Get Started!"
    ),

    TutorialStep.UNDERSTAND_REAGING: TutorialContent(
        step=TutorialStep.UNDERSTAND_REAGING,
        title="Understanding Debt Re-Aging",
        content="""
**What is debt re-aging?**

When you fall behind on payments and never catch up, that's called becoming "delinquent."
The date this happens is your **Date of First Delinquency (DOFD)**.

Under federal law (FCRA), most negative items must be removed from your credit report
**7 years from your DOFD** - not from any later date.

**The Problem:**

When debts are sold to collection agencies, some collectors report new dates that make
the debt appear more recent. This illegally extends how long it stays on your report.

**Example:**
- You stopped paying a credit card in March 2018
- Your DOFD is March 2018
- It should be removed by March 2025
- A collector reports "Date Opened: January 2023"
- Now it might not be removed until 2030!

This is illegal and you have the right to dispute it.
        """,
        tips=[
            "The DOFD never changes, even when a debt is sold",
            "Check your credit report for dates that don't make sense",
            "Collection accounts should always trace back to the original DOFD"
        ],
        action_text="I Understand, Continue"
    ),

    TutorialStep.UPLOAD_DOCUMENT: TutorialContent(
        step=TutorialStep.UPLOAD_DOCUMENT,
        title="Step 1: Upload Your Document",
        content="""
**What to upload:**
- A screenshot or photo of a specific account from your credit report
- A PDF of your credit report (the tool will extract text)
- Images in PNG, JPG, or JPEG format

**Tips for best results:**
- Focus on one account at a time
- Make sure dates are clearly visible
- Higher resolution = better accuracy
- Avoid blurry or dark images

**What the tool extracts:**
- Account names (original creditor, collector)
- Important dates (opened, reported, DOFD, removal)
- Balances and account status
- Which credit bureau it's from
        """,
        tips=[
            "You can take a screenshot of just the account section",
            "If using a phone, ensure good lighting and steady hands",
            "PDF files work better than photos for text extraction"
        ],
        action_text="Ready to Upload"
    ),

    TutorialStep.REVIEW_EXTRACTION: TutorialContent(
        step=TutorialStep.REVIEW_EXTRACTION,
        title="Step 2: Review Extracted Text",
        content="""
**What you'll see:**

After uploading, the tool shows you the raw text it extracted from your document.
This step lets you:

1. **Verify accuracy** - Make sure all text was captured correctly
2. **Fix errors** - Edit any garbled or missing text
3. **Check completeness** - Ensure important information is visible

**Common issues:**
- Blurry text may appear garbled
- Some characters might be misread (0 vs O, 1 vs l)
- Handwritten notes won't be captured

**Quality Score:**
The tool gives a quality score (0-100) based on how well it could read the text.
Scores below 50 may need manual correction.
        """,
        tips=[
            "Look for dates - they're the most important information",
            "Check that dollar amounts are correct",
            "You can edit the text directly in this step"
        ],
        action_text="Continue to Fields"
    ),

    TutorialStep.VERIFY_FIELDS: TutorialContent(
        step=TutorialStep.VERIFY_FIELDS,
        title="Step 3: Verify Extracted Fields",
        content="""
**What happens here:**

The tool automatically identifies and extracts key fields from the text:

- **Original Creditor**: Who you originally owed
- **Furnisher/Collector**: Who is reporting this now
- **Account Type**: Collection, charge-off, etc.
- **Date Opened**: When the account started
- **DOFD**: Date of First Delinquency (most important!)
- **Removal Date**: When it should drop off your report
- **Bureau**: Experian, Equifax, or TransUnion

**Confidence Scores:**
- 🟢 High: Very likely correct
- 🟡 Medium: Probably correct, but verify
- 🔴 Low: Needs manual verification

**Your State:**
Enter your state to check the Statute of Limitations for your debt.
        """,
        tips=[
            "Focus especially on the DOFD and Removal Date",
            "If DOFD is blank, that's often a red flag",
            "Double-check all dates match your records"
        ],
        action_text="Continue to Checks"
    ),

    TutorialStep.RUN_CHECKS: TutorialContent(
        step=TutorialStep.RUN_CHECKS,
        title="Step 4: Automated Logic Checks",
        content="""
**What the tool checks:**

The tool runs 10+ automated rules to detect potential problems:

**Timeline Rules (A-Series):**
- Is the removal date more than 7 years from DOFD?
- Do the dates make mathematical sense?

**Re-aging Indicators (B-Series):**
- Is there a suspicious gap between dates?
- Does the "date opened" seem too recent for a collection?

**Cross-Bureau Issues (C-Series):**
- Are different bureaus showing different dates?

**Data Integrity (E-Series):**
- Are there any impossible or future dates?

**Severity Levels:**
- 🔴 High: Strong indicator of a problem
- 🟡 Medium: Possible issue, investigate further
- 🔵 Low: Minor concern, may be legitimate
        """,
        tips=[
            "High severity flags are worth disputing",
            "Expand each flag to see detailed explanations",
            "Not every flag means something is wrong - use judgment"
        ],
        action_text="Continue to Generation"
    ),

    TutorialStep.GENERATE_PACKET: TutorialContent(
        step=TutorialStep.GENERATE_PACKET,
        title="Step 5: Generate Dispute Documentation",
        content="""
**What you get:**

If issues are found, the tool generates a complete dispute packet:

1. **Case Summary**: Overview of findings
2. **Bureau Dispute Letter**: Template letter to credit bureaus
3. **Furnisher Dispute Letter**: Template letter to the collector
4. **Debt Validation Letter**: Request for proof of the debt
5. **Attachments Checklist**: What to include with your dispute

**File Formats:**
- Markdown files (human-readable)
- JSON data files (for record-keeping)
- YAML case files (structured data)
- Optional PDF export

**All files are bundled in a downloadable ZIP file.**
        """,
        tips=[
            "Customize the letters with your specific details",
            "Send disputes via certified mail with return receipt",
            "Keep copies of everything you send"
        ],
        action_text="I'm Ready!"
    ),

    TutorialStep.NEXT_STEPS: TutorialContent(
        step=TutorialStep.NEXT_STEPS,
        title="You're Ready to Go!",
        content="""
**Congratulations!** You now know how to use the Debt Re-Aging Case Factory.

**Next Steps:**

1. **Try a sample case** - Use the samples in the sidebar to practice
2. **Process your first real case** - Upload your credit report snippet
3. **Review the results** - Check each flag carefully
4. **Generate documentation** - Create your dispute packet

**Remember:**
- This tool helps identify potential issues, but you decide what to dispute
- Always verify the information before submitting disputes
- Consider consulting with a consumer law attorney for complex cases
- Keep records of all your disputes and responses

**Getting Help:**
- Check the Help/About section for more information
- Review the Rules Documentation to understand each check
- See the Pilot Guide for organizational deployment

**Good luck with your credit report journey!**
        """,
        tips=[
            "Start with the clearest, most obvious violations",
            "You can dispute with all three bureaus simultaneously",
            "Bureaus have 30 days to investigate your dispute"
        ],
        action_text="Start Using the Tool"
    )
}


# Tutorial content in Spanish
TUTORIAL_ES: Dict[TutorialStep, TutorialContent] = {
    TutorialStep.WELCOME: TutorialContent(
        step=TutorialStep.WELCOME,
        title="¡Bienvenido a la Fábrica de Casos de Re-envejecimiento de Deudas!",
        content="""
Esta herramienta le ayuda a identificar posibles manipulaciones ilegales de fechas en su informe de crédito
que podrían mantener artículos negativos en su informe más tiempo de lo legalmente permitido.

**Lo que aprenderá:**
1. Qué es el re-envejecimiento de deudas y por qué importa
2. Cómo cargar y analizar fragmentos de informes de crédito
3. Cómo verificar la información extraída
4. Cómo generar documentación de disputa

**Importante:** Esta herramienta NO es asesoría legal. Siempre consulte con un abogado calificado.
        """,
        tips=[
            "Tenga su informe de crédito listo antes de comenzar",
            "Puede usar los casos de muestra para practicar primero",
            "Todo el procesamiento ocurre localmente - sus datos permanecen en su computadora"
        ],
        action_text="¡Comencemos!"
    ),
    # Additional Spanish translations would follow the same pattern...
}


class OnboardingManager:
    """Manages the onboarding and tutorial experience."""

    def __init__(self, language: str = 'en'):
        self.language = language
        self.tutorials = TUTORIAL_EN if language == 'en' else TUTORIAL_ES
        self.current_step = 0
        self.steps = list(TutorialStep)

    def get_current_content(self) -> TutorialContent:
        """Get the content for the current step."""
        step = self.steps[self.current_step]
        return self.tutorials.get(step, self.tutorials[TutorialStep.WELCOME])

    def next_step(self) -> bool:
        """Move to the next step. Returns False if at end."""
        if self.current_step < len(self.steps) - 1:
            self.current_step += 1
            return True
        return False

    def prev_step(self) -> bool:
        """Move to the previous step. Returns False if at start."""
        if self.current_step > 0:
            self.current_step -= 1
            return True
        return False

    def skip_to_end(self):
        """Skip to the last step."""
        self.current_step = len(self.steps) - 1

    def reset(self):
        """Reset to the beginning."""
        self.current_step = 0

    @property
    def progress(self) -> float:
        """Get progress as a percentage."""
        return (self.current_step + 1) / len(self.steps)

    @property
    def is_complete(self) -> bool:
        """Check if tutorial is complete."""
        return self.current_step >= len(self.steps) - 1


def render_tutorial_modal(st, manager: OnboardingManager, on_complete: Callable = None):
    """Render the tutorial as a modal dialog in Streamlit."""
    content = manager.get_current_content()

    # Progress bar
    st.progress(manager.progress)
    st.caption(f"Step {manager.current_step + 1} of {len(manager.steps)}")

    # Title and content
    st.header(content.title)
    st.markdown(content.content)

    # Tips section
    if content.tips:
        st.markdown("---")
        st.markdown("**💡 Tips:**")
        for tip in content.tips:
            st.markdown(f"- {tip}")

    st.markdown("---")

    # Navigation buttons
    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        if manager.current_step > 0:
            if st.button("← Previous", use_container_width=True):
                manager.prev_step()
                st.rerun()

    with col2:
        if st.button("Skip Tutorial", use_container_width=True, type="secondary"):
            if on_complete:
                on_complete()

    with col3:
        button_text = content.action_text or "Next →"
        if st.button(button_text, use_container_width=True, type="primary"):
            if manager.is_complete:
                if on_complete:
                    on_complete()
            else:
                manager.next_step()
                st.rerun()


def render_contextual_help(st, step_name: str, language: str = 'en'):
    """Render contextual help for a specific workflow step."""
    step_map = {
        'upload': TutorialStep.UPLOAD_DOCUMENT,
        'review': TutorialStep.REVIEW_EXTRACTION,
        'verify': TutorialStep.VERIFY_FIELDS,
        'checks': TutorialStep.RUN_CHECKS,
        'generate': TutorialStep.GENERATE_PACKET
    }

    if step_name not in step_map:
        return

    tutorials = TUTORIAL_EN if language == 'en' else TUTORIAL_ES
    content = tutorials.get(step_map[step_name])

    if content:
        with st.expander("ℹ️ Help for this step"):
            st.markdown(content.content)
            if content.tips:
                st.markdown("**Tips:**")
                for tip in content.tips:
                    st.markdown(f"- {tip}")


# Quick tips for inline help
QUICK_TIPS = {
    'dofd': "This is the most important date! It determines when the account should be removed.",
    'removal_date': "Should be exactly 7 years after the DOFD for most items.",
    'collection': "Collection accounts inherit the DOFD from the original account.",
    'ocr_quality': "Low quality? Try uploading a clearer image or PDF.",
    'confidence_low': "Low confidence means you should double-check this field manually.",
    'no_flags': "No flags doesn't guarantee everything is correct - always verify.",
    'multiple_flags': "Multiple flags on one account often indicates serious re-aging."
}


def get_quick_tip(key: str) -> str:
    """Get a quick tip by key."""
    return QUICK_TIPS.get(key, "")
