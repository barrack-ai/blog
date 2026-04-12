---
title: "Fractional GPU Security: NVIDIA Says Sharing GPUs Is Not Safe"
description: "Fractional GPU security is the gap nobody talks about. NVIDIA's own documentation says MPS is not a security boundary and MIG alone does not support multi-tenancy. Published research from MICRO, CCS, ISCA, and USENIX Security has broken every fractional GPU sharing mechanism. Here is what it actually means for your workload, and why production data, model weights, and even unpublished research do not belong on shared infrastructure."
slug: fractional-gpu-security
date: 2026-04-09
authors: [dhaya]
tags: [fractional-gpu, gpu-security, multi-tenant, mig, mps, vgpu, ai-infrastructure]
image: ./fractional-gpu-security-cover.png
---

The fractional GPU pitch goes like this. Full GPUs are expensive. Most workloads do not need a full GPU. So we will slice one GPU into fractions, rent you a fraction, and pass the savings along. Pay for what you use, the marketing says. Efficient, cheap, modern.

The part of the pitch that never gets said out loud is that the fraction you rented sits on the same physical hardware as someone else's fraction, and the isolation between your work and theirs is much weaker than the marketing suggests. NVIDIA's own documentation says so directly. Published research from MICRO, CCS, ISCA, and USENIX Security has been demonstrating it for years. The gap between what NVIDIA recommends and what fractional GPU providers actually ship is the entire problem.

This post is about fractional GPU security and why fractional GPU is the wrong place for anything you care about. Not just regulated enterprise workloads. Anything that matters to the person running it. Your company's inference traffic. Your startup's model weights. Your research data. Your unpublished thesis. If the work has value to you, fractional GPU is the wrong answer.

<!-- truncate -->

## What "fractional GPU" actually means

When someone sells you a fractional GPU, one of four things is happening under the hood. The vendor almost never tells you which one, which is its own problem.

The first is MIG, NVIDIA's hardware partitioning on A100, H100, and H200 datacenter GPUs. MIG splits one physical GPU into up to seven smaller instances with dedicated memory slices and separate compute paths. NVIDIA calls this securely partitioned, and the hardware isolation is real at the memory controller and DRAM level.

The second is MPS, which stands for Multi-Process Service. MPS lets multiple processes share a single GPU by multiplexing their CUDA work. NVIDIA's own documentation says MPS is recommended for cooperative processes effectively acting as a single application. They do not market it as a security boundary because it is not one.

The third is vGPU, software virtualization run by a hypervisor component called the Virtual GPU Manager. Each virtual machine gets a virtual GPU that looks dedicated. The isolation is mediated by NVIDIA's own vGPU Manager code running in the hypervisor.

The fourth is container-level sharing, where multiple Docker containers or Kubernetes pods just hit the same GPU through the NVIDIA driver with no hardware partitioning and no multiplexing service. This is the cheapest form of sharing and the most common one used by small providers. It is also the weakest.

Each of these has been broken in published research. Not theoretical attacks. Peer-reviewed papers at top-tier security venues with code and reproduction steps.

## MPS has no security isolation and NVIDIA says so

NVIDIA's official documentation for MPS contains this sentence: MPS is only recommended for running cooperative processes effectively acting as a single application. The same documentation says MPS does not offer error isolation between clients, that scheduling hardware and memory bandwidth and caches are all shared, and that the multi-user mode explicitly drops isolation between users.

NVIDIA is not hiding this. The problem is that fractional GPU products quietly use MPS underneath and do not surface any of it to the buyer.

What happens when two tenants share a GPU via MPS has been demonstrated repeatedly. Rendered Insecure at CCS 2018 used GPU performance counter contention under MPS to fingerprint websites with around 90 percent accuracy and to infer neural network parameters from a co-located training process. A paper at ASIA CCS 2021 called Mismanaged built a TLB-based covert channel that MPS amplified by a factor of 40. Veiled Pathways at MICRO 2024 added four more side channels under MPS based on GPU DRAM frequency scaling and the NVENC, NVDEC, and NVJPEG hardware engines, all observable from unprivileged user space via NVIDIA's own monitoring APIs. The most recent attack fingerprinted 12 large language models including BERT, GPT2, and T5 with 93 percent accuracy during inference.

