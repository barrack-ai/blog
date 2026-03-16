---
title: "NVIDIA Rubin at GTC 2026: Full Technical Breakdown for ML Engineers"
description: "NVIDIA's Rubin platform ships H2 2026 with 336B transistors, 288 GB HBM4 per GPU, 22 TB/s bandwidth, and a claimed 10x inference cost reduction over Blackwell. Here is everything confirmed, everything projected, and what it actually means for GPU cloud costs."
slug: nvidia-rubin-specs-architecture-2026
authors: [dhaya]
keywords:
  - NVIDIA Rubin
  - GTC 2026
  - Vera Rubin NVL72
  - GPU cloud pricing
  - H100 vs H200 vs B200 vs Rubin
  - MoE inference cost
  - NVIDIA Rubin specs
  - AI GPU 2026
  - Rubin vs Blackwell
  - GPU cloud for startups
tags: [nvidia, rubin, gtc-2026, gpu-cloud, inference, ml-infrastructure]
image: ./nvidia-rubin-gtc-2026-og.png
---

336 billion transistors. 288 GB of HBM4 per GPU. 22 TB/s memory bandwidth. 50 petaFLOPS of FP4 inference per chip.

Those are the numbers NVIDIA is putting behind Rubin, the successor to Blackwell, announced at CES 2026 and entering production for H2 2026 deployment. GTC 2026 kicks off March 16 in San Jose, where Jensen Huang is expected to go deep on Rubin's architecture, pricing signals, and the software stack updates that make these numbers real.

<!-- truncate -->

This post covers what is confirmed, what is projected by NVIDIA, and where the claims need scrutiny. If you are evaluating GPU infrastructure for the next 12 months, this is the breakdown that matters.

## GTC 2026: what is happening and when

GTC 2026 runs March 16 to 19 across 10 venues in downtown San Jose. Jensen Huang's keynote is at the SAP Center on Monday, March 16 at 11:00 AM PT. It is a two-hour address covering accelerated compute, AI factories, agentic systems, and physical AI.

The event hosts 30,000+ attendees from 190+ countries with 1,000+ sessions and 70+ hands-on labs. The keynote will be preceded by a pregame show at 8:00 AM featuring CEOs from Perplexity, LangChain, Mistral AI, and Skild AI.

Beyond Rubin, GTC is expected to feature NemoClaw (an open-source enterprise AI agent platform) and possibly a new inference chip tied to NVIDIA's ~$20 billion Groq acquisition. Financial analysts also expect a Feynman architecture tease, which is the post-Rubin generation targeting 2028.

## Rubin GPU: the architecture in detail

The Rubin GPU (R200/VR200) is built on TSMC 3nm using a multi-chip module design. Two near-reticle-sized compute dies plus two I/O dies sit on a 4x reticle-size CoWoS-L interposer alongside eight HBM4 stacks. Total transistor count: 336 billion, which is 1.6x Blackwell's 208 billion.

Each GPU has 224 Streaming Multiprocessors with sixth-generation Tensor Cores supporting FP4, FP6, FP8, FP16, BF16, TF32, FP32, and FP64 precisions. The third-generation Transformer Engine adds hardware-accelerated adaptive compression that dynamically adjusts precision across transformer layers using a two-level micro-block scaling scheme for NVFP4 format.

The memory numbers are where Rubin makes its biggest jump. Each GPU has 288 GB of HBM4 across 8 stacks delivering up to 22 TB/s of memory bandwidth. That is 2.8x over Blackwell's 8 TB/s and 6.6x over H100's 3.35 TB/s. HBM4 doubles the interface width to 2,048 bits per stack versus HBM3e.

Here is the per-GPU compute breakdown:

| Precision | Rubin R200 | Blackwell B200 | Hopper H100 | Rubin vs B200 |
|-----------|-----------|----------------|-------------|---------------|
| NVFP4 Inference | 50 PFLOPS | ~10 PFLOPS | N/A | 5x |
| NVFP4 Training | 35 PFLOPS | ~10 PFLOPS | N/A | 3.5x |
| FP8 (estimated) | ~16 PFLOPS | ~9 PFLOPS | 3.96 PFLOPS | ~1.8x |
| FP32 Vector | 130 TFLOPS | 80 TFLOPS | 67 TFLOPS | 1.6x |
| FP64 Matrix | 200 TFLOPS | 150 TFLOPS | 67 TFLOPS | 1.3x |

