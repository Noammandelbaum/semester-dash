# Security Policy

## Reporting a Vulnerability

If you believe you have found a security vulnerability in SemesterDash, we encourage you to let us know right away. We will investigate all legitimate reports and do our best to quickly fix the problem.

**Please report security vulnerabilities to:** noam.mandelbaum@gmail.com

### What to Include in Your Report

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Varies based on severity (P0: 24-48h, P1: 1 week, P2: 1 month)

## Security Features

SemesterDash implements industry-standard security practices:

- **Authentication:** OAuth 2.0 via Google (NextAuth.js v5)
- **Transport Security:** HTTPS enforced (all traffic encrypted)
- **Data Protection:** Secure session management with httpOnly cookies
- **Database Security:** Parameterized queries via Prisma ORM
- **XSS Protection:** React automatic output escaping
- **Dependency Management:** Regular security audits and updates

## Out of Scope

The following are **not** considered security vulnerabilities:

- Denial of Service (DoS) attacks
- Social engineering attacks
- Physical attacks
- Issues requiring physical access to user devices
- Reports from automated tools without proof of exploitability
- Issues in third-party dependencies (report to the dependency maintainers)

## Responsible Disclosure

We ask that you:

- Give us reasonable time to investigate and fix the issue before public disclosure
- Do not access or modify other users' data
- Do not perform attacks that could harm the availability or integrity of our services
- Act in good faith to avoid privacy violations and data destruction

## Recognition

We appreciate the security research community's efforts. Security researchers who responsibly disclose vulnerabilities will be:

- Acknowledged in our release notes (unless you prefer to remain anonymous)
- Kept informed of the fix progress
- Notified when the fix is deployed

Thank you for helping keep SemesterDash and our users safe!

---

**Last Updated:** 2025-11-25
