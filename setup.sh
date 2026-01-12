#!/bin/bash
# Setup script for Debt Re-Aging Case Factory

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Debt Re-Aging Case Factory...${NC}"

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 is not installed.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo -e "Found Python ${PYTHON_VERSION}"

# Check for Tesseract OCR (required for image extraction)
if ! command -v tesseract &> /dev/null; then
    echo -e "${YELLOW}Warning: Tesseract OCR not found. OCR extraction from images will not work.${NC}"
    echo -e "${YELLOW}To install on Ubuntu/Debian: sudo apt-get install tesseract-ocr${NC}"
    echo -e "${YELLOW}To install on macOS: brew install tesseract${NC}"
fi

# Check for Docker permissions if docker is installed
if command -v docker &> /dev/null; then
    if ! docker ps &> /dev/null; then
        echo -e "${YELLOW}Warning: Docker detected but you don't have permissions or the daemon isn't running.${NC}"
        echo -e "${YELLOW}To fix permissions: sudo usermod -aG docker \$USER && newgrp docker${NC}"
        echo -e "${YELLOW}To start Docker (WSL/Linux): sudo service docker start${NC}"
    fi
fi

# Check for pip
if ! python3 -m pip --version &> /dev/null; then
    echo -e "${YELLOW}Warning: pip is not installed for python3.${NC}"
    echo -e "${YELLOW}Attempting to install pip...${NC}"
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python3 get-pip.py --user
    rm get-pip.py
fi

# Create virtual environment
if [ ! -d "venv" ]; then
    echo -e "Creating virtual environment..."
    python3 -m venv venv || {
        echo -e "${RED}Error: Failed to create virtual environment.${NC}"
        echo -e "${YELLOW}You might need to install python3-venv: sudo apt-get install python3-venv${NC}"
        exit 1
    }
fi

# Activate virtual environment and install dependencies
echo -e "Installing dependencies..."
source venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

# Create output directory
mkdir -p output

echo -e "${GREEN}Setup complete!${NC}"
echo -e "To start the application, run:"
echo -e "${YELLOW}source venv/bin/activate${NC}"
echo -e "${YELLOW}streamlit run app/main.py${NC}"
echo -e ""
echo -e "Or use the start script:"
echo -e "${YELLOW}./start.sh${NC}"
