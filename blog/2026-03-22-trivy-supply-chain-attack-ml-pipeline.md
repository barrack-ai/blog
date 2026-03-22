---
slug: trivy-compromise-ml-pipeline
title: "Your ML Pipeline's Security Scanner Was Stealing Your Cloud Credentials for 12 Hours"
description: "The Trivy supply chain attack compromised 75 of 76 GitHub Action tags, silently exfiltrating CI/CD secrets including GPU cloud API keys, HuggingFace tokens, and model registry credentials. Here is what ML engineers need to know."
authors: [dhaya]
tags: [security, gpu-cloud, ml-pipeline, supply-chain, trivy, ci-cd]
image: /img/blog/trivy-ml-pipeline.png
---

# Your ML Pipeline's Security Scanner Was Stealing Your Cloud Credentials for 12 Hours

On March 19, 2026, threat actors hijacked Aqua Security's Trivy vulnerability scanner, one of the most widely used container security tools in the open-source ecosystem, and turned it into an infostealer that exfiltrated every secret it could find from CI/CD pipelines.

If your team runs `trivy-action` in GitHub Actions to scan Docker images before deploying to GPU cloud infrastructure, your GPU cloud API keys, HuggingFace tokens, Weights & Biases credentials, and cloud IAM keys may have been stolen.

The attack affected 75 of 76 release tags across a roughly 12-hour window. Over 10,000 GitHub workflow files reference `trivy-action`, and StepSecurity's Harden-Runner telemetry detected compromised instances making outbound connections to attacker infrastructure across 12,000+ public repositories.

This post breaks down exactly what happened, what was stolen, why ML engineers face outsized risk, and the precise steps you need to take right now.

<!--truncate-->

## The attack chain: from stolen token to full credential harvest

The Trivy compromise did not happen overnight. It was the second stage of an attack that began weeks earlier, enabled by a single misconfigured GitHub Actions workflow and an incomplete credential rotation.

**Stage 1: The initial breach (February 28).** A GitHub account called `hackerbot-claw`, created on February 20, ran an automated campaign scanning public repositories for misconfigured `pull_request_target` workflows. Trivy's repository had one such workflow since October 2025 (flagged by Boost Security's `poutine` tool on November 29, 2025, but never fixed). The `pull_request_target` trigger runs in the context of the base repository, meaning it has access to the base repo's secrets even when triggered by a fork's pull request. On February 28, hackerbot-claw exploited this to steal an org-scoped Personal Access Token (`ORG_REPO_TOKEN`) belonging to the `aqua-bot` service account, a token used across 33+ workflows in Aqua Security's GitHub organization.

**Stage 2: First compromise and flawed recovery (March 1).** Using the stolen PAT, the attacker temporarily privatized the Trivy repository, deleted GitHub releases between v0.27.0 and v0.69.1, published a malicious VS Code extension to Open VSX, and exfiltrated additional credentials. Aqua Security disclosed the incident in GitHub Discussion #10265 and began rotating credentials. The rotation process was not fully atomic, and the attacker retained access to newly issued credentials.

**Stage 3: The full-scale supply chain attack (March 19).** Twenty days later, the attacker returned. The timeline, reconstructed from Wiz, Socket, and StepSecurity forensics:

| Time (UTC) | Event |
|---|---|
| 17:43 | Attacker pushes malicious commits to the Trivy repo; `v0.69.4` tag triggers release workflow |
| 17:51 | `aqua-bot` deletes a `v0.70.0` tag (apparent initial attempt at a higher version number) |
| 18:05 | Homebrew automation picks up v0.69.4 and opens an update PR |
| 18:26 | Poisoned binaries published to GitHub Releases, Docker Hub, GHCR, and AWS ECR |
| 18:30 | Attacker opens PR #538 on trivy-action to "bump default Trivy version"; tag force-pushes begin in parallel |
| 19:15 | Socket.dev detection systems begin generating threat feed entries (182 total) |
| 22:06-22:08 | `aqua-bot` publishes 7 poisoned `setup-trivy` releases (v0.1.0 through v0.2.5) in under 3 minutes |
| 23:13 | Maintainers delete malicious v0.69.4 tag |
| 05:40 (Mar 20) | All trivy-action tags restored to safe commits; exposure window closes |

