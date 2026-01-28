"""
Streamlit entrypoint wrapper.

This file exists to keep existing commands working:
- `streamlit run app/main.py`
- Dockerfile CMD

It executes the legacy Streamlit app located at `legacy/python-app/main.py`.
"""

from __future__ import annotations

from pathlib import Path
import runpy


def _legacy_main_path() -> Path:
    return (Path(__file__).resolve().parent.parent / "legacy" / "python-app" / "main.py").resolve()


if __name__ == "__main__":
    runpy.run_path(str(_legacy_main_path()), run_name="__main__")

