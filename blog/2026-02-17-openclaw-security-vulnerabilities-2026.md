---
slug: openclaw-security-vulnerabilities-2026
title: "OpenClaw is a Security Nightmare — Here's the Safe Way to Run It"
description: "Complete timeline of every OpenClaw CVE, the ClawHavoc malware campaign, 42,000+ exposed instances, the Moltbook leak, and how to deploy safely."
authors: [dhaya]
tags: [openclaw, security, vulnerabilities, CVE, AI-agents, ClawHavoc, Moltbook]
image: /img/openclaw-security-og.png
date: 2026-02-17
keywords:
  - openclaw security
  - openclaw vulnerabilities
  - is openclaw safe
  - openclaw CVE 2026
  - clawhavoc malware
  - moltbook data breach
  - openclaw exposed instances
  - openclaw hardening guide
---

**OpenClaw, the open-source AI agent that rocketed to 179,000 GitHub stars and triggered a Mac mini shortage, is riddled with critical vulnerabilities that have already been exploited in the wild.** A one-click remote code execution flaw, 341 malware-laden skills on its marketplace, over 42,000 exposed instances on the public internet, and a vibe-coded social network that leaked 1.5 million API tokens — this is not a theoretical risk. Security researchers, government agencies, and firms from Cisco to Kaspersky have called it one of the most dangerous consumer AI deployments ever released. Yet OpenClaw remains genuinely useful. The solution is not to avoid it entirely but to run it on an isolated cloud VM where its blast radius is contained. Here's every documented vulnerability, and the exact steps to deploy it safely.

<!--truncate-->

## Table of Contents

