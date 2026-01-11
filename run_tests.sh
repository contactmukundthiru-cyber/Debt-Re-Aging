#!/bin/bash
# Script to run all tests for the Debt Re-Aging Case Factory

echo "Running Logic Tests..."
python3 -m pytest tests/test_logic.py -v

echo -e "\nRunning Rule Engine Coverage..."
python3 -m pytest tests/test_logic.py --cov=app/rules --cov=app/utils
