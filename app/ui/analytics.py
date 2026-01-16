import streamlit as st
from app.rules import RuleEngine
from app.metrics import MetricsTracker
import pandas as pd
from datetime import datetime, timedelta

def render_cross_bureau_analysis():
    """Render the Cross-Bureau Analysis UI."""
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Compare Across Credit Bureaus</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            Check if the same account is reported differently by Experian, Equifax, and TransUnion.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.info("""
    **Why this matters:** The same debt should have the same dates on all three bureaus.
    If the removal date or DOFD is different, that's a reporting error you can dispute.
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
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Analyze Multiple Accounts</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            Upload several credit report pages at once to check all your accounts.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.info("Upload multiple files and we'll analyze each account for potential issues.")
    
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
            
            # Check for patterns across multiple accounts
            st.subheader("Patterns Across Your Accounts")
            with st.spinner("Looking for common issues across collectors..."):
                simple_accounts = []
                for acc in results.accounts:
                    simple_acc = {k: v.get('value') for k, v in acc.fields.items()}
                    simple_acc['furnisher_or_collector'] = acc.fields.get('furnisher_or_collector', {}).get('value')
                    simple_accounts.append(simple_acc)
                
                beh_flags = engine.audit_furnisher_behavior(simple_accounts)
                
                if beh_flags:
                    st.warning(f"Found {len(beh_flags)} pattern(s) that may indicate problems")
                    for b_flag in beh_flags:
                        with st.container():
                            st.markdown(f"""
                            <div style="background-color: #fef2f2; border-left: 5px solid #dc2626; padding: 15px; border-radius: 4px; margin-bottom: 10px;">
                                <h4 style="margin: 0; color: #991b1b;">{b_flag['rule_name']}</h4>
                                <p style="margin-top: 10px;">{b_flag['explanation']}</p>
                            </div>
                            """, unsafe_allow_html=True)
                else:
                    st.success("No suspicious patterns found across your accounts.")

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
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Compare Reports Over Time</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            Upload two reports of the same account from different dates to detect manipulation.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.info("""
    **How this works:** If a debt's dates changed between reports, that's evidence of re-aging.
    For example, if the DOFD was January 2020 in your old report but shows as June 2021 in your new report,
    someone illegally reset the clock on your debt.
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
        if st.button("Compare These Reports", type="primary", use_container_width=True):
            with st.spinner("Comparing your reports..."):
                from app.extraction import extract_text_from_bytes
                from app.parser import parse_credit_report
                
                text_a, _ = extract_text_from_bytes(file_a.read(), file_a.name)
                text_b, _ = extract_text_from_bytes(file_b.read(), file_b.name)
                
                parsed_a = parse_credit_report(text_a)
                parsed_b = parse_credit_report(text_b)
                
                # Logic for comparison
                fields_a = parsed_a.to_verified_dict()
                fields_b = parsed_b.to_verified_dict()
                
                st.markdown("---")
                st.subheader("What We Found")

                # Check for DOFD changes
                dofd_a = fields_a.get('dofd')
                dofd_b = fields_b.get('dofd')

                if dofd_a and dofd_b and dofd_a != dofd_b:
                    st.error("**Problem Found: The DOFD Changed**")
                    st.markdown(f"""
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 10px 0;">
                        <p style="margin: 0; color: #991b1b;">
                            The Date of First Delinquency changed from <strong>{dofd_a}</strong> to <strong>{dofd_b}</strong>.
                        </p>
                        <p style="margin: 10px 0 0 0; color: #7f1d1d; font-size: 0.9rem;">
                            This is strong evidence of illegal re-aging. The DOFD should never change - it's the date you first fell behind on the original account.
                        </p>
                    </div>
                    """, unsafe_allow_html=True)
                elif dofd_a and dofd_b and dofd_a == dofd_b:
                    st.success("Good: The DOFD is the same in both reports.")

                # Check for frozen status
                status_a = str(fields_a.get('account_status') or '').lower()
                status_b = str(fields_b.get('account_status') or '').lower()

                months_between = (date_b - date_a).days / 30
                if months_between > 6 and status_a == status_b and "late" in status_a:
                    st.warning("**Suspicious: Status Hasn't Changed**")
                    st.markdown(f"""
                    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 10px 0;">
                        <p style="margin: 0; color: #92400e;">
                            The account showed "{status_a}" in both reports, even though {int(months_between)} months passed.
                        </p>
                        <p style="margin: 10px 0 0 0; color: #78350f; font-size: 0.9rem;">
                            This could mean someone is keeping the debt looking "fresh" to extend its impact on your credit.
                        </p>
                    </div>
                    """, unsafe_allow_html=True)


def render_timeline_visualization():
    """Render the Multi-Report Timeline Visualization UI."""
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Timeline Visualization</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            Upload multiple reports over time to see how an account's dates changed - visual proof of re-aging.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.info("""
    **How to use:** Add 2 or more snapshots of the same account from different credit reports.
    Enter the key dates from each report, and we'll show you a timeline revealing any suspicious changes.
    """)

    # Initialize session state for timeline entries
    if 'timeline_entries' not in st.session_state:
        st.session_state.timeline_entries = []

    # Add new entry form
    st.markdown("### Add a Report Snapshot")

    col1, col2 = st.columns(2)
    with col1:
        report_date = st.date_input("When was this report pulled?", key="tl_report_date")
        dofd = st.text_input("DOFD shown on report", placeholder="YYYY-MM-DD", key="tl_dofd")
    with col2:
        date_opened = st.text_input("Date Opened shown", placeholder="YYYY-MM-DD", key="tl_opened")
        removal_date = st.text_input("Est. Removal Date", placeholder="YYYY-MM-DD", key="tl_removal")

    balance = st.text_input("Balance shown", placeholder="e.g., $1,234", key="tl_balance")
    status = st.text_input("Account Status", placeholder="e.g., Collection, Charge-off", key="tl_status")

    if st.button("Add This Snapshot", type="primary"):
        entry = {
            'report_date': str(report_date),
            'dofd': dofd,
            'date_opened': date_opened,
            'removal_date': removal_date,
            'balance': balance,
            'status': status
        }
        st.session_state.timeline_entries.append(entry)
        st.success(f"Added snapshot from {report_date}")
        st.rerun()

    # Show current entries
    if st.session_state.timeline_entries:
        st.markdown("---")
        st.markdown("### Your Timeline Data")

        # Create dataframe for display
        df = pd.DataFrame(st.session_state.timeline_entries)
        df = df.sort_values('report_date')
        st.dataframe(df, use_container_width=True)

        col1, col2 = st.columns(2)
        with col1:
            if st.button("Clear All Entries", type="secondary"):
                st.session_state.timeline_entries = []
                st.rerun()
        with col2:
            if len(st.session_state.timeline_entries) >= 2:
                if st.button("Analyze Timeline", type="primary"):
                    analyze_timeline(st.session_state.timeline_entries)


def analyze_timeline(entries):
    """Analyze timeline entries for suspicious patterns."""
    st.markdown("---")
    st.markdown("## Timeline Analysis Results")

    # Sort by report date
    sorted_entries = sorted(entries, key=lambda x: x['report_date'])

    # Visual timeline
    st.markdown("### Visual Timeline")

    # Create a visual representation
    timeline_html = '<div style="position: relative; padding: 20px 0;">'
    timeline_html += '<div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 4px; background: #e2e8f0;"></div>'

    for i, entry in enumerate(sorted_entries):
        side = "left" if i % 2 == 0 else "right"
        margin = "margin-right: 60%;" if side == "left" else "margin-left: 60%;"

        timeline_html += f'''
        <div style="{margin} padding: 15px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; position: relative;">
            <div style="position: absolute; {'right' if side == 'left' else 'left'}: -12px; top: 20px; width: 20px; height: 20px; background: #2563eb; border-radius: 50%; border: 3px solid white;"></div>
            <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">Report: {entry['report_date']}</div>
            <div style="font-size: 0.85rem; color: #64748b;">
                <div>DOFD: <strong>{entry['dofd'] or 'Not shown'}</strong></div>
                <div>Opened: <strong>{entry['date_opened'] or 'Not shown'}</strong></div>
                <div>Removal: <strong>{entry['removal_date'] or 'Not shown'}</strong></div>
                <div>Balance: <strong>{entry['balance'] or 'Not shown'}</strong></div>
                <div>Status: <strong>{entry['status'] or 'Not shown'}</strong></div>
            </div>
        </div>
        '''

    timeline_html += '</div>'
    st.markdown(timeline_html, unsafe_allow_html=True)

    # Analysis
    st.markdown("### What We Found")

    issues_found = []

    # Check for DOFD changes
    dofds = [e['dofd'] for e in sorted_entries if e['dofd']]
    unique_dofds = set(dofds)
    if len(unique_dofds) > 1:
        issues_found.append({
            'severity': 'high',
            'title': 'DOFD Changed Between Reports',
            'detail': f"The DOFD changed from {dofds[0]} to {dofds[-1]}. The DOFD should NEVER change - this is strong evidence of re-aging.",
            'values': list(unique_dofds)
        })

    # Check for Date Opened changes
    opened_dates = [e['date_opened'] for e in sorted_entries if e['date_opened']]
    unique_opened = set(opened_dates)
    if len(unique_opened) > 1:
        issues_found.append({
            'severity': 'high',
            'title': 'Date Opened Changed',
            'detail': f"The Date Opened changed across reports. This could indicate the debt was 're-aged' by reporting a new open date.",
            'values': list(unique_opened)
        })

    # Check for Removal Date changes
    removal_dates = [e['removal_date'] for e in sorted_entries if e['removal_date']]
    unique_removal = set(removal_dates)
    if len(unique_removal) > 1:
        issues_found.append({
            'severity': 'medium',
            'title': 'Removal Date Changed',
            'detail': f"The estimated removal date changed. If it moved LATER, that's suspicious - the removal date is based on the original DOFD and shouldn't extend.",
            'values': list(unique_removal)
        })

    # Check for balance changes when status is paid/settled
    for i in range(1, len(sorted_entries)):
        prev = sorted_entries[i-1]
        curr = sorted_entries[i]
        if prev.get('status') and 'paid' in str(prev['status']).lower():
            if curr['balance'] and curr['balance'] != '$0' and curr['balance'] != '0':
                issues_found.append({
                    'severity': 'medium',
                    'title': 'Balance Reappeared After Paid Status',
                    'detail': f"Report from {prev['report_date']} showed 'paid' but {curr['report_date']} shows a balance of {curr['balance']}.",
                    'values': [prev['status'], curr['balance']]
                })

    # Display findings
    if issues_found:
        for issue in issues_found:
            severity_colors = {
                'high': ('#fef2f2', '#fecaca', '#dc2626', '#991b1b'),
                'medium': ('#fef3c7', '#fcd34d', '#d97706', '#92400e'),
                'low': ('#f0fdf4', '#bbf7d0', '#16a34a', '#166534')
            }
            bg, border, title_color, text_color = severity_colors.get(issue['severity'], severity_colors['medium'])

            st.markdown(f"""
            <div style="background: {bg}; border: 1px solid {border}; border-left: 4px solid {title_color}; border-radius: 8px; padding: 15px; margin: 10px 0;">
                <div style="color: {title_color}; font-weight: 600; font-size: 1rem; margin-bottom: 8px;">
                    {issue['title']}
                </div>
                <div style="color: {text_color}; font-size: 0.9rem;">
                    {issue['detail']}
                </div>
                <div style="margin-top: 10px; font-size: 0.8rem; color: #64748b;">
                    Values seen: {', '.join(str(v) for v in issue['values'])}
                </div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("### What To Do Next")
        st.markdown("""
        Based on the changes detected, you should:

        1. **Gather all reports** - Print or save copies of each credit report showing the different dates
        2. **Document the timeline** - Create a written summary of how the dates changed
        3. **File disputes** - Send dispute letters to each credit bureau citing the inconsistencies
        4. **Consider legal action** - If dates were clearly manipulated, consult with a consumer rights attorney

        Use the **"Check One Report"** mode to generate dispute letters for the most recent report.
        """)
    else:
        st.success("""
        **Good news!** No suspicious changes detected across your timeline.

        The dates appear consistent across all the reports you entered. This suggests the account
        is being reported accurately over time.
        """)
