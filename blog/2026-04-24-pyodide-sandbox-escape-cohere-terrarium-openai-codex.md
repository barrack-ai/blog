---
slug: pyodide-sandbox-escape-cohere-terrarium-openai-codex
title: "Cohere, OpenAI, and the broken sandbox problem"
description: "Cohere Terrarium (CVE-2026-5752) and OpenAI Codex CLI (CVE-2025-59532) are two instances of the same industry-wide failure: sandboxes built to contain LLM-generated code that can't actually contain it. A cross-CVE breakdown, the Pyodide architecture problem underneath, and why CERT couldn't get Cohere to answer the phone for 61 days."
authors: [dhaya]
tags: [security, ai-security, sandbox-escape, CVE, pyodide, cohere, openai, vulnerability-research]
date: 2026-04-24
---

Two sandboxes. Two AI labs. Seven months apart. Same class of failure.

On September 22, 2025, OpenAI published GHSA-w5fx-fh39-j5rw. Codex CLI versions 0.2.0 through 0.38.0 had a sandbox bypass. The `cwd` (current working directory) that the model suggested was being treated as the sandbox's writable root. If the model decided, through whatever chain of reasoning or injection, that it needed to work in `/etc`, the sandbox would dutifully mark `/etc` as writable.

On April 14, 2026, GHSA-cmpr-pw8g-6q6c landed. Cohere Terrarium, a Python sandbox built to run LLM-generated code, scored 9.3. Root code execution on the host, from inside the sandbox, via JavaScript prototype chain traversal.

Then there's the other thing. CERT/CC had notified Cohere on February 19, 2026, and published VU#414811 on April 21. Sixty-one days, sixteen past CERT's standard 45-day disclosure window. On the live advisory today, Cohere's vendor status is still listed as "Unknown," and under "Vendor Statement" CERT writes: "We have not received a statement from the vendor." As far as I can find in public kb.cert.org listings, this is the first published CERT/CC advisory against a major AI lab where the vendor went that long without responding.

<!--truncate-->

