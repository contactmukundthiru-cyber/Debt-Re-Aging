"""
Evidence Packet Builder for Attorneys
Generate comprehensive, professionally formatted evidence packages for legal review.

This module creates documentation suitable for:
- FCRA lawsuits
- Attorney consultations
- CFPB complaints with supporting evidence
- Small claims court filings
"""

import streamlit as st
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
import json


@dataclass
class EvidenceItem:
    """Single piece of evidence."""
    item_number: int
    category: str  # 'document', 'screenshot', 'calculation', 'timeline', 'statement'
    title: str
    description: str
    source: str
    date_obtained: str
    relevance: str
    exhibits_reference: str  # e.g., "Exhibit A-1"


@dataclass
class LegalCitation:
    """Legal citation with full text."""
    statute: str
    section: str
    title: str
    full_text: str
    relevance_to_case: str


@dataclass
class ViolationImpact:
    """Assessment of violation impact."""
    category: str
    description: str
    severity: str
    basis: str
    statutory_reference: str


@dataclass
class EvidencePacket:
    """Complete evidence packet for attorney review."""
    case_id: str
    prepared_date: str
    consumer_name: str
    consumer_state: str

    # Case summary
    executive_summary: str
    key_violations: List[str]
    recommended_causes_of_action: List[str]

    # Parties
    defendants: List[Dict[str, str]]  # furnishers, bureaus

    # Evidence
    evidence_items: List[EvidenceItem]
    timeline_of_events: List[Dict[str, str]]

    # Legal analysis
    applicable_statutes: List[LegalCitation]
    impact_assessment: List[ViolationImpact]

    # Forensic analysis
    chain_of_custody: List[Dict[str, str]]
    integrity_checks: List[Dict[str, str]]

    # Supporting data
    raw_flags: List[Dict[str, Any]]
    risk_profile: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        result['evidence_items'] = [asdict(e) for e in self.evidence_items]
        result['applicable_statutes'] = [asdict(c) for c in self.applicable_statutes]
        result['impact_assessment'] = [asdict(d) for d in self.impact_assessment]
        return result


# FCRA liability reference
FCRA_LIABILITY = {
    'negligent': {
        'liability': 'Actual impact suffered',
        'fees': 'Reasonable attorneys fees and costs',
        'statute': '15 U.S.C. § 1681o'
    },
    'willful': {
        'liability': 'Civil Liability provisions',
        'enforcement': 'Regulatory enforcement as allowed',
        'fees': 'Reasonable attorneys fees and costs',
        'statute': '15 U.S.C. § 1681n'
    }
}

# Common causes of action
CAUSES_OF_ACTION = {
    'FCRA_1681e_b': {
        'title': 'Failure to Maintain Reasonable Procedures',
        'statute': '15 U.S.C. § 1681e(b)',
        'against': 'Credit Reporting Agency',
        'elements': [
            'CRA reported inaccurate information',
            'CRA failed to follow reasonable procedures to assure accuracy',
            'Consumer suffered negative impact'
        ]
    },
    'FCRA_1681i': {
        'title': 'Failure to Conduct Reasonable Reinvestigation',
        'statute': '15 U.S.C. § 1681i',
        'against': 'Credit Reporting Agency',
        'elements': [
            'Consumer disputed inaccurate information',
            'CRA failed to conduct reasonable reinvestigation',
            'Inaccurate information was not corrected/deleted'
        ]
    },
    'FCRA_1681s-2_a': {
        'title': 'Furnisher Duty to Report Accurate Information',
        'statute': '15 U.S.C. § 1681s-2(a)',
        'against': 'Furnisher/Creditor',
        'elements': [
            'Furnisher reported inaccurate information',
            'Information was materially inaccurate',
            'Furnisher knew or should have known of inaccuracy'
        ]
    },
    'FCRA_1681s-2_b': {
        'title': 'Furnisher Duty to Investigate Disputes',
        'statute': '15 U.S.C. § 1681s-2(b)',
        'against': 'Furnisher/Creditor',
        'elements': [
            'Consumer disputed through CRA',
            'CRA notified furnisher of dispute',
            'Furnisher failed to conduct reasonable investigation',
            'Furnisher failed to correct inaccurate information'
        ]
    },
    'FDCPA_807': {
        'title': 'False or Misleading Representations',
        'statute': '15 U.S.C. § 1692e',
        'against': 'Debt Collector',
        'elements': [
            'Defendant is a debt collector',
            'Defendant made false or misleading representation',
            'Representation was in connection with debt collection'
        ]
    }
}


