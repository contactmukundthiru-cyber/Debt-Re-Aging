import streamlit as st
import pandas as pd
from datetime import datetime
from app.metro2 import Metro2Validator, Metro2BaseSegment

def render_furnisher_mode():
    """Render the Compliance Auditor mode for furnishers."""
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Furnisher Compliance Check</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            For credit card issuers and debt buyers: audit your Metro2 files before submission.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.info("""
    **For Industry Professionals:** This tool checks Metro2 submission files for
    re-aging violations and field errors before you send them to the bureaus.
    """)

    col1, col2 = st.columns([2, 1])

    with col1:
        st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
        st.subheader("Upload Metro2 File")
        uploaded_file = st.file_uploader("Upload Metro2 (.dat, .txt, .raw)", type=['dat', 'txt', 'raw'])

        raw_input = st.text_area("Or paste a Metro2 Base Segment (426 characters)", height=100)

        if st.button("Check for Compliance Issues", type="primary"):
            process_metro2_input(uploaded_file, raw_input)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
        st.subheader("Compliance Standards")
        st.metric("Tolerance Threshold", "0.01%")
        st.metric("Re-Aging Risk", "LOW")
        st.info("Regular auditing helps maintain FCRA compliance and safe harbor protection.")
        st.markdown('</div>', unsafe_allow_html=True)

def process_metro2_input(uploaded_file, raw_text):
    """Process and validate Metro2 data."""
    lines = []
    if uploaded_file:
        content = uploaded_file.read().decode('utf-8')
        lines = content.splitlines()
    elif raw_text:
        lines = [raw_text]
        
    if not lines:
        st.warning("No data to process.")
        return
        
    validator = Metro2Validator()
    results = []
    
    for line in lines:
        if len(line.strip()) < 100: continue
        segment = Metro2BaseSegment.from_line(line)
        violations = validator.validate_segment(segment)
        
        results.append({
            "Account": segment.account_number,
            "Status": segment.account_status,
            "DOFD": segment.date_first_delinquency,
            "Errors": len(violations),
            "Details": violations
        })
        
    if results:
        df = pd.DataFrame(results)
        st.subheader("Scrub Results")
        st.dataframe(df[["Account", "Status", "DOFD", "Errors"]], use_container_width=True)
        
        # Details view
        for res in results:
            if res["Errors"] > 0:
                with st.expander(f"🔴 Account {res['Account']} - {res['Errors']} Violations"):
                    for v in res["Details"]:
                        st.error(f"**[{v['id']}] {v['field']}**: {v['message']}")
                        st.caption(f"**Regulatory Impact:** {v['impact']}")
    else:
        st.success("No violations found in the sample.")

def render_e_oscar_simulation():
    """Future feature: Simulated e-OSCAR dispute ingestion."""
    st.subheader("📨 e-OSCAR DISPUTE QUEUE (SIMULATED)")
    st.warning("Integration with e-OSCAR requires specialized SFTP credentials.")
    st.info("System matches incoming ACDV codes to internal ledger history.")