If your workload runs on MPS-shared GPU and another tenant cares enough to watch, they can tell what you are running. They can fingerprint your model. They can correlate your usage with your business activity. This is not theoretical.

## MIG has been broken three times

MIG is the strongest of the four sharing modes because it partitions actual hardware. NVIDIA markets it as securely partitioned with separate memory controllers and isolated paths through the memory system. Those claims are technically true for the specific things they claim to isolate. The problem is what MIG does not partition.

### Three papers, three research groups, three years

A paper at ACM CCS 2023 called TunneLs for Bootlegging reverse-engineered the GPU's translation lookaside buffer hierarchy and showed that the last-level TLB is shared across all MIG instances. The authors built a covert channel with 31 kilobits per second of bandwidth and 99.8 percent accuracy. They tested it on a commercial MIG-based sharing platform and on lab A100 and A30 GPUs.

A year later, Veiled Pathways at MICRO 2024 showed that the PCIe bus connecting the GPU to the host is also shared across MIG instances. The PCIe contention channel under MIG runs at about 6.8 kilobits per second. More importantly, the side channel version of this attack fingerprinted 12 large language models during inference with 93 percent accuracy from a different MIG instance on the same physical GPU.

A third paper is being presented at USENIX Security 2026. It targets MIG on H100 specifically, using memory barrier timing to break MIG's cache partitioning. This is the first published attack on Hopper-generation MIG. AMD issued a security bulletin in February 2026 responding to this research and confirming their own MI300 series is not affected. The full paper drops at the conference.

Three published attacks on MIG from three different research groups in three years. MIG is the strongest sharing mode NVIDIA offers and it has been broken three times.

There is one more detail buyers should know. NVIDIA's own vGPU knowledge base contains this sentence: MIG alone does not support multi-tenancy. To achieve true multi-tenancy, vGPU is required. NVIDIA is telling you in their own docs that MIG by itself is not enough. They recommend layering MIG plus vGPU. Very few providers actually do this.

## vGPU is the strongest isolation NVIDIA offers and it ships critical bugs every quarter

vGPU is conceptually the strongest of the four sharing models because it uses hypervisor-level separation, the same mechanism that isolates CPU virtual machines from each other. In theory a vGPU escape should be as hard as a regular VM escape. In practice, the vGPU Manager is a large, complex piece of software sitting directly on the hypervisor, and NVIDIA has been patching critical bugs in it on a predictable quarterly schedule for the last two years.

Take CVE-2024-0146 as the representative example. Disclosed in January 2025, it was a memory corruption bug in the vGPU Manager itself. A malicious guest VM sharing a physical GPU with other tenants could trigger the corruption through the normal vGPU interface, escape its assigned virtual GPU, execute arbitrary code on the underlying host, escalate privileges, and read information belonging to every other VM on that host. The attacker does not need root on the guest. The attacker does not need a kernel exploit. The attacker just needs to be a paying customer running a guest VM and to send the right sequence of calls through the vGPU driver. Once the bug fires, the hypervisor boundary that the entire multi-tenant isolation story depends on is gone.

This is not an isolated incident. The same pattern repeats with CVE-2025-33220 in January 2026 (use-after-free, guest-to-host escape), CVE-2025-23352 in April 2025 (uninitialized pointer, guest-to-host code execution), CVE-2024-53881 (guest-to-host denial of service), and the CVE-2024-0117 through 0121 series from October 2024 (out-of-bounds memory access). Every NVIDIA quarterly security bulletin from mid-2024 through early 2026 contains at least one vGPU-affecting vulnerability enabling some flavor of guest-to-host compromise. If your provider uses vGPU for tenant isolation, the security of your workload depends on how quickly that provider rolls out each quarterly patch, and on whether NVIDIA finds the next bug before an attacker does.

## Container-level sharing has the worst track record of all

When a provider uses neither MIG nor MPS nor vGPU, they are sharing the GPU at the container level. Multiple containers hit the same GPU through the NVIDIA driver with no partitioning. Linux cgroups and namespaces do not extend to GPU resources. The driver runs in kernel space and bypasses container boundaries entirely. This is the most common sharing mode used by smaller fractional GPU providers because it is the easiest to ship, and it is also the one with the worst security track record.