- [From weekend project to 179,000 stars in weeks](#from-weekend-project-to-179000-stars-in-weeks)
- [Every documented CVE and security advisory](#every-documented-cve-and-security-advisory)
- [341 malicious skills turned ClawHub into a malware bazaar](#341-malicious-skills-turned-clawhub-into-a-malware-bazaar)
- [Over 42,000 instances exposed on the open internet](#over-42000-instances-exposed-on-the-open-internet)
- [Prompt injection turns trusted documents into attack vectors](#prompt-injection-turns-trusted-documents-into-attack-vectors)
- [Moltbook leaked 1.5 million API tokens through a vibe-coded database](#moltbook-leaked-15-million-api-tokens-through-a-vibe-coded-database)
- [Government agencies and industry analysts sounded the alarm](#government-agencies-and-industry-analysts-sounded-the-alarm)
- [The safe way: running OpenClaw on an isolated cloud VM](#the-safe-way-running-openclaw-on-an-isolated-cloud-vm)
- [FAQ](#frequently-asked-questions)

---

## From weekend project to 179,000 stars in weeks

Peter Steinberger, the Austrian developer behind PSPDFKit, started OpenClaw as a weekend WhatsApp relay project in November 2025. Originally named Clawdbot — a pun on Anthropic's Claude and a lobster claw — the project lets any computer become a persistent AI agent that connects to WhatsApp, Telegram, Discord, Slack, email, calendars, browsers, and shell commands. It runs 24/7, retains long-term memory, and can write its own code for tasks it doesn't yet know how to perform.

The project went viral in late January 2026, accumulating **20,000 GitHub stars in 24 hours** and drawing 2 million visitors in a single week. Mac mini sales spiked as users set up always-on AI servers. Anthropic's trademark team forced a rename to Moltbot on January 27, then Steinberger voluntarily rebranded again to OpenClaw on January 29. As of mid-February 2026, the project has **179,000+ GitHub stars** and **720,000 weekly downloads** according to OX Security. On February 15, 2026, Steinberger joined OpenAI, with the project transitioning to a foundation model.

But while the hype surged, security researchers were discovering a cascade of critical vulnerabilities. Andrej Karpathy, who initially called the system "genuinely the most incredible sci-fi takeoff-adjacent thing I have seen recently," reversed course within days: **"It's a dumpster fire, and I also definitely do not recommend that people run this stuff on their computers."** He tested it only in an isolated environment and said "even then I was scared."

---

## Every documented CVE and security advisory

The formal vulnerability record for OpenClaw is extensive. A security audit conducted on January 25, 2026, by the Argus Security Platform (filed as GitHub Issue #1796 by user devatsecure) identified **512 total vulnerabilities, eight classified as critical**, spanning authentication, secrets management, dependencies, and application security. Key findings included OAuth credentials stored in plaintext JSON files without encryption.

The most severe individual vulnerability is **CVE-2026-25253** (CVSS 8.8), discovered by **Mav Levin**, founding security researcher at DepthFirst. Published January 31, 2026, and patched in v2026.1.29, this flaw enables **one-click remote code execution** through a cross-site WebSocket hijacking attack. The Control UI accepts a `gatewayUrl` query parameter without validation and auto-connects on page load, transmitting the stored authentication token over the WebSocket channel. A victim who simply visits a malicious web page has their token stolen in milliseconds. The attacker then connects to the victim's gateway, disables sandboxing via API calls (`exec.approvals.set ask:"off"`, `config.patch tools.exec.host:"gateway"`), and achieves full RCE. Steinberger noted in the advisory that **"the vulnerability is exploitable even on instances configured to listen on loopback only,"** since the victim's browser initiates the outbound connection. Belgium's Centre for Cybersecurity (CCB) issued an emergency advisory on February 2, 2026, urging immediate patching.

Additional documented vulnerabilities include:

- **CVE-2026-25157** (High) — OS command injection via unsanitized project root paths in the macOS SSH handler's `sshNodeCommand` function, discovered by researcher koko9xxx, patched in v2026.1.29
- **CVE-2026-25475** (CVSS 6.5) — Local file inclusion via the `MEDIA:` path extraction mechanism, allowing the agent to read arbitrary files on the system including `/etc/passwd` or `~/.ssh/id_rsa`, reported by jasonsutter87, patched in v2026.1.30
- **GHSA-mc68-q9jw-2h3v** (High) — Command injection in Docker execution via PATH environment variable manipulation, patched in v2026.1.29
- **GHSA-g55j-c2v4-pjcg** (High) — Unauthenticated local RCE via the WebSocket `config.apply` mechanism, published February 4, 2026
- **GHSA-8jpq-5h99-ff5r** — Local file disclosure via the Feishu (Lark) messaging extension, published February 15, 2026

---

## 341 malicious skills turned ClawHub into a malware bazaar

ClawHub, OpenClaw's open marketplace for third-party "skills," became ground zero for supply chain attacks within days of the project going viral. Skills are not sandboxed scripts — they are folders of executable code with direct filesystem and network access, running under the agent's full privileges.

**Koi Security** researcher **Oren Yomtov** conducted the most comprehensive initial audit, examining all 2,857 skills on ClawHub and identifying **341 malicious entries**. Of these, **335 belonged to a single coordinated campaign dubbed ClawHavoc**, targeting both macOS and Windows users. The campaign disguised malicious skills as cryptocurrency wallets, Polymarket trading bots, YouTube utilities, auto-updaters, and Google Workspace integrations. Many used typosquatting — names like `clawhub`, `clawhub1`, `clawhubb`, `clawhubcli` — to catch hasty installs.

The kill chain was deceptively simple. Each skill's documentation instructed users to install a "prerequisite" before use. On macOS, this meant copying a shell command from glot.io into Terminal, which decoded a base64-encoded script fetching additional malware. On Windows, users downloaded a password-protected ZIP from GitHub (password: "openclaw") — the encryption deliberately bypassing automated antivirus scanning. Both paths delivered **Atomic macOS Stealer (AMOS)**, a commodity information stealer sold as malware-as-a-service for **$500–$1,000 per month**. All 335 ClawHavoc skills shared the same command-and-control infrastructure at IP **91.92.242.30**.

Security researcher **Paul McCarty** (online alias 6mile) found malware **within two minutes** of looking at the marketplace, then identified **386 malicious packages from a single threat actor**. When he contacted Steinberger, the founder reportedly said security **"isn't really something that he wants to prioritize."**

**Snyk's ToxicSkills study**, published February 5, 2026, scanned **3,984 skills** and found even more alarming numbers: **1,467 skills (36.82%)** had at least one security flaw, **534 (13.4%)** contained critical-level issues, and **76 were confirmed malicious payloads** designed for credential theft, backdoor installation, and data exfiltration. Hardcoded secrets appeared in **10.9% of all ClawHub skills** and **32% of confirmed malicious samples**. Snyk researchers also uncovered active campaigns by user "zaycv," who published a fake ClawHub CLI tool that dropped reverse shells. **Bitdefender** identified **14 malicious actors** on ClawHub, with one user (sakaen736jih) submitting **199 malicious skills** at a rate of one every few minutes via automation.

**Cisco's AI Threat and Security Research team** ran their Skill Scanner against the #1-ranked skill on ClawHub — "What Would Elon Do?" — and found **nine vulnerabilities, two critical**. The skill silently exfiltrated data to attacker-controlled servers and used direct prompt injection to bypass safety guidelines. It had been **downloaded thousands of times** after being gamed to the top ranking.

In response, OpenClaw partnered with VirusTotal to scan all uploaded skills using SHA-256 hashing and VirusTotal's Code Insight AI analysis. Skills flagged as malicious are blocked from download, and all active skills are rescanned daily. **Jamieson O'Reilly**, founder of Dvuln, who had earlier demonstrated the marketplace's vulnerabilities by uploading a malicious skill that became ClawHub's top-ranked entry, joined OpenClaw as lead security advisor.

---

## Over 42,000 instances exposed on the open internet

OpenClaw's default configuration in early versions bound the gateway to **0.0.0.0:18789** — listening on all network interfaces, fully exposed to the public internet. Combined with the option to run with zero authentication, this created a catastrophic exposure surface.

Researcher **@fmdz387** ran the first Shodan scan in late January 2026 and found **nearly 1,000 instances running without any authentication**. **Censys** researcher **Silas Cutler** tracked growth from approximately 1,000 to **21,639 exposed instances** in under a week. **Bitsight** observed **30,000+ distinct instances** between January 27 and February 8, 2026. Independent researcher **Maor Dayan** conducted the most comprehensive study using a custom tool called ClawdHunter v3.0, discovering **42,665+ publicly exposed instances** with **93.4% of verified instances exhibiting critical authentication bypass vulnerabilities**. He called it **"the largest security incident in sovereign AI history."** By February 9, **SecurityScorecard's STRIKE team** reported the number had surged to **135,000+ unique IPs** across 82 countries, with **12,812 exploitable via RCE**.

**Jamieson O'Reilly** demonstrated the real-world impact by manually examining exposed instances found via Shodan. Of those he tested, eight were completely open with no authentication. He was able to access **Anthropic API keys, Telegram bot tokens, Slack OAuth credentials, and months of complete chat histories**. He could send messages on behalf of users and execute commands with **full system administrator privileges**. **Hunt.io** confirmed **17,500+ instances** vulnerable to CVE-2026-25253 specifically, with the naming confusion visible in the data: 68.9% still identified as "Clawdbot Control," 22.3% as "Moltbot Control," and only 8.8% as "OpenClaw Control."

SecurityScorecard correlated **549 exposed instances with prior breach activity**, and found **33.8% of exposed infrastructure correlates with known threat actor activity**, including Kimsuky and APT28 groups. Honeypot data from Terrace Networks showed scanning for OpenClaw instances began **January 26, 2026 — the same day as the Hacker News announcement** — indicating attackers mobilized within hours.

---

## Prompt injection turns trusted documents into attack vectors

Unlike traditional software vulnerabilities, prompt injection attacks exploit the fundamental architecture of LLM-powered agents. Two major proof-of-concept demonstrations showed how OpenClaw's design makes it especially vulnerable.

**Zenity Labs**, led by VP of Security Strategy **Chris Hughes**, demonstrated an **indirect prompt injection via Google Docs** in their "OpenClaw or OpenDoor?" research published in early February 2026. The attack begins with a Google Document containing legitimate-looking enterprise text with a hidden payload embedded deeper in the document. When a user asks OpenClaw to summarize the document, the injected instructions steer the agent into creating a new **Telegram bot integration** controlled by the attacker, complete with an allowlist entry and bot token. The attack then modifies **SOUL.md** (OpenClaw's persistent identity file) and creates a **scheduled cron job** that periodically re-injects attacker logic — surviving restarts and persisting even if the original integration is removed. Finally, the attacker deploys a **traditional C2 (command-and-control) implant**, escalating from agent manipulation to full system compromise. Hughes noted: **"This attack demonstrates how a persistent command and control channel can be created for malicious activities while using native features and capabilities of OpenClaw."** No CVE is needed — the attack abuses documented, intended features.

**Noma Security**, led by CISO **Diana Kelley**, discovered a critical blind spot in corporate group chats. When OpenClaw is deployed in a Discord server, Telegram group, or WhatsApp channel, **it treats instructions from any channel participant as if they came from its owner**. An attacker who joins a public-facing Discord server with an OpenClaw bot can instruct it to crawl the local filesystem for tokens, passwords, and crypto seed phrases. **"Within 30 seconds, the agent bundles the sensitive data and sends it straight to the attacker's-controlled server,"** Noma's researchers found. To the security team, the bot appears to function normally. Kelley warned: **"Some of us are looking at agentic assistants like they're smarter chatbots. They're not."**

Security researcher **Simon Willison** coined the term **"lethal trifecta"** to describe AI systems that combine three dangerous properties: access to private data, exposure to untrusted content, and the ability to communicate externally. Snyk's researchers adopted this framework under their own term **"toxic flows"** in their ToxicSkills study, finding that **91% of malicious ClawHub skills combined prompt injection with traditional malware techniques**. Palo Alto Networks' Unit 42 researchers **Sailesh Mishra** and **Sean P. Morgan** identified persistent memory as an accelerant that turns the trifecta into a mechanism for "stateful, delayed-execution attacks" — enabling time-shifted prompt injection, memory poisoning, and logic bomb activation.

---

## Moltbook leaked 1.5 million API tokens through a vibe-coded database

Moltbook, the AI-agent social network launched on January 28, 2026, by **Matt Schlicht** — who boasted he "didn't write a single line of code" and built it entirely with AI — became a cautionary tale for vibe-coded security. The platform, which is not part of the OpenClaw project itself, functions as a Reddit clone where only AI agents can post, eventually accumulating 1.7 million registered agents and nearly 7 million comments.

On January 31, 2026, **Wiz Security** researcher **Gal Nagli** noticed that the **Supabase API key was hardcoded in Moltbook's client-side JavaScript**, visible to anyone who opened browser developer tools. Normally, Supabase's public API key is safe when Row Level Security (RLS) is properly configured. **Moltbook never enabled RLS.** The key granted full unauthenticated read and write access to the entire production database.

**Jamieson O'Reilly** independently discovered the same flaw and demonstrated it to **404 Media**, who verified the findings. The exposed data included **approximately 1.5 million API authentication tokens**, **~35,000 email addresses**, **~4,000 private messages between agents** (some containing plaintext OpenAI API keys), agent claim tokens, verification codes, and Twitter handles of human owners. Write access meant attackers could manipulate content, inject prompts, and impersonate any agent. O'Reilly noted the fix required **just two SQL statements** — they simply didn't exist. Wiz disclosed to Moltbook on February 2, and the vulnerability was patched within hours. Only **17,000 human owners** were behind the 1.5 million agents — an 88:1 agent-to-human ratio — revealing that anyone could register millions of agents with no rate limiting.

---

## Government agencies and industry analysts sounded the alarm

Multiple government bodies issued formal warnings. **Belgium's Centre for Cybersecurity (CCB)** published an emergency advisory on February 2, 2026, classifying CVE-2026-25253 as critical and urging organizations to **"install updates for vulnerable devices with the highest priority."**

**China's Ministry of Industry and Information Technology (MIIT)**, through its National Vulnerability Database (NVDB), issued a security alert on **February 5, 2026**, warning that OpenClaw deployments carry "high security risks" under default or poorly configured settings. The notice stated that "unclear trust boundaries during deployment, combined with continuous operation, autonomous decision-making, and access to system and external resources, could expose instances to prompt-induced misuse, configuration flaws, or hostile takeovers." Chinese cloud providers Alibaba, Tencent, and Baidu had already launched OpenClaw hosting services.

**South Korea** took direct action: Kakao, Naver, and Karrot Market **restricted or blocked OpenClaw across corporate networks and work devices**. **Gartner** published a formal research note calling OpenClaw "insecure by default" and "unmanaged with high privileges," recommending enterprises **"block OpenClaw downloads and traffic immediately"** and rotate any corporate credentials the agent may have accessed. Sophos assessed that OpenClaw "should be considered an interesting research project that can only be run 'safely' in a disposable sandbox with no access to sensitive data."

**Gary Marcus** called OpenClaw **"basically a weaponized aerosol"** and wrote that using it was **"like giving a stranger at a bar all your passwords."** His direct advice: **"If you care about the security of your device or the privacy of your data, don't use OpenClaw. Period."** He warned of "CTD — chatbot transmitted disease" and expressed doubt that any truly secure configuration exists.

Cisco's blog concluded bluntly: **"From a capability perspective, OpenClaw is groundbreaking. From a security perspective, it's an absolute nightmare."** Aikido.dev's analysis stated: "Trying to make OpenClaw fully safe to use is a lost cause. You can make it safer by removing its claws, but then you've rebuilt ChatGPT with extra steps. **It's only useful when it's dangerous.**"

---

## The safe way: running OpenClaw on an isolated cloud VM

Despite the risks, OpenClaw delivers genuine utility that no other tool replicates — a persistent, cross-platform AI agent with real autonomy. The key insight is that **isolation, not hardening, is the primary defense**. Running OpenClaw on a dedicated cloud VM transforms the threat model: a compromised agent can only reach what exists on that isolated machine, not your primary workstation, corporate network, or personal credentials.

**Bind the gateway to loopback only.** Change the default from `0.0.0.0:18789` to `127.0.0.1`. This ensures the gateway API is accessible only from the local machine. Access the Control UI through an SSH tunnel or a reverse proxy (Caddy or Nginx) with auto-HTTPS and WebSocket upgrade support. The `openclaw doctor --fix` command will automatically tighten this binding.

**Require authentication on every connection.** Version 2026.1.29 removed the `auth: none` option, but older versions still allow it. Ensure `gateway.auth.token` is set to a random string of at least 32 characters. Enable pairing codes for new device connections. Set DM policies to `pairing` mode so the bot ignores messages from unapproved senders.

**Enable Docker sandboxing.** Configure `agents.defaults.sandbox` to run all agent execution in Docker containers. Use `scope: "agent"` for one container per agent, `workspaceAccess: "ro"` for read-only filesystem access, and `sandbox.docker.network: "none"` to disable outbound network access from within the sandbox. The default sandbox image runs as non-root user node (UID 1000).

**Enforce strict firewall rules.** Block all egress traffic except to approved API endpoints (your LLM provider, specific integrations). Specifically block **91.92.242.30** (the ClawHavoc C2 server) and any paste services like glot.io at the firewall level. Rate-limit connections to the gateway port.

**Use tool allowlists aggressively.** When the `allow` list is non-empty, only explicitly listed tools are available. Block high-risk tools by default: `exec`, `browser`, `web_fetch`, `gateway`, `nodes`, `cron`, `sessions_spawn`, `whatsapp_login`. Enable them individually only when needed, and only for specific agents.

**Use burner accounts for all connected services.** Never connect OpenClaw to your primary email, messaging accounts, or cloud credentials. Create dedicated accounts with minimal permissions. Store API keys in environment variables, not config files, and rotate them every 90 days. Consider using a LiteLLM proxy so the agent never sees actual API keys.

**Adopt a progressive configuration strategy.** Week one: read-only access, monitoring only. Week two: restricted write access to specific directories. Week three: enable additional tools as needed, with continuous monitoring. Run `openclaw doctor` and `security audit --deep` regularly to detect misconfigurations.

**Use Tailscale for remote access** rather than exposing any ports to the public internet. Keep the gateway and node hosts on a tailnet, disable `gateway.auth.allowTailscale` behind your own reverse proxy, and treat node pairing like admin access.

---

## Conclusion: useful and dangerous are not mutually exclusive

OpenClaw's security record is genuinely alarming — **six GitHub Security Advisories in three weeks**, 512 vulnerabilities in its first audit, hundreds of malicious skills, over 42,000 exposed instances, government warnings from Belgium to China, and a one-click RCE that works even on localhost configurations. The "lethal trifecta" of private data access, untrusted content exposure, and external communication capability is not a bug in OpenClaw — it is the architecture.

But the demand OpenClaw revealed is real. **720,000 weekly downloads** prove that users want persistent AI agents with genuine autonomy. The path forward is not abstinence but containment. An isolated cloud VM with loopback binding, Docker sandboxing, strict tool allowlists, and burner accounts transforms OpenClaw from a "weaponized aerosol" into a contained experiment where the blast radius of any compromise is limited to a disposable machine with no access to sensitive data. As Colin Shea-Blymyer of Georgetown's CSET put it: **"The more access you give them, the more fun and interesting they're going to be — but also the more dangerous."** The trick is controlling where that danger lives.

---

## Frequently Asked Questions

### Is OpenClaw safe to use in 2026?

Not with default settings. OpenClaw has had six GitHub Security Advisories in three weeks, 512 vulnerabilities in its first security audit, 341 confirmed malicious skills on ClawHub, and over 42,000 publicly exposed instances. Security researchers, Gartner, and government agencies in Belgium, China, and South Korea have all issued formal warnings. It can be made safer by running on an isolated cloud VM with loopback binding, Docker sandboxing, strict tool allowlists, and burner accounts — but no configuration eliminates all risk.

### What is CVE-2026-25253?

CVE-2026-25253 is a critical vulnerability (CVSS 8.8) in OpenClaw that enables one-click remote code execution through cross-site WebSocket hijacking. A victim who visits a malicious web page has their authentication token stolen in milliseconds. The attacker then connects to the victim's gateway, disables sandboxing, and achieves full RCE. It was discovered by Mav Levin of DepthFirst and patched in version 2026.1.29. Belgium's Centre for Cybersecurity issued an emergency advisory urging immediate patching.

### What is ClawHavoc?

ClawHavoc is a coordinated malware campaign that planted 335 malicious skills on ClawHub, OpenClaw's third-party marketplace. The skills disguised themselves as cryptocurrency wallets, YouTube utilities, and Google Workspace integrations. Each instructed users to install fake prerequisites that delivered Atomic macOS Stealer (AMOS), a commodity information stealer. All 335 skills shared the same command-and-control infrastructure at IP 91.92.242.30.

### How many OpenClaw instances are exposed on the internet?

As of February 2026, SecurityScorecard's STRIKE team identified over 135,000 unique IPs running exposed OpenClaw instances across 82 countries, with 12,812 exploitable via remote code execution. Independent researcher Maor Dayan found 42,665+ instances with 93.4% exhibiting critical authentication bypass vulnerabilities.

### What happened with Moltbook?

Moltbook, an AI-agent social network built for OpenClaw bots, exposed approximately 1.5 million API authentication tokens, 35,000 email addresses, and 4,000 private messages because its Supabase database had Row Level Security disabled. The Supabase API key was hardcoded in client-side JavaScript. The fix required just two SQL statements.

### Why did OpenClaw change its name?

OpenClaw was originally called Clawdbot (a pun on Claude). Anthropic's trademark team forced a rename to Moltbot on January 27, 2026. The developer then voluntarily rebranded to OpenClaw on January 29, 2026.

### Did any governments issue warnings about OpenClaw?

Yes. Belgium's Centre for Cybersecurity published an emergency advisory on February 2, 2026. China's Ministry of Industry and Information Technology issued a security alert on February 5, 2026. South Korea's Kakao, Naver, and Karrot Market restricted or blocked OpenClaw across corporate networks. Gartner recommended enterprises block OpenClaw downloads and traffic immediately.

### Is OpenClaw safe to use in an enterprise?

No. Gartner classified OpenClaw as "insecure by default" and "unmanaged with high privileges." Noma Security reported that 53% of its enterprise customers gave OpenClaw privileged access over a single weekend. Bitdefender documented shadow AI deployments of OpenClaw on corporate machines. Security researchers universally recommend against enterprise deployment without extensive hardening and monitoring.

---

*Last updated: February 17, 2026*

*Barrack AI provides isolated GPU cloud instances for AI workloads. [Learn more →](https://barrack.ai)*
