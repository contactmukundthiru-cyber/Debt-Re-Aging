#!/bin/bash
# Script to run all tests for the Debt Re-Aging Case Factory

# Check if pytest is installed
if ! python3 -m pytest --version &> /dev/null; then
    echo "Error: pytest is not installed. Please run ./setup.sh or pip install pytest pytest-cov"
    exit 1
fi

echo "Running Logic Tests..."
python3 -m pytest tests/test_logic.py -v

echo -e "\nRunning Rule Engine Coverage..."
python3 -m pytest tests/test_logic.py --cov=app/rules --cov=app/utils
