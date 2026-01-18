#!/bin/bash
# Script to run all tests for the Debt Re-Aging Case Factory

# Check if pytest is installed
if [ -f "venv/bin/pytest" ]; then
    PYTEST="venv/bin/pytest"
elif ! python3 -m pytest --version &> /dev/null; then
    echo "Error: pytest is not installed. Please run ./setup.sh or pip install pytest pytest-cov"
    exit 1
else
    PYTEST="python3 -m pytest"
fi

echo "Running All Tests..."
$PYTEST tests/ -v

echo -e "\nRunning Rule Engine Coverage..."
$PYTEST tests/ --cov=app
