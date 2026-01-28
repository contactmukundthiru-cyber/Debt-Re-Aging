"""
Import hook to map `app.*` to `legacy/python-app/*`.

Why:
- Existing scripts and Docker entrypoints reference `app/main.py`
- Tests import `app.*`
- The actual Python code is currently stored under `legacy/python-app/`

This keeps "same code, different path" without copying files.
"""

from __future__ import annotations

import importlib.abc
import importlib.util
import sys
from importlib.machinery import SourceFileLoader
from pathlib import Path
from types import ModuleType
from typing import Optional


LEGACY_ROOT = (Path(__file__).resolve().parent.parent / "legacy" / "python-app").resolve()


class _LegacyAppFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname: str, path, target=None):  # type: ignore[override]
        # Don't try to re-resolve the `app` package itself or our importer module.
        if fullname == "app" or fullname.startswith("app._legacy_importer"):
            return None

        if not fullname.startswith("app."):
            return None

        rel = fullname.split(".")[1:]  # drop "app"
        if not rel:
            return None

        candidate_dir = LEGACY_ROOT.joinpath(*rel)
        candidate_file = LEGACY_ROOT.joinpath(*rel).with_suffix(".py")

        # Package: legacy/<...>/__init__.py
        init_py = candidate_dir / "__init__.py"
        if init_py.is_file():
            loader = SourceFileLoader(fullname, str(init_py))
            return importlib.util.spec_from_file_location(
                fullname,
                str(init_py),
                loader=loader,
                submodule_search_locations=[str(candidate_dir)],
            )

        # Module: legacy/<...>.py
        if candidate_file.is_file():
            loader = SourceFileLoader(fullname, str(candidate_file))
            return importlib.util.spec_from_file_location(fullname, str(candidate_file), loader=loader)

        return None


_INSTALLED = False


def install_legacy_app_importer() -> None:
    """Install the finder once per process."""
    global _INSTALLED
    if _INSTALLED:
        return

    if not LEGACY_ROOT.exists():
        # Fail closed: if legacy code isn't present, don't silently mask errors.
        return

    # Prepend so it wins over other finders.
    sys.meta_path.insert(0, _LegacyAppFinder())
    _INSTALLED = True

