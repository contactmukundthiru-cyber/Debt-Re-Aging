#!/usr/bin/env python3
"""
Debt Re-Aging Case Factory Launcher
Starts the Streamlit application server.

This script is used by PyInstaller to create a standalone executable.
"""

import sys
import os
from pathlib import Path

def get_app_path():
    """Get the application path, handling both dev and frozen (PyInstaller) modes."""
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        return Path(sys._MEIPASS)
    else:
        # Running as script
        return Path(__file__).parent


def main():
    """Launch the Streamlit application."""
    app_path = get_app_path()
    main_script = app_path / 'app' / 'main.py'

    # Set up environment
    os.environ['STREAMLIT_SERVER_HEADLESS'] = 'true'
    os.environ['STREAMLIT_BROWSER_GATHER_USAGE_STATS'] = 'false'

    # Check if running frozen (PyInstaller)
    if getattr(sys, 'frozen', False):
        # Add app path to Python path
        sys.path.insert(0, str(app_path))

        print("=" * 60)
        print("  DEBT RE-AGING CASE FACTORY")
        print("  Timeline Inconsistency Detection & Dispute Generator")
        print("=" * 60)
        print()
        print(f"Starting server...")
        print(f"Application path: {app_path}")
        print()

    # Import and run Streamlit
    try:
        from streamlit.web import cli as stcli

        sys.argv = [
            "streamlit",
            "run",
            str(main_script),
            "--server.port=8501",
            "--server.address=localhost",
            "--theme.base=dark",
            "--browser.gatherUsageStats=false",
        ]

        print("Opening browser at http://localhost:8501")
        print("Press Ctrl+C to stop the server")
        print()

        sys.exit(stcli.main())

    except ImportError as e:
        print(f"Error: Streamlit not found. Please install it: pip install streamlit")
        print(f"Details: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error starting application: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
