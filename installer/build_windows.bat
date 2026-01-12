@echo off
REM Build script for Debt Re-Aging Case Factory Windows Installer
REM Run this script from the project root directory

echo ============================================================
echo   DEBT RE-AGING CASE FACTORY - Windows Build Script
echo ============================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check/Install PyInstaller
echo Checking PyInstaller...
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo Installing PyInstaller...
    pip install pyinstaller
)

REM Install project dependencies
echo.
echo Installing project dependencies...
pip install -r requirements.txt

REM Create output directories
echo.
echo Creating directories...
if not exist "output" mkdir output
if not exist "output\cases" mkdir output\cases
if not exist "output\packets" mkdir output\packets
if not exist "output\deadlines" mkdir output\deadlines
if not exist "output\analytics" mkdir output\analytics
if not exist "assets" mkdir assets

REM Build with PyInstaller
echo.
echo Building executable...
pyinstaller installer/debt_reaging.spec --clean --noconfirm

echo.
echo ============================================================
if exist "dist\DebtReagingCaseFactory\DebtReagingCaseFactory.exe" (
    echo   BUILD SUCCESSFUL!
    echo.
    echo   Executable location:
    echo   dist\DebtReagingCaseFactory\DebtReagingCaseFactory.exe
    echo.
    echo   To run the application:
    echo   1. Navigate to dist\DebtReagingCaseFactory
    echo   2. Double-click DebtReagingCaseFactory.exe
    echo   3. Open browser to http://localhost:8501
) else (
    echo   BUILD FAILED - Check error messages above
)
echo ============================================================
echo.

pause
