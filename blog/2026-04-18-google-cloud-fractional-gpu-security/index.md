---
title: "Google Cloud Fractional G4 Uses vGPU, Not MIG. Here Is Why That Matters."
description: "Google Cloud's new fractional G4 VM preview on RTX PRO 6000 Blackwell uses NVIDIA vGPU time-slicing for multi-tenant isolation instead of MIG hardware partitioning. The NVIDIA Virtual GPU Manager has shipped guest-to-host code execution CVEs in every quarterly security bulletin for two years. This post breaks down what fractional G4 buyers are actually getting."
slug: google-cloud-fractional-g4-vgpu-security
date: 2026-04-18
authors: [dhaya]
tags: [fractional-gpu, gpu-security, vgpu, google-cloud, mig, multi-tenant, ai-infrastructure]
image: ./google-cloud-fractional-g4-vgpu-security-cover.png
---

Google Cloud announced fractional G4 VMs at GTC 2026 in March. The pitch is straightforward. The RTX PRO 6000 Blackwell Server Edition is a 96 GB GDDR7 GPU. Most workloads do not need all 96 GB. So Google slices one physical GPU into fractions (1/8, 1/4, 1/2) and sells you only what you need. Pay less, get less. Simple.

What Google does not say in the announcement, but does say in the documentation, is how that slicing works. The fractional G4 shapes use NVIDIA vGPU. Not MIG. That is a specific technical choice with specific security consequences, and the distinction matters if you are putting anything sensitive on a fractional instance.

This post covers what fractional G4 is actually built on, what NVIDIA's own documentation says about vGPU isolation versus MIG isolation, the Virtual GPU Manager's CVE history over the past two years, and what all of this means for workloads that care about tenant separation.

<!-- truncate -->

## What fractional G4 is built on

Google's Compute Engine documentation for the accelerator-optimized machine family spells it out directly. Fractional GPU support on G4 is a preview feature that "allows a single physical GPU to be shared by multiple virtual machine (VM) instances" using NVIDIA vGPU technology. The available shapes are g4-standard-6 (1/8 GPU, 6 vCPUs, 22 GiB RAM), g4-standard-12 (1/4 GPU), and g4-standard-24 (1/2 GPU). The full single-GPU shape is g4-standard-48 with 48 vCPUs and 180 GB RAM.

Google's documentation for creating G4 instances also states that MIG is a separate feature available on the same hardware: "With MIG mode enabled, the single GPU is partitioned into as many as seven independent GPU instances. Each instance runs simultaneously, each with its own memory, cache, and streaming multiprocessors. This is distinct from using G4 machine types that have fractional GPUs attached, where multiple workloads share access to a single physical GPU through fractional (vGPUs) partitioning."

That last sentence is worth reading twice. Google is telling you, in their own docs, that fractional G4 (vGPU) and MIG are different things. They chose vGPU for the fractional product.

