# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller Specification for Debt Re-Aging Case Factory
Builds a standalone Windows executable with all dependencies bundled.

Usage:
    1. Install PyInstaller: pip install pyinstaller
    2. Run from project root: pyinstaller installer/debt_reaging.spec
    3. Find executable in dist/DebtReagingCaseFactory/

Note: The Streamlit app requires a launcher script since Streamlit
      runs as a server. This spec creates the launcher.
"""

import sys
from pathlib import Path

block_cipher = None

# Project paths
project_root = Path(SPECPATH).parent
app_dir = project_root / 'app'
output_dir = project_root / 'output'
templates_dir = project_root / 'templates'
samples_dir = project_root / 'samples'

# Collect all Python files from app directory
app_files = [(str(f), 'app') for f in app_dir.glob('*.py')]
ui_files = [(str(f), 'app/ui') for f in (app_dir / 'ui').glob('*.py') if (app_dir / 'ui').exists()]

a = Analysis(
    [str(project_root / 'launcher.py')],
    pathex=[str(project_root)],
    binaries=[],
    datas=[
        # Application code
        (str(app_dir), 'app'),
        # Templates
        (str(templates_dir), 'templates') if templates_dir.exists() else (None, None),
        # Sample files
        (str(samples_dir), 'samples') if samples_dir.exists() else (None, None),
        # Streamlit config
        (str(project_root / '.streamlit'), '.streamlit') if (project_root / '.streamlit').exists() else (None, None),
    ],
    hiddenimports=[
        # Streamlit and dependencies
        'streamlit',
        'streamlit.web.cli',
        'streamlit.runtime.scriptrunner',
        'altair',
        'pandas',
        'numpy',

        # OCR dependencies
        'pytesseract',
        'pdf2image',
        'PIL',
        'PIL.Image',

        # PDF processing
        'fitz',
        'pymupdf',

        # Document generation
        'docx',
        'python-docx',

        # Web/API
        'flask',
        'werkzeug',

        # Utilities
        'rapidfuzz',
        'thefuzz',
        'psutil',
        'chardet',

        # App modules
        'app.main',
        'app.parser',
        'app.rules',
        'app.generator',
        'app.extraction',
        'app.i18n',
        'app.settings',
        'app.case_manager',
        'app.deadlines',
        'app.analytics',
        'app.creditor_db',
        'app.multi_account',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'scipy',
        'notebook',
        'IPython',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# Filter out None entries from datas
a.datas = [(d, s, t) for d, s, t in a.datas if d is not None]

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='DebtReagingCaseFactory',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # Keep console for Streamlit server output
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(project_root / 'assets' / 'icon.ico') if (project_root / 'assets' / 'icon.ico').exists() else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='DebtReagingCaseFactory',
)
