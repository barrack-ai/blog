---
slug: gpu-rowhammer-ai-model-accuracy
title: "GPU Rowhammer Is Real: A Single Bit Flip Drops AI Model Accuracy from 80% to 0.1%"
description: "Researchers proved Rowhammer attacks work on GPU memory, dropping AI model accuracy from 80% to 0.1% with a single bit flip. Combined with LeftoverLocals, NVBleed, and zero GPU security monitoring tools, the GPU hardware attack surface is wider than most teams realize."
authors: [dhaya]
tags: [gpu, security, vulnerability, ai-infrastructure, cloud-gpu, nvidia]
image: ./gpu-security-cover.png
---

A single bit flip in GPU memory dropped an AI model's accuracy from 80% to 0.1%.

That is not a theoretical risk. It is a documented, reproducible attack called GPUHammer, demonstrated on an NVIDIA RTX A6000 by University of Toronto researchers and presented at USENIX Security 2025. The attack requires only user-level CUDA privileges and works in multi-tenant cloud GPU environments where attacker and victim share the same physical GPU.

GPUHammer is not the only GPU hardware vulnerability. LeftoverLocals (CVE-2023-4969) proved that AMD, Apple, and Qualcomm GPUs leak memory between processes, allowing full reconstruction of LLM responses. NVBleed demonstrated cross-VM data leakage through NVIDIA's NVLink interconnect on Google Cloud Platform. And at RSA Conference 2026, analysts highlighted that traditional security tools monitor only CPU and OS activity, leaving GPU operations completely invisible.

If you are training or running inference on cloud GPUs, this matters. Here is the full technical breakdown.

<!--truncate-->

## GPUHammer: Rowhammer attacks work on GPU memory

GPUHammer is the first demonstrated Rowhammer attack on a discrete GPU. The paper, "GPUHammer: Rowhammer Attacks on GPU Memories are Practical," was authored by Chris S. (Shaopeng) Lin, Joyce Qu, and Gururaj Saileshwar at the University of Toronto. It was presented at the 34th USENIX Security Symposium (August 13-15, 2025, Seattle) and won the CSAW'25 Best Paper Award for Technical Impact at NYU on November 7, 2025.

### How the attack works

Rowhammer exploits a physical property of DRAM: repeatedly accessing ("hammering") one row of memory cells causes electrical interference in adjacent rows, flipping bits in memory the attacker never directly touched.

GPUHammer targets the NVIDIA RTX A6000 (Ampere architecture, GA102 chip) with 48 GB of GDDR6 DRAM. The researchers overcame three challenges specific to GPUs:

1. NVIDIA does not expose physical-to-DRAM address mappings, even to privileged software. The team reverse-engineered these proprietary mappings using timing side-channels.
2. GPU memory has up to 4x higher latency than CPU memory, and GDDR6 refresh periods are shorter (32ms or less versus 32-64ms for DDR4). The researchers exploited GPU parallelism by launching multi-warp hammering patterns to achieve approximately 500,000 activations per refresh window.
3. GDDR6 includes undocumented in-DRAM Target Row Refresh (TRR) defenses. The team bypassed these using n-sided synchronized hammering patterns (n = 8, 12, 16, 20, 24).

The attack produced 8 bit-flips across 4 DRAM banks with a minimum activation count threshold of approximately 12,000.

### The impact on AI models

The proof-of-concept exploit, called "Terminal Brain Damage," demonstrated that flipping the most significant bit of the exponent in FP16 model weights can degrade AI model accuracy from approximately 80% to 0.1% with a single bit flip. Five pretrained ImageNet models were tested: AlexNet, VGG16, ResNet50, DenseNet161, and InceptionV3. All dropped below 1% accuracy under the attack.

The threat model assumes a multi-tenant cloud setting where attacker and victim are co-located on the same GPU, executing CUDA kernels in time-multiplexed fashion. NVIDIA GPU schedulers default to 250ms time slices (approximately 10 refresh intervals), providing sufficient window for the attack. Only user-level CUDA privileges are required.

### What about HBM-based data center GPUs?

