---
title: "Your AI Copilot Is the Newest Attack Surface"
description: "Four AI assistant vulnerabilities in Q1 2026 prove that Copilot, Gemini, and Perplexity Comet have become weaponizable attack vectors. Technical analysis of CVE-2026-26144, CVE-2026-0628, CVE-2026-24307, and PleaseFix."
slug: ai-copilot-attack-surface
authors: [dhaya]
image: ./og-ai-copilot-attack-surface.png
tags: [ai-security, copilot, chrome, gemini, microsoft, google, perplexity, prompt-injection, CVE, AI-agents, vulnerability]
keywords: [ai copilot vulnerability, CVE-2026-26144, CVE-2026-0628, GlicJack, Reprompt, PleaseFix, agentic AI security, prompt injection, Chrome Gemini exploit, Excel Copilot XSS, Perplexity Comet 1Password]
---


**Four distinct security incidents in early 2026 prove that AI assistants have become viable, weaponizable attack vectors.** Researchers demonstrated zero-click data exfiltration through Excel's Copilot Agent, full system compromise via Chrome's Gemini panel, session hijacking of Microsoft Copilot Personal, and 1Password vault takeover through Perplexity's agentic browser. Each exploits the same fundamental problem: AI agents inherit broad permissions and cannot reliably distinguish legitimate instructions from attacker-controlled content. The industry data confirms the gap: **83% of organizations plan to deploy agentic AI, but only 29% feel ready to secure it**.

<!-- truncate -->

---

## The landscape: agentic AI outpaces security readiness

Before examining each incident, the macro picture matters. Three major 2026 reports quantify the structural mismatch between AI adoption velocity and security preparedness.

The **Cisco State of AI Security 2026** report (published February 19, 2026) found that 83% of surveyed organizations had planned to deploy agentic AI capabilities into their business functions, while only 29% felt truly ready to leverage these technologies securely. The report examines prompt injection evolution, AI supply chain fragility, and the growing risk surface of Model Context Protocol (MCP) in agentic AI systems.

The **IBM X-Force 2026 Threat Intelligence Index** (published February 25, 2026) reported a **44% increase in attacks exploiting public-facing applications**, largely driven by missing authentication controls and AI-enabled vulnerability discovery. Vulnerability exploitation became the leading cause of attacks, accounting for **40% of all incidents** observed by X-Force in 2025. Of nearly 40,000 vulnerabilities tracked, 56% could be exploited without any form of authentication.

Google's Threat Intelligence Group published **"Look What You Made Us Patch: 2025 Zero-Days in Review"** on March 5, 2026, tracking **90 zero-day vulnerabilities** exploited in the wild during 2025. Enterprise technologies reached an all-time high, with **43 zero-days (48%)** targeting enterprise products. GTIG expects AI tools will help automate vulnerability discovery and accelerate exploit development in 2026.

The **OWASP Top 10 for LLM Applications 2025** maintains prompt injection as the **#1 risk (LLM01:2025)**, defining indirect prompt injection explicitly: an LLM accepts input from external sources containing content that alters model behavior. This is the exact mechanism underlying all four incidents below.

![Attack Flow Diagram](/img/attack-flow-diagram.svg)

---

## CVE-2026-26144: a simple XSS turns Copilot Agent into an exfiltration tool

Disclosed on the **March 10, 2026 Patch Tuesday**, CVE-2026-26144 is a cross-site scripting vulnerability in Microsoft Excel classified under **CWE-79** (Improper Neutralization of Input During Web Page Generation). Microsoft rated it **Critical** despite a CVSS 7.5 base score, an unusual severity elevation for an information disclosure bug.

The attack requires **no privileges and no user interaction**. Microsoft's advisory states the vulnerability could cause Copilot Agent mode to exfiltrate data via unintended network egress, enabling a zero-click information disclosure attack. The Preview Pane is explicitly not a valid attack path.

The mechanism: an attacker delivers specially crafted content that exploits the XSS flaw in Excel's web-rendering pipeline. When processed, this content causes the Copilot Agent to initiate outbound data transmission without user awareness. The AI agent itself becomes the exfiltration channel. No public proof-of-concept exists. Microsoft assessed exploitation as "unlikely" with no evidence of active abuse at the time of release.

ZDI's Dustin Childs called it "a fascinating bug and an attack scenario we're likely to see more often. The vulnerability is a simple cross-site scripting bug in Excel, but an attacker could use it to cause the Copilot Agent to exfiltrate data off the target. This essentially makes it a zero-click information disclosure. Info disclosures rarely get rated Critical, but it makes sense here."