class EvidenceBuilder:
    """Build comprehensive evidence packets for legal review."""

    def __init__(self):
        self.exhibit_counter = {'A': 0, 'B': 0, 'C': 0, 'D': 0}

    def _next_exhibit(self, category: str) -> str:
        """Generate next exhibit reference."""
        cat_map = {'document': 'A', 'screenshot': 'B', 'calculation': 'C', 'timeline': 'D'}
        cat = cat_map.get(category, 'A')
        self.exhibit_counter[cat] += 1
        return f"Exhibit {cat}-{self.exhibit_counter[cat]}"

    def generate_executive_summary(
        self,
        flags: List[Dict[str, Any]],
        risk_profile: Dict[str, Any],
        fields: Dict[str, Any]
    ) -> str:
        """Generate executive summary for attorney."""
        creditor = fields.get('creditor_name') or fields.get('furnisher_or_collector') or 'the furnisher'
        high_flags = [f for f in flags if f.get('severity') == 'high']

        summary = []
        summary.append(f"This evidence packet documents violations by {creditor} in credit reporting practices.")
        summary.append("")

        if risk_profile:
            score = risk_profile.get('overall_score', 0)
            strength = risk_profile.get('dispute_strength', 'unknown')
            summary.append(f"Case Strength Assessment: {score}/100 ({strength.upper()})")
            if risk_profile.get('litigation_potential'):
                summary.append("This case shows strong potential for litigation.")
            summary.append("")

        if high_flags:
            summary.append(f"HIGH SEVERITY VIOLATIONS IDENTIFIED: {len(high_flags)}")
            for flag in high_flags[:3]:
                summary.append(f"  - {flag.get('rule_name')}: {flag.get('explanation', '')[:100]}...")
            summary.append("")

        # Patterns detected
        patterns = risk_profile.get('detected_patterns', [])
        if patterns:
            summary.append("PATTERNS DETECTED:")
            for p in patterns:
                summary.append(f"  - {p.get('pattern_name')} (Confidence: {p.get('confidence_score')}%)")
            summary.append("")

        summary.append("Detailed analysis, evidence inventory, and forensic integrity audit follow.")

        return "\n".join(summary)

    def identify_defendants(self, fields: Dict[str, Any], flags: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Identify potential defendants."""
        defendants = []

        # Furnisher/Collector
        furnisher = fields.get('furnisher_or_collector') or fields.get('creditor_name')
        if furnisher:
            defendants.append({
                'name': furnisher,
                'type': 'Furnisher/Creditor',
                'potential_claims': 'FCRA § 1681s-2, FDCPA § 1692e (if debt collector)',
                'role': 'Reported allegedly inaccurate information to credit bureaus'
            })

        # Original creditor if different
        original = fields.get('original_creditor')
        if original and original != furnisher:
            defendants.append({
                'name': original,
                'type': 'Original Creditor',
                'potential_claims': 'FCRA § 1681s-2(a)',
                'role': 'Original source of account information'
            })

        # Credit bureaus (always potential defendants in FCRA cases)
        for bureau in ['Experian', 'Equifax', 'TransUnion']:
            defendants.append({
                'name': bureau,
                'type': 'Credit Reporting Agency',
                'potential_claims': 'FCRA § 1681e(b), § 1681i',
                'role': 'Published credit report containing allegedly inaccurate information'
            })

        return defendants

    def build_evidence_items(
        self,
        flags: List[Dict[str, Any]],
        fields: Dict[str, Any],
        timeline_data: List[Dict] = None
    ) -> List[EvidenceItem]:
        """Build list of evidence items."""
        items = []
        item_num = 1

        # Credit report itself
        items.append(EvidenceItem(
            item_number=item_num,
            category='document',
            title='Credit Report Extract',
            description='The credit report section showing the disputed tradeline',
            source='Consumer credit file',
            date_obtained=datetime.now().strftime('%Y-%m-%d'),
            relevance='Primary evidence of the reported information being disputed',
            exhibits_reference=self._next_exhibit('document')
        ))
        item_num += 1

        # For each high severity flag, add evidence item
        for flag in flags:
            if flag.get('severity') == 'high':
                items.append(EvidenceItem(
                    item_number=item_num,
                    category='calculation',
                    title=f"Analysis: {flag.get('rule_name')}",
                    description=flag.get('explanation', ''),
                    source='Automated rule engine analysis',
                    date_obtained=datetime.now().strftime('%Y-%m-%d'),
                    relevance=flag.get('why_it_matters', ''),
                    exhibits_reference=self._next_exhibit('calculation')
                ))
                item_num += 1

        # Timeline evidence if available
        if timeline_data and len(timeline_data) >= 2:
            items.append(EvidenceItem(
                item_number=item_num,
                category='timeline',
                title='Timeline Comparison Analysis',
                description=f'Comparison of {len(timeline_data)} credit reports over time showing date changes',
                source='Historical credit report comparison',
                date_obtained=datetime.now().strftime('%Y-%m-%d'),
                relevance='Demonstrates manipulation of dates across reporting periods',
                exhibits_reference=self._next_exhibit('timeline')
            ))
            item_num += 1

        return items

    def build_timeline(self, fields: Dict[str, Any], flags: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Build timeline of events."""
        timeline = []

        # Date opened
        if fields.get('date_opened'):
            timeline.append({
                'date': fields['date_opened'],
                'event': 'Account Opened',
                'significance': 'Original account opening date as reported'
            })

        # DOFD
        if fields.get('dofd'):
            timeline.append({
                'date': fields['dofd'],
                'event': 'Date of First Delinquency (DOFD)',
                'significance': 'Critical date for 7-year reporting clock under FCRA § 1681c'
            })

        # Charge off date
        if fields.get('charge_off_date'):
            timeline.append({
                'date': fields['charge_off_date'],
                'event': 'Account Charged Off',
                'significance': 'Date creditor wrote off the debt'
            })

        # Last payment
        if fields.get('date_last_payment'):
            timeline.append({
                'date': fields['date_last_payment'],
                'event': 'Last Payment Received',
                'significance': 'May affect statute of limitations calculations'
            })

        # Report date
        if fields.get('date_reported_or_updated'):
            timeline.append({
                'date': fields['date_reported_or_updated'],
                'event': 'Last Reported to Bureaus',
                'significance': 'Most recent furnisher reporting date'
            })

        # Analysis date
        timeline.append({
            'date': datetime.now().strftime('%Y-%m-%d'),
            'event': 'Violations Analyzed',
            'significance': f'{len(flags)} potential violations identified'
        })

        # Sort by date
        timeline.sort(key=lambda x: x['date'] if x['date'] else '9999-99-99')

        return timeline

    def get_applicable_statutes(self, flags: List[Dict[str, Any]]) -> List[LegalCitation]:
        """Determine applicable statutes based on violations."""
        citations = []

        # Always include core FCRA provisions
        citations.append(LegalCitation(
            statute='FCRA',
            section='15 U.S.C. § 1681e(b)',
            title='Accuracy of Consumer Reports',
            full_text='Whenever a consumer reporting agency prepares a consumer report it shall follow reasonable procedures to assure maximum possible accuracy of the information concerning the individual about whom the report relates.',
            relevance_to_case='CRA failed to maintain accurate information about the consumer'
        ))

        citations.append(LegalCitation(
            statute='FCRA',
            section='15 U.S.C. § 1681s-2(a)(1)(A)',
            title='Duty to Provide Accurate Information',
            full_text='A person shall not furnish any information relating to a consumer to any consumer reporting agency if the person knows or has reasonable cause to believe that the information is inaccurate.',
            relevance_to_case='Furnisher reported information known or believed to be inaccurate'
        ))

        # Check for re-aging violations
        reaging_rules = ['A1', 'A2', 'B1', 'B2', 'K6']
        if any(f.get('rule_id') in reaging_rules for f in flags):
            citations.append(LegalCitation(
                statute='FCRA',
                section='15 U.S.C. § 1681c(a)',
                title='7-Year Reporting Limitation',
                full_text='No consumer reporting agency may make any consumer report containing... accounts placed for collection or charged to profit and loss which antedate the report by more than seven years.',
                relevance_to_case='Date manipulation appears designed to extend the 7-year reporting period'
            ))

        # Check for collection account issues
        if any(f.get('rule_id', '').startswith('J') for f in flags):
            citations.append(LegalCitation(
                statute='FDCPA',
                section='15 U.S.C. § 1692e(2)(A)',
                title='False Representation of Character of Debt',
                full_text='A debt collector may not use any false, deceptive, or misleading representation... The false representation of the character, amount, or legal status of any debt.',
                relevance_to_case='Collector may be misrepresenting the age or status of the debt'
            ))

        return citations

    def assess_impact(self, flags: List[Dict[str, Any]], risk_profile: Dict[str, Any]) -> List[ViolationImpact]:
        """Assess technical and statutory impact of violations."""
        impacts = []

        high_count = len([f for f in flags if f.get('severity') == 'high'])
        critical_failure = risk_profile.get('litigation_potential', False) or high_count >= 2

        if critical_failure:
            # Impact of systemic/willful violations
            impacts.append(ViolationImpact(
                category='Civil Liability (Willful)',
                description='Potential for enforcement action due to willful FCRA violations',
                severity='Critical',
                basis=f'Detected {high_count} high-severity violations indicating systemic failure',
                statutory_reference='15 U.S.C. § 1681n(a)(1)(A)'
            ))

            impacts.append(ViolationImpact(
                category='Civil Accountability',
                description='Exposure to regulatory scrutiny and enforcement for reckless disregard',
                severity='High',
                basis='Egregious conduct or reckless disregard of Metro2/FCRA requirements',
                statutory_reference='15 U.S.C. § 1681n(a)(2)'
            ))
        else:
            # Impact of negligent violations
            impacts.append(ViolationImpact(
                category='Liability (Negligence)',
                description='Technical errors resulting in inaccurate data reporting',
                severity='Moderate',
                basis='Failure to maintain reasonable procedures for accuracy',
                statutory_reference='15 U.S.C. § 1681o(a)(1)'
            ))

        # Attorney fees
        impacts.append(ViolationImpact(
            category='Legal Fee Recovery',
            description='Mandatory recovery of reasonable attorneys fees and litigation costs',
            severity='N/A',
            basis='Fee-shifting provisions for successful consumer protection actions',
            statutory_reference='15 U.S.C. § 1681n(a)(3) / § 1681o(a)(2)'
        ))

        return impacts

    def build_chain_of_custody(self, fields: Dict[str, Any], flags: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Construct a forensic chain of custody for the debt."""
        chain = []
        oc = fields.get('original_creditor')
        furnisher = fields.get('furnisher_or_collector')
        
        if oc:
            chain.append({
                'entity': oc, 
                'role': 'Original Creditor', 
                'significance': 'Debt Originator / Account Source'
            })
            
        if furnisher and furnisher != oc:
            chain.append({
                'entity': furnisher, 
                'role': 'Current Holder / Servicer', 
                'significance': 'Assignee responsible for accuracy'
            })
            
        return chain

    def run_integrity_checks(self, flags: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Perform forensic data integrity verification."""
        checks = []
        
        # Check 1: Timeline Consistency
        timeline_fails = [f for f in flags if f.get('rule_id', '').startswith('B') or f.get('rule_id', '').startswith('A')]
        checks.append({
            'test': 'Temporal Consistency Audit',
            'result': 'CRITICAL FAILURE' if timeline_fails else 'PASSED',
            'detail': f"Detected {len(timeline_fails)} evidence-grade timeline re-aging indicators." if timeline_fails else "No chronological anomalies detected."
        })
        
        # Check 2: Regulatory Logic
        metro2_fails = [f for f in flags if f.get('rule_id', '').startswith('M')]
        checks.append({
            'test': 'Metro2 Structural Integrity',
            'result': 'SYSTEMIC FAILURE' if metro2_fails else 'PASSED',
            'detail': f"Identified {len(metro2_fails)} illogical status-to-code mapping variations." if metro2_fails else "Compliant with Metro2 data standards."
        })
        
        return checks

    def build_packet(
        self,
        case_id: str,
        consumer_info: Dict[str, str],
        fields: Dict[str, Any],
        flags: List[Dict[str, Any]],
        risk_profile: Dict[str, Any] = None,
        timeline_data: List[Dict] = None
    ) -> EvidencePacket:
        """Build complete evidence packet."""

        # Identify causes of action
        causes = []
        if any(f.get('severity') == 'high' for f in flags):
            causes.append('FCRA § 1681e(b) - Failure to Assure Accuracy')
            causes.append('FCRA § 1681s-2(a) - Furnishing Inaccurate Information')
        if any(f.get('rule_id', '').startswith('B') or f.get('rule_id') == 'K6' for f in flags):
            causes.append('FCRA § 1681c - Violation of Reporting Time Limits')
        if any(f.get('rule_id', '').startswith('J') for f in flags):
            causes.append('FDCPA § 1692e - False or Misleading Representations')

        # Build key violations list
        key_violations = [f.get('rule_name') for f in flags if f.get('severity') == 'high']

        packet = EvidencePacket(
            case_id=case_id,
            prepared_date=datetime.now().strftime('%Y-%m-%d'),
            consumer_name=consumer_info.get('name', 'Consumer'),
            consumer_state=consumer_info.get('state', 'Unknown'),
            executive_summary=self.generate_executive_summary(flags, risk_profile or {}, fields),
            key_violations=key_violations,
            recommended_causes_of_action=causes,
            defendants=self.identify_defendants(fields, flags),
            evidence_items=self.build_evidence_items(flags, fields, timeline_data),
            timeline_of_events=self.build_timeline(fields, flags),
            applicable_statutes=self.get_applicable_statutes(flags),
            impact_assessment=self.assess_impact(flags, risk_profile or {}),
            chain_of_custody=self.build_chain_of_custody(fields, flags),
            integrity_checks=self.run_integrity_checks(flags),
            raw_flags=flags,
            risk_profile=risk_profile or {}
        )

        return packet


def render_evidence_builder(st):
    """Render the Evidence Packet Builder UI."""

    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Evidence Packet Builder</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            Generate comprehensive evidence packages for attorney review and legal proceedings.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.warning("""
    **For Attorney Use:** This evidence packet is designed for legal professionals evaluating
    potential FCRA, FDCPA, or state law claims. It is not legal advice.
    """)

    # Check for case data
    flags = st.session_state.get('rule_flags', [])
    fields = st.session_state.get('editable_fields', {})
    risk_profile = st.session_state.get('risk_profile', {})
    consumer_info = st.session_state.get('consumer_info', {})
    timeline_data = st.session_state.get('timeline_entries', [])

    if not flags:
        st.info("""
        **No case data available.**

        To generate an evidence packet:
        1. Go to "Check One Report" mode
        2. Upload and analyze a credit report
        3. Return here after violations are detected
        """)
        return

    # Display case overview
    st.markdown("### Case Overview")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Violations Detected", len(flags))
    with col2:
        high_count = len([f for f in flags if f.get('severity') == 'high'])
        st.metric("High Severity", high_count)
    with col3:
        if risk_profile:
            st.metric("Case Strength", f"{risk_profile.get('overall_score', 0)}/100")

    st.markdown("---")

    # Consumer information for packet
    st.markdown("### Consumer Information")
    col1, col2 = st.columns(2)
    with col1:
        consumer_name = st.text_input("Consumer Name", value=consumer_info.get('name', ''))
    with col2:
        consumer_state = st.text_input("State", value=consumer_info.get('state', ''))

    # Generate packet
    st.markdown("---")

    if st.button("Generate Evidence Packet", type="primary", use_container_width=True):
        with st.spinner("Building evidence packet..."):
            builder = EvidenceBuilder()

            # Get verified fields
            verified_fields = {k: v.get('value') if isinstance(v, dict) else v
                             for k, v in fields.items()}

            # Generate case ID
            import secrets
            case_id = f"EVD_{secrets.token_hex(4).upper()}"

            packet = builder.build_packet(
                case_id=case_id,
                consumer_info={'name': consumer_name, 'state': consumer_state},
                fields=verified_fields,
                flags=flags,
                risk_profile=risk_profile,
                timeline_data=timeline_data if len(timeline_data) >= 2 else None
            )

            st.session_state.evidence_packet = packet

    # Display generated packet
    if 'evidence_packet' in st.session_state:
        packet = st.session_state.evidence_packet

        st.success(f"Evidence Packet Generated: {packet.case_id}")

        # Executive Summary
        st.markdown("### Executive Summary")
        st.markdown(f"""
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; white-space: pre-wrap; font-family: monospace; font-size: 0.85rem;">
{packet.executive_summary}
        </div>
        """, unsafe_allow_html=True)

        # Recommendations
        st.markdown("### Recommended Causes of Action")
        for cause in packet.recommended_causes_of_action:
            st.markdown(f"- {cause}")

        # Forensic Data Integrity
        st.markdown("---")
        st.markdown("### Forensic Data Integrity Checks")
        cols = st.columns(len(packet.integrity_checks))
        for i, check in enumerate(packet.integrity_checks):
            color = "#16a34a" if "PASSED" in check['result'] else "#dc2626"
            cols[i].markdown(f"""
            <div style="background: white; border: 1px solid #e2e8f0; border-top: 4px solid {color}; border-radius: 8px; padding: 12px; height: 100%;">
                <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 600;">{check['test']}</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: {color}; margin: 4px 0;">{check['result']}</div>
                <div style="font-size: 0.8rem; color: #1e293b;">{check['detail']}</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("### Forensic Chain of Custody")
        for step in packet.chain_of_custody:
            st.markdown(f"""
            <div style="background: #f1f5f9; border-radius: 6px; padding: 10px; margin-bottom: 6px; border-left: 3px solid #64748b;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 600;">{step['entity']}</span>
                    <span style="font-size: 0.75rem; color: #475569; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">{step['role']}</span>
                </div>
                <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">{step['significance']}</div>
            </div>
            """, unsafe_allow_html=True)

        # Defendants
        st.markdown("### Potential Defendants")
        for defendant in packet.defendants:
            with st.expander(f"{defendant['name']} ({defendant['type']})"):
                st.markdown(f"**Potential Claims:** {defendant['potential_claims']}")
                st.markdown(f"**Role:** {defendant['role']}")

        # Evidence Inventory
        st.markdown("### Evidence Inventory")
        for item in packet.evidence_items:
            st.markdown(f"""
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between;">
                    <strong>{item.exhibits_reference}: {item.title}</strong>
                    <span style="color: #64748b; font-size: 0.8rem;">{item.category.upper()}</span>
                </div>
                <div style="font-size: 0.85rem; color: #475569; margin-top: 4px;">{item.description}</div>
            </div>
            """, unsafe_allow_html=True)

        # Timeline
        st.markdown("### Timeline of Events")
        for event in packet.timeline_of_events:
            st.markdown(f"**{event['date']}** - {event['event']}")
            st.markdown(f"  _{event['significance']}_")

        # Applicable Statutes
        st.markdown("### Applicable Statutes")
        for citation in packet.applicable_statutes:
            with st.expander(f"{citation.section} - {citation.title}"):
                st.markdown(f"**Full Text:**\n> {citation.full_text}")
                st.markdown(f"**Relevance:** {citation.relevance_to_case}")

        # Impact Assessment
        st.markdown("### Statutory Impact Assessment")
        for impact in packet.impact_assessment:
            st.markdown(f"""
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                <strong>{impact.category}</strong>
                <div style="font-size: 0.85rem; color: #92400e;">{impact.description}</div>
                <div style="font-size: 0.8rem; color: #78350f; margin-top: 4px;">
                    Severity: {impact.severity}<br>
                    Basis: {impact.basis}<br>
                    Reference: {impact.statutory_reference}
                </div>
            </div>
            """, unsafe_allow_html=True)

        # Download options
        st.markdown("---")
        st.markdown("### Export Options")

        col1, col2 = st.columns(2)
        with col1:
            # JSON export
            packet_json = json.dumps(packet.to_dict(), indent=2, default=str)
            st.download_button(
                "Download as JSON",
                packet_json,
                file_name=f"evidence_packet_{packet.case_id}.json",
                mime="application/json",
                use_container_width=True
            )

        with col2:
            # Text export
            text_export = generate_text_export(packet)
            st.download_button(
                "Download as Text",
                text_export,
                file_name=f"evidence_packet_{packet.case_id}.txt",
                mime="text/plain",
                use_container_width=True
            )


def generate_text_export(packet: EvidencePacket) -> str:
    """Generate plain text export of evidence packet."""
    lines = []
    lines.append("=" * 70)
    lines.append("EVIDENCE PACKET FOR ATTORNEY REVIEW")
    lines.append("=" * 70)
    lines.append("")
    lines.append(f"Case ID: {packet.case_id}")
    lines.append(f"Prepared: {packet.prepared_date}")
    lines.append(f"Consumer: {packet.consumer_name}")
    lines.append(f"State: {packet.consumer_state}")
    lines.append("")
    lines.append("-" * 70)
    lines.append("EXECUTIVE SUMMARY")
    lines.append("-" * 70)
    lines.append(packet.executive_summary)
    lines.append("")
    lines.append("-" * 70)
    lines.append("RECOMMENDED CAUSES OF ACTION")
    lines.append("-" * 70)
    for cause in packet.recommended_causes_of_action:
        lines.append(f"  * {cause}")
    lines.append("")
    lines.append("-" * 70)
    lines.append("POTENTIAL DEFENDANTS")
    lines.append("-" * 70)
    for defendant in packet.defendants:
        lines.append(f"\n{defendant['name']} ({defendant['type']})")
        lines.append(f"  Claims: {defendant['potential_claims']}")
        lines.append(f"  Role: {defendant['role']}")
    lines.append("")
    lines.append("-" * 70)
    lines.append("FORENSIC INTEGRITY AUDIT")
    lines.append("-" * 70)
    for check in packet.integrity_checks:
        lines.append(f"[{check['result']}] {check['test']}")
        lines.append(f"  Finding: {check['detail']}")
    lines.append("")
    lines.append("-" * 70)
    lines.append("FORENSIC CHAIN OF CUSTODY")
    lines.append("-" * 70)
    for step in packet.chain_of_custody:
        lines.append(f"{step['entity']} ({step['role']})")
        lines.append(f"  Significance: {step['significance']}")
    lines.append("")
    lines.append("-" * 70)
    lines.append("EVIDENCE INVENTORY")
    lines.append("-" * 70)
    for item in packet.evidence_items:
        lines.append(f"\n{item.exhibits_reference}: {item.title}")
        lines.append(f"  Category: {item.category}")
        lines.append(f"  Description: {item.description}")
        lines.append(f"  Relevance: {item.relevance}")
    lines.append("")
    lines.append("-" * 70)
    lines.append("TIMELINE OF EVENTS")
    lines.append("-" * 70)
    for event in packet.timeline_of_events:
        lines.append(f"{event['date']}: {event['event']}")
        lines.append(f"  Significance: {event['significance']}")
    lines.append("")
    lines.append("-" * 70)
    lines.append("APPLICABLE STATUTES")
    lines.append("-" * 70)
    for citation in packet.applicable_statutes:
        lines.append(f"\n{citation.section} - {citation.title}")
        lines.append(f"  {citation.full_text}")
        lines.append(f"  Relevance: {citation.relevance_to_case}")
    lines.append("")
    lines.append("-" * 70)
    lines.append("STATUTORY IMPACT ASSESSMENT")
    lines.append("-" * 70)
    for impact in packet.impact_assessment:
        lines.append(f"\n{impact.category}")
        lines.append(f"  {impact.description}")
        lines.append(f"  Severity: {impact.severity}")
        lines.append(f"  Basis: {impact.basis}")
        lines.append(f"  Reference: {impact.statutory_reference}")
    lines.append("")
    lines.append("=" * 70)
    lines.append("END OF EVIDENCE PACKET")
    lines.append("=" * 70)

    return "\n".join(lines)
