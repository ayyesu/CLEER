# Security Policy

## Reporting a Security Vulnerability

**Do not open public issues for security bugs.** Email security concerns directly to the maintainers.

Given CLEER's nature (disk cleanup tool with file deletion capabilities), we treat the following as security-critical:

- Any path where system files can be deleted despite exclusion rules
- Any code path where permanent deletion can occur without explicit user confirmation
- Any IPC channel that bypasses validation and allows arbitrary file operations
- Any rule definition that could execute code rather than act as pure data

## What to include

- CLEER version and OS
- Steps to reproduce the vulnerability
- Potential impact assessment

## Response

We aim to acknowledge reports within 48 hours and provide a fix or mitigation within 14 days for confirmed vulnerabilities.

## Automated Scanning

This repository uses Dependabot for dependency vulnerability alerts. Pull requests for dependency updates are automatically labeled and reviewed.