---

## CVE-2026-0628 (GlicJack): one extension, full Gemini panel compromise

Discovered by **Gal Weizman**, Senior Principal Researcher at Palo Alto Networks Unit 42, GlicJack (short for "Gemini Live in Chrome hijack") demonstrates how a malicious Chrome extension with only basic permissions can fully compromise Chrome's privileged Gemini AI panel. The vulnerability carries a **CVSS 8.8 (High)** score, classified as **CWE-862** (Missing Authorization). It affects **all Chrome versions prior to 143.0.7499.192** and was patched on **January 6, 2026**.

The exploit chain hinges on an architectural oversight. Google added Gemini integration to Chrome in September 2025, loading the Gemini side panel at the internal URL `chrome://glic`, which uses a WebView component to embed `gemini.google.com/app`. Chrome's **declarativeNetRequest API** allows extensions to intercept and modify HTTPS requests, a legitimate capability used by ad blockers. The critical flaw: **when engineers applied rejection logic to declarativeNetRequest rules for privileged WebViews, the WebView components used by `chrome://glic` were not included in the blocklist.** Weizman confirmed that "Chromium's interpretation for what went wrong here is that WebView components were forgotten from being rejected when considering rule appliance."

This single oversight creates a devastating privilege escalation. When `gemini.google.com/app` loads in a regular tab, extensions can inject JavaScript but gain no special privileges. When the same URL loads inside the `chrome://glic` panel via WebView, Chrome hooks it with **elevated browser-level capabilities**: local file access, screenshot capture, camera and microphone control. As Unit 42 stated: "This difference in what type of component loads the Gemini app is the line between by-design behavior and a security flaw."

Unit 42 demonstrated these exact capabilities gained by an attacker: camera activation without consent, microphone activation without consent, screenshots of any HTTPS tab, local file and directory access, phishing attacks rendered inside the trusted Gemini panel, and arbitrary code execution in the privileged context.

The disclosure timeline shows Unit 42 initially shared the vulnerability with Google around **October 23, 2025**, with a formal Chromium bug report filed **November 23, 2025** (bug ID 463155954). Google patched it on January 6, 2026. Unit 42 published their full technical write-up on **March 2, 2026**. No active exploitation in the wild was confirmed.

Weizman warned: "The vulnerability put any user of the new Gemini feature in Chrome at risk of system compromise if they had installed a malicious extension. Beyond individual users, the risk profile was significantly amplified within business and organizational environments."

---

## Reprompt (CVE-2026-24307): hijacking Copilot Personal with a single click

Discovered by **Dolev Taler** at **Varonis Threat Labs**, Reprompt is a prompt injection attack against Microsoft Copilot Personal that achieves single-click data exfiltration through three chained techniques. It was responsibly disclosed to Microsoft on **August 31, 2025** and patched on **January 13, 2026**. The vulnerability is tracked as **CVE-2026-24307**, classified under **CWE-1287** (Improper Validation of Specified Type of Input). **Enterprise M365 Copilot was not affected.**

The attack chain uses three distinct techniques in sequence.

**First, parameter-to-prompt (P2P) injection**: Copilot's URL accepts a `q` parameter (e.g., `copilot.microsoft.com/?q=Hello`) that automatically populates the input field when the page loads, causing the AI to execute the prompt immediately. An attacker crafts a malicious URL with exploit instructions in the `q` parameter and delivers it via phishing. The link appears legitimate as it is hosted on `copilot.microsoft.com` and leverages the user's active authenticated session, which persists even after closing the Copilot tab.

**Second, the double-request technique bypasses Copilot's safeguards.** Copilot has built-in protections: it will not fetch URLs without a valid reason, and it reviews and alters sensitive data before returning it. Varonis discovered these safeguards **only apply to the initial request**. By instructing Copilot to perform each task twice, the first attempt triggers the safeguard while the second bypasses it completely. Varonis demonstrated this by asking Copilot to fetch a URL containing a secret phrase: the first attempt sanitized the phrase, but the second attempt returned it in full.

**Third, the chain-request technique enables continuous exfiltration.** After the initial prompt executes, the attacker's server issues follow-up instructions based on Copilot's responses, forming an ongoing chain. Each server response instructs Copilot to both exfiltrate more information and fetch the next instruction. The chain progresses through stages (user identity, location, accessed files, conversation history) with data embedded as URL path parameters in GET requests to the attacker's server. As Taler stated: "Copilot leaks the data little by little, allowing the threat to use each answer to generate the next malicious instruction." Varonis noted: "Client-side monitoring tools won't catch these malicious prompts, because the real data leaks happen dynamically during back-and-forth communication."

