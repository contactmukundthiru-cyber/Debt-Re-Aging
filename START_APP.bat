@echo off
title Credit Report Analyzer

echo.
echo  ========================================
echo   CREDIT REPORT ANALYZER
echo   Starting application...
echo  ========================================
echo.

cd /d "%~dp0"

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed.
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

:: Check if dependencies are installed (check for streamlit)
python -c "import streamlit" >nul 2>&1
if errorlevel 1 (
    echo First time setup - installing dependencies...
    echo This may take a few minutes...
    echo.
    pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies.
        echo Please run: pip install -r requirements.txt
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

echo Opening application in your browser...
echo.
echo  ----------------------------------------
echo   The app will open at:
echo   http://localhost:8501
echo  ----------------------------------------
echo.
echo  To stop the app, close this window
echo   or press Ctrl+C
echo.

:: Start the app
streamlit run app/main.py --server.headless=true

pause
