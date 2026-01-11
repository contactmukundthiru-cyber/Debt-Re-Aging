# Pilot Guide for Organizations

This guide helps legal aid organizations and consumer advocacy groups pilot the Debt Re-Aging Case Factory.

## Installation
**Docker (Recommended):** Use `docker-compose up`. This provides a secure, offline, and rootless environment.

## Phase 1: Familiarization
- **System Health**: Check the "🔍 System Health Check" in the Help section to ensure OCR is active.
- **Privacy Mode**: Toggle "Privacy Mode" in the sidebar when reviewing cases in shared environments.
- **Sample Mode**: Use the built-in samples to understand how Rule B1 and A1 flags trigger.

## Phase 2: Testing & Metrics
- **Metrics Dashboard**: After processing 5-10 cases, visit the "Metrics Dashboard" to view aggregate flag rates and export your organization's data to CSV.
- **Case Persistence**: Use the "Export Case" feature to save complex cases for review by senior attorneys without sharing the original PII-heavy documents.

## Phase 3: Developer Verification
Technical staff can verify the core logic by running:
```bash
./run_tests.sh
```
This ensures the date arithmetic and rule engine are performing as expected on the local hardware.

## Feedback
Submit feedback and edge cases to `contactmukundthiru1@gmail.com`.

*Pilot Guide Version: 1.1.0*