The researchers also tested the A100 (HBM2e memory). No bit flips were observed. HBM's stacked architecture likely provides additional resilience. However, separate research by ETH Zurich (Olgun et al.) confirmed that all 6 tested HBM2 chips were vulnerable to RowHammer in controlled settings, with up to 79% variation in bit error rates across channels. Whether HBM3 and HBM3e (used in H100, H200, B200) exhibit similar vulnerability under a GPUHammer-style attack is not yet tested.

### NVIDIA's response

NVIDIA published "Security Notice: Rowhammer - July 2025" on July 9, 2025, recommending that users enable System-Level ECC via `nvidia-smi -e 1` followed by a reboot. Key details on ECC:

- ECC is enabled by default on Hopper and Blackwell data center GPUs (H100, H200, B200, GB200).
- ECC is not enabled by default on the RTX A6000 or other Ampere professional GPUs.
- Consumer GPUs (RTX 4090, RTX 3090) typically lack robust system-level ECC support.
- Enabling ECC incurs up to a 10% performance penalty for ML inference and approximately 6.25% reduction in usable memory.
- Newer GPUs include On-Die ECC (always-on, non-configurable), including Hopper, Blackwell, and GeForce RTX 50 series.

The researchers caution that future multi-bit Rowhammer patterns may bypass ECC, as demonstrated in prior CPU attacks like ECCploit. No CVE was assigned for the GPU hardware vulnerability.

### Disclosure timeline

| Date | Event |
|------|-------|
| January 15, 2025 | Disclosed to NVIDIA |
| Subsequently | Disclosed to AWS, Azure, GCP |
| July 9, 2025 | NVIDIA security notice published |
| July 10, 2025 | ArXiv preprint posted (arXiv:2507.08166) |
| August 12, 2025 | Embargo expired; code released (github.com/sith-lab/gpuhammer) |
| August 13-15, 2025 | Presented at USENIX Security 2025 |

---

## LeftoverLocals: GPU memory leaks between processes

LeftoverLocals (CVE-2023-4969, CVSS 6.5) is a GPU memory isolation failure discovered by Tyler Sorensen and Heidy Khlaaf at Trail of Bits, publicly disclosed on January 16, 2024. The root cause: multiple GPU vendors do not zero local memory between kernel invocations. One GPU kernel can read data written by a completely different application, process, or user.

GPU local memory is a software-managed cache (analogous to CPU L1), typically 16-64KB per compute unit. On affected GPUs, this memory persists intact between kernel executions. Exploitation requires only the ability to run GPU compute through standard APIs (OpenCL, Vulkan, or Metal). Trail of Bits noted the attack code "can be less than 10 lines of code."

### Affected vendors

- **Affected**: AMD (Radeon, Instinct product lines), Apple (M2 vulnerable at disclosure; A17 and M3 fixed), Qualcomm (Adreno GPU families), Imagination Technologies
- **Not affected**: NVIDIA, ARM (Mali), Intel

NVIDIA confirmed: "Our development teams investigated this finding and determined we are not affected by this issue." NVIDIA's immunity likely traces to a 2013 academic paper (arXiv:1305.7383) that previously exposed the same class of memory leak on NVIDIA GPUs, prompting earlier remediation. AMD, Apple, and Qualcomm did not address the same vulnerability class until forced by the LeftoverLocals disclosure in 2024. The takeaway: GPU memory isolation is not a solved problem by default. It gets fixed only when researchers find and report it.

### The 181MB data leak

On an AMD Radeon RX 7900 XT (84 compute units x 64KB local memory), the vulnerability leaks approximately 5.5MB per GPU invocation. Running a 7B-parameter LLM on llama.cpp, a single inference query leaked 181MB of data, sufficient to reconstruct the LLM's response with high precision. The attack works in two phases: fingerprinting the model by stealing approximately 80MB of weights, then targeting the output layer's input vector to reconstruct actual responses.

### Patch status

AMD published security bulletin AMD-SB-6010 on January 16, 2024. The "secure compute" mode introduced in ROCm 6.2.4 is disabled by default and carries performance impacts. Apple shipped fixes in A17 and M3 processors but left M2 vulnerable. Qualcomm released firmware patch v2.0.7 for Adreno 630 (Snapdragon 845) only. CERT/CC advisory VU#446598 was published January 16, 2024, with 31 vendors notified.

---

## NVBleed: cross-VM attacks through NVLink