Two critical vulnerabilities in the NVIDIA Container Toolkit in the last eighteen months show what container-level sharing actually means in production.

CVE-2024-0132, disclosed September 2024, was a TOCTOU vulnerability in the NVIDIA Container Toolkit. A specially crafted container image could escape its container and gain full access to the host, including data belonging to every other container sharing that host. CVSS 9.0. Discovered by Wiz Research. It affected AWS, Google Cloud, and Azure simultaneously. All three hyperscalers had to patch their GPU-optimized machine images. Wiz confirmed in their disclosure that the attack could access the data of other customers sharing the same GPU resources in real cloud production environments. Trend Micro later found that NVIDIA's initial patch was incomplete, which extended the exposure window for everyone running the toolkit.

CVE-2025-23266, disclosed July 2025, was another container escape that Wiz Research dubbed NVIDIAScape. It was exploitable with a three-line Dockerfile via LD_PRELOAD injection in the enable-cuda-compat OCI hook. Also CVSS 9.0. Wiz stated in their writeup that it represented a systemic risk to the AI ecosystem and that it could tear down the walls separating different customers. The exploit was originally demonstrated at Pwn2Own Berlin in May 2025 before responsible disclosure.

Two critical container escape CVEs in eighteen months, both CVSS 9.0, both affecting every major cloud provider running GPUs, both giving full host takeover from a malicious container image. This is the threat model for container-level sharing.

There is a separate and more fundamental problem. GPU memory is not cleared between containers or between processes. NVIDIA's own CUDA documentation for cudaMalloc says the memory is not cleared. NVIDIA's own admin tools include a clear-memory flag because clearing is an explicit administrative action, not default behavior. Zhou et al. demonstrated in 2017 that you could recover credit card numbers, email contents, and usernames from GPU memory residues left behind by Chrome, Adobe Reader, and MATLAB. Guo et al. in 2024 showed code injection and model parameter tampering through persistent GPU memory. When your container exits, whatever was in GPU VRAM is still there waiting for the next container, and the next container is some stranger's workload.

Combining the two issues makes the picture clear. The container boundary itself has been broken twice in eighteen months, and even when it holds, the GPU memory underneath it persists across tenants by default. Container-level sharing is not a security boundary in any meaningful sense. It is a scheduling convenience that vendors sell as a security boundary because the marketing is easier.

## Rowhammer makes a hostile co-tenant the worst case

The GPU Rowhammer family (GPUHammer, GDDRHammer, GeForge, and GPUBreach) all share one property that matters specifically for shared GPU. They run from unprivileged CUDA code. They do not need root on the host. They do not need a kernel exploit. They run from exactly the access level a paying cloud tenant has by default. The most recent one, GPUBreach, reaches root shell on the host even with the IOMMU enabled, using memory-safety bugs in the NVIDIA kernel driver. The full paper and code drop on April 13 at IEEE S&P 2026.

On a shared GPU where one of the tenants is hostile, this is the worst case scenario. The attacker tenant hammers memory rows that happen to belong to your workload, or to the driver data structures that manage your memory. The attacker flips bits in your model weights and silently degrades your inference accuracy from 80 percent to 1 percent. The attacker corrupts page tables and reads your memory directly. None of this is detectable from the host side because there is no eBPF hook that watches GPU memory access patterns. The attack surface and the monitoring surface are on different sides of a wall, which is the subject of the next post in this series.

## Who this actually matters for

Shared GPU is the wrong place for anything you would care about losing. The line is not about company size or budget. It is about whether your work has value to you.

It includes company production inference on customer data, which is obvious. It also includes startup model weights that took months to fine-tune and represent the core of what makes your product valuable. Those weights sit in GPU memory during inference. A neighbor tenant can fingerprint them. A neighbor tenant running GPUBreach can potentially read them.

It includes any research where the data is sensitive. Medical imaging models. Models trained on scraped data you do not want traced back to you. Fine-tunes on conversational data from beta users. Anything under NDA.

