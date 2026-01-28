"""
`app` compatibility package.

This repository's Python/Streamlit code lives in `legacy/python-app/`, but many
entrypoints (Docker, scripts, tests) import from `app.*`.

To avoid duplicating code (and to keep the same codebase), we install an import
hook that maps `app.<module>` imports to files under `legacy/python-app/`.
"""

from ._legacy_importer import install_legacy_app_importer as _install

_install()