TDP sits at approximately 1,800 to 2,300W per GPU. NVIDIA reportedly increased from the original 1,800W target to 2,300W (Max-P) to compete with AMD's MI455X, with a 1,800W Max-Q software-configurable profile. This is a significant jump from Blackwell's 1,000W and mandates 100% liquid cooling. No air-cooled Rubin configuration exists.

## Vera CPU: NVIDIA's fully custom ARM processor

Vera is not an off-the-shelf ARM Neoverse derivative. It is a fully custom design with 88 "Olympus" cores, Armv9.2 compatible, and 176 threads via Spatial Multi-Threading (which physically partitions core resources rather than time-slicing). The die has 227 billion transistors in a monolithic design.

Vera is the first CPU to support FP8 precision natively, with 6x 128-bit SVE2 SIMD units per core. It delivers 2x performance over Grace in data processing and compression workloads. Memory capacity reaches 1.5 TB LPDDR5X at 1.2 TB/s bandwidth (versus Grace's 480 GB at 512 GB/s). It connects to Rubin GPUs via NVLink-C2C at 1.8 TB/s, which is 7x faster than PCIe Gen 6.

A Vera Rubin Superchip combines one Vera CPU with two Rubin GPUs.

## The 10x token cost claim: what is real and what needs scrutiny

NVIDIA's headline claim is a 10x reduction in inference token cost versus Blackwell. This is the number that will drive GPU cloud purchasing decisions for the next 12 months, so it deserves careful examination.

**What the benchmark actually measures:** The 10x figure is benchmarked on the Kimi-K2-Thinking model (a Mixture of Experts model) at 32K input / 8K output sequence lengths, comparing Vera Rubin NVL72 against GB200 NVL72. This is a specific MoE model at specific sequence lengths on a specific system configuration. It is not a general-purpose 10x improvement across all workloads.

**Why MoE models see the biggest gains:** Over 60% of open-source model releases in 2025 used MoE architectures. The top 10 most capable open models (DeepSeek-R1, Kimi K2, Mistral Large 3, Llama 4) all use MoE. These models route tokens to only 2 to 8 experts per token out of hundreds, creating massive all-to-all communication demands between GPUs and heavy dynamic memory access patterns.

Rubin's MoE advantage comes from several features working together. NVLink 6 provides 3.6 TB/s per GPU with full all-to-all connectivity, which is 2x higher throughput for the communication patterns that MoE expert routing demands. SHARP in-network compute (14.4 TFLOPS FP8 per NVLink switch tray) offloads collective operations. The 22 TB/s HBM4 bandwidth eliminates the memory bottleneck when dynamically loading expert parameters. And the Transformer Engine's adaptive compression handles naturally sparse MoE data streams.

**Where the claim likely does not hold:** If you are running dense transformer inference (non-MoE models like the original Llama 2/3 dense variants, or custom fine-tuned dense models), the real improvement is closer to 2 to 3x over Blackwell. The 10x number is heavily dependent on MoE routing patterns and long sequence lengths. Short-context dense inference will not see anywhere near 10x.

**The 4x training claim also needs context:** NVIDIA says Rubin trains MoE models with 4x fewer GPUs. This is benchmarked on training a 10-trillion-parameter MoE model on 100 trillion tokens in a fixed one-month window. As analyst Timothy Prickett Morgan noted: 4x reduction in GPU count does not mean 4x reduction in cost, since per-GPU pricing for Rubin will be higher than Blackwell.

That said, even with a per-GPU premium, the capital expenditure math is significant. If a training run previously required 4 NVL72 racks at ~$3.35M each ($13.4M total), completing it on a single Rubin rack at $3.5 to 4M represents roughly 70% capex reduction.

## Vera Rubin NVL72: the rack-scale system

The NVL72 is the actual deployment unit. It packs 72 Rubin GPUs and 36 Vera CPUs into NVIDIA's third-generation MGX (Oberon) rack. It maintains the same physical form factor as Blackwell NVL72 for drop-in upgrades.

| NVL72 Metric | Vera Rubin | Grace Blackwell | Improvement |
|-------------|-----------|-----------------|-------------|
| NVFP4 Inference | 3.6 EFLOPS | ~720 PFLOPS | 5x |
| Total HBM | 20.7 TB | ~13.5 TB | 1.5x |
| HBM Bandwidth | 1.6 PB/s | ~576 TB/s | 2.8x |
| NVLink Bandwidth | 260 TB/s | 130 TB/s | 2x |
| System Memory (LPDDR5X) | 54 TB | ~17 TB | 3.2x |
| Total Fast Memory | ~75 TB | ~30 TB | 2.5x |

The rack uses an 800V DC power architecture (departing from previous 48V distribution) and requires 100% liquid cooling with 45 degree C inlet water. A cable-free modular tray design enables 5-minute tray installation versus 2 hours for Blackwell. The system exceeds 250 kW total power.

Networking is three-layered: NVLink 6 for 260 TB/s scale-up bandwidth, ConnectX-9 SuperNICs at 1.6 Tb/s per GPU for Spectrum-X Ethernet scale-out, and 36 BlueField-4 DPUs per rack for storage, security, and infrastructure offload.

## Spectrum-X Photonics and BlueField-4

Spectrum-X Ethernet Photonics is the first co-packaged optics (CPO) Ethernet switching platform, built on the Spectrum-6 ASIC at TSMC 3nm. The SN6800 switch delivers 409.6 Tb/s across 512 ports at 800 Gb/s. By embedding optical engines directly on the switch package, NVIDIA eliminates pluggable transceivers entirely, achieving 5x power reduction per 1.6 Tb/s port and 5x longer flap-free AI uptime.

BlueField-4 is a significant upgrade: 126 billion transistors, a 64-core Grace CPU (versus BlueField-3's 16 Cortex-A78 cores), 128 GB LPDDR5, and 800 Gb/s networking. It handles multi-tenant isolation, NVMe-oF storage acceleration, encryption at line rate, and KV cache management.

The Inference Context Memory Storage (ICMS) Platform introduces a new memory tier between local SSDs and shared storage, purpose-built for KV cache. Using BlueField-4 DPUs as both client accelerators and storage controllers, ICMS provides petabyte-scale shared context memory via RDMA at microsecond latency. NVIDIA claims 5x higher tokens-per-second for long-context workloads. If you are building agentic AI systems with persistent multi-turn context, ICMS directly addresses the KV cache scaling problem that forces trade-offs between context length and serving cost.

## Cloud provider and AI lab adoption

NVIDIA confirmed Rubin deployments with eight cloud providers at CES 2026: AWS, Google Cloud, Microsoft Azure, Oracle Cloud, CoreWeave, Lambda, Nebius, and Nscale. Each received direct CEO endorsement.

On the AI lab side: OpenAI secured 3 GW of dedicated inference capacity and 2 GW of training capacity on Vera Rubin systems. Anthropic, Meta (deploying by 2027), Mistral AI, xAI, Cohere, Perplexity, Runway, Cursor, Harvey, and Black Forest Labs have all confirmed adoption.

Quanta's Executive VP confirmed initial Rubin units could reach customers by August 2026. System integrators Dell, HPE, Lenovo, Cisco, and Supermicro are all building Rubin platforms.

## What Rubin means for GPU cloud costs

Hourly GPU pricing is not the number that matters anymore. Every GPU generation launches at a per-hour premium over the previous one, and every generation also delivers more useful work per dollar spent. The metric that actually drives infrastructure decisions is cost per token or cost per unit of useful inference.

Here is how that trajectory has played out across generations:

| Generation | Approximate Cost per Million Tokens (MoE Inference) | Trend |
|-----------|-----------------------------------------------------|-------|
| Hopper (H100) | ~$0.20 | Baseline |
| Blackwell FP8 (B200) | ~$0.10 | 2x reduction |
| Blackwell NVFP4 (B200) | ~$0.05 | 4x reduction from Hopper |
| Rubin NVFP4 (projected) | ~$0.005 to $0.01 | 10x reduction claim vs Blackwell |

These numbers are based on inference provider cost reductions reported across the Hopper-to-Blackwell transition. The Rubin projection uses NVIDIA's 10x claim, which (as discussed above) applies specifically to MoE workloads at long sequence lengths. For dense model inference, a more realistic projection is $0.02 to $0.03 per million tokens, which is still a meaningful 2 to 3x improvement over Blackwell.

The Vera Rubin NVL72 rack is estimated at $3.5 to 4.0 million, roughly a 25% premium over Blackwell's ~$3.35M. Cloud providers will price Rubin instances at a premium per GPU-hour over current B200 rates. But if the per-token economics hold, teams running MoE inference at scale will see their effective compute costs drop substantially despite paying more per hour.

This is the same pattern that played out with H100 replacing A100 and B200 replacing H100. Higher hourly rate, lower cost per useful result. The gap just gets wider with each generation because the architectural optimizations compound.

For agentic AI workloads specifically, the math changes dramatically. Multi-step reasoning generates roughly 5x more tokens per request than single-turn inference. At Hopper-era token pricing, running an agent that chains 10 reasoning steps was prohibitively expensive for most startups. At Rubin-projected pricing for MoE models, it becomes viable at consumer scale.

## The roadmap beyond Rubin

NVIDIA has confirmed Rubin Ultra for H2 2027 with 4 compute dies per package delivering 100 PFLOPS FP4, 1 TB HBM4e memory, and deployment in NVL576 "Kyber" racks at 600 kW. This represents 14x performance over today's GB300 NVL72.

After Rubin Ultra, the Feynman architecture targets 2028 on TSMC A16 (1.6nm) with backside power delivery, 8th-gen NVSwitch, ConnectX-10 at 3.2 Tb/s, and Spectrum-7 Ethernet.

NVIDIA's annual cadence is locked in: Blackwell (2024), Blackwell Ultra (2025), Rubin (2026), Rubin Ultra (2027), Feynman (2028). Each generation delivers roughly 3 to 5x inference improvements and 2 to 3x training improvements.

## What this means for your infrastructure decisions right now

Rubin cloud instances will not be available until Q4 2026 at the earliest, and initial supply will be allocated to hyperscalers and frontier labs. For startups and ML teams, the practical timeline looks like this:

**Now through Q3 2026:** H100, H200, and B200/B300 remain your options. H100 SXM pricing has dropped significantly across the market over the past year and remains strong value for most training and inference workloads today. H200 offers a meaningful memory bandwidth upgrade for large-context inference. B200/B300 is the right choice if you need the latest Blackwell FP4/FP8 capabilities. When evaluating providers, look beyond the headline per-hour rate. Billing granularity (per-minute vs per-hour), egress fees, and contract requirements have a larger impact on your actual bill than the sticker price, especially for bursty workloads like training runs and batch inference.

**Q4 2026 onward:** Rubin instances start appearing on major cloud providers. Early pricing will be at a premium. The biggest beneficiaries will be teams running MoE inference at scale.

**Architecture decision:** If you are designing inference serving infrastructure now, build for disaggregated inference (prefill/decode separation, KV cache tiering). This architecture maximizes Rubin's advantages when it arrives. The NVFP4 format is backward-compatible with Blackwell-optimized code, reducing migration friction.

The bottom line: do not wait for Rubin if you have compute needs today. Current-generation GPUs are available, proven, and at historically low prices. But design your software stack with Rubin's strengths in mind so migration is smooth when capacity opens up.

---

## FAQs

### When does NVIDIA Rubin ship?

NVIDIA confirmed Rubin is in full production as of CES 2026 (January 2026). Quanta, a key manufacturing partner, confirmed initial units could reach customers by August 2026. Cloud provider availability (AWS, Google Cloud, Microsoft Azure, CoreWeave, Lambda, Nebius, Nscale) is expected in H2 2026, with broader availability in Q4 2026 and Q1 2027.

### How much will Rubin GPUs cost to rent?

Per-GPU-hour cloud pricing has not been officially announced. Based on the NVL72 rack cost estimate of $3.5 to 4.0 million and historical pricing patterns, initial on-demand rates are projected at $6 to 10+ per GPU-hour. The meaningful metric is cost per token or cost per useful inference, which NVIDIA claims will be up to 10x lower than Blackwell for MoE workloads.

### Is the 10x inference cost reduction real?

It is benchmarked on a specific workload: the Kimi-K2-Thinking MoE model at 32K input / 8K output. For MoE inference at long sequence lengths, the 10x number is plausible given the combined improvements in HBM4 bandwidth (2.8x), NVLink 6 throughput (2x), and NVFP4 Tensor Core performance (5x). For dense model inference at shorter contexts, expect 2 to 3x improvement, not 10x. Independent benchmarks do not exist yet.

### Should I wait for Rubin or rent H100/H200/B200 now?

If you have active compute needs, do not wait. H100 SXM pricing has dropped significantly over the past year, and H200 and B200 are available and production-ready. Rubin cloud instances will not be broadly available until late 2026 at the earliest, and initial supply will be allocated to large customers. When choosing a provider now, prioritize per-minute billing, zero egress fees, and no lock-in contracts so your spend stays proportional to actual usage. Design your serving architecture to be migration-ready (disaggregated inference, NVFP4 compatibility) so the transition to Rubin is smooth when capacity opens up.

### What is the Vera Rubin NVL72?

It is NVIDIA's rack-scale deployment unit: 72 Rubin GPUs and 36 Vera CPUs in a single liquid-cooled rack. It provides 3.6 EFLOPS of FP4 inference compute, 20.7 TB of HBM4 memory, 260 TB/s NVLink 6 bandwidth, and 54 TB of LPDDR5X system memory. It maintains the same physical form factor as Blackwell NVL72 for drop-in rack upgrades.

### What is MoE and why does Rubin favor it?

Mixture of Experts (MoE) is a model architecture that divides computation among specialized sub-networks called experts. A learned router selects only 2 to 8 experts per token out of hundreds, so trillion-parameter models only activate tens of billions of parameters per inference step. MoE creates heavy all-to-all GPU communication and dynamic memory access patterns. Rubin's NVLink 6 all-to-all fabric, SHARP in-network compute, and 22 TB/s HBM4 bandwidth are specifically optimized for these patterns.

### How does Rubin compare to AMD MI400?

AMD's Instinct MI400 series (CDNA 5) targets Q3 2026 on TSMC 2nm. The MI455X offers 40 PFLOPS FP4 and 432 GB HBM4 (versus Rubin's 288 GB), but at lower bandwidth (19.6 TB/s versus 22 TB/s). AMD leads in raw memory capacity; NVIDIA leads in FP4 performance, memory bandwidth, and scale-up interconnect (NVLink 6 at 260 TB/s versus AMD's UALink). For MoE workloads where inter-GPU communication is the bottleneck, NVIDIA's interconnect advantage is likely more impactful than per-chip memory capacity.

### What comes after Rubin?

Rubin Ultra ships H2 2027 with 100 PFLOPS FP4, 1 TB HBM4e, and NVL576 "Kyber" racks at 600 kW. The Feynman architecture targets 2028 on TSMC 1.6nm. NVIDIA is maintaining a strict annual cadence.

---

*Published by [barrack.ai](https://barrack.ai) — dedicated and bare metal GPU cloud. H100, H200, B200, B300 on-demand, per-minute billing, zero egress fees, no contracts.*

<!--
DOCUSAURUS CONFIGURATION NOTES:

Recommended slug: /nvidia-rubin-gtc-2026-full-breakdown
OG Image: Create a 1200x630 image with NVIDIA Rubin GPU visual + "Full Technical Breakdown for ML Engineers" text overlay. Save as /static/img/nvidia-rubin-gtc-2026-og.png

Schema markup (add to docusaurus.config.js headTags or via plugin):

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "NVIDIA Rubin at GTC 2026: Full Technical Breakdown for ML Engineers",
  "description": "Complete technical analysis of NVIDIA's Rubin platform: 336B transistor GPU, 288 GB HBM4, 22 TB/s bandwidth, Vera CPU, NVL72 rack specs, and GPU cloud pricing implications for AI startups.",
  "author": {
    "@type": "Person",
    "name": "Dhayabaran V",
    "jobTitle": "Founder",
    "worksFor": {
      "@type": "Organization",
      "name": "barrack.ai",
      "url": "https://barrack.ai"
    }
  },
  "publisher": {
    "@type": "Organization",
    "name": "barrack.ai",
    "url": "https://blog.barrack.ai",
    "logo": {
      "@type": "ImageObject",
      "url": "https://blog.barrack.ai/img/logo.png"
    }
  },
  "datePublished": "2026-03-14",
  "dateModified": "2026-03-14",
  "mainEntityOfPage": "https://blog.barrack.ai/nvidia-rubin-gtc-2026-full-breakdown",
  "keywords": ["NVIDIA Rubin", "GTC 2026", "GPU cloud pricing", "Vera Rubin NVL72", "H100 vs Rubin", "MoE inference", "AI GPU 2026"],
  "about": {
    "@type": "Thing",
    "name": "NVIDIA Rubin GPU Platform"
  }
}
</script>

FAQ Schema (add as additional headTag or via plugin):

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "When does NVIDIA Rubin ship?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "NVIDIA confirmed Rubin is in full production as of CES 2026. Quanta confirmed initial units could reach customers by August 2026. Cloud provider availability is expected in H2 2026, with broader availability in Q4 2026 and Q1 2027."
      }
    },
    {
      "@type": "Question",
      "name": "How much will Rubin GPUs cost to rent?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Per-GPU-hour pricing has not been officially announced. Based on rack cost estimates of $3.5 to 4.0 million, initial on-demand rates are projected at $6 to 10+ per GPU-hour. Cost per token for MoE inference is projected to be up to 10x lower than Blackwell."
      }
    },
    {
      "@type": "Question",
      "name": "Is the 10x inference cost reduction real?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It is benchmarked on a specific MoE workload (Kimi-K2-Thinking at 32K/8K sequence lengths). For MoE inference at long contexts, 10x is plausible. For dense model inference at shorter contexts, expect 2 to 3x. Independent benchmarks do not exist yet."
      }
    },
    {
      "@type": "Question",
      "name": "Should I wait for Rubin or rent H100/H200/B200 now?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "If you have active compute needs, do not wait. H100 SXM pricing has dropped significantly over the past year, and H200 and B200 are production-ready. Rubin cloud instances will not be broadly available until late 2026. Prioritize providers with per-minute billing, zero egress fees, and no contracts. Design your architecture to be migration-ready."
      }
    },
    {
      "@type": "Question",
      "name": "What is the Vera Rubin NVL72?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It is NVIDIA's rack-scale unit: 72 Rubin GPUs and 36 Vera CPUs delivering 3.6 EFLOPS FP4 inference, 20.7 TB HBM4, and 260 TB/s NVLink 6 bandwidth in a single liquid-cooled rack."
      }
    },
    {
      "@type": "Question",
      "name": "What is MoE and why does Rubin favor it?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mixture of Experts divides computation among specialized sub-networks. Rubin's NVLink 6 all-to-all fabric, SHARP in-network compute, and 22 TB/s HBM4 bandwidth are specifically optimized for MoE's heavy communication and dynamic memory patterns."
      }
    },
    {
      "@type": "Question",
      "name": "How does Rubin compare to AMD MI400?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AMD MI455X offers 40 PFLOPS FP4 and 432 GB HBM4 versus Rubin's 50 PFLOPS and 288 GB. AMD leads in memory capacity; NVIDIA leads in FP4 performance, bandwidth, and NVLink interconnect, which matters most for MoE workloads."
      }
    },
    {
      "@type": "Question",
      "name": "What comes after Rubin?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Rubin Ultra ships H2 2027 with 100 PFLOPS FP4 and 1 TB HBM4e. Feynman targets 2028 on TSMC 1.6nm. NVIDIA maintains a strict annual cadence."
      }
    }
  ]
}
</script>
-->