Varonis was explicit about the scope: "There's no limit to the amount or type of data that can be exfiltrated. The server can request information based on earlier responses."

---

## PleaseFix / PerplexedBrowser: a calendar invite hijacks your agentic browser

Disclosed on **March 3, 2026** by **Stav Cohen** (Senior AI Security Researcher) and **Michael Bargury** (Co-founder and CTO) of **Zenity Labs**, PleaseFix represents the most dramatic demonstration of agentic AI risk yet published. No CVE has been assigned. The vulnerability family affects Perplexity's Comet agentic browser across macOS, Windows, and Android, and was rated **P1 (Critical)** on Bugcrowd.

PleaseFix demonstrates two attack paths, both initiated through an ordinary Google Calendar invitation with no suspicious links or attachments.

**The file system exfiltration attack** works as follows. The attacker sends a Google Calendar invite with a legitimate-looking meeting description with real names, roles, and agenda items. Below this text, hundreds of newline characters create whitespace that hides malicious content from human view. Hidden below: a fake HTML `<button>` element using Comet's internal node identifier format (discovered by extracting Comet's system prompt), a `<system_reminder>` block mimicking Comet's internal reasoning format, and the keyword "background" to trigger side-panel processing. When the victim asks Comet to accept the meeting (a routine action), the agent navigates to an attacker-controlled website in the background. That website contains second-stage instructions **written in Hebrew** to evade English-focused safety guardrails, framing file access as a "game" to avoid triggering security keywords. The agent navigates to `file:///Users/`, traverses the local file system, reads sensitive files, constructs a URL with stolen data as query parameters, and transmits it via a standard HTTP GET request to the attacker's server. The user remains on their calendar page, unaware.

Zenity coined the term **"intent collision"** for this dynamic: when the agent merges a benign user request with attacker-controlled instructions from untrusted data into a single execution plan, and the LLM cannot reliably distinguish between the two.

**The 1Password vault takeover attack** exploits Perplexity's September 2025 integration with 1Password. The 1Password browser extension, when installed and unlocked (default: up to 8 hours), enables automatic sign-in to the 1Password web interface. Using the same calendar invite entry vector, the attacker steers Comet to navigate to the 1Password Web Vault (where the extension auto-signs in), locate vault items, enter edit mode, reveal stored passwords, and exfiltrate credentials. The attack escalates to full account takeover: the agent navigates to account management settings, uses the extension to autofill the current password, **changes the account password** to an attacker-chosen value, extracts the account email and full Secret Key from the Emergency Kit flow, and exfiltrates everything to the attacker's endpoint.

Bargury stated: "This is not a bug. It is an inherent vulnerability in agentic systems. Attackers can push untrusted data into AI browsers and hijack the agent itself, inheriting whatever access it has been granted."

The disclosure timeline reveals a complex patch cycle. The file system vulnerability was reported to Perplexity via Bugcrowd on **October 22, 2025**. Perplexity issued a first fix on **January 23, 2026**, a hard boundary blocking agent access to `file://` paths at code level. Four days later, Zenity discovered a bypass using the `view-source:file:///` prefix. Perplexity issued a second patch on **February 11, 2026**, which Zenity confirmed effective on February 13.

1Password published a security advisory on **January 30, 2026** with opt-in hardening measures: the ability to disable automatic browser sign-in, "Ask before filling" controls requiring explicit user confirmation, and shorter lock timeout settings. Their official position: the issue does not break 1Password's cryptography, authentication model, or vault design, and the root cause resides in Perplexity's browser execution model. Zenity noted pointedly: **"The mitigations are opt-in. The risk is opt-out."** Default configurations remained unchanged.

---

## What connects these four incidents

The common thread across all four vulnerabilities is not a shared codebase or vendor. It is a shared architectural pattern. AI assistants are granted broad permissions (file access, network egress, credential autofill, camera/microphone control) to be useful, and those permissions become exploitable when the AI cannot distinguish between legitimate user instructions and attacker-injected content. This is OWASP's #1 LLM risk made concrete.

CVE-2026-26144 shows an XSS flaw turning an AI agent into an unwitting exfiltration channel. GlicJack shows a forgotten blocklist entry granting an extension full control over a privileged AI panel. Reprompt shows that safeguards applied only to initial requests leave subsequent ones wide open. PleaseFix shows that a calendar invite can trigger autonomous file theft and credential harvesting.