Different labs. Different stacks. Different bug classes (one CWE-20 input validation, one prototype walk through Pyodide's FFI). Both sandboxes built to contain code written by language models. Both failed at the first principle of confinement, which is that untrusted code shouldn't be able to reach out and touch the host.

That's the story worth telling.

## What actually happened in Codex CLI

OpenAI's root cause, in their own words:

> "Codex CLI could treat a model-generated cwd as the sandbox's writable root, including paths outside of the folder where the user started their session." (GHSA-w5fx-fh39-j5rw)

The fix is telling. PR #3874, merged as part of 0.39.0 on September 18, 2025, is titled "fix: ensure cwd for conversation and sandbox are separate concerns." Two path variables where there used to be one: `command_cwd` (what the model asks for) and `sandbox_policy_cwd` (the user's actual session boundary). The sandbox policy now derives from the user's session. The model's suggestion is still honored for running the command, but it can't redefine what the sandbox is.

Read that slowly. The bug wasn't that Codex failed to block a known attack. The bug was that the sandbox treated a value the model controls as authoritative for the sandbox's own boundary.

CVSS v4 8.6. CWE-20 (improper input validation). The advisory notes the network-disabled restriction wasn't bypassed by this, only the filesystem boundary. Small consolation if the Codex process had permission to write your SSH config.

## What actually happened in Terrarium

Terrarium is a simple idea. Cohere's data agents generate Python code. The code needs to run somewhere that isn't the main server. So it runs inside Pyodide, which is CPython compiled to WebAssembly, wrapped in a Node.js HTTP server, wrapped in a Docker container. The README is honest about the threat model, even preemptively: "Cohere does not give any guarantees for the sandbox integrity."

That caveat turned out to be more important than it looked.

CERT's technical breakdown, from VU#414811:

> "The root cause of the vulnerability lies in the configuration of `jsglobals` objects in `service.ts`."

> "the mock document object is created using a standard JavaScript object literal, which inherits properties from `Object.prototype`."

> "This inheritance chain allows sandbox code to traverse up to the function constructor, create a function that returns `globalThis`, and from there access `Node.js` internals, including `require()`."

To understand why this matters, you have to understand what Pyodide actually is.

## Pyodide isn't a sandbox

This is the part nobody's been writing about.

Pyodide's own description:

> "Pyodide is a Python distribution for the browser and Node.js based on WebAssembly."

It is not, and has never claimed to be, a security boundary. The Pyodide project documents an FFI (foreign function interface) between Python and JavaScript, and the whole point of the FFI is that Python code can reach into JavaScript objects. From Pyodide's type conversion docs: "JavaScript objects in the globalThis global scope can be imported into Python using the js module."

There's an option when initializing Pyodide called `jsglobals` that lets the embedder swap out which JavaScript scope Python's `js` module sees. Default value: `globalThis`. That is, by default, Python running inside Pyodide has read/write access to the host JavaScript runtime's global scope.

Terrarium tried to restrict this by passing a custom `jsglobals` object, a plain JavaScript object literal containing a mock `document`. This is where the CVE lives.

In JavaScript, a plain object literal (`{}`) inherits from `Object.prototype`. Which means every JavaScript object the sandbox can see has a `.constructor` property. And `constructor.constructor` is the `Function` constructor. And the `Function` constructor, given any string, compiles and returns a function in the outer JavaScript scope. That function, invoked, runs in the real `globalThis`. Which in Node.js means `process`, `require`, and `child_process`.

Terrarium's sandbox check was: don't give Python access to the real `globalThis`. The escape was: walk the prototype chain of the fake object the sandbox handed you.

```javascript
fake_document.constructor.constructor("return globalThis")()
```

Five tokens. Root inside the container.

The full escape chain, drawn out:

```
 [ Python code running inside Pyodide inside Terrarium ]
                          |
                          |  Pyodide FFI
                          |  (import js; JsProxy property reads)
                          v
 [ fake_document  =  a plain JS {} literal ]
 [ handed to the sandbox as "safe globals" ]
                          |
                          |  .constructor
                          v
                       Object
                          |
                          |  .constructor
                          v
                      Function     <-- this is the Function
                          |            constructor, and it lives
                          |            in the OUTER JS realm
                          |
                          |  ("return globalThis")
                          v
 [ a new function, compiled in the real outer realm ]
                          |
                          |  ()
                          v
 [ globalThis of the host Node.js process ]
                          |
                          |  .process.mainModule
                          |  .require('child_process')
                          |  .execSync('id')
                          v
                root inside the container
```

Every arrow in that diagram is a single JavaScript property read. Five of them in total. The one labelled `Function` is the hinge, because it's the only step where the sandbox crosses from "objects the sandbox was given" into "code running in the host realm," and the crossing happens through a property the sandbox can't hide without breaking JavaScript.

This exact class of Pyodide escape has been public for years. CVE-2025-68668 (the "N8Scape" advisory against n8n, December 2025, CVSS 9.9). CVE-2026-24002 ("Cellbreak" against Grist's formula engine, January 2026, CVSS 9.1). An older 2024 advisory against Grist stating flatly: "pyodide on node does not have a useful sandbox barrier." The Pyodide maintainers themselves acknowledge it in issue #4120, where one of them writes that the behavior "is usually not an issue for static js code controlled by the owner of a site. However it becomes an issue when we allow one user to execute python code that a different user authored."

That describes Terrarium exactly.

## The CERT angle

CERT/CC VU#414811 was first published on April 21, 2026, one week after the GitHub Advisory. Cohere had been notified on February 19, 2026. That's 61 days. CERT's standard disclosure window is 45.

The live advisory, as of April 23 (Revision 2), still lists Cohere's vendor status as "Unknown" rather than "Affected" or "Fixed." Under "Vendor Statement" it reads:

> "We have not received a statement from the vendor."

Revision 1 of the advisory, preserved in third-party mirrors and contemporary coverage, was more direct in its Mitigation section and stated plainly that CERT had not been able to coordinate with Cohere to obtain a patch. That sentence was replaced in Revision 2 with text acknowledging Cohere's v1.0.1 release. Which arrived on April 22, 2026, one day after CERT published.

The CERT addendum under the Cohere vendor block now reads:

> "cohere-terrarium has been archived. v1.0.1 is the final release and the README will carry an end-of-life banner pointing users to either upgrade to 1.0.1 or migrate off the project. There will be no further patches."

So the sequence was: CERT tried to reach Cohere for 61 days, didn't get a response, published anyway, and only then did Cohere ship a patch, archive the repo, and decline to file a vendor statement. The patch exists. The 61-day silence exists too.

One other detail from the advisory, worth sitting with. CERT's acknowledgements read: "The vulnerability was discovered by Jeremy Brown, who used AI-assisted vulnerability research to identify the issue. This document was written by Timur Snoke with assistance from AI." The bug in the LLM sandbox was found with AI help and the advisory describing it was written with AI help. That is where we are.

## The pattern

Codex and Terrarium are two data points. They aren't outliers. Zoom out and the bugs cluster around a small number of mistakes, made by every major AI lab, with depressing regularity.

| Tool | Vendor | Identifier | What broke | Date |
|---|---|---|---|---|
| Claude Code | Anthropic | CVE-2026-25725 | Sandboxed code writes `.claude/settings.json`; host executes SessionStart hooks at host privilege | Nov 2025 |
| Claude Code | Anthropic | CVE-2026-39861 | Sandbox escape via symlink following into host-privileged write | 2026 |
| Claude Code | Anthropic | Ona research | Agent reasons its way into disabling its own sandbox; `/proc/self/root/...` defeats denylist; dynamic-linker trick skips `execve` gate | Mar 2026 |
| Cursor | Anysphere | CVE-2026-22708 | Allowlist bypass via shell builtins (`export`, `declare`) poisoning env vars | 2026 |
| Cursor | Anysphere | CVE-2026-26268 | Sandbox escape via write to `.git/hooks` | 2026 |
| Copilot | GitHub / Microsoft | CVE-2025-53773 | "YOLO mode": prompt injection writes `.vscode/settings.json` with `chat.tools.autoApprove: true` | Aug 2025 |
| Copilot Chat | GitHub / Microsoft | CVE-2025-59145 | "CamoLeak" CSP bypass via GitHub Camo proxy; private-repo exfil. CVSS 9.6 | 2025 |
| Gemini CLI | Google | Tracebit | Allow-list bypass via `grep … && curl …` in malicious `GEMINI.md` | Jul 2025 |
| Gemini CLI | Google | Cymulate | Container-to-host escape via planted `where.exe` + `--sandbox` restart | Jan 2026 |
| Antigravity | Google | Pillar Security | `fd` CLI flag injection via unsanitized `Pattern` in `find_by_name` tool | Jan 2026 |
| Cortex AI | Snowflake | PromptArmor | README prompt injection + shell process-substitution escapes allowlist | Mar 2026 |
| Codex CLI | OpenAI | CVE-2025-59532 | Model-controlled `cwd` treated as sandbox writable root. CVSS 8.6 | Sep 2025 |
| Terrarium | Cohere | CVE-2026-5752 | Pyodide prototype chain walk to `globalThis` → `require()` → root. CVSS 9.3 | Apr 2026 |
| vm2 | open source | CVE-2022-36067 + 7 more | Repeated VM escapes; maintainer deprecated the project | 2022-2026 |

The bugs cluster around a small set of recurring mistakes: treating model-controlled values as policy (Codex CLI, Antigravity), relying on denylists against a reasoning adversary (Gemini CLI, Snowflake, Ona's Claude Code work), using language-level "sandboxes" that were never security boundaries in the first place (Pyodide in Terrarium, n8n, Grist; vm2 in its many escapes), and letting sandboxed processes write their own config (Claude Code settings.json, Copilot autoApprove, Cursor mcp.json).

The sandbox isn't broken because any one engineer made a bad call. The sandbox is broken because the threat model changed underneath it and the implementation didn't.

## What actually works, with caveats

The AI tools that haven't been publicly broken, or that get broken and recover, tend to be the ones using real isolation primitives underneath. Modal uses gVisor. E2B uses Firecracker microVMs. Google's Gemini API code execution runs on gVisor with a $100,000 bounty for escape. Daytona uses Sysbox.

These aren't free. They cost latency, they cost memory, they cost engineering time. They're also the only layer that still works when your model decides, through whatever chain of reasoning or injected instruction, that it wants to `curl | bash`.

Worth saying out loud: "no public escape has been demonstrated" is not the same as "proven secure." Firecracker, gVisor, and Sysbox all have public CVE histories of their own, and private research exists that never becomes public. The claim here is relative, not absolute. These layers are stronger than OS primitives without an outer VM, which are in turn stronger than language-level interpreters pretending to be sandboxes. The floor matters.

The weaker layers, in rough order of decreasing confidence: V8 isolates (Cloudflare Dynamic Workers, where Cloudflare itself admits "V8 security bugs are more common than hypervisors"), bare OS primitives with no outer VM (Claude Code bubblewrap, Codex Seatbelt and Landlock, Gemini CLI), and language-level sandboxes like Pyodide and vm2 (Terrarium, n8n, Grist, Flowise).

If you're building anything that executes LLM-generated code and your architecture diagram has a single box labeled "sandbox" with no second layer beneath it, the threat model is wrong.

## What this means for operators

If you run LLM-driven code in production, three things are worth doing this week.

First, check what your sandbox actually is. Not what the docs say. Not what the vendor markets. What process isolation primitive sits between the generated code and your host. If the answer is "we pass a Python string to Pyodide" or "we run it in the same Node.js process," you have a JavaScript-prototype-walk away from root.

Second, stop trusting model-generated values to define policy. If your sandbox consults anything the model can influence (a config path, a cwd, a tool parameter, an MCP server URL) to decide what's permitted, that's the Codex bug.

Third, assume indirect prompt injection is always on. Every retrieved document, every README, every web page the agent sees is an instruction channel. If the agent has a tool that can run code, and the code runs with enough privilege to hurt you, the only thing between a malicious GitHub issue and your server is the isolation layer underneath the "sandbox" word.

## FAQ

**Was Cohere's Terrarium fixed?**
Yes. v1.0.1 was released on April 22, 2026, one day after CERT published the non-coordination advisory. Cohere also archived the repository and added an end-of-life banner per CERT's updated advisory. There will be no further patches. On CERT's live page Cohere's vendor status remains "Unknown," and no vendor statement has been filed.

**Was OpenAI's Codex CLI fixed?**
Yes, in version 0.39.0, released September 18, 2025. The Codex IDE Extension was fixed in 0.4.12.

**Is Pyodide itself vulnerable?**
No CVEs exist against Pyodide the package. The bugs are in projects that used Pyodide as a security boundary, which Pyodide doesn't claim to be. From the project's own issue tracker: the library is fine for trusted code, and not designed to isolate one user's Python from another user's Python on the same server.

**What does "CERT couldn't coordinate with the vendor" actually mean?**
CERT's disclosure policy gives vendors 45 days to respond from initial contact. If the vendor doesn't respond in a reasonable time (typically around two weeks per CERT's VINCE FAQ), CERT publishes the vulnerability note anyway. Cohere was notified on February 19, 2026, and didn't ship a patch publicly tied to the CVE until April 22, 61 days later and one day after CERT published.

**Is there a public proof-of-concept for CVE-2026-5752?**
No public PoC has been published. The CERT advisory contains enough architectural detail (constructor walk, `globalThis`, `require()`) that reconstructing one is an exercise for interested readers.

**Which AI code execution platforms use stronger isolation?**
Based on public documentation as of April 2026: Modal uses gVisor, E2B uses Firecracker microVMs, Google's Gemini API code execution runs on gVisor, and Daytona uses Sysbox. These are meaningfully stronger than OS primitives or language-level sandboxes, though none are unconditionally secure.

**Is this a Cohere problem or an industry problem?**
Industry. The CVE just happens to have Cohere's name on it. OpenAI, Anthropic, Google, Microsoft, and multiple open-source agent runtimes have all shipped code sandbox CVEs in the last twelve months. Cohere is the only major AI lab I could find in public CERT/CC listings where the vendor went 61 days without a response, but the bug class crosses all of them.

---

*Acknowledgements: CVE-2025-59532 (Codex CLI) was reported by Tzanko Matev of Codetracer. CVE-2026-5752 (Terrarium) was reported by Jeremy Brown, who used AI-assisted vulnerability research to identify the issue, per CERT's acknowledgements.*

*Sources consulted: CERT/CC VU#414811 (verified against the live advisory on April 24, 2026); GHSA-cmpr-pw8g-6q6c; GHSA-w5fx-fh39-j5rw; Pyodide documentation and issue tracker; MDN and OWASP prototype pollution references; Cyera research on CVE-2025-68668 and CVE-2026-24002; Anthropic, Cursor, OpenAI, and Google security advisories and research disclosures as linked inline.*