Fractional G4 instances require a specific NVIDIA vGPU guest driver (Linux build 580.126.09 or later from Google's driver bucket) that "connects to the physical machine's host driver." That host driver is the NVIDIA Virtual GPU Manager, and it is the software component that enforces tenant isolation in a vGPU deployment. Because Compute Engine needs to verify the VM's identity to authenticate the vGPU driver, fractional G4 instances cannot be created with the `--no-service-account` flag.

The feature is still in preview. Access requires an allowlist. Google's docs state: "To create G4 instances that have less than one GPU attached (fractional GPUs) (Preview), you must be using a Google Cloud project that's been added to the allowlist for the preview." Initial availability is limited to us-central1-b (Iowa). No GA date is published.

## What vGPU shares versus what MIG isolates

The security difference between vGPU and MIG comes down to what hardware resources are shared between tenants and what resources are dedicated.

NVIDIA's Virtual GPU Software User Guide describes the vGPU architecture: "All vGPUs resident on a physical GPU share access to the GPU's engines including the graphics (3D), video decode, and video encode engines. In a time-sliced vGPU, processes that run on the vGPU are scheduled to run in series." In time-sliced vGPU, which is what Google's fractional G4 preview uses, only framebuffer is spatially partitioned. The streaming multiprocessors, L2 cache, memory controllers, DRAM bus, copy engines, NVENC, and NVDEC are all shared and time-sliced across tenants.

MIG works differently at the hardware level. NVIDIA's MIG User Guide states: "With MIG, each instance's processors have separate and isolated paths through the entire memory system, the on-chip crossbar ports, L2 cache banks, memory controllers, and DRAM address busses are all assigned uniquely to an individual instance." That is hardware partitioning. The silicon itself enforces the boundary.

NVIDIA's own knowledge base goes further. It says "MIG alone does not support multi-tenancy. To achieve true multi-tenancy, vGPU is required. When combined with MIG, vGPU allows the hypervisor to assign individual MIG-backed vGPUs to individual VMs." And NVIDIA's troubleshooting documentation recommends: "If users require hardware partitioning and strict resource isolation in a multi-tenant environment, they should use vGPU within MIG partitions."

That combined mode, MIG-backed vGPU, is the configuration NVIDIA recommends for multi-tenant security. It gives you hardware-partitioned resources (MIG) plus hypervisor-enforced VM isolation (vGPU). Google's fractional G4 preview uses time-sliced vGPU without MIG. That is the less isolated of the two configurations NVIDIA documents.

The RTX PRO 6000 Blackwell Server Edition supports up to four MIG instances of 24 GB each. Google's G4 documentation confirms MIG is available on G4 hardware. But the fractional product (the g4-standard-6/12/24 shapes) uses time-sliced vGPU, not MIG-backed vGPU.

Here is what that means in practice:

In time-sliced vGPU (fractional G4), framebuffer is partitioned but streaming multiprocessors are shared and time-sliced. L2 cache banks are shared. Memory controllers and DRAM bus are shared. NVENC, NVDEC, and copy engines are shared. Fault isolation is partial. The attack surface is the vGPU Manager plus the hypervisor.

In MIG or MIG-backed vGPU, each instance gets a dedicated memory slice, dedicated streaming multiprocessors, dedicated L2 cache banks, dedicated memory controllers and DRAM bus, and dedicated NVENC/NVDEC/copy engines per instance. Fault isolation is hardware-enforced. The attack surface shifts to the hardware partition boundaries.

## The Virtual GPU Manager's CVE history

The NVIDIA Virtual GPU Manager runs with elevated privileges on the hypervisor host. It mediates all guest-to-host messaging in a vGPU deployment. It is the primary security boundary for fractional G4, and NVIDIA has patched it in every quarterly security bulletin from February 2024 through January 2026.

The July 2025 bulletin (NVIDIA Answer ID 5670) is the most relevant cluster. CVE-2025-23283 and CVE-2025-23284 are stack buffer overflows in the Virtual GPU Manager, each rated CVSS 7.8. A low-privileged guest can trigger memory corruption leading to code execution, privilege escalation, information disclosure, and data tampering on the hypervisor host. CVE-2025-23290, rated CVSS 2.5, is a cross-VM information disclosure where a guest VM can read global GPU metrics influenced by other VMs. That is the first publicly acknowledged leakage of co-tenant activity through the vGPU Manager. CVE-2025-23285, rated CVSS 5.5, allows a guest to consume global resources and deny service to neighbor tenants.

The October 2025 bulletin added CVE-2025-23352, rated CVSS 7.8, an access-of-uninitialized-pointer bug in the Virtual GPU Manager with the same code-execution and privilege-escalation impact.

The January 2026 bulletin (Answer ID 5747) added CVE-2025-33220, rated CVSS 7.8, a use-after-free in the Virtual GPU Manager on XenServer, vSphere, RHEL KVM, Ubuntu KVM, and Azure Stack HCI. Again, malicious guest to host code execution. This CVE was fixed in vGPU Manager build 580.129.08. Google's preview driver is build 580.126.09, which was released before this fix.

Going back further into 2024, CVE-2024-0127, rated CVSS 7.8, was an improper input validation in the vGPU Manager that permitted guest-to-host code execution. It was reported by Cisco Talos and Microsoft's Offensive Research and Security Engineering Team (MORSE). CVE-2024-0128, rated CVSS 7.1, was a global-resource-access bug. The April 2025 bulletin added CVE-2025-23244, rated CVSS 7.8, a Linux driver improper authorization vulnerability reported by Google's own Xingyu Jin.

The reporters across these bulletins include Microsoft MORSE, Cisco Talos (Piotr Bania), Google (Xingyu Jin), Kentaro Kawane, Sam Lovejoy, Valentina Palmiotti, and Thomas Keefer. That is sustained attention from multiple top-tier offensive security teams. No public in-the-wild exploitation of vGPU Manager bugs has been documented to date.

The container toolkit is a separate attack surface but worth noting. Wiz Research disclosed CVE-2024-0132, rated CVSS 9.0, a TOCTOU container escape in NVIDIA Container Toolkit versions through 1.16.1. The patch was incomplete, leading to CVE-2025-23359, also rated CVSS 9.0. Wiz then disclosed CVE-2025-23266, dubbed "NVIDIAScape," at Pwn2Own Berlin in July 2025. That one is also rated CVSS 9.0 and affects Container Toolkit through 1.17.7. These target Docker and Kubernetes deployments, not vGPU directly, but they matter for any G4 workload that pulls in NVIDIA's container stack.

## What academic research has and has not proven

The only publicly documented end-to-end guest-to-host vGPU escape presented at a major security venue is Wenxiang Qian's Tencent Blade presentation at Black Hat USA 2021, titled "Another Road Leads to the Host: From a Message to VM Escape on NVIDIA vGPU." That work chained three bugs (a stack leak, a heap overflow, and an unlink primitive) to achieve root on the hypervisor, producing CVE-2021-1080 through CVE-2021-1087.

The Veiled Pathways paper from MICRO 2024 (Miao et al., Penn State and Duke) is the most cited recent GPU side-channel work, but its scope is explicitly MPS and MIG, not vGPU. It found covert and side channels in what the authors call the GPU "uncore" (NVENC utilization, NVDEC utilization, NVJPEG utilization, GPU DRAM frequency scaling) that bypass both MPS and MIG isolation and are observable via unprivileged NVML calls. Those same uncore engines are shared across tenants in time-sliced vGPU as well, so the attack primitives are relevant to fractional G4 even though the paper did not test that configuration directly.

Other cross-VM side-channel work on NVIDIA vGPU includes LockedDown (EuroS&P 2022), which built a PCIe contention covert channel on GRID RTX6000-4Q on Chameleon Cloud, and NVBleed (arXiv 2503.17847, 2025), which demonstrated NVLink-based cross-VM inference on Google Cloud. Neither achieved a hypervisor escape. Both demonstrated that co-tenant activity is observable through shared hardware resources.

No peer-reviewed paper published after the 2021 Tencent Blade work has demonstrated a vGPU hypervisor escape. But NVIDIA's own bulletin cadence shows the bugs keep arriving quarterly.

## GDDR7 is not the problem

GPUHammer (USENIX Security 2025, Lin, Qu, and Saileshwar at the University of Toronto) induced bit flips on RTX A6000 (GDDR6) but found no flips on RTX 3080 (GDDR6X), A100 (HBM2e), or RTX 5090 (GDDR7). GDDRHammer and GeForge (IEEE S&P 2026, disclosed April 2 via gddr.fail) tested RTX 5050 (GDDR7) and also observed zero bit flips.

The RTX PRO 6000 Blackwell Server Edition uses 96 GB of GDDR7. GDDR7 has mandatory on-die ECC per the JEDEC JESD239 specification. It cannot be disabled. NVIDIA's July 2025 Rowhammer Security Notice (Answer ID 5671) confirms that OD-ECC is always enabled on GDDR7 products.

Rowhammer is not a near-term cross-VM threat on the RTX PRO 6000. The silicon is fine. The attack surface that matters for fractional G4 is the software stack sitting above the silicon.

## AWS and Azure made the same bet

Every major hyperscaler now sells fractional GPU instances, and all of them use NVIDIA vGPU for the fractional product. Not MIG.

AWS launched EC2 G6f and Gr6f on July 29, 2025. These are NVIDIA L4-based instances available in 1/8, 1/4, and 1/2 GPU sizes, managed via the NVIDIA GRID driver. AWS documentation notes that G6f fractional instances do not support MIG on top of vGPU. MIG on AWS is available only inside whole-GPU instances (P4d with A100, P5 and P5e with H100/H200, P6b with B200) and is customer-configured.

Azure has been in this market the longest. NVads A10 v5 (GA in 2022) and the earlier NVsv3 (M60, 2019) use SR-IOV-based vGPU with fractions at 1/6, 1/3, 1/2, and full. MIG on Azure is available on NC40ads_H100_v5 and ND96isr_H100_v5 VMs but must be set at AKS node pool creation time.

Google's G4 fractional is the newest entrant but the first to market on Blackwell RTX PRO 6000 and the first to offer 1/8 granularity on this tier of silicon. The shared pattern across all three is worth noting: no hyperscaler currently sells pre-partitioned MIG slices as discrete SKUs. You rent whole GPUs and configure MIG yourself, or you rent vGPU slices with the Virtual GPU Manager as the security boundary. The fractional GPU market is, for now, a vGPU market.

## What this means for workload decisions

Fractional G4 is a legitimate option for workloads that already trust Google Cloud's multi-tenant isolation for CPU and memory. Remote desktops, lightweight inference, video transcoding, graphics applications. If you are comfortable with the same risk model you accept when you share a physical server with other Google Cloud customers through standard VMs, fractional G4 is a cost optimization on top of that model.

But fractional G4 is not equivalent to a dedicated GPU. The preview uses time-sliced vGPU rather than MIG-backed vGPU, which is the configuration NVIDIA's own documentation reserves for "strict resource isolation in a multi-tenant environment." The software boundary between you and your neighbor is the NVIDIA Virtual GPU Manager, a component with eight quarterly bulletins worth of CVSS 7.8 guest-to-host code execution flaws in the past two years and a documented cross-VM metrics leak. The Veiled Pathways uncore side channels, demonstrated against MPS and MIG, apply to the shared NVENC and NVDEC engines that time-sliced vGPU does not partition.

If your workload involves proprietary model weights, production inference on sensitive data, unpublished research, or anything where a co-tenant observing your GPU activity is a threat, you need to understand that fractional G4 gives you software isolation, not hardware isolation. That is not a flaw in Google's implementation. That is what vGPU is. AWS G6f and Azure NVads A10 v5 work the same way.

The alternative on Google Cloud is to rent a full g4-standard-48 (one whole RTX PRO 6000) and optionally configure MIG yourself. Or rent a dedicated-node commitment where no other customer's VMs run on the same physical host.

## FAQ

**Is Google Cloud fractional G4 generally available?**

No. As of April 2026, fractional G4 is in preview and requires your Google Cloud project to be added to an allowlist. It is available only in us-central1-b (Iowa). No GA date has been announced.

**What GPU does the G4 series use?**

The NVIDIA RTX PRO 6000 Blackwell Server Edition with 96 GB of GDDR7 memory, 24,064 CUDA cores, 752 fifth-generation Tensor Cores, and 188 fourth-generation RT Cores.

**What is the difference between fractional G4 vGPU and MIG on G4?**

Fractional G4 uses NVIDIA vGPU time-slicing where framebuffer is partitioned but streaming multiprocessors, L2 cache, memory controllers, DRAM bus, and video encode/decode engines are shared and time-sliced across tenants. MIG uses hardware partitioning where each instance gets dedicated memory, compute, cache, and engine resources. Google's documentation explicitly states these are distinct features. The fractional g4-standard-6/12/24 shapes use vGPU. MIG is available separately on full-GPU G4 instances and supports up to four partitions on the RTX PRO 6000.

**Has the NVIDIA Virtual GPU Manager been exploited in the wild?**

No public in-the-wild exploitation of vGPU Manager vulnerabilities has been documented. However, NVIDIA has patched guest-to-host code execution flaws (rated CVSS 7.8) in the Virtual GPU Manager in every quarterly security bulletin from February 2024 through January 2026. Reporters include Microsoft MORSE, Cisco Talos, and Google.

**Is the RTX PRO 6000 vulnerable to GPU Rowhammer attacks?**

No published research has demonstrated Rowhammer bit flips on GDDR7 memory. GPUHammer (USENIX Security 2025) and GDDRHammer (IEEE S&P 2026) both tested GDDR7 GPUs and observed zero bit flips. GDDR7 has mandatory on-die ECC per the JEDEC JESD239 specification that cannot be disabled.

**Does NVIDIA recommend time-sliced vGPU for multi-tenant deployments?**

NVIDIA's documentation recommends MIG-backed vGPU (the combined mode) for multi-tenant environments requiring hardware partitioning and strict resource isolation. Time-sliced vGPU alone provides VM-level isolation through the hypervisor and Virtual GPU Manager but shares GPU compute and engine resources across tenants.

**How does Google Cloud's fractional GPU compare to AWS and Azure?**

All three hyperscalers use NVIDIA vGPU for their fractional GPU products. AWS G6f/Gr6f uses NVIDIA L4 with vGPU. Azure NVads A10 v5 uses NVIDIA A10 with SR-IOV-based vGPU. Google G4 fractional uses RTX PRO 6000 Blackwell with vGPU. None of them sell pre-partitioned MIG slices as discrete instance types. MIG is available on all three clouds but only on whole-GPU instances where the customer configures it.

**What should I use instead of fractional G4 for sensitive workloads?**

On Google Cloud, the full g4-standard-48 gives you one entire RTX PRO 6000 with no co-tenants on the GPU. You can optionally enable MIG for internal workload partitioning. For the strongest isolation, sole-tenant nodes guarantee no other customer's VMs share the physical host. Bare metal providers offer dedicated hardware with no hypervisor layer.

**Where can I read more about GPU multi-tenant security?**

NVIDIA's MIG User Guide and Virtual GPU Software User Guide document the isolation properties of each technology. The Veiled Pathways paper (MICRO 2024) covers GPU uncore side channels. GPUHammer (USENIX Security 2025) and GPUBreach (IEEE S&P 2026) cover GPU memory attacks. NVIDIA's quarterly security bulletins list all patched vGPU Manager CVEs with CVSS scores and affected versions.
