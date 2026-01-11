# Contributing to Debt Re-Aging Case Factory

Thank you for your interest in contributing to the Debt Re-Aging Case Factory! This project aims to help consumers and advocacy organizations identify potential credit reporting violations.

## How to Contribute

### Reporting Bugs

If you find a bug, please open a GitHub issue with:

1. **Description**: Clear description of the problem
2. **Steps to Reproduce**: How to trigger the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Python version, browser
6. **Screenshots**: If applicable

### Suggesting Features

Feature requests are welcome! Please include:

1. **Use Case**: Who would use this and why?
2. **Description**: What should the feature do?
3. **Alternatives**: Other ways to solve this problem
4. **Priority**: How important is this for your workflow?

### Contributing Code

#### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/debt-reaging-case-factory.git
   ```
3. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Making Changes

1. Make your changes
2. Test thoroughly
3. Update documentation if needed
4. Commit with clear messages:
   ```bash
   git commit -m "Add feature: description of what it does"
   ```
5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. Open a Pull Request

#### Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Comment complex logic
- Keep functions focused and small

#### Testing

Before submitting:

1. Test the full workflow (upload → extract → parse → check → generate)
2. Test with sample cases
3. Test edge cases (empty fields, malformed dates, etc.)
4. Verify generated output is correct

### Contributing Documentation

Documentation improvements are always welcome:

- Fix typos or unclear explanations
- Add examples
- Improve the pilot guide
- Translate documentation

### Contributing Rules

To add new detection rules:

1. Review existing rules in `app/rules.py`
2. Document the rule thoroughly
3. Include:
   - Rule ID (following naming convention)
   - Clear description
   - Explanation of why it matters
   - Suggested evidence
   - Test cases showing when it triggers

## Areas of Focus

We especially need help with:

### Credit Report Formats

The parser needs to handle diverse formats:
- Different bureau layouts
- Various date formats
- Multiple languages
- Scanning artifacts

### Detection Rules

New rules for identifying:
- Additional re-aging patterns
- Other FCRA violations
- State-specific issues

### Accessibility

Making the tool more accessible:
- Screen reader compatibility
- Keyboard navigation
- High contrast modes
- Mobile responsiveness

### Testing

Expanding test coverage:
- Unit tests for core functions
- Integration tests for workflow
- Edge case handling
- Performance testing

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Focus on constructive feedback
- Accept criticism gracefully
- Put the community first

### Our Responsibilities

Maintainers will:
- Review contributions promptly
- Provide constructive feedback
- Help contributors succeed
- Enforce standards fairly

## Recognition

Contributors will be acknowledged in:
- The project README
- Release notes
- A CONTRIBUTORS file (for significant contributions)

## Questions?

If you have questions about contributing:
- Open a GitHub Discussion
- Email the maintainer at contactmukundthiru1@gmail.com
- Review existing issues and discussions

## Legal

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make credit reporting more transparent and fair!