It includes unpublished student research. A PhD student training a novel architecture for a paper submission has exactly the thing most worth protecting, which is unpublished work someone else could scoop. A thesis model trained on a novel dataset is valuable specifically because it has not been released yet. Running that on a fractional GPU where another tenant could fingerprint the model architecture, observe the training patterns, or recover leftover memory is a risk the student probably does not realize they are taking.

It includes any work where you would be embarrassed or professionally damaged if the data leaked.

A student has no budget. A student still has research they care about. The question is not whether you can afford isolation. The question is whether your work deserves it. For almost any work that took effort to produce, the answer is yes.

## Affordable isolation exists

The bad version of this post would end with "therefore buy bare metal," as if the only alternative to fractional GPU is paying market rates for dedicated H100 nodes. That is not true. Isolation is cheaper than the fractional GPU marketing wants you to believe, and every option below has one thing in common: the provider does not have to sell your neighbor a slice of the same card to make the economics work. That is the entire reason fractional GPU exists as a product category, and it is the entire reason the alternatives are safer.

For students and researchers in the United States, NSF ACCESS allocations are free and provide H100, H200, and GH200 access at national HPC centers. Every job gets its own allocated node with full hardware isolation. The application takes one form and a letter from an advisor. For researchers outside the US, most major universities have institutional HPC clusters with similar isolation properties.

Spot and preemptible instances on the hyperscalers offer full dedicated GPU isolation at 60 to 80 percent discount off on-demand rates. AWS T4 spot instances run around 10 cents an hour, which is cheaper than most fractional GPU products on the market. Google Cloud preemptible and Azure spot work the same way. The catch is that the instance can be reclaimed at short notice, which is fine for batch training and bad for production inference.

Bare metal providers and dedicated GPU specialists give you the full GPU with no co-tenant at per-hour prices that, for small workloads, are comparable to fractional alternatives once you account for the fact that you are getting a whole GPU instead of an eighth of one.

Running locally on a consumer RTX 3090 or 4090 costs nothing per hour after the initial purchase. For students doing long-running training on their own data, a used RTX 3090 for around 700 dollars pays for itself against cloud rentals in a few weeks of active use. The hardware sits in your room, no one else has access to it, and there is no isolation question to ask.

None of these is as cheap per hour as a one-eighth GPU slice on a shared service. But per hour is the wrong metric. The right metric is cost per unit of work you actually care about, and for work that matters, the cost of a leak is infinite.

## Questions to ask your provider

If you are evaluating a GPU cloud service right now and cannot tell from the marketing whether your workload is safe, three questions will tell you everything you need to know. A provider who cannot answer them specifically is telling you something by the silence.

**Which isolation technology do you use to separate tenants on shared GPUs?** The answer should be a specific technology, not a brand name. MIG, MPS, vGPU, container-level, time-slicing, or some combination. If the provider says "proprietary" or "custom" or routes you to sales, they are using one of the four and do not want to say which. If they say MIG, ask whether it is layered with vGPU per NVIDIA's own multi-tenancy recommendation. If they say MPS, ask how they address NVIDIA's documented position that MPS is not a security boundary. If they say vGPU, ask about their patch cadence for the quarterly CVEs. If they say container-level, the conversation is already over.

**Do you clear GPU memory between tenants, and how?** NVIDIA's default behavior is not to clear. Clearing requires an explicit administrative action. A provider that has actually thought about this will be able to describe their process in one or two sentences. A provider that has not will either claim NVIDIA does it automatically (it does not) or route the question to engineering and never come back.

**Is my workload ever scheduled on the same physical GPU as another customer, and can I pay more to guarantee dedicated hardware?** This is the question that exposes whether the provider treats isolation as a product decision or a cost decision. A provider that offers a dedicated tier at a premium has thought about the tradeoff and is letting you make the choice. A provider that cannot offer dedicated hardware at any price has built their economics on fractional GPU and cannot afford to give any customer the full card.

If the answers are vague, defensive, or routed to marketing, the provider is not thinking about this problem at the level your work deserves. Take that as data.

## FAQ

**Is fractional GPU ever acceptable?**

