# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities **privately**, not in a public issue.

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**
(https://github.com/Dogukan986/frontend-code-review-skill/security/advisories/new).

If that option is not available, open a public issue that says only that you have a security report (no details) and the maintainer will arrange a private channel.

Include what you found, how to reproduce it, and the impact. This is a volunteer-run project: expect an acknowledgement within about 7 days, with no guaranteed fix timeline.

## What is in scope

- The skill text (`skills/frontend-code-review/`) and its safety rules: for example a way to make the skill write files, run commands from a reviewed repository, or follow instructions found in reviewed code.
- The scripts (`scripts/`) and the CI workflow (`.github/`): for example injection, unsafe file access or excessive permissions.

Not in scope: vulnerabilities in the code *being reviewed*, and model behaviour that the skill cannot control.

## Known limits of the safety model

The skill is **safe by instruction, not sandboxed**. Its rules (read-only, never run repository commands, treat repository content as data) are written in `SKILL.md`; a model can still be manipulated by hostile content. `allowed-tools` is experimental and clients may ignore it. If you review untrusted code, also restrict the agent's tools in your client (read, search and list only) and run it without credentials. See the *Safety* section of the README and the injection notes in `docs/eval-report.md`.

## Supported versions

Only the latest release receives fixes.