NVBleed (arXiv:2503.17847, March 2025) by Yicheng Zhang and colleagues at UC Riverside is the first attack exploiting NVIDIA's multi-GPU NVLink interconnect. The researchers reverse-engineered NVLink behavior and identified two leakage sources: timing variations from contention and user-level-accessible performance counters.

The results are directly relevant to cloud GPU users:

- Covert channel achieves 70.59 Kbps with 4.78% error rate
- Application fingerprinting of 18 HPC/DL applications with 97.8% accuracy
- Works across VM instances on Google Cloud Platform with greater than 88% F1-score

This means a co-tenant on a multi-GPU cloud node can determine what application you are running and establish a data exfiltration channel, all through the NVLink interconnect.

---

## NVIDIAScape: container escape to full root access

NVIDIAScape (CVE-2025-23266, CVSS 9.0) was discovered by Wiz Research at Pwn2Own Berlin in May 2025. It is a container escape in NVIDIA Container Toolkit (versions up to v1.17.7) and GPU Operator (versions up to 25.3.1) that grants full root access to the host via a three-line Dockerfile exploit using LD_PRELOAD injection. Wiz estimated it affects 37% of cloud environments. This followed CVE-2024-0132, a similar container escape discovered by Wiz in 2024.

---

## Cloud GPU multi-tenancy: no guaranteed memory isolation

The security of multi-tenant GPU cloud environments rests on several isolation mechanisms. A critical finding: no industry standard mandates GPU memory zeroing between tenant sessions.

### GPU memory is not reliably wiped

NVIDIA's `cudaMalloc()` does not guarantee zeroed memory. A 2014 study by Clémentine Maurice et al. (Eurecom) found that GPU global memory zeroing is a side effect of ECC in some configurations, not a security guarantee. Cloud providers vary in their practices: AWS documents system memory scrubbing but does not publicly document GPU VRAM scrubbing. RunPod states it "employs secure data wiping procedures." Lambda Labs and CoreWeave publish no GPU memory isolation documentation.

### MIG: strong but imperfect

NVIDIA's Multi-Instance GPU (MIG), available on A100, H100, H200, and B200, provides hardware-level partitioning into up to 7 isolated instances with dedicated streaming multiprocessors, L2 cache banks, and HBM partitions. However, a 2023 paper ("TunneLs for Bootlegging," ACM CCS 2023) demonstrated that MIG does not partition the last-level TLB, which remains shared across all compute units. The researchers constructed a working covert channel across MIG-enforced isolation on A100 and A30 GPUs.

### Confidential Computing: the strongest option available

NVIDIA's Confidential Computing (CC) mode on Hopper H100 GPUs provides hardware-encrypted memory, secure boot, AES-GCM-256 encryption for PCIe transfers, and cryptographic attestation. A benchmark study (Zhu et al., arXiv:2409.03992) found LLM inference overhead below 7%, approaching zero for large models.

Cloud availability as of March 2026: Azure offers GA confidential VMs with H100. Google Cloud has A3 confidential VMs with H100 in preview. AWS has not announced GPU confidential computing.

### Isolation mechanisms compared

| Mechanism | Memory isolation | Side-channel protection | Multi-tenant suitability |
|-----------|-----------------|------------------------|-------------------------|
| GPU passthrough (IOMMU) | Strong | Not addressed | Single-tenant only |
| MIG | Hardware-partitioned | Incomplete (shared TLB) | Suitable with caveats |
| MIG-backed vGPU | Strongest non-CC option | Incomplete (shared TLB) | Best non-CC option |
| Time-sliced vGPU | Partial | Vulnerable | Not recommended |
| CUDA MPS | None | None | Not suitable |
| Confidential Computing | Hardware-encrypted | Perf counters disabled | Most secure option |

---

## The GPU security monitoring gap

RSA Conference 2026 (March 23-26, San Francisco) brought GPU security gaps into industry discourse. Futurum Group's 2H 2025 Cybersecurity Decision Maker Survey (n=1,008) found that 62% of organizations have seen a significant increase in sophisticated AI-driven attacks, and 62.1% see AI-powered defensive tools as a necessity. Their central finding: traditional EDR tools monitor only CPU and OS activity, leaving GPU operations invisible to security teams.

