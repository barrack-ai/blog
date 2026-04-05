---
title: "GDDRHammer and GeForge: GPU Rowhammer Now Achieves Full System Compromise"
description: "Two new attacks escalate GDDR6 GPU memory bit flips into root shell access. RTX A6000 and RTX 3060 confirmed vulnerable. What GPU cloud operators need to know."
slug: gddrhammer-geforge-gpu-rowhammer-gddr6
date: 2026-04-05
authors: [dhaya]
tags: [nvidia, gpu-security, rowhammer, ai-infrastructure]
image: ./gpu-rowhammer-system-compromise-cover.png
---

*Last updated: April 2026. GPU security is an evolving field. Verify current mitigation guidance with your infrastructure provider.*

Rowhammer just jumped from CPUs to GPUs. And this time it is not about corrupting model weights or degrading inference accuracy. Two independent research teams disclosed attacks on April 2, 2026 that escalate GDDR6 memory bit flips into a root shell on the host machine. From an unprivileged CUDA kernel. No authentication required.

The original GPUHammer research demonstrated 8 bit flips on an RTX A6000 and showed that a single strategic flip could drop ImageNet accuracy from 80% to 0.1%. That was a data integrity problem. What GDDRHammer and GeForge demonstrate is a full privilege escalation chain: GPU memory corruption to GPU page table hijacking to CPU memory read/write to root shell.

Both papers will be presented at the 47th IEEE Symposium on Security and Privacy (IEEE S&P 2026), running May 18 through 20 in San Francisco. A third concurrent attack called GPUBreach, from the University of Toronto team behind the original GPUHammer, goes even further by bypassing IOMMU protections entirely. All three are disclosed at gddr.fail and gpubreach.ca.

The RTX A6000 is one of the two confirmed vulnerable GPUs, and it is widely deployed across GPU cloud platforms. This post covers what the attacks actually do, which hardware is affected, what the mitigations cost, and what it means for anyone running GDDR6 GPUs in a shared environment.


## How GDDRHammer works

GDDRHammer was developed by researchers at UNC Chapel Hill, Georgia Tech, and Mohamed bin Zayed University of Artificial Intelligence. The paper, code (github.com/heelsec/GDDRHammer), and supplementary materials are all available at gddr.fail.

The attack exploits a flaw in how NVIDIA's default memory allocator (`cudaMalloc`) places GPU page tables. Under normal operation, page table entries should be isolated from user-controlled data. They are not. The allocator co-locates page tables and user data in the same GDDR6 memory region. That means an attacker who can induce bit flips in adjacent rows can corrupt page table entries.

The team characterized Rowhammer behavior across 25 GDDR6 GPUs. They developed double-sided hammering patterns that exploit GPU parallelism, specifically the SIMT architecture and multi-warp execution model, to generate far more intense memory access patterns than a CPU can produce. The result was roughly 64x more bit flips than the original GPUHammer work.

The actual attack chain has four parts. The attacker uses a memory massaging technique to steer GPU page table entries toward DRAM rows with known-vulnerable bits. Then they hammer adjacent rows to flip bits in those page table entries. A single flip in the right position redirects a GPU virtual address mapping to point at CPU physical memory via the PCIe BAR1 aperture. From there, the GPU performs DMA reads and writes to arbitrary CPU memory. The attacker modifies kernel data structures and gets a root shell.

On the RTX A6000, the team achieved an average of 129 bit flips per memory bank. Compare that to GPUHammer's 8 bit flips across 4 banks.


## How GeForge differs

GeForge was built by a separate team at Purdue, University of Rochester, University of Western Australia, HydroX AI, and Clemson. Code is at github.com/stefan1wan/GeForge, and a video demo of the root shell exploit is at gddr.fail/files/geforge-demo.mp4.

The main architectural difference is where in the GPU's address translation hierarchy the attack lands. GDDRHammer corrupts the last-level page table (PT). GeForge goes one level deeper and targets the last-level page directory (PD0). The page directory contains pointers to page tables, so corrupting a PD0 entry lets the attacker forge entirely new page table mappings instead of just modifying existing ones. Broader control.

GeForge introduced three techniques that set it apart. A memory massaging strategy tuned specifically for page directory placement. A non-uniform Rowhammer pattern that varies hammering intensity across rows rather than applying uniform pressure, which produced more bit flips. And a page-anchoring technique that uses timing side-channels to locate GPU physical addresses at runtime, since the GPU physical address layout is not exposed to userspace.