Gartner's February 2026 trends report identified agentic AI oversight as the #1 cybersecurity trend for the year, noting that **57% of employees already use personal GenAI accounts for work purposes** and **33% admit inputting sensitive information into unapproved tools**.

| Incident | CVE | CVSS | CWE | Product | Patched | Researcher |
|---|---|---|---|---|---|---|
| Excel Copilot XSS | CVE-2026-26144 | 7.5 (Critical) | CWE-79 | Microsoft Excel / Copilot Agent | Mar 10, 2026 | Undisclosed |
| GlicJack | CVE-2026-0628 | 8.8 (High) | CWE-862 | Chrome Gemini Panel (< 143.0.7499.192) | Jan 6, 2026 | Gal Weizman, Unit 42 |
| Reprompt | CVE-2026-24307 | Not published | CWE-1287 | Microsoft Copilot Personal | Jan 13, 2026 | Dolev Taler, Varonis Threat Labs |
| PleaseFix | None assigned | P1 (Bugcrowd) | N/A | Perplexity Comet Browser | Jan-Feb 2026 | Stav Cohen & Michael Bargury, Zenity Labs |

---

## Frequently asked questions

### Am I affected by these vulnerabilities?

If you use Google Chrome, Microsoft Excel with Copilot, Microsoft Copilot Personal, or Perplexity's Comet browser, you were potentially affected. All four vulnerabilities have been patched. Chrome users need version 143.0.7499.192 or later (patched January 6, 2026). Excel users need the March 10, 2026 Patch Tuesday update. Microsoft Copilot Personal was patched on January 13, 2026 (server-side). Perplexity Comet was patched in February 2026. No user action is required for the Reprompt fix, as it was applied server-side.

### What is an agentic AI browser?

An agentic AI browser is a web browser with a built-in AI assistant that can autonomously perform actions on behalf of the user. Unlike traditional chatbot-style AI that only generates text, agentic browsers can click buttons, fill forms, navigate websites, read local files, access connected services (email, calendar, password managers), and execute multi-step tasks without requiring explicit approval for each action. Perplexity Comet, Google Chrome with Gemini, and Microsoft Edge with Copilot are examples. The PleaseFix and GlicJack vulnerabilities both exploit this autonomous action capability.

### What is indirect prompt injection?

Indirect prompt injection is OWASP's #1 ranked risk for LLM applications (LLM01:2025). It occurs when an attacker embeds malicious instructions inside content that an AI agent will process as part of its normal workflow. The attacker does not interact with the AI directly. Instead, the instructions are hidden in a website, document, calendar invite, email, or any other data source the AI consumes. When the AI processes that content, it follows the hidden instructions alongside or instead of the user's actual request. All four incidents in this post use some form of this technique.

### Is Microsoft 365 Copilot for enterprise affected by Reprompt?

No. Varonis explicitly confirmed that enterprise customers using Microsoft 365 Copilot were not affected. The Reprompt vulnerability was specific to Microsoft Copilot Personal. Enterprise tenants have additional controls including Purview auditing, tenant-level DLP policies, and admin-enforced restrictions that were not present in the consumer product. Microsoft's patch was applied server-side on January 13, 2026.

### How do I check my Chrome version?

Navigate to `chrome://settings/help` in your address bar. Chrome will display your current version and automatically check for updates. You need version **143.0.7499.192** or later on Linux, and **143.0.7499.193** or later on Windows and macOS. If your organization manages Chrome centrally, verify the rollout with your IT team, as managed deployments may have delayed update cycles.

### How do I disable or restrict Copilot Agent mode in Excel?

As of the March 2026 patch, Microsoft has not published a dedicated administrative control to globally disable Copilot Agent mode in Excel. Action1 researchers recommended that organizations restrict outbound network traffic from Office applications and monitor unusual network requests generated by Excel processes as interim measures. Disabling or limiting AI-driven automation features at the tenant level through Microsoft 365 admin settings can reduce exposure. CISOs should also reinforce controls that reduce document-based attack risk, including strengthening email attachment filtering and increasing endpoint monitoring for abnormal Office process behavior.

---

*Written by [Dhayabaran V](https://barrack.ai), Founder of Barrack AI. We provide GPU cloud infrastructure for AI workloads with per-minute billing and zero egress fees. [Learn more →](https://barrack.ai)*