Despite significant vendor activity at RSA 2026 (Palo Alto Networks launched Prisma AIRS, Cisco unveiled Zero Trust for AI Agents, Wiz launched AI Application Protection), no vendor announced a tool that specifically monitors GPU compute activity or memory for security threats.

---

## What this means if you rent cloud GPUs

Based on the documented vulnerabilities above, here are concrete actions:

**If you are using RTX A6000 or other GDDR6 GPUs in shared environments:**
Enable ECC immediately via `nvidia-smi -e 1` followed by a reboot. Accept the approximately 10% performance cost. GPUHammer is a proven attack on GDDR6, and ECC is your primary mitigation.

**If you are using H100, H200, or B200:**
ECC is already enabled by default. Your primary risk is not GPUHammer but cross-tenant side-channel attacks (NVBleed, MIG TLB leakage). If you are running sensitive workloads (healthcare, financial models, proprietary model weights), ask your provider about Confidential Computing availability.

**For all cloud GPU users:**
Ask your provider three questions: (1) Is GPU VRAM scrubbed between tenant sessions? (2) What isolation mechanism is used (passthrough, MIG, time-slicing, vGPU)? (3) Is Confidential Computing available? If they cannot answer these clearly, that is information you need before running production workloads.

**If you are self-hosting:**
Update NVIDIA GPU drivers and CUDA Toolkit to the latest versions. NVIDIA published security bulletins for GPU display drivers in July 2025, October 2025, and January 2026, and for CUDA Toolkit in September 2025 and January 2026. Multiple CVEs have been patched across these releases.

---

## FAQ

### What is GPUHammer?

GPUHammer is the first demonstrated Rowhammer attack on GPU memory, presented at USENIX Security 2025 by University of Toronto researchers. It targets GDDR6 memory on the NVIDIA RTX A6000 and can flip bits in GPU DRAM by rapidly accessing adjacent memory rows. A single bit flip in AI model weights was shown to drop model accuracy from approximately 80% to 0.1%.

### Does GPUHammer affect H100, H200, or B200 GPUs?

The researchers tested only the RTX A6000 (GDDR6) and A100 (HBM2e). No bit flips were observed on the A100. H100, H200, and B200 use HBM3/HBM3e memory and have ECC enabled by default, which provides significant protection. However, whether a GPUHammer-style attack can produce bit flips on HBM3/HBM3e has not been tested.

### What is LeftoverLocals?

LeftoverLocals (CVE-2023-4969) is a GPU memory isolation failure where GPU local memory is not zeroed between kernel invocations, allowing one process to read another process's data. It affects AMD, Apple, and Qualcomm GPUs. NVIDIA GPUs are not affected. The attack can reconstruct LLM responses from leaked GPU memory.

### Is my cloud GPU instance vulnerable?

It depends on your GPU model, provider, and isolation mechanism. Time-sliced vGPU sharing is the least secure. MIG provides hardware partitioning but has a documented shared-TLB weakness. GPU passthrough (single-tenant) and Confidential Computing are the most secure options. Ask your provider about their specific isolation implementation.

### Should I enable ECC on my GPU?

If you are running workloads on shared infrastructure using RTX A6000 or similar GDDR6 GPUs, yes. ECC is the primary mitigation against GPUHammer. It introduces approximately 10% performance overhead and reduces usable memory by approximately 6.25%. On H100, H200, and B200, ECC is already enabled by default.

### What is NVIDIA Confidential Computing?

NVIDIA Confidential Computing (CC) mode, available on Hopper H100 GPUs, encrypts all data in GPU memory and on the PCIe bus using AES-GCM-256, with a hardware root of trust and cryptographic attestation. It protects against physical bus interposition, host/hypervisor memory access, and command injection. LLM inference overhead is below 7%. It is available on Azure (GA) and Google Cloud (preview) as of March 2026.

### Does any security tool monitor GPU activity?

As of March 2026, no vendor ships a tool that provides security visibility into GPU compute operations or memory. Traditional EDR tools monitor CPU and OS activity only. This was identified as a critical gap at RSA Conference 2026.

### Has anyone been attacked using these vulnerabilities in the wild?

No publicly documented in-the-wild exploitation of GPUHammer, LeftoverLocals, or NVBleed has been reported as of March 2026. All three are academic research demonstrations with published proof-of-concept code. The risk is highest in multi-tenant cloud GPU environments where co-tenancy is possible.
