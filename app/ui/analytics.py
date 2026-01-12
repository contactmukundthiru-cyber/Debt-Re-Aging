import streamlit as st
from app.rules import RuleEngine
from app.metrics import MetricsTracker
import pandas as pd

def render_cross_bureau_analysis():
    """Render the Cross-Bureau Analysis UI."""
    st.title("Cross-Bureau Comparison")
    st.markdown("""
    Use this tool to compare how the **same account** is reported across different credit bureaus.
    Inconsistencies in removal dates or DOFD across bureaus often indicate reporting errors.
    """)
    
    engine = RuleEngine()
    
    col1, col2, col3 = st.columns(3)
    bureaus = ['Experian', 'Equifax', 'TransUnion']
    bureau_data = []
    
    for i, bureau in enumerate(bureaus):
        with [col1, col2, col3][i]:
            st.subheader(bureau)
            removal = st.text_input(f"Removal Date ({bureau})", key=f"cb_rem_{bureau}", placeholder="YYYY-MM-DD")
            dofd = st.text_input(f"DOFD ({bureau})", key=f"cb_dofd_{bureau}", placeholder="YYYY-MM-DD")
            
            if removal:
                bureau_data.append({
                    'bureau': bureau,
                    'estimated_removal_date': removal,
                    'dofd': dofd
                })
                
    if len(bureau_data) >= 2:
        if st.button("Analyze Discrepancies", type="primary"):
            flags = engine.check_cross_bureau(bureau_data)
            
            if flags:
                st.warning(f"Found {len(flags)} cross-bureau inconsistency!")
                for flag in flags:
                    st.error(f"**{flag.rule_name}**")
                    st.write(flag.explanation)
            else:
                st.success("No material discrepancies found between the provided bureau dates.")

def render_batch_mode():
    """Render the experimental Batch Mode UI."""
    st.title("Batch Processing Mode (Alpha)")
    st.info("This mode allows processing multiple accounts or documents simultaneously.")
    
    from app.batch import process_multiple_files
    
    uploaded_files = st.file_uploader(
        "Upload one or more credit report snippets",
        type=['pdf', 'png', 'jpg', 'jpeg'],
        accept_multiple_files=True
    )
    
    if uploaded_files:
        if st.button("Process Batch", type="primary"):
            file_data = []
            for f in uploaded_files:
                file_data.append((f.name, f.read()))
                
            with st.spinner("Processing batch..."):
                results = process_multiple_files(file_data)
                
            st.success(f"Processed {results.total_accounts} accounts!")
            
            # Industry-Disruptive: Systemic Behavioral Audit
            st.subheader("Industrial Audit: Systemic Patterns")
            with st.spinner("Analyzing furnisher behavioral patterns..."):
                simple_accounts = []
                for acc in results.accounts:
                    simple_acc = {k: v.get('value') for k, v in acc.fields.items()}
                    simple_acc['furnisher_or_collector'] = acc.fields.get('furnisher_or_collector', {}).get('value')
                    simple_accounts.append(simple_acc)
                
                beh_flags = engine.audit_furnisher_behavior(simple_accounts)
                
                if beh_flags:
                    st.warning(f"DETECTED {len(beh_flags)} SYSTEMIC PATTERNS")
                    for b_flag in beh_flags:
                        with st.container():
                            st.markdown(f"""
                            <div style="background-color: #fef2f2; border-left: 5px solid #dc2626; padding: 15px; border-radius: 4px; margin-bottom: 10px;">
                                <h4 style="margin: 0; color: #991b1b;">⚠️ {b_flag['rule_name']}</h4>
                                <p style="margin-top: 10px;">{b_flag['explanation']}</p>
                            </div>
                            """, unsafe_allow_html=True)
                else:
                    st.success("No systemic behavioral anomalies detected across furnishers.")

            st.markdown("---")
            
            # Show summary
            col1, col2, col3 = st.columns(3)
            col1.metric("Total Accounts", results.total_accounts)
            col2.metric("Flagged Accounts", results.accounts_with_flags)
            col3.metric("Total Flags", results.total_flags)
            
            # Show detailed findings
            for acc in results.accounts:
                with st.expander(f"Account: {acc.account_id} - {len(acc.flags)} flags"):
                    if acc.flags:
                        for flag in acc.flags:
                            st.warning(f"{flag['rule_name']} ({flag['severity']})")
                    else:
                        st.success("No issues detected.")
            
            st.warning("Note: Full packet generation for Batch Mode is under development.")

def render_historical_delta_analysis():
    """Render the Historical Delta Analysis UI."""
    st.title("Historical Delta Analysis")
    st.markdown("""
    Compare two credit reports from different dates to detect hidden re-aging patterns.
    This feature identifies if a debt's status or DOFD has been "frozen" or "reset" over time.
    """)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Report A (Older)")
        file_a = st.file_uploader("Upload Older Report", type=['pdf', 'png', 'jpg'], key="hist_a")
        date_a = st.date_input("Report A Date", key="date_a")
        
    with col2:
        st.subheader("Report B (Newer)")
        file_b = st.file_uploader("Upload Newer Report", type=['pdf', 'png', 'jpg'], key="hist_b")
        date_b = st.date_input("Report B Date", key="date_b")
        
    if file_a and file_b:
        if st.button("RUN DELTA ANALYTICS", type="primary", use_container_width=True):
            with st.spinner("Executing forensic comparison..."):
                from app.extraction import extract_text_from_bytes
                from app.parser import parse_credit_report
                
                text_a, _ = extract_text_from_bytes(file_a.read(), file_a.name)
                text_b, _ = extract_text_from_bytes(file_b.read(), file_b.name)
                
                parsed_a = parse_credit_report(text_a)
                parsed_b = parse_credit_report(text_b)
                
                # Logic for comparison
                fields_a = parsed_a.to_verified_dict()
                fields_b = parsed_b.to_verified_dict()
                
                st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
                st.subheader("🔬 FORENSIC FINDINGS: DELTA ANALYTICS")
                
                # Check for frozen delinquency
                dofd_a = fields_a.get('dofd')
                dofd_b = fields_b.get('dofd')
                
                if dofd_a and dofd_b and dofd_a != dofd_b:
                    st.error(f"⚠️ **CRITICAL: DOFD SHIFT DETECTED**")
                    st.write(f"The Date of First Delinquency shifted from `{dofd_a}` to `{dofd_b}`. This is a direct indicator of illegal re-aging.")
                elif dofd_a and dofd_b and dofd_a == dofd_b:
                    st.success("✅ CONSISTENCY: DOFD is aligned across both reports.")
                
                # Check for "Time Freeze" (Status hasn't aged)
                status_a = fields_a.get('account_status', '').lower()
                status_b = fields_b.get('account_status', '').lower()
                
                months_between = (date_b - date_a).days / 30
                if months_between > 6 and status_a == status_b and "late" in status_a:
                    st.warning(f"⚠️ **WARNING: DELINQUENCY FREEZE**")
                    st.write(f"The account was '{status_a}' in both reports despite {int(months_between)} months passing. This indicates a 'stalled' status used to artificially keep the debt appearing more recent.")
                st.markdown('</div>', unsafe_allow_html=True)
