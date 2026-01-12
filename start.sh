#!/bin/bash
# Start script for Debt Re-Aging Case Factory

if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Running setup first..."
    ./setup.sh
fi

source venv/bin/activate
streamlit run app/main.py