Results: 1,171 bit flips on an RTX 3060. 202 bit flips on an RTX A6000. Both exploits achieve the same end state as GDDRHammer. When IOMMU is disabled (the default on most systems), the attacker gets arbitrary read/write to CPU memory and a root shell from an unprivileged user account.


## GPUBreach bypasses IOMMU

This is the one that should concern cloud operators most. GPUBreach, from the University of Toronto Computer Security Lab (the same group behind GPUHammer), will also be presented at IEEE S&P 2026. It is disclosed at gpubreach.ca.

GDDRHammer and GeForge can be blocked by enabling IOMMU, which restricts GPU DMA access to only host memory regions mapped by the OS. GPUBreach sidesteps that entirely. It starts the same way, with Rowhammer bit flips corrupting GPU page tables from an unprivileged CUDA kernel. But instead of trying to DMA into CPU memory (which IOMMU blocks), GPUBreach chains the GPU-side memory corruption with newly discovered memory-safety bugs in the NVIDIA GPU driver. The driver runs as a CPU-side kernel component. Exploiting it bypasses IOMMU because the escalation path goes through software, not hardware DMA.

That means IOMMU alone is not enough. Full technical details of the driver vulnerabilities exploited by GPUBreach are pending the IEEE S&P presentation in May.


## Which GPUs are affected

The researchers tested specific models across multiple memory technologies. The picture is clear for now.

| GPU | Memory | Architecture | Bit Flips | Status |
|-----|--------|-------------|-----------|--------|
| RTX 3060 | GDDR6 | Ampere | 1,171 | Exploit demonstrated |
| RTX A6000 | GDDR6 | Ampere | 202 | Exploit demonstrated |
| RTX 3080 | GDDR6X | Ampere | 0 | Not vulnerable |
| RTX 4060 / 4060 Ti | GDDR6 | Ada Lovelace | 0 | Not vulnerable |
| RTX 6000 Ada | GDDR6 | Ada Lovelace | 0 | Not vulnerable |
| RTX 5050 | GDDR7 | Blackwell | 0 | Not vulnerable |
| A100 | HBM2e | Ampere | 0 | On-die ECC |
| H100 | HBM3 | Hopper | Not tested | On-die ECC |
| H200 | HBM3e | Hopper | Not tested | On-die ECC |

*Source: gddr.fail, GDDRHammer and GeForge papers (IEEE S&P 2026). "Not vulnerable" = no bit flips observed in testing. "On-die ECC" = always-on hardware error correction, assessed as resistant to current single-bit techniques.*

**Confirmed vulnerable with exploits demonstrated:**

NVIDIA GeForce RTX 3060 (Ampere, GA106, 12 GB GDDR6). Showed 1,171 bit flips in GeForge testing.

NVIDIA RTX A6000 (Ampere, GA102, 48 GB GDDR6). Showed 202 bit flips in GeForge testing and averaged 129 bit flips per bank in GDDRHammer. The GDDRHammer paper states that nearly all tested RTX A6000 cards remained vulnerable under realistic settings.

**Tested with no bit flips observed:**

GeForce RTX 3080 (Ampere, GDDR6X). GDDR6X appears to have stronger in-DRAM mitigations.

GeForce RTX 4060 and RTX 4060 Ti (Ada Lovelace, GDDR6). Two samples of the Ti were tested. No bit flips on either. Ada-generation memory controllers or newer GDDR6 chip revisions may include improved defenses.

RTX 6000 Ada (Ada Lovelace, GDDR6, 48 GB). Tested by the GDDRHammer team. No bit flips induced. Some press outlets incorrectly reported this GPU as vulnerable, likely confusing it with the Ampere-generation RTX A6000. They are different products.

GeForce RTX 5050 (Blackwell, GDDR7). No bit flips. GDDR7 implements always-on, non-configurable on-die ECC.

**Not tested against these attacks but assessed:**

A100 (HBM2e). Tested in the original GPUHammer research. No bit flips observed. On-die ECC is standard.

H100 (HBM3) and H200 (HBM3e). On-die ECC enabled by default. The gddr.fail FAQ states that these GPUs "likely mask single-bit flips." The researchers add a caveat: future Rowhammer patterns causing multi-bit flips may bypass ECC, citing prior work like ECCploit and ECC.fail.

The GDDRHammer team tested 25 GDDR6 GPUs in total. Tom's Hardware reports the paper found vulnerabilities in most tested GDDR6 GPUs, suggesting bit flips were observed on additional models beyond the RTX 3060 and A6000 even if full exploits were not demonstrated on all of them.


## NVIDIA's response

