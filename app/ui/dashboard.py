import streamlit as st
import pandas as pd
from app.metrics import MetricsTracker

def render_metrics_dashboard():
    """Render the Metrics Dashboard UI with industrial styling."""
    st.markdown('<div class="step-header"><h2>📊 SYSTEM ANALYTICS DASHBOARD</h2></div>',
                unsafe_allow_html=True)
    
    st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
    st.markdown("""
    **AGGREGATE TELEMETRY**  
    Review statistics from locally processed forensic cases. All data is stored in the 
    `output/metrics/` directory and is never transmitted externally.
    """)
    
    tracker = MetricsTracker()
    summary = tracker.get_summary()
    
    if not summary:
        st.warning("NO DATA DETECTED: Process forensic cases to populate telemetry.")
        st.markdown('</div>', unsafe_allow_html=True)
        return
        
    col1, col2, col3 = st.columns(3)
    col1.metric("TOTAL_CASES", summary['total_cases'])
    col2.metric("ANOMALY_RATE", f"{summary['flag_rate_percent']:.1f}%")
    col3.metric("MEAN_OCR_QUAL", f"{summary['avg_extraction_quality']:.1f}/100")
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Flags distribution
    st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
    st.subheader("🛠️ ANOMALY DISTRIBUTION BY RULE_ID")
    dist = summary.get('flag_distribution', {})
    if dist:
        df = pd.DataFrame(list(dist.items()), columns=['Rule ID', 'Count'])
        st.bar_chart(df.set_index('Rule ID'), color="#2563eb")
    st.markdown('</div>', unsafe_allow_html=True)

    # Bureau and Account Type
    c1, c2 = st.columns(2)
    with c1:
        st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
        st.subheader("🏢 BY BUREAU")
        b_dist = summary.get('bureau_distribution', {})
        if b_dist:
            df_b = pd.DataFrame(list(b_dist.items()), columns=['Bureau', 'Count'])
            st.bar_chart(df_b.set_index('Bureau'), color="#059669")
        st.markdown('</div>', unsafe_allow_html=True)
    
    with c2:
        st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
        st.subheader("📁 BY ACCOUNT TYPE")
        a_dist = summary.get('account_type_distribution', {})
        if a_dist:
            df_a = pd.DataFrame(list(a_dist.items()), columns=['Type', 'Count'])
            st.bar_chart(df_a.set_index('Type'), color="#d97706")
        st.markdown('</div>', unsafe_allow_html=True)

    
    # Recent cases table
    st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
    st.subheader("📑 RECENT FORENSIC PAYLOADS")
    recent = tracker.get_recent_cases(10)
    if recent:
        df_recent = pd.DataFrame(recent)
        cols = ['case_id', 'timestamp', 'bureau', 'account_type', 'flags_identified', 'extraction_quality']
        st.dataframe(df_recent[cols], use_container_width=True)
        
        if st.button("EXPORT TELEMETRY TO CSV", use_container_width=True, type="primary"):
            csv_path = tracker.export_csv()
            with open(csv_path, 'rb') as f:
                st.download_button(
                    "📥 DOWNLOAD CSV DATA",
                    f,
                    file_name="debt_reaging_metrics.csv",
                    mime="text/csv",
                    use_container_width=True
                )
    st.markdown('</div>', unsafe_allow_html=True)
