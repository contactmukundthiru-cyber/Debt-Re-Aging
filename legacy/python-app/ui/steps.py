"""
Step-by-step workflow for the single case analysis mode.
"""
import streamlit as st
import html
import os
from datetime import datetime
from app.extraction import extract_text_from_bytes, get_extraction_quality_score
from app.parser import parse_credit_report, fields_to_editable_dict
from app.rules import run_rules, calculate_pattern_score
from app.generator import generate_dispute_packet
from app.state_sol import get_all_states
from app.pdf_export import export_packet_to_pdf
from app.docx_export import export_packet_to_docx
from app.metrics import MetricsTracker, create_case_metric
from app.utils import (
    confidence_to_color, severity_to_emoji, mask_pii
)

def render_step_1_upload():
    """
    Render Step 1: Upload credit report.
    
    Provides two tabs for input: file upload (PDF/image) and raw text paste.
    Handles immediate text extraction upon file upload.
    """
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Step 1: Upload Your Credit Report</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            Upload a photo or PDF of the account you want to check, or paste the text directly.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Helpful tips
    st.markdown("""
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="color: #166534; font-weight: 600; margin-bottom: 8px;">Tips for best results:</div>
        <ul style="color: #15803d; margin: 0; padding-left: 20px; font-size: 0.9rem;">
            <li>Use a clear, well-lit photo or high-quality scan</li>
            <li>Include all the dates shown on the account</li>
            <li>Make sure text is readable (not blurry)</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

    # Input method tabs
    input_tab1, input_tab2 = st.tabs(["Upload File", "Paste Text"])

    with input_tab1:
        st.markdown("**Upload a PDF or image of your credit report**")
        uploaded_file = st.file_uploader(
            "Choose a file",
            type=['pdf', 'png', 'jpg', 'jpeg'],
            help="Supported formats: PDF, PNG, JPG, JPEG",
            label_visibility="collapsed"
        )

    with input_tab2:
        st.markdown("**Or paste the text from your credit report**")
        pasted_text = st.text_area(
            "Paste credit report text here",
            height=200,
            placeholder="Copy and paste the account details from your credit report here.\n\nInclude dates like:\n- Date Opened\n- Date of First Delinquency\n- Last Reported Date\n- Balance\n- Creditor Name",
            help="Paste the text from your credit report. Include dates and account information.",
            label_visibility="collapsed"
        )

        if pasted_text and st.button("Continue with this text", type="primary", use_container_width=True):
            st.session_state.uploaded_file = None
            st.session_state.extracted_text = pasted_text
            st.session_state.extraction_method = 'pasted_text'
            st.session_state.processing_start_time = datetime.now()
            st.success("Text received!")
            st.rerun()

    if uploaded_file is not None:
        st.session_state.uploaded_file = uploaded_file
        st.session_state.processing_start_time = datetime.now()

        with st.spinner("Extracting text from document..."):
            file_bytes = uploaded_file.read()
            extracted_text, method = extract_text_from_bytes(file_bytes, uploaded_file.name)

            if method != "error":
                st.session_state.extracted_text = extracted_text
                st.session_state.extraction_method = method

                quality_score, quality_desc = get_extraction_quality_score(extracted_text)

                st.success(f"Text extracted successfully using {method}!")
                st.info(f"Quality: {quality_score}/100 - {quality_desc}")

                if st.button("Continue to Review", type="primary"):
                    st.session_state.current_step = 2
                    st.rerun()
            else:
                st.error(f"Error extracting text: {extracted_text}")

def render_step_2_review():
    """
    Render Step 2: Review extracted text.
    
    Allows users to manually correct any OCR errors in the extracted text
    before it is parsed into structured fields.
    """
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Step 2: Review the Extracted Text</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            Check that the text below looks correct. Fix any errors you see before continuing.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Show extraction method
    method = st.session_state.extraction_method
    method_display = {
        'embedded_text': 'PDF text extraction',
        'ocr': 'Image scanning (OCR)',
        'pasted_text': 'Pasted text',
        'sample': 'Sample case'
    }.get(method, method)

    st.info(f"Text extracted using: **{method_display}**")

    # Show extracted text in editable area
    display_text = st.session_state.extracted_text
    if st.session_state.privacy_mode:
        display_text = mask_pii(display_text)

    st.markdown("**Review and edit the text if needed:**")
    edited_text = st.text_area(
        "Extracted text",
        value=display_text,
        height=350,
        help="Fix any scanning errors - especially dates and numbers",
        label_visibility="collapsed"
    )

    if not st.session_state.privacy_mode:
        st.session_state.extracted_text = edited_text
    else:
        st.warning("Privacy Mode is on. Edits won't be saved to avoid masking errors.")

    col1, col2 = st.columns(2)

    with col1:
        if st.button("Back"):
            st.session_state.current_step = 1
            st.rerun()

    with col2:
        if st.button("Continue", type="primary"):
            # Parse the text
            with st.spinner("Extracting details..."):
                parsed = parse_credit_report(st.session_state.extracted_text)
                st.session_state.parsed_fields = parsed
                st.session_state.editable_fields = fields_to_editable_dict(parsed)

            st.session_state.current_step = 3
            st.rerun()

def render_step_3_verify():
    """
    Render Step 3: Verify extracted details.
    
    Shows the structured fields parsed from the text. Users can verify or
    correct individual data points like DOFD, balance, and creditor name.
    """
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Step 3: Verify the Details</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            We found these details in your report. Please check they're correct and fill in any missing fields.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
        <div style="color: #92400e; font-size: 0.85rem;">
            <strong>Important:</strong> Fields highlighted in red or yellow need your attention.
            Dates should be in YYYY-MM-DD format (e.g., 2023-05-15).
        </div>
    </div>
    """, unsafe_allow_html=True)

    fields = st.session_state.editable_fields
    
    st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
    st.markdown("### Account Details")

    # Field definitions for display
    # Field definitions for display
    field_info = {
        'original_creditor': ('Original Creditor', 'The original company you had the account with'),
        'furnisher_or_collector': ('Furnisher/Collector', 'The company reporting this to the credit bureau'),
        'account_type': ('Account Type', 'e.g., collection, charge_off, other'),
        'account_status': ('Account Status', 'e.g., Paid, Settled, Late, Default'),
        'current_balance': ('Current Balance', 'The current balance reported ($)'),
        'original_amount': ('Original Amount', 'The initial amount of the debt ($)'),
        'date_opened': ('Date Opened', 'Date the account was opened (YYYY-MM-DD)'),
        'date_reported_or_updated': ('Date Reported/Updated', 'When this was last reported (YYYY-MM-DD)'),
        'dofd': ('Date of First Delinquency', 'When you first fell behind (YYYY-MM-DD)'),
        'charge_off_date': ('Charge-Off Date', 'When the debt was charged off (YYYY-MM-DD)'),
        'date_last_payment': ('Date of Last Payment', 'When you last made a payment (YYYY-MM-DD)'),
        'date_last_activity': ('Date of Last Activity', 'When the account last had activity (YYYY-MM-DD)'),
        'estimated_removal_date': ('Estimated Removal Date', 'When this should drop off (YYYY-MM-DD)'),
        'payment_history': ('Payment History', 'Raw delinquency markers (e.g., 30 60 90 C)'),
        'bureau': ('Credit Bureau', 'Experian, Equifax, TransUnion, or Unknown')
    }

    # Create two columns for fields
    col1, col2 = st.columns(2)

    field_list = list(field_info.keys())
    for i, field_name in enumerate(field_list):
        label, help_text = field_info[field_name]
        field_data = fields.get(field_name, {'value': '', 'confidence': 'Low', 'source_text': ''})
        source = field_data.get('source_text', '')

        # Alternate columns
        with col1 if i % 2 == 0 else col2:
            confidence = field_data.get('confidence', 'Low')
            conf_color = confidence_to_color(confidence)
            
            # Highlight border for low/medium confidence
            container_style = ""
            if confidence == 'Low':
                container_style = "border: 2px solid #ef4444; border-radius: 4px; padding: 10px; background-color: #fef2f2;"
            elif confidence == 'Medium':
                container_style = "border: 2px solid #f59e0b; border-radius: 4px; padding: 10px; background-color: #fffbeb;"

            if container_style:
                st.markdown(f'<div style="{container_style}">', unsafe_allow_html=True)

            st.markdown(f"**{label}** <span style='color:{conf_color}; font-weight: bold;'>({confidence.upper()} CONFIDENCE)</span>",
                       unsafe_allow_html=True)

            # Special handling for account type and bureau (dropdowns)
            if field_name == 'account_type':
                options = ['', 'collection', 'charge_off', 'closed', 'open', 'other']
                current = field_data.get('value', '') or ''
                if current not in options:
                    options.append(current)
                new_value = st.selectbox(
                    f"Select {label}",
                    options=options,
                    index=options.index(current) if current in options else 0,
                    label_visibility="collapsed",
                    key=f"field_{field_name}"
                )
            elif field_name == 'bureau':
                options = ['Unknown', 'Experian', 'Equifax', 'TransUnion']
                current = field_data.get('value', 'Unknown') or 'Unknown'
                if current not in options:
                    options.append(current)
                new_value = st.selectbox(
                    f"Select {label}",
                    options=options,
                    index=options.index(current) if current in options else 0,
                    label_visibility="collapsed",
                    key=f"field_{field_name}"
                )
            else:
                new_value = st.text_input(
                    label,
                    value=field_data.get('value', '') or '',
                    help=f"Detected from: {source}" if source else help_text,
                    label_visibility="collapsed",
                    key=f"field_{field_name}"
                )

            # Show source text if available as a small caption
            if source:
                st.markdown(f"<small style='color:#64748b'>Source: {source[:60]}{'...' if len(source)>60 else ''}</small>", unsafe_allow_html=True)

            if container_style:
                st.markdown('</div>', unsafe_allow_html=True)

            # Update the field value
            fields[field_name]['value'] = new_value

    st.markdown('</div>', unsafe_allow_html=True)
    st.session_state.editable_fields = fields

    st.markdown("---")

    # Optional consumer info
    st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
    st.subheader("Your Information (Optional)")
    st.caption("Add your name and state to personalize the dispute letters and check state-specific laws.")

    col1, col2 = st.columns(2)
    with col1:
        st.session_state.consumer_info['name'] = st.text_input(
            "Full Legal Name",
            value=st.session_state.consumer_info.get('name', ''),
            placeholder="John Q. Consumer"
        )
        
        from app.state_sol import get_all_states, get_state_sol
        states = get_all_states()
        state_options = [""] + sorted(list(states.keys()))
        state_names = {code: f"{code} - {name}" for code, name in states.items()}
        state_names[""] = "Select a Jurisdiction"
        
        selected_state = st.selectbox(
            "Legal Jurisdiction (State)",
            options=state_options,
            format_func=lambda x: state_names[x],
            index=state_options.index(st.session_state.consumer_info.get('state', '')) if st.session_state.consumer_info.get('state', '') in state_options else 0,
            help="Required for Statute of Limitations (SOL) heuristics."
        )
        st.session_state.consumer_info['state'] = selected_state

        if selected_state:
            sol_info = get_state_sol(selected_state)
            if sol_info:
                st.info(f"**SOL Info for {sol_info.state}:** Written Contracts: {sol_info.written_contracts}y | Open Accounts: {sol_info.open_accounts}y", icon="⚖️")

    with col2:
        st.session_state.consumer_info['address'] = st.text_area(
            "Mailing Address",
            value=st.session_state.consumer_info.get('address', ''),
            placeholder="Street Address\nCity, State Zip",
            height=130
        )

    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown("---")

    # Verification checkbox
    verified = st.checkbox(
        "I have reviewed and verified all fields above",
        value=st.session_state.fields_verified
    )
    st.session_state.fields_verified = verified

    col1, col2 = st.columns(2)

    with col1:
        if st.button("← Back to Review"):
            st.session_state.current_step = 2
            st.rerun()

    with col2:
        if st.button("Run Checks →", type="primary", disabled=not verified):
            st.session_state.current_step = 4
            st.rerun()

