# Security Policy

CorpusGuard ships **offensive security tooling** (the QTPI attack engine and
multi-vector campaign runner in `corpusguard/attacks/`) alongside its defensive
Memory Hygiene Layer. Please read the responsible-use terms before using it.

## Responsible use

- **Authorized targets only.** Run the attack modules only against RAG systems
  you own or have **explicit written permission** to test. Unauthorized testing
  of systems you do not control is illegal in most jurisdictions.
- **Simulation by default.** The attack modules default to `simulate=True` and
  produce no traffic against any real system. Live execution
  (`--no-simulate`) is intentionally gated behind an interactive authorization
  confirmation and is not implemented against arbitrary targets.
- **Research and defense framing.** CorpusGuard exists for academic
  reproducibility of SSRN 6734225 and to help defenders deploy the MHL. Do not
  use it to develop or deliver attacks against third parties.
- **No enhancement of offensive capability.** Contributions that increase attack
  effectiveness, add evasion, or broaden targeting will not be accepted. Bug
  fixes and defensive improvements are welcome.

## Reporting a vulnerability

If you discover a security vulnerability **in CorpusGuard itself** (not in a
system you scanned with it):

1. **Do not** open a public GitHub issue for it.
2. Email **ondiekifrank021@gmail.com** with:
   - a description of the issue and its impact,
   - steps to reproduce (or a proof of concept),
   - the affected version/commit.
3. Please allow up to **14 days** for an initial response and coordinated
   remediation before any public disclosure.

Do **not** include third-party credentials, customer data, or live target
details in your report.

## Supported versions

CorpusGuard is pre-1.0 research software. Only the latest `main` /
tagged release receives fixes.

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ |
| < 0.1   | ❌ |
