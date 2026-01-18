"""
Main dashboard UI for case management and metrics overview.
"""
import streamlit as st
import pandas as pd
from app.metrics import MetricsTracker

def render_metrics_dashboard():
    """
    Render the Metrics Dashboard UI.
    
    Loads aggregate case data from the local MetricsTracker and displays
    visualizations including issue distribution, bureau statistics, and
    a list of recent cases.
    """
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Your Statistics</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            See how many cases you've processed and what issues were found.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
    st.markdown("""
    **Summary of All Cases**
    These statistics are from cases processed on this computer. All data stays local and private.
    """)

    tracker = MetricsTracker()
    summary = tracker.get_summary()

    if not summary:
        st.info("No cases processed yet. Analyze a credit report to see statistics here.")
        st.markdown('</div>', unsafe_allow_html=True)
        return

    col1, col2, col3 = st.columns(3)
    col1.metric("Cases Processed", summary['total_cases'])
    col2.metric("Issues Found", f"{summary['flag_rate_percent']:.1f}%")
    col3.metric("Avg. Text Quality", f"{summary['avg_extraction_quality']:.1f}/100")
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Flags distribution
    st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
    st.subheader("Issues by Type")
    dist = summary.get('flag_distribution', {})
    if dist:
        df = pd.DataFrame(list(dist.items()), columns=['Rule', 'Count'])
        st.bar_chart(df.set_index('Rule'), color="#2563eb")
    else:
        st.info("No issues detected yet.")
    st.markdown('</div>', unsafe_allow_html=True)

    # Bureau and Account Type
    c1, c2 = st.columns(2)
    with c1:
        st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
        st.subheader("By Credit Bureau")
        b_dist = summary.get('bureau_distribution', {})
        if b_dist:
            df_b = pd.DataFrame(list(b_dist.items()), columns=['Bureau', 'Count'])
            st.bar_chart(df_b.set_index('Bureau'), color="#059669")
        else:
            st.info("No bureau data yet.")
        st.markdown('</div>', unsafe_allow_html=True)

    with c2:
        st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
        st.subheader("By Account Type")
        a_dist = summary.get('account_type_distribution', {})
        if a_dist:
            df_a = pd.DataFrame(list(a_dist.items()), columns=['Type', 'Count'])
            st.bar_chart(df_a.set_index('Type'), color="#d97706")
        else:
            st.info("No account type data yet.")
        st.markdown('</div>', unsafe_allow_html=True)


    # Recent cases table
    st.markdown('<div class="forensic-card">', unsafe_allow_html=True)
    st.subheader("Recent Cases")
    recent = tracker.get_recent_cases(10)
    if recent:
        df_recent = pd.DataFrame(recent)
        cols = ['case_id', 'timestamp', 'bureau', 'account_type', 'flags_identified', 'extraction_quality']
        st.dataframe(df_recent[cols], use_container_width=True)

        if st.button("Export to CSV", use_container_width=True, type="primary"):
            csv_path = tracker.export_csv()
            with open(csv_path, 'rb') as f:
                st.download_button(
                    "Download CSV",
                    f,
                    file_name="credit_report_analysis_data.csv",
                    mime="text/csv",
                    use_container_width=True
                )
    else:
        st.info("No recent cases to display.")
    st.markdown('</div>', unsafe_allow_html=True)