The published attacks in this post apply to every fractional GPU workload regardless of what is running on it. If you have nothing on the GPU that would matter to you if it leaked or got corrupted, the consequences do not affect you, but the attack surface is the same. There is no fractional GPU configuration that is meaningfully safer than another for sensitive work.

**Does MIG make fractional GPU safe?**

Not on its own. Three published papers have demonstrated attacks that break MIG isolation, including one on H100 that will be presented at USENIX Security 2026. NVIDIA's own documentation states that MIG alone does not support multi-tenancy and that vGPU is required for true multi-tenancy. Very few providers actually layer MIG plus vGPU.

**Why is MPS even a thing if it has no security isolation?**

MPS exists for performance reasons, not security. It lets multiple cooperative processes from the same application share a GPU efficiently. NVIDIA is clear in their documentation that MPS is recommended only for cooperative processes. Problems arise when providers use MPS to share a GPU across different untrusted tenants and do not disclose this to buyers.

**What about vGPU, which is supposed to be the secure option?**

vGPU is the strongest isolation model NVIDIA offers for multi-tenant GPU, and it is the right choice if you need shared infrastructure. The practical problem is that the vGPU Manager has been a persistent source of critical vulnerabilities. Every NVIDIA quarterly security bulletin in the last eighteen months has contained vGPU-affecting bugs enabling guest-to-host escape. If your provider uses vGPU, ask about their patch cadence.

**Are GPU memory leaks actually exploitable or just theoretical?**

Exploitable and demonstrated. LeftoverLocals recovered 181 MB of LLM response data per query from AMD, Apple, and Qualcomm GPUs. Academic research has recovered credit card numbers, email contents, and rendered webpages from GPU memory residues. NVIDIA GPUs are not vulnerable to LeftoverLocals specifically, but GPU memory is still not cleared by default between processes on NVIDIA hardware, which enables other recovery attacks.

**Does running on a hyperscaler like AWS, GCP, or Azure protect me?**

The hyperscalers mostly sell dedicated GPU instances for production workloads, not shared ones. When they do sell fractional GPU products, their own documentation is clear that these offer no memory or fault isolation. Both of the recent critical container escape CVEs affected GPU machine images on all three hyperscalers. Being on a big cloud does not automatically mean your GPU workload is isolated.

**What about students on tight budgets who really cannot afford anything else?**

Free isolation exists. NSF ACCESS provides free H100 and H200 access to U.S. academic researchers, with per-job node allocation. Most major universities have institutional HPC clusters available to students. Student credits from AWS, Google Cloud, and Azure cover dedicated instances for the first few months. For long-running training, a used RTX 3090 at around 700 dollars pays for itself against cloud rentals in a few weeks. None of these requires buying into a fractional GPU product.

**How do I tell if my current provider is secure?**

Ask them specifically which isolation technology they use, whether they clear GPU memory between tenants, and whether your workload is ever scheduled on the same physical GPU as another customer. A provider that cannot give specific answers is probably not thinking about this problem at the level your work deserves.

**Is bare metal the only fully safe option?**

Bare metal removes the hypervisor layer entirely, which eliminates the vGPU Manager attack surface along with it. Dedicated VM instances on hyperscalers still depend on the hypervisor and still inherit whatever vGPU Manager bugs exist at any given time, but they are otherwise well isolated at the GPU level because the VM is the only tenant on the card. Spot and preemptible dedicated instances offer the same GPU-level isolation at significant discount but can be reclaimed at short notice. All three options are meaningfully safer than fractional GPU. Bare metal is the cleanest of the three because it has the fewest layers of software between your workload and the hardware.

**Where can I read more?**

The Veiled Pathways paper from MICRO 2024 is the most direct evidence for MIG and MPS side channels. TunneLs for Bootlegging from CCS 2023 is the first MIG isolation break. The Trail of Bits LeftoverLocals writeup from January 2024 is the most readable introduction to GPU memory leakage. The Wiz Research writeups for CVE-2024-0132 and CVE-2025-23266 explain the container escape attacks. The GPUHammer, GDDRHammer, and GPUBreach project pages cover the Rowhammer family, with the full GPUBreach paper and code dropping April 13 at IEEE S&P 2026.
