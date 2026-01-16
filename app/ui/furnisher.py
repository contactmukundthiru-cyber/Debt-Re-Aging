import streamlit as st
import pandas as pd
from datetime import datetime
from app.metro2 import Metro2Validator, Metro2BaseSegment

def render_furnisher_mode():
    """Render the Compliance Auditor mode for furnishers in premium style."""
    st.markdown('<p class="section-header">INDUSTRY COMPLIANCE — PRE-REPORTING QC</p>', unsafe_allow_html=True)
    
    st.markdown("""
    <div class="notice-banner">
        <strong>Enterprise Auditor:</strong> This terminal validates Metro2 (426-spec) segments for internal consistency 
        and CDIA standards before bureau submission.
    </div>
    """, unsafe_allow_html=True)

    col1, col2 = st.columns([2, 1])

    with col1:
        st.markdown('<div class="premium-card">', unsafe_allow_html=True)
        st.markdown('<h3 style="margin-top: 0;">Data Ingestion</h3>', unsafe_allow_html=True)
        
        uploaded_file = st.file_uploader("Batch Upload Metro2 (.dat, .txt)", type=['dat', 'txt'])
        st.markdown('<p style="text-align: center; color: #64748b; font-size: 0.8rem; margin: 1rem 0;">OR</p>', unsafe_allow_html=True)
        raw_input = st.text_area("Individual Segment Input (426 chars)", height=100, help="Paste a single Metro2 Base Segment here.")

        if st.button("Initiate Compliance Scrub", type="primary", use_container_width=True):
            process_metro2_input(uploaded_file, raw_input)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="premium-card">', unsafe_allow_html=True)
        st.markdown('<h3 style="margin-top: 0;">Risk Metrics</h3>', unsafe_allow_html=True)
        st.metric("TOLERANCE", "0.01%")
        st.metric("RE-AGING RISK", "RECOGNIZED")
        st.markdown("""
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
            Auditing aligns with 15 U.S.C. § 1681s-2 safe harbor provisions for data accuracy.
        </div>
        """, unsafe_allow_html=True)
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