As of April 5, 2026, NVIDIA has not issued a new security bulletin for GDDRHammer or GeForge. They point to the existing "Security Notice: Rowhammer, July 2025" (nvidia.custhelp.com/app/answers/detail/a_id/5671/), which was originally published July 9, 2025 in response to GPUHammer. NVIDIA characterizes Rowhammer as an industry-wide DRAM issue and says the notice reinforces already known mitigations. No CVE has been assigned as of April 5, 2026. No new driver patches or firmware updates target these attacks.

NVIDIA recommends two mitigations.

First, enabling ECC via `nvidia-smi -e 1` followed by a reboot. This activates SECDED error correction that detects and corrects single-bit errors. The trade-offs: approximately 6.25% reduction in usable VRAM (consumed by parity bits) and a performance overhead that varies by workload, typically 5 to 15% for ML inference. ECC is available on professional and datacenter GPUs like the RTX A6000, A5000, and A4000 but generally not on consumer GeForce cards. On Ampere professional GPUs like the A6000, ECC is not enabled by default. Administrators must explicitly enable it. Hopper and Blackwell datacenter GPUs have ECC on by default.

Second, enabling IOMMU in the system BIOS. This restricts GPU DMA access to only host memory regions explicitly mapped by the OS. IOMMU is disabled by default on most systems. Performance impact in passthrough mode (`iommu=pt`) is minimal for GPU workloads. Strict DMA translation mode can add 0 to 25% overhead depending on workload, though GPU workloads with large bulk transfers are less affected than networking workloads.

NVIDIA also notes that all GDDR7 and HBM GPUs feature on-die ECC that is always on and non-configurable, providing hardware-level Rowhammer protection.


## What this means for GPU cloud environments

If you run GDDR6 GPUs in a multi-tenant setup, the threat model is simple. A tenant with standard CUDA execution access (which is exactly what cloud tenants get) could run a Rowhammer attack, corrupt GPU page tables, and escalate to host memory access. From there, data belonging to other tenants on the same host is reachable. NVIDIA's default GPU time-slicing provides sufficient time windows to execute the attack.

The isolation mechanisms that matter:

**IOMMU** blocks the DMA-based escalation path used by GDDRHammer and GeForge. Major cloud providers typically enable IOMMU on hypervisor hosts since it is essential for VM isolation via VT-d and AMD-Vi. Bare-metal GPU instances may not have it enabled. But IOMMU alone does not stop GPUBreach, which escalates through the GPU driver instead of DMA. GPU passthrough in VMs with VFIO and IOMMU typically achieves 95%+ of bare-metal performance.

**MIG (Multi-Instance GPU)** provides hardware-level partitioning with isolated DRAM banks, memory channels, L2 cache, and compute units per instance. The GPUHammer paper explicitly states that MIG and Confidential Computing prevent the multi-tenant data co-location required for these exploits. The problem: MIG is only available on datacenter GPUs (A100, A30, H100, H200, B200). The RTX A6000 does not support MIG.

**SR-IOV** creates hardware Virtual Functions with IOMMU protection per VM, blocking GPU-to-CPU escalation. It does not prevent intra-GPU Rowhammer between VFs sharing the same physical GDDR6 memory.

**Time-slicing**, the default GPU sharing mode many cloud providers use, provides no protection. Tenants share DRAM banks.

The RTX A6000 is in a difficult position. It is confirmed vulnerable. It does not support MIG. ECC is off by default. If you run shared A6000 instances, enabling both ECC and IOMMU is the minimum. Recognizing that GPUBreach can bypass IOMMU through driver bugs, those are necessary but not sufficient.


## How Barrack AI A6000 instances are configured

On Barrack AI, as of April 2026, every A6000 instance is provisioned as a dedicated GPU. No other tenant shares the physical GPU while a VM is active. The host infrastructure runs with IOMMU enabled, which blocks the DMA-based escalation path used by GDDRHammer and GeForge. ECC is enabled by default on all A6000 GPUs and should not be disabled.

These three configurations address the primary attack vectors disclosed in this research. Dedicated GPU allocation eliminates the cross-tenant co-location that the attacks require. IOMMU prevents corrupted GPU page tables from reaching host CPU memory via DMA. ECC corrects single-bit flips before they can corrupt page table entries. Single-tenant GPU allocation also means the co-location required for GPUBreach's driver-based escalation is not present.

For H100 instances, HBM3 memory with on-die ECC is always active and non-configurable. No bit flips have been demonstrated on HBM GPUs using current techniques.


## The GPU attack surface keeps expanding