The tag poisoning technique was the same one used in the tj-actions/changed-files compromise roughly a year earlier (which affected 23,000 repositories). For each of the 75 trivy-action tags, the attacker started from the master HEAD commit, swapped `entrypoint.sh` with the infostealer payload, cloned the original commit's metadata (author name, email, timestamps, commit message with PR number), and force-pushed the tag. The result was that GitHub's release page showed no visible change: same name, same dates, same description.

The attacker also deleted the original incident disclosure Discussion (#10265) and deployed 47+ spam bot accounts to flood replacement discussions, with two accounts posting "teampcp owns you" at 00:01 UTC on March 20. This was a deliberate counter-incident-response tactic designed to slow community detection.

## What the 204-line infostealer actually collected

The malicious `entrypoint.sh` totaled 204 lines. Lines 4 through 105 contained the infostealer. Lines 106 through 204 were a functional copy of the legitimate Trivy scanning code, meaning your pipeline scan completed normally and produced expected output while the malware silently ran in the background.

CrowdStrike, Socket, and Wiz independently confirmed a three-stage operation:

### Collection

The malware enumerated GitHub Actions runner processes (`Runner.Worker`, `Runner.Listener`, `runsvc`, `run.sh`) and read environment variables from `/proc/<pid>/environ`, filtering for variables containing `env` or `ssh`.

On **GitHub-hosted runners**, it exploited passwordless sudo (standard on these runners) to execute a base64-encoded Python script that read `/proc/<pid>/maps` to identify readable memory regions, then dumped the Runner.Worker process heap via `/proc/<pid>/mem`. It searched this raw memory for the JSON pattern `{"value":"<secret>","isSecret":true}`, which is the internal format GitHub Actions uses to store secrets in the .NET Runner.Worker process. This means every secret referenced in the workflow job was extracted directly from memory.

On **self-hosted runners**, a different Python payload (self-identified as `## TeamPCP Cloud stealer`) performed comprehensive filesystem credential harvesting across 50+ paths, including:

- `~/.aws/credentials` and `~/.aws/config`
- `~/.config/gcloud/application_default_credentials.json`
- `~/.azure/*`
- `~/.kube/config`
- `~/.docker/config.json`
- `~/.ssh/id_*`
- `.env` files
- Terraform state files
- Cryptocurrency wallet data

It also executed system reconnaissance commands (`hostname`, `whoami`, `uname -a`, `ip addr`, `printenv`), ran `kubectl get secrets --all-namespaces -o json`, queried cloud metadata services at `169.254.169.254` (AWS EC2 IMDS for IAM role credentials) and `169.254.170.2` (AWS ECS container credentials endpoint), and searched recursively for API keys, webhook URLs, and database connection strings.

### Encryption

Collected data was encrypted with AES-256-CBC using a randomly generated 32-byte session key derived via PBKDF2. The session key was wrapped with a hardcoded RSA-4096 public key using OAEP padding. The bundle was packaged as `tpcp.tar.gz` containing `payload.enc` and `session.key.enc`. Only the holder of the corresponding private key can decrypt the stolen data.

### Exfiltration

The primary channel was an HTTPS POST to `scan.aquasecurtiy[.]org` (a typosquat of "aquasecurity" with swapped `i` and `t`), resolving to IP 45.148.10.212 (TECHOFF SRV LIMITED, Amsterdam).

If the primary C2 returned a non-2xx response and `INPUT_GITHUB_PAT` was available, the fallback created a public repository named `tpcp-docs` in the victim's GitHub account, created a timestamped release, and uploaded the encrypted bundle as a release asset.

A secondary fallback used a Cloudflare Tunnel at `plug-tab-protective-relay.trycloudflare.com`.

After exfiltration, all temporary files were removed.

For teams that installed the compromised Trivy binary v0.69.4 (as opposed to the GitHub Action), a different persistence mechanism was deployed: a Python dropper written to `~/.config/sysmon.py` that polled a C2 endpoint on the Internet Computer Protocol blockchain (`tdtqy-oyaaa-aaaae-af2dq-cai.raw.icp0.io`) every ~50 minutes for additional payloads, making traditional domain takedowns ineffective.

## Why ML engineers face outsized risk

> **Disclosure:** No ML-specific victims have been publicly confirmed at the time of writing. The following analysis maps the documented credential types harvested by the malware (as confirmed by CrowdStrike, Wiz, and Socket forensics) against credentials commonly stored in ML CI/CD pipelines.

ML/AI teams sit at the intersection of several factors that make this compromise especially dangerous. The typical ML CI/CD workflow builds a Docker image containing PyTorch, TensorFlow, or a CUDA runtime, scans it with trivy-action for vulnerabilities, and pushes it to a container registry before deploying to GPU cloud infrastructure. That scan step now potentially leaked every secret accessible to the workflow job.

**GPU cloud API keys are uniquely high-value targets.** API keys for on-demand GPU cloud platforms provide direct access to some of the most expensive compute resources available. A single 8xH100 node costs $25-32 per hour on-demand. An attacker with a stolen GPU cloud API key can spin up dozens of GPU instances within minutes, racking up tens of thousands of dollars in charges before anyone notices. Many ML teams store these keys as GitHub Actions secrets following their provider's CI/CD documentation.

**ML platform tokens unlock proprietary assets.** HuggingFace tokens (`HF_TOKEN`) with write access allow downloading private or gated models, uploading backdoored models under the victim's identity, and accessing proprietary datasets. The HuggingFace Hub library reads `HF_TOKEN` directly from the environment, and teams routinely pass it as a GitHub Actions secret for automated model publishing and dataset access. Weights & Biases API keys (`WANDB_API_KEY`), commonly stored as GitHub Actions secrets per W&B's own CI/CD documentation, expose experiment logs, hyperparameters, and model metrics, which can represent months of R&D effort and significant competitive intelligence.

**S3 and GCS credentials for training data and model weights could give attackers access to proprietary datasets and trained model checkpoints.** A stolen IAM key or service account credential with bucket access means the attacker can download your model weights, your training data, or both.

**The attacker profile makes GPU credentials especially attractive.** TeamPCP, the threat group attributed with this attack, is explicitly known for cryptomining operations. Per security researchers at Flare, the group has compromised at least 60,000 servers worldwide, with 97% being cloud infrastructure (61% Azure, 36% AWS). GPU instances are the single most valuable resource for cryptomining. NVIDIA A100 and H100 GPUs are the most commonly targeted for unauthorized mining in cloud environments, and attackers can deploy mining infrastructure within minutes of credential access.

**ML teams often have weaker security posture around CI/CD secrets.** Many teams pass master API keys rather than scoped temporary credentials. Teams running self-hosted GPU runners for CUDA-enabled CI have an even larger attack surface, since the filesystem scraper targeted 50+ credential paths. And because Trivy is a security tool, many organizations allowlist its network traffic in egress policies, meaning the C2 communication would blend in with legitimate vulnerability database updates.

## The cascading impact

The stolen credentials did not stop at direct account access. Within roughly 24 hours, exfiltrated npm tokens were used to compromise 47 npm packages with a self-propagating worm called CanisterWorm, which used stolen tokens to spread to every package the compromised account had publish access to. ML teams running Node.js-based inference APIs or model dashboards should audit their npm dependencies as well.

## How to check if you are affected

**Step 1: Determine exposure.** Check if any GitHub Actions workflow in your organization ran `aquasecurity/trivy-action` by tag (not SHA) between March 19, 17:43 UTC and March 20, 05:40 UTC. The only safe tag during this window was `v0.35.0`. Every other tag from `0.0.1` through `0.34.2` was compromised. Also check for usage of `aquasecurity/setup-trivy` at any version other than `v0.2.6`, and for the Trivy binary at version `v0.69.4`.

**Step 2: Search for exfiltration indicators.** Check if any GitHub account or organization in your team has a repository named `tpcp-docs`, which indicates successful fallback exfiltration:

```bash
gh repo list YOUR-ORG --json name -q '.[].name' | grep tpcp-docs
```

**Step 3: Check for persistent backdoors on self-hosted runners and developer machines.**

```bash
ls -la ~/.config/sysmon.py
ls -la ~/.config/systemd/user/sysmon.py
systemctl --user list-units | grep sysmon
ls -la /tmp/pglog
```

**Step 4: Rotate every secret accessible to affected workflows.** If you were exposed, treat all pipeline secrets as compromised. For ML teams, this specifically means:

- GPU cloud API keys for every on-demand GPU platform your team uses
- HuggingFace tokens (`HF_TOKEN`)
- Weights & Biases API keys (`WANDB_API_KEY`)
- Neptune.ai, Comet ML, and MLflow tokens
- Container registry credentials (Docker Hub, GHCR, ECR, NGC)
- S3 bucket keys, GCS service account keys, and Azure Blob storage keys used for training data and model weights
- SSH keys used to access GPU clusters or private model repositories
- Any GitHub Personal Access Tokens passed via `INPUT_GITHUB_PAT`

**Step 5: Monitor GPU cloud dashboards immediately.** Log in to every GPU cloud platform your team uses and check for unauthorized instance creation, unexpected API calls, or billing anomalies. Set up billing alerts if you have not already. TeamPCP is known for cryptomining operations and GPU instances are their highest-value target.

**Step 6: Pin GitHub Actions to commit SHAs, not tags.** Tags are mutable. SHAs are not. Update your workflows:

```yaml
# BEFORE (vulnerable to tag poisoning):
- uses: aquasecurity/trivy-action@0.33.1

# AFTER (immutable reference):
- uses: aquasecurity/trivy-action@57a97c7e7821a5776cebc9bb87c984fa69cba8f1
```

Tools like `pinact`, StepSecurity's `secure-repo`, and Renovate's `pinGitHubActionDigests` option can automate this across your repositories.

**Step 7: Apply the principle of least privilege to CI secrets.** Scope secrets per workflow job rather than making them available to the entire workflow. Never pass master GPU cloud API keys to CI. Use scoped, temporary credentials with minimal permissions. For AWS, use OIDC federation with short-lived role assumptions instead of static access keys.

**Step 8: Restrict network egress from CI runners.** Tools like StepSecurity's Harden-Runner can monitor and restrict outbound connections from GitHub Actions runners. This would have detected the C2 communication to `scan.aquasecurtiy[.]org` in real time.

**Step 9: Run the trivy-compromise-scanner.** StepSecurity released a dedicated tool at `github.com/step-security/trivy-compromise-scanner` to check your repositories for signs of compromise.

## Indicators of compromise

Block these indicators at your network perimeter and search your CI/CD logs for any connections to them.

### Network indicators

| Type | Value | Notes |
|---|---|---|
| C2 domain | `scan[.]aquasecurtiy[.]org` | Typosquat (swapped `i` and `t`) |
| C2 IP | `45.148.10.212` | TECHOFF SRV LIMITED, Amsterdam |
| Cloudflare Tunnel | `plug-tab-protective-relay.trycloudflare.com` | Fallback exfiltration |
| ICP endpoint | `tdtqy-oyaaa-aaaae-af2dq-cai.raw.icp0.io` | Persistence dropper C2 |

### Malicious commits

| Commit SHA | Repository |
|---|---|
| `e0198fd2b6e1679e36d32933941182d9afa82f6f` | aquasecurity/trivy-action |
| `ddb9da4475c1cef7d5389062bdfdfbdbd1394648` | aquasecurity/trivy-action (alternate) |
| `8afa9b9f9183b4e00c46e2b82d34047e3c177bd0` | aquasecurity/setup-trivy |
| `70379aad1a8b40919ce8b382d3cd7d0315cde1d0` | Spoofed actions/checkout (fork commit) |

### File hashes

| SHA-256 | File |
|---|---|
| `18a24f83e807479438dcab7a1804c51a00dafc1d526698a66e0640d1e5dd671a` | Malicious entrypoint.sh (17,592 bytes) |
| `822dd269ec10459572dfaaefe163dae693c344249a0161953f0d5cdd110bd2a0` | Trojanized Trivy Linux 64-bit binary v0.69.4 |

### Safe commit SHA (trivy-action)

```
57a97c7e7821a5776cebc9bb87c984fa69cba8f1
```

### Filesystem artifacts

| Path | Purpose |
|---|---|
| `~/.config/sysmon.py` | Persistent Python dropper |
| `~/.config/systemd/user/sysmon.py` | Dropper with systemd persistence |
| `/tmp/pglog` | Downloaded binary (mimics PostgreSQL logging) |
| `tpcp-docs` (GitHub repo) | Fallback exfiltration dead drop |

### Safe versions

| Component | Safe version |
|---|---|
| Trivy binary | v0.69.3 |
| trivy-action | v0.35.0 (or pin to SHA above) |
| setup-trivy | v0.2.6 |

## Frequently asked questions

**Was my pipeline affected if I use trivy-action?**

Only if a workflow ran between March 19, 17:43 UTC and March 20, 05:40 UTC using any trivy-action tag other than `v0.35.0`. If you pinned to a full commit SHA, you were not affected (unless you pinned to the malicious commit). Check your GitHub Actions run history for this window.

**What if I use Trivy locally but not through GitHub Actions?**

If you installed or updated the Trivy binary to version v0.69.4 during the exposure window, you may be affected. The compromised binary was distributed through GitHub Releases, Docker Hub (`aquasec/trivy:0.69.4`), GHCR, and AWS ECR. Version v0.69.3 is safe. The binary variant also installs a persistent Python dropper that phones home every 50 minutes via an ICP blockchain endpoint, so check for `~/.config/sysmon.py` on any machine where it was installed.

**Did the malware affect the actual scan results?**

No. The legitimate Trivy scanning code ran normally after the malware executed. Scan results were accurate. This was by design: the attacker needed pipelines to appear healthy so operators would not investigate.

**I use a different container scanner (Grype, Snyk Container, etc.). Am I safe from this specific attack?**

From this specific incident, yes. However, this attack demonstrates that any GitHub Action referenced by tag is vulnerable to the same tag-poisoning technique. Pin all your Actions to full commit SHAs regardless of which tools you use.

**Can the attacker still access my secrets if I rotate them now?**

Rotating credentials invalidates anything that was stolen. However, if the attacker already used your stolen credentials to create persistent access (additional API keys, service accounts, or SSH keys), those would survive rotation. Audit all access logs on your GPU cloud platforms, HuggingFace account, and cloud providers for unauthorized activity since March 19.

**How do I know if my GPU cloud account was abused?**

Check for instances or pods you did not create, unexpected API calls in audit logs, and billing spikes. On AWS, check CloudTrail for `RunInstances` calls targeting GPU instance types (p4d, p5, g5, g6). On GCP, review Compute Engine audit logs for A100/H100 VM creation. On any GPU cloud platform, review your dashboard for instances or serverless endpoints that you did not provision.

**Who is TeamPCP?**

TeamPCP (also tracked as DeadCatx3, PCPcat, PersyPCP, ShellForce, and CipherForce) is a cloud-native cybercrime group that has compromised at least 60,000 servers worldwide according to security researchers at Flare. The group targets cloud infrastructure for data theft, extortion, and cryptomining. The credential stealer self-identifies as "TeamPCP Cloud stealer" in the Python source code. Socket researchers note that while self-labeling could be a false flag, technical overlap with prior TeamPCP tooling makes genuine attribution plausible.

## Sources

- [CrowdStrike: From Scanner to Stealer: Inside the trivy-action Supply Chain Compromise](https://www.crowdstrike.com/en-us/blog/from-scanner-to-stealer-inside-the-trivy-action-supply-chain-compromise/)
- [Wiz: Trivy Compromised by "TeamPCP"](https://www.wiz.io/blog/trivy-compromised-teampcp-supply-chain-attack)
- [Socket: Trivy Under Attack Again: Widespread GitHub Actions Tag Compromise](https://socket.dev/blog/trivy-under-attack-again-github-actions-compromise)
- [Snyk: Trivy GitHub Actions Supply Chain Compromise](https://snyk.io/articles/trivy-github-actions-supply-chain-compromise/)
- [StepSecurity: Trivy Compromised a Second Time](https://www.stepsecurity.io/blog/trivy-compromised-a-second-time---malicious-v0-69-4-release)
- [The Hacker News: Trivy Security Scanner GitHub Actions Breached](https://thehackernews.com/2026/03/trivy-security-scanner-github-actions.html)
- [CSO Online: Trivy vulnerability scanner backdoored with credential stealer](https://www.csoonline.com/article/4148317/trivy-vulnerability-scanner-backdoored-with-credential-stealer-in-supply-chain-attack.html)
- [Aqua Security: Trivy Security Incident Discussion #10425](https://github.com/aquasecurity/trivy/discussions/10425)
- [The Hacker News: Trivy Supply Chain Attack Triggers Self-Spreading CanisterWorm](https://thehackernews.com/2026/03/trivy-supply-chain-attack-triggers-self.html)

---

*Written by Dhayabaran V, Founder of Barrack AI. We provide GPU cloud infrastructure for AI workloads with per-minute billing and zero egress fees. [Learn more →](https://barrack.ai)*