def render_timeline_visual(fields):
    """
    Render a professional visual timeline of key dates.
    
    Generates a CSS-based horizontal timeline showing account opening,
    delinquency, and estimated removal dates.
    """
    from app.utils import normalize_date
    
    dates = []
    for label, key in [("Opened", "date_opened"), ("DOFD", "dofd"), ("Removal", "estimated_removal_date")]:
        val = fields.get(key)
        if val:
            norm, _ = normalize_date(val)
            if norm:
                try:
                    dt = datetime.strptime(norm, '%Y-%m-%d')
                    dates.append({'label': label, 'date': dt, 'str': norm})
                except ValueError:
                    # Logging here would be too noisy for a render loop if it fails often
                    pass
                except Exception as e:
                    from app.rules import logger as rule_logger
                    rule_logger.error(f"Unexpected error in timeline rendering: {e}")
    
    if len(dates) < 2:
        return
        
    dates.sort(key=lambda x: x['date'])
    
    st.markdown("### Timeline of Key Dates")
    
    min_date = dates[0]['date']
    max_date = dates[-1]['date']
    total_days = (max_date - min_date).days or 1
    
    # Simple CSS timeline inside the new container class
    timeline_html = '<div class="timeline-container"><div style="display: flex; align-items: center; width: 100%; height: 4px; background: #cbd5e1; position: relative; margin: 40px 0;">'
    
    for item in dates:
        pos = ((item['date'] - min_date).days / total_days) * 95 # 95% to avoid edge
        timeline_html += f"""
        <div style="position: absolute; left: {pos}%; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 16px; height: 16px; background: #2563eb; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #2563eb; transform: translateY(-6px);"></div>
            <div style="font-size: 0.75rem; font-weight: 800; color: #0f172a; margin-top: 12px; text-transform: uppercase;">{item['label']}</div>
            <div style="font-size: 0.7rem; color: #64748b; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">{item['str']}</div>
        </div>
        """
        
    timeline_html += "</div></div>"
    st.markdown(timeline_html, unsafe_allow_html=True)