This is the fourth major GPU security disclosure in two years. LeftoverLocals (CVE-2023-4969, January 2024) demonstrated uninitialized local memory leakage across process boundaries on Apple, AMD, and Qualcomm GPUs, enough to reconstruct LLM responses. NVIDIA GPUs were not affected by that one. NVIDIAScape (CVE-2025-23266, CVSS 9.0) showed that a three-line Dockerfile exploiting the NVIDIA Container Toolkit could achieve complete host takeover, affecting 37% of cloud environments. GPUHammer (USENIX Security 2025) proved Rowhammer works on GPU GDDR6 memory.

Each disclosure raised the severity ceiling. Data leakage, then container escape, then model corruption, now full system compromise from unprivileged code. The trajectory from 8 bit flips in 2025 to 1,171 in 2026, from accuracy degradation to root shell, from IOMMU-blockable to IOMMU-bypassing, shows a research area that is still accelerating.

The IEEE S&P presentations in mid-May will bring full technical detail. If you are running GDDR6 GPUs in any shared capacity, the time to audit your IOMMU and ECC configuration is now, not after the conference.


## FAQ

**Which GPUs are confirmed vulnerable to GDDRHammer and GeForge?**

The NVIDIA GeForce RTX 3060 (Ampere, GDDR6) and the NVIDIA RTX A6000 (Ampere, GDDR6) are the only two GPUs with publicly demonstrated exploits. The GDDRHammer team tested 25 GDDR6 GPUs and found bit flips in most of them, but full exploit chains are only demonstrated on these two models.

**Are H100, H200, or A100 GPUs affected?**

Not by current techniques. These GPUs use HBM memory with on-die ECC enabled by default. The gddr.fail FAQ states that on-die ECC "likely masks single-bit flips." The researchers caution that future multi-bit flip attacks could potentially bypass ECC, but no such attack has been demonstrated on HBM GPUs.

**Are GDDR6X or GDDR7 GPUs vulnerable?**

No bit flips were observed on any tested GDDR6X GPU (including the RTX 3080) or GDDR7 GPU (including the RTX 5050). GDDR6X appears to have stronger in-DRAM mitigations. GDDR7 implements always-on, non-configurable on-die ECC.

**Is the RTX 6000 Ada the same as the RTX A6000?**

No. The RTX A6000 is Ampere-generation (GA102) with GDDR6 and is confirmed vulnerable. The RTX 6000 Ada is the Ada Lovelace successor with GDDR6 and was tested by the GDDRHammer team with no bit flips observed. Some press coverage has confused the two.

**Does enabling IOMMU fully protect against these attacks?**

IOMMU blocks the DMA-based escalation used by GDDRHammer and GeForge. It does not protect against GPUBreach, which bypasses IOMMU by exploiting memory-safety bugs in the NVIDIA GPU driver to escalate through software instead of hardware DMA. IOMMU is necessary but not sufficient.

**What is the performance cost of enabling ECC on an RTX A6000?**

Approximately 6.25% reduction in usable VRAM (consumed by parity bits) and a performance overhead that varies by workload, typically 5 to 15% for ML inference. ECC is enabled via `nvidia-smi -e 1` followed by a system reboot. It is not on by default on Ampere professional GPUs.

**Has NVIDIA issued a security bulletin for these attacks?**

No new bulletin as of April 5, 2026. NVIDIA directs users to the existing "Security Notice: Rowhammer, July 2025" and characterizes Rowhammer as an industry-wide DRAM issue. No CVE has been assigned as of April 5, 2026.

**Can an unprivileged cloud tenant execute these attacks?**

Yes. The attacks require only standard CUDA execution access, which is the access level GPU cloud tenants receive. NVIDIA's default GPU time-slicing provides sufficient time windows to perform the Rowhammer attack.

**What should GPU cloud operators do right now?**

Enable ECC on all GDDR6 professional GPUs (accepting the VRAM and performance trade-off). Verify IOMMU is active on all hosts. Avoid time-slicing for multi-tenant GDDR6 GPU sharing. For workloads requiring strong tenant isolation, use datacenter GPUs with MIG support (A100, H100, H200, B200). Monitor NVIDIA security notices and the IEEE S&P 2026 proceedings (May 18 to 20) for updated guidance.

**When are the full papers being presented?**

Both GDDRHammer and GeForge will be presented at the 47th IEEE Symposium on Security and Privacy (IEEE S&P 2026), May 18 through 20, 2026 in San Francisco. GPUBreach will also be presented at the same conference.

**Where can I read the full research?**

The papers, code repositories, and FAQ are at gddr.fail. GPUBreach details are at gpubreach.ca. The GDDRHammer code is at github.com/heelsec/GDDRHammer. The GeForge code is at github.com/stefan1wan/GeForge.