def render_step_4_checks():
    """
    Render Step 4: Run Checks.
    
    Executes the RuleEngine against the verified fields and displays
    all identified violations with severity, explanations, and legal citations.
    """
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Step 4: Issues Found</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            We checked your report against 20+ rules. Here's what we found.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Prepare fields for rule checking
    verified_fields = {}
    for field_name, field_data in st.session_state.editable_fields.items():
        verified_fields[field_name] = field_data.get('value') or None
    
    # Render Timeline
    render_timeline_visual(verified_fields)

    # Add state for SOL check
    if st.session_state.consumer_info.get('state'):
        verified_fields['state_code'] = st.session_state.consumer_info['state']

    # Run the checks
    if not st.session_state.rules_checked:
        with st.spinner("Running checks..."):
            flags = run_rules(verified_fields)
            st.session_state.rule_flags = flags
            st.session_state.rules_checked = True
            # Calculate pattern score and risk profile
            if flags:
                risk_profile = calculate_pattern_score(flags, verified_fields)
                st.session_state.risk_profile = risk_profile

    flags = st.session_state.rule_flags
    risk_profile = st.session_state.get('risk_profile', {})

    # Risk Profile Display (if available)
    if risk_profile and flags:
        overall_score = risk_profile.get('overall_score', 0)
        risk_level = risk_profile.get('risk_level', 'low')
        dispute_strength = risk_profile.get('dispute_strength', 'weak')
        litigation_potential = risk_profile.get('litigation_potential', False)

        # Risk level colors
        risk_colors = {
            'critical': ('#dc2626', '#fef2f2', '#991b1b'),
            'high': ('#ea580c', '#fff7ed', '#9a3412'),
            'medium': ('#d97706', '#fffbeb', '#92400e'),
            'low': ('#16a34a', '#f0fdf4', '#166534')
        }
        bg_color, card_bg, text_color = risk_colors.get(risk_level, risk_colors['low'])

        st.markdown(f"""
        <div style="background: {card_bg}; border: 2px solid {bg_color}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                    <div style="font-size: 0.8rem; color: {text_color}; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">
                        Case Strength Score
                    </div>
                    <div style="font-size: 2.5rem; font-weight: 800; color: {bg_color}; line-height: 1;">
                        {overall_score}/100
                    </div>
                    <div style="font-size: 0.9rem; color: {text_color}; margin-top: 4px;">
                        Risk Level: <strong>{risk_level.upper()}</strong>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="background: {bg_color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 0.85rem;">
                        Dispute Strength: {dispute_strength.upper()}
                    </div>
                    {"<div style='margin-top: 8px; font-size: 0.8rem; color: " + text_color + ";'><strong>Litigation Potential</strong></div>" if litigation_potential else ""}
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        # Detected patterns
        patterns = risk_profile.get('detected_patterns', [])
        if patterns:
            st.markdown("### Detected Patterns")
            for pattern in patterns:
                confidence = pattern.get('confidence_score', 0)
                strength = pattern.get('legal_strength', 'weak')
                strength_colors = {'definitive': '#16a34a', 'strong': '#2563eb', 'moderate': '#d97706', 'weak': '#64748b'}

                st.markdown(f"""
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid {strength_colors.get(strength, '#64748b')};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-weight: 700; color: #0f172a; font-size: 1rem;">{pattern.get('pattern_name', 'Unknown Pattern')}</div>
                            <div style="color: #64748b; font-size: 0.85rem; margin-top: 4px;">{pattern.get('description', '')}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.2rem; font-weight: 700; color: {strength_colors.get(strength, '#64748b')};">{confidence}%</div>
                            <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">{strength}</div>
                        </div>
                    </div>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9;">
                        <div style="font-size: 0.8rem; color: #475569;"><strong>Action:</strong> {pattern.get('recommended_action', '')}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 6px;">Rules matched: {', '.join(pattern.get('matched_rules', []))}</div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

        # Recommended approach
        st.markdown("### Recommended Approach")
        st.markdown(f"""
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
            <p style="font-size: 0.95rem; color: #334155; margin: 0;">{risk_profile.get('recommended_approach', '')}</p>
        </div>
        """, unsafe_allow_html=True)

        # Key violations
        key_violations = risk_profile.get('key_violations', [])
        if key_violations:
            st.markdown(f"""
            <div style="margin-top: 12px; padding: 12px; background: #fef2f2; border-radius: 6px;">
                <div style="font-size: 0.8rem; color: #991b1b; font-weight: 600;">Key Violations:</div>
                <div style="font-size: 0.85rem; color: #dc2626;">{' • '.join(key_violations)}</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")

    elif flags:
        # Fallback to old display if no risk profile
        st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
        st.markdown("### Recommended Approach")

        has_metro2 = any(str(f.get('rule_id') or '').startswith('M') for f in flags)
        has_reaging = any(str(f.get('rule_id') or '').startswith('B') or f.get('rule_id', '') == 'K6' for f in flags)

        if has_reaging:
            strategy_title = "Strong Case - Re-Aging Detected"
            strategy_desc = "We found signs that dates may have been changed illegally. Your dispute should focus on proving the correct Date of First Delinquency."
            status_color = "#e11d48"
        elif has_metro2:
            strategy_title = "Technical Errors Found"
            strategy_desc = "The data reporting doesn't follow standard rules. Your dispute can challenge whether they're keeping accurate records."
            status_color = "#d97706"
        else:
            strategy_title = "Potential Issues Found"
            strategy_desc = "We found some things that don't look right. Request that they verify the specific details we flagged."
            status_color = "#2563eb"

        st.markdown(f"""
        <div style="background: {status_color}; color: white; padding: 12px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; margin-bottom: 12px; display: inline-block;">
            {strategy_title}
        </div>
        <p style="font-size: 0.95rem; color: #475569;">{strategy_desc}</p>
        """, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    # Display results
    if flags:
        st.markdown(f"### Issues Found ({len(flags)})")

        for flag in flags:
            severity = flag.get('severity', 'medium')
            severity_class = f"severity-{severity}"

            st.markdown(f"""
            <div class="{severity_class}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0; color: #0f172a; font-weight: 700; font-size: 1rem;">
                            {severity_to_emoji(severity)} {html.escape(flag.get('rule_name', 'Unknown Rule'))}
                        </h4>
                        <div style="margin-top: 8px; font-size: 0.95rem; color: #1e293b;">
                            {html.escape(flag.get('explanation', 'No explanation available'))}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-family: monospace; font-size: 0.7rem; opacity: 0.6; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px;">
                            Rule {html.escape(flag.get('rule_id', 'N/A'))}
                        </span>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)

            with st.expander("See more details"):
                col_ev1, col_ev2 = st.columns(2)
                with col_ev1:
                    st.markdown(f"**Why this matters:**\n\n{flag.get('why_it_matters', '')}")

                    # Legal references
                    cites = flag.get('legal_citations', [])
                    if cites:
                        st.markdown("---")
                        st.markdown("**Related laws:**")
                        from app.regulatory import get_citations as resolve_citations
                        try:
                            resolved = resolve_citations(cites)
                            for r in resolved:
                                st.markdown(f"> **{r['title']}**: {r['text']}")
                        except Exception as e:
                            st.error(f"Error loading citations: {e}")

                with col_ev2:
                    st.markdown("**Evidence you should gather:**")
                    for evidence in flag.get('suggested_evidence', []):
                        st.markdown(f"- {evidence}")

                st.markdown("---")
                st.markdown("**🔍 FORENSIC DATA TRACE**")
                # High-end grid for data trace
                data_points = list(flag.get('field_values', {}).items())
                if data_points:
                    for i in range(0, len(data_points), 3):
                        cols = st.columns(3)
                        for j in range(3):
                            if i + j < len(data_points):
                                k, v = data_points[i+j]
                                cols[j].metric(label=k.replace('_', ' ').upper(), value=str(v))
    else:
        st.success("No obvious timeline inconsistencies detected!")
        st.info("""
        This does not necessarily mean everything is accurate. The automated checks
        only look for specific patterns. Manual review is always recommended.
        """)

    st.markdown("---")

    col1, col2 = st.columns(2)

    with col1:
        if st.button("← Back to Verify"):
            st.session_state.rules_checked = False
            st.session_state.current_step = 3
            st.rerun()

    with col2:
        if st.button("Generate Dispute Packet →", type="primary"):
            st.session_state.current_step = 5
            st.rerun()

def render_step_5_generate():
    """
    Render Step 5: Generate dispute letters.
    
    Provides the UI for generating and downloading the final dispute packet,
    including PDF and Word document exports.
    """
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Step 5: Generate Your Dispute Letters</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            Ready to create your dispute documentation. This includes letters to send to credit bureaus and collectors.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="color: #1e40af; font-weight: 600; margin-bottom: 8px;">What you'll get:</div>
        <ul style="color: #1e3a8a; margin: 0; padding-left: 20px; font-size: 0.9rem;">
            <li>Dispute letter for the credit bureau</li>
            <li>Letter for the debt collector/furnisher</li>
            <li>Case summary with all the evidence</li>
            <li>Checklist of documents to include</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

    # Prepare verified fields
    verified_fields = {}
    for field_name, field_data in st.session_state.editable_fields.items():
        verified_fields[field_name] = field_data.get('value') or None

    # Consumer info
    consumer_info = st.session_state.consumer_info
    if not consumer_info.get('name'):
        consumer_info = None

    if not st.session_state.packet_generated:
        if st.button("Generate Packet", type="primary"):
            with st.spinner("Generating dispute packet..."):
                try:
                    result = generate_dispute_packet(
                        verified_fields=verified_fields,
                        flags=st.session_state.rule_flags,
                        consumer_info=consumer_info
                    )

                    st.session_state.packet_result = result
                    st.session_state.packet_generated = True
                    
                    # Generate PDFs if possible
                    try:
                        pdf_results = export_packet_to_pdf(
                            result['generated_files'],
                            result['output_directory'],
                            result['case_id']
                        )
                        result['generated_files'].update(pdf_results)
                    except Exception as e:
                        st.warning(f"Note: PDF generation skipped: {e}")

                    # Generate DOCX if possible
                    try:
                        docx_results = export_packet_to_docx(
                            result['generated_files'],
                            result['output_directory']
                        )
                        result['generated_files'].update(docx_results)
                    except Exception as e:
                        st.warning(f"Note: Word (DOCX) generation skipped: {e}")

                    # Record metrics
                    try:
                        tracker = MetricsTracker()
                        quality_score, _ = get_extraction_quality_score(st.session_state.extracted_text)
                        
                        metric = create_case_metric(
                            case_id=result['case_id'],
                            start_time=st.session_state.processing_start_time or datetime.now(),
                            end_time=datetime.now(),
                            original_fields=st.session_state.parsed_fields.to_dict() if st.session_state.parsed_fields else {},
                            edited_fields=st.session_state.editable_fields,
                            flags=st.session_state.rule_flags,
                            extraction_method=st.session_state.extraction_method,
                            extraction_quality=quality_score
                        )
                        tracker.record_case(metric)
                    except Exception as e:
                        st.error(f"Error recording metrics: {e}")

                    st.rerun()
                except Exception as e:
                    st.error(f"Error generating packet: {str(e)}")
    else:
        st.markdown('</div>', unsafe_allow_html=True)
        result = st.session_state.packet_result

        st.success(f"Packet generated successfully! Case ID: {result['case_id']}")

        st.markdown("### Your Documents")

        # Show generated files
        for filename, filepath in result['generated_files'].items():
            icon = "📄"
            if filename.endswith('.pdf'): icon = "📕"
            elif filename.endswith('.docx'): icon = "🟦"
            elif filename.endswith('.html'): icon = "🌐"
            elif filename.endswith('.json'): icon = "🔢"
            elif filename.endswith('.yaml'): icon = "⚙️"
            
            with st.expander(f"{icon} {filename}"):
                try:
                    if filename.endswith('.pdf') or filename.endswith('.docx'):
                        st.info(f"{filename.split('.')[-1].upper()} file generated. Download the full packet to view.")
                    else:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                        st.code(content, language='markdown' if filename.endswith('.md') else 'yaml')
                except Exception as e:
                    st.error(f"Could not read file: {e}")

        st.markdown("### Download Your Packet")

        # Provide ZIP download
        zip_path = result['zip_path']
        if os.path.exists(zip_path):
            with open(zip_path, 'rb') as f:
                zip_bytes = f.read()

            st.download_button(
                label=f"Download All Files (ZIP)",
                data=zip_bytes,
                file_name=f"{result['case_id']}_packet.zip",
                mime="application/zip",
                use_container_width=True,
                type="primary"
            )

        st.info(f"Files also saved to: {result['output_directory']}")

        st.markdown("---")

        # DOCX Export option
        st.markdown("### Get Editable Word Documents")
        st.caption("Download as Word files (.docx) so you can edit them before sending.")

        if st.button("Create Word Documents", use_container_width=True):
            try:
                from app.docx_export import export_all_documents, is_docx_available
                if is_docx_available():
                    # Prepare data
                    consumer_info = st.session_state.consumer_info or {}
                    account_info = {}
                    for field_name, field_data in st.session_state.editable_fields.items():
                        account_info[field_name] = field_data.get('value', '')

                    docx_files = export_all_documents(
                        case_id=result['case_id'],
                        consumer_info=consumer_info,
                        account_info=account_info,
                        flags=st.session_state.rule_flags
                    )

                    if docx_files:
                        st.success(f"Created {len(docx_files)} Word document(s)")
                        for filename, file_bytes in docx_files.items():
                            st.download_button(
                                label=f"Download {filename}",
                                data=file_bytes,
                                file_name=filename,
                                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                key=f"docx_{filename}",
                                use_container_width=True
                            )
                else:
                    st.warning("Word export requires python-docx. Install with: pip install python-docx")
            except Exception as e:
                st.error(f"Error generating Word documents: {e}")

        st.markdown("---")

        if st.button("Print This Page", use_container_width=True):
            import streamlit.components.v1 as components
            components.html("<script>window.print();</script>", height=0)
            st.info("Print dialog should appear.")

    st.markdown("---")

    col1, col2 = st.columns(2)

    with col1:
        if st.button("← Back to Checks"):
            st.session_state.current_step = 4
            st.rerun()
