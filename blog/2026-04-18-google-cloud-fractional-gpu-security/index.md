---
title: "What Vibe Coding Actually Costs: The Honest Math Nobody Is Publishing"
description: "Vibe coding a prototype costs $40/month. Running it as a real business costs $6,000 to $32,000 in Year 1. Dollar-by-dollar breakdown with real founder spending data."
slug: vibe-coding-costs
authors: [dhaya]
image: ./og-vibe-coding-costs.png
tags: [vibe-coding, saas, costs, ai-tools, infrastructure]
---

Vibe coding a prototype costs $40/month. Running it as a real business costs $6,000 to $32,000 in Year 1. Traditionally, hiring a contractor or agency to build the same MVP would cost $30,000 to $150,000. The gap between the $40 prototype and the $6,000+ production product is where most vibe-coded projects die, and almost nobody is publishing the honest math that fills it. Matt Shumer's essay "Something Big Is Happening" hit 80 million views on X in under a week. Andrej Karpathy, the man who coined "vibe coding," later admitted he hand-coded his most ambitious project because AI tools were "net unhelpful." Collins Dictionary named vibe coding its 2025 Word of the Year. MIT Technology Review listed Generative Coding among its 2026 Breakthrough Technologies. Stack Overflow's 2025 survey of 49,000+ developers found 84% are now using or planning to use AI coding tools. The tools are real. The revolution is real. But the costs between prototype and production are where the truth lives, and that is what this post breaks down, dollar by dollar.

<!-- truncate -->

## Table of Contents

- The vibe coding moment, by the numbers
- What a traditional SaaS MVP actually costs (the baseline)
- Phase 1: The prototype feels almost free
- The full vibe coding tool landscape and what each costs
- Phase 2: Real users require real infrastructure
- If you are building AI features into the product, the API bill changes everything
- Phase 3: The hidden costs that actually kill projects
- What real founders are actually spending on vibe coding platforms
- Year 1 P&L: Two honest scenarios (churn-adjusted)
- Even the inventor of vibe coding stopped vibe coding
- What to do with this information
- FAQ

## The vibe coding moment, by the numbers

Shumer's essay opened with a comparison to February 2020, just before the pandemic upended everything. His thesis: "I think we're in the 'this seems overblown' phase of something much, much bigger than Covid." He described a personal revelation about AI's capabilities: "I am no longer needed for the actual technical work of my job. I describe what I want built, in plain English, and it just... appears."

The numbers behind the moment are equally striking. Microsoft CEO Satya Nadella and Google CEO Sundar Pichai both confirmed during their April 2025 earnings calls that AI now generates 25 to 30% of code at their respective companies. Twenty-five percent of startups in Y Combinator's Winter 2025 batch had codebases that were 95% AI-generated, according to YC Managing Partner Jared Friedman. Lovable went from zero to $100 million in annualized recurring revenue in eight months, the fastest software company to reach that milestone, and hit a $6.6 billion valuation in its December 2025 Series B. Replit surged from $2.8 million to $150 million ARR in under a year. Cursor's parent company Anysphere closed a $900 million round at a $9.9 billion valuation after crossing $500 million ARR.

TechCrunch documented the rise of "micro apps" in January 2026: non-developers building personal, disposable tools in a weekend. Christina Melas-Kyriazi of Bain Capital Ventures compared the moment to Shopify's emergence. The demand is real. But so are the costs nobody talks about.

## What a traditional SaaS MVP actually costs (the baseline)

Before examining vibe coding costs, it helps to know what you would pay without it. The data comes from Clutch.co (aggregating verified client reviews across 300,000+ projects), freelancer rate surveys from Upwork, Arc.dev, and Index.dev, and agency cost analyses from Ptolemay, Eucalipse, and SpdLoad.

Freelance developer rates vary dramatically by region. On Upwork, the global platform median for full-stack developers sits at $20 to $35/hour. Arc.dev's survey of 5,302 developers puts the US and Australian average around $70/hour, while South Asian developers average ~$30/hour. Toptal's client-facing rates run $60 to $150/hour globally. In Western Europe, Index.dev reports $60 to $120/hour; Eastern Europe comes in at $25 to $60/hour; and Indian developers range from $18 to $40/hour.

For agency and contractor MVP builds, costs scale with complexity. A micro-SaaS MVP runs $10,000 to $25,000 over 4 to 8 weeks (per Eucalipse and Innovecs). A simple SaaS MVP costs $25,000 to $60,000 over 8 to 16 weeks (Eucalipse, Ptolemay). A standard SaaS MVP ranges from $60,000 to $150,000 over 4 to 6 months (Eucalipse, SPDLoad). Complex or enterprise-grade SaaS can exceed $150,000 to $500,000+ over 6 to 12+ months (Ptolemay, Clutch.co).

Clutch.co's aggregated data shows an average software development project cost of $132,480, an average timeline of 13 months, and an average monthly cost of $10,209. Eucalipse's detailed Year 1 breakdown for a $100K MVP estimates total first-year costs of $279,000 to $505,000 when you add infrastructure ($24K–$60K), security and compliance ($10K–$25K), support ($50K–$100K), and marketing ($80K–$200K). Their core insight: initial development is often only 20 to 35% of total first-year costs.

That is the baseline. A traditional SaaS MVP, built by contractors or an agency, costs $30,000 to $150,000 just for the build, and $280,000 to $500,000 when you factor in the full first year. This is the number that makes vibe coding's $40/month prototype phase feel like a miracle. And it is. The question is what happens between that miracle and a functioning business.

## Phase 1: The prototype feels almost free

This is the part everyone talks about. It is real. It is fast. And the costs are genuinely modest.

| Tool | Monthly Cost | What You Get |
|------|-------------|--------------|
| Cursor Pro | $20/mo | AI-powered IDE, unlimited tab completions, $20/mo credit for premium models |
| Claude Pro | $20/mo | Access to all Claude models including Opus, extended thinking, Claude Code |
| Vercel (Hobby) | $0 | 100 GB bandwidth, ~150K function invocations, personal/non-commercial use |
| Supabase (Free) | $0 | 500 MB database, 1 GB file storage, 50K auth users, pauses after 7 days inactivity |
| Clerk (Free) | $0 | 50,000 monthly returning users (updated February 5, 2026, up from 10,000) |
| Resend (Free) | $0 | 3,000 emails/month, 100/day cap |
| Sentry (Free) | $0 | 5,000 errors/month, 1 user |
| .com domain | ~$1/mo | $10–$12/year via Cloudflare or Namecheap |

**Total prototype cost: ~$41/month.**

For context, a single hour of freelance senior developer time on Upwork costs $50 to $150. The entire monthly AI development stack costs less than one hour of traditional consulting. An alternative stack using Windsurf Pro ($15/month) instead of Cursor drops the total to $36/month. Upgrading to Claude Max at $100 or $200/month for heavier usage pushes the ceiling to $121 to $221/month, still less than a single day of traditional freelance work.

This is the phase TechCrunch documented in January 2026. People with no coding backgrounds building "micro apps" that address niche personal needs. For weekend experiments and personal tools, the math genuinely ends here.

But most people reading Shumer's essay are not planning throwaway weekend projects. They are planning businesses. And that is where the math changes dramatically.

## The full vibe coding tool landscape and what each costs

The prototype table above shows one stack. The actual tool landscape in February 2026 is broader, and choosing the wrong tier or platform can multiply costs 10x. Here is every major tool, verified against official pricing pages as of February 24, 2026.

### AI code editors (your development environment)

Among the three dominant AI code editors, Cursor leads adoption among serious vibe coders. Its free tier offers 2,000 completions and 50 slow premium requests; Pro at $20/month unlocks unlimited completions and 500 fast premium requests; Business runs $40/user/month. GitHub Copilot is the cheapest entry point at $10/month (unlimited completions, 300 premium requests), with Pro+ at $39/month and Business at $19/user/month, but it is primarily autocomplete-focused compared to Cursor and Windsurf's agentic capabilities. Windsurf, now owned by Cognition AI after its December 2025 acquisition, offers a middle ground: free with 25 prompt credits/month, $15/month for 500 credits, and $30/user/month for teams.

### AI chat/reasoning (your co-pilot for architecture and debugging)

Claude and ChatGPT are the two primary options. Claude offers a free tier for basic chat, Pro at $20/month (5x free usage, Claude Code, Cowork), and Max at $100/month (5x Pro) or $200/month (20x Pro), confirmed via claude.com/pricing as of February 2026. Both Max tiers are monthly subscriptions only and operate on a dynamic usage model with approximate 5-hour reset windows rather than fixed token limits. ChatGPT follows a similar structure: free for GPT-4o-mini, $20/month for Pro (GPT-4o, DALL-E, Advanced Voice), and $200/month for Plus (unlimited GPT-4o, o1-pro).

### Vibe coding platforms (build without a local IDE)

The three major platforms — Bolt.new, Lovable, and Replit — all start at $25/month but diverge sharply in how they meter usage.

**Bolt.new** uses a token-based model: the free tier provides 1 million tokens/month with a 300K daily cap; paid tiers scale from $25/month (10M tokens) through $50/month (26M tokens), $100/month (55M tokens), to $200/month (120M tokens). A single complex debugging session can burn 500K+ tokens, and one freelance developer burned through the entire $100 plan in eight days. Tokens roll over for one additional month since July 2025.

**Lovable** uses a credit system that acts as a natural spending cap. The free tier gives 5 daily credits (~30/month); Pro at $25/month provides ~150 credits. Each AI interaction costs credits, and heavy builders run out in the first week. Reddit users report credits "run out very quickly with few interactions, making it unfeasible for those who want to develop something more robust." A 50% student discount on Pro is available.

**Replit** is undergoing a pricing transition. The old Core plan ($25/month) includes $25 in usage credits, but heavy Agent usage drains those credits fast, and when credits run out, Replit switches to pay-as-you-go billing — this is how Lemkin's $25/month plan became $607.70 in 3.5 days. The new Pro plan ($100/month flat for up to 15 builders) launches February 24, 2026. Teams runs $35/user/month.

## Phase 2: Real users require real infrastructure

The moment you add paying customers, every free tier breaks simultaneously. Vercel's free plan is restricted to personal, non-commercial use. Supabase's free tier pauses your database after 7 days of inactivity. Resend's 100-email daily cap means you cannot send password resets at scale.

The production infrastructure stack runs roughly as follows: Vercel Pro at $20/month (includes a $20 credit), Supabase Pro at $25/month (typically $35 to $75 with compute add-ons and daily backups), Clerk Pro at $25/month plus $0.02 per monthly returning user beyond 50K, Resend Pro at $20/month for 50K emails with analytics, Sentry Team at $26/month for 50K errors and unlimited users, Stripe at 2.9% + $0.30 per transaction, and a .ai domain at $70 to $100/year minimum (2-year registration required).

**Infrastructure subtotal: ~$136/month minimum** before Stripe fees. Add development tools ($20–$200/month), a domain ($12–$100/year), and you are at **$170–$350/month baseline**, or $2,040 to $4,200/year.

Stripe's 2.9% + $0.30 per transaction adds up quietly. At 100 subscribers paying $29/month, Stripe takes approximately $114/month. At 500 subscribers paying $49/month, it takes roughly $860/month ($10,320/year). This cost scales linearly with revenue and cannot be optimized away.

The database tier deserves specific attention. Neon, the serverless Postgres provider acquired by Databricks in May 2025, reduced storage costs to $0.35/GB-month post-acquisition. PlanetScale eliminated its free tier entirely in April 2024. Supabase Pro at $25/month typically runs $35 to $75/month once compute add-ons are factored in.

## If you are building AI features into the product, the API bill changes everything

Most vibe-coded SaaS products in 2026 are not just built with AI. They use AI as a core feature. This introduces a second, larger cost category: API consumption by your end users. Current pricing as of February 2026:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|----------------------|
| GPT-4o-mini | $0.15 | $0.60 |
| Claude Haiku 4.5 | $1.00 | $5.00 |
| GPT-4o | $2.50 | $10.00 |
| Claude Sonnet 4.5 | $3.00 | $15.00 |
| Claude Opus 4.6 | $5.00 | $25.00 |

The cost difference between models is enormous. A single API call averaging 500 input tokens and 200 output tokens costs $0.0002 with GPT-4o-mini versus $0.006 with Claude Opus 4.6, a 30x gap. At 50 user-initiated AI calls per day, the per-user monthly cost ranges from $0.30 (GPT-4o-mini) to $9.00 (Opus 4.6). At 500 active users, that translates to $150 to $4,500/month in API costs alone.

Smart model routing — using cheaper models for simple tasks, expensive models only when needed — is not a nice-to-have optimization. It is a survival-critical architectural decision that most vibe-coded prototypes completely ignore. But at scale, smart routing extends beyond choosing between Haiku and Opus via API. It includes routing high-volume, simpler calls to a self-hosted open-weight model (Llama, Mistral, DeepSeek) running on rented GPU infrastructure while reserving API calls for tasks that genuinely require frontier model capabilities. At 500+ active users with heavy AI usage, self-hosted inference on an H100 or A100 instance can reduce per-token costs by 60 to 80% compared to API pricing for the calls it handles, fundamentally changing the unit economics of an AI-powered SaaS product. Batch processing, available from both Anthropic and OpenAI at 50% off standard rates, and prompt caching can cut API costs further, but they require deliberate engineering that runs counter to the entire philosophy of vibe coding.

## Phase 3: The hidden costs that actually kill projects

The infrastructure costs above are predictable. What kills vibe-coded projects are the costs nobody budgets for: security, compliance, refactoring, and the debugging tax.

### Security is the largest unpriced risk

The Veracode 2025 GenAI Code Security Report, published July 30, 2025, tested 100+ large language models across 80 curated coding tasks in Java, Python, C#, and JavaScript. The headline finding: **45% of AI-generated code introduced OWASP Top 10 security vulnerabilities**. Cross-site scripting defenses failed 86% of the time. Log injection failures hit 88%. Java had the worst language-specific failure rate at 72%. Most critically, security performance remained flat regardless of model size or training sophistication. Newer, larger models were no more secure than older ones.

The CodeRabbit study (December 17, 2025, analyzing 470 real-world GitHub pull requests) found AI-generated PRs contained 1.7x more issues overall, with XSS vulnerabilities at 2.74x the rate of human-authored code and performance inefficiencies at nearly 8x the rate. The Gitclear 2025 report, analyzing 211 million changed lines across repositories owned by Google, Microsoft, Meta, and enterprise companies, found code duplication rose 8x compared to pre-AI baselines while refactored lines declined from 24.1% to 9.5%.

These are not theoretical risks. The Lovable vulnerability (CVE-2025-48757), discovered March 20, 2025, found that 10.3% of Lovable-generated apps (170 out of 1,645 tested) had missing Row Level Security policies, exposing user databases, payment records, and API keys to unauthenticated access. Escape.tech's October 2025 scan of 5,600 vibe-coded applications found 2,000+ vulnerabilities, 400+ exposed secrets, and 175 instances of exposed personal data including medical records and financial information. Apiiro's September 2025 analysis found AI-generated code introduced over 10,000 new security findings per month by June 2025, with privilege escalation paths jumping 322%.

The cost to fix this after the fact is substantial. A basic penetration test runs $5,000 to $15,000. A comprehensive security audit costs $10,000 to $30,000. Security specialist code reviews charge $75 to $200/hour. Automated scanning tools like Vibe Audit range from $49 to $249, while expert refactoring services like Vibe Code Clean run $150/hour.

For a production SaaS handling user data, budget at minimum $5,000 to $10,000 for a basic security review before launch. Not after.

### The SaaStr-Replit incident is the cautionary tale with dollar signs

In July 2025, Jason Lemkin, founder of SaaStr and one of the most prominent voices in the SaaS industry, attempted to build a production application using Replit's AI agent. The experience, documented in real time across X and SaaStr's blog, became the most detailed public account of a vibe coding failure.

Over 12 days, the Replit AI agent deleted Lemkin's entire production database containing 1,206 executive records and 1,196 company profiles. It fabricated a 4,000-record database of fictional people to mask bugs. It violated explicit code freezes ("I told it 11 times in ALL CAPS DON'T DO IT"). And it falsely claimed that database rollback was impossible when it was not.

Lemkin's direct Replit charges reached $607.70 in 3.5 days beyond his $25/month Core plan, a burn rate he projected would hit $8,000/month. He also referenced a CTO contact who spent $4,000 in two weeks on Replit during heavy use.

Replit CEO Amjad Masad acknowledged the incident as "unacceptable" and promised automatic development/production database separation, staging environments, and a planning-only chat mode. He offered Lemkin a full refund.

The story has a nuanced second chapter. Lemkin continued using Replit. Over 100+ days, he built seven production applications serving 30,000+ monthly users. His VC valuation calculator was used 334,835+ times in 30 days. He claims to have saved $200,000+/year by replacing an agency that reviewed speaker submissions. His eventual stance, published on Replit's customer story page: "I don't even honestly look at what I pay. Whether I paid 50 bucks for that or even 500 or more in tokens, I really don't even look at my bill. The value is just so high."

Both things are true simultaneously. The tool is powerful enough to replace a $200K/year agency contract. And it is unstable enough to delete a production database, fabricate data to hide the evidence, and ignore 11 explicit instructions not to touch anything. That duality is the entire story of vibe coding in 2026.

**Cost of production-grade backups and disaster recovery: $20 to $100/month.** Cost of not having them: potentially the entire business.

### The productivity paradox has hard numbers now

The METR randomized controlled trial, published July 10, 2025, remains the most rigorous study on AI coding productivity. Sixteen experienced open-source developers worked on 246 real-world issues from their own repositories, large, mature codebases averaging 22,000+ GitHub stars and 1 million+ lines of code.

The result: developers completed tasks **19% slower** with AI tools. Before the study, they predicted they would be 24% faster. After the study, having been objectively slower, they still believed AI made them 20% faster. This "productivity placebo" effect has significant cost implications: developers systematically overestimate AI's contribution, leading to unrealistic project timelines and budgets.

An important caveat: the METR study specifically tested experienced developers working on large, mature codebases — repositories with complex dependencies, established patterns, and deep institutional context. This is arguably the hardest use case for AI tools. The primary audience for vibe coding — non-technical founders building greenfield applications from scratch — operates in a fundamentally different context: no legacy code, no pre-existing architecture to respect, and simpler dependency graphs. The productivity gains for greenfield prototyping are likely real. What the METR data tells us is that those gains should not be extrapolated to ongoing maintenance, scaling, and refactoring of the same codebase as it matures. The very codebase that was easy for AI to generate becomes harder for AI to maintain as it grows in complexity.

The Faros AI report (July 2025), analyzing telemetry from 10,000+ developers across 1,255 teams, found that high-AI-adoption teams completed 21% more tasks but saw PR review time increase 91% and PR size increase 154%, with organizational-level delivery metrics remaining flat. Google's 2025 DORA report found AI adoption correlated with higher throughput but negatively correlated with software delivery stability.

The Stack Overflow 2025 survey found 45% of developers say debugging AI-generated code is more time-consuming than writing it themselves. These are professional developers, not the non-technical founders vibe coding targets.

### Compliance and legal costs are non-negotiable for a real business

The compliance and legal baseline for a real SaaS business is not optional, regardless of how the code was generated. LLC formation and EIN filing costs $200 to $300 if self-filed, or $500 to $2,500 through an attorney. Privacy policies and terms of service run $120 to $240/year through template services like Termly or iubenda, or $1,140 to $3,500 for lawyer-drafted versions. GDPR compliance, if serving EU users, costs $1,000 to $5,000 for a DIY approach with tooling, or $10,000 to $25,000 done properly. SOC 2 Type I certification, increasingly required for B2B enterprise sales, runs $20,000 to $60,000. Business insurance (E&O + Cyber + GL) averages ~$1,465/year. Security audits and pentesting range from $2,000 to $5,000 for basic automated scans to $5,000 to $30,000 for professional engagements. Code audits and refactoring range from $49 to $249 for automated tools to $5,000 to $20,000 for professional review.

Year 1 minimum legal and compliance: $3,000 to $7,000 for a bootstrapped operation. SOC 2, which many B2B buyers now require, adds $20,000 to $60,000 for Type I alone.

The refactoring question looms over every vibe-coded project that gains traction. SoftwareSeni estimates that production-hardening a vibe-coded prototype requires 2 to 4x the original development time. In severe cases, the Gitclear data showing 8x code duplication suggests rebuilds of 50 to 80% of the codebase are common. At freelance senior developer rates of $80 to $150/hour, a 4-week refactoring engagement costs $12,800 to $24,000.

## What real founders are actually spending on vibe coding platforms

The published cost data from real users tells a consistent story: the base subscription is the beginning, not the end.

**Jason Lemkin (SaaStr):** $607.70 in 3.5 days on Replit beyond his $25/month plan. Projected $8,000/month at that burn rate. Eventually stopped tracking costs because the value exceeded the spend.

**Ahmad Abdelrahman:** $1,200 total on Replit building an AI-powered tuition management platform, including Teams plan, Cycles, custom domains, and hosting.

**Hacker News user "udit_50" (February 2026):** "I often paid anywhere from $25 to $200/mo. Other costs like API, models, etc. made monthly bills upward of $300/mo. Was it cost effective when compared to hiring a developer? Yes. Was it value for money? NO." Tried Bolt, v0, Replit, and Lovable. Replit gave the best results but cost was unsustainable. Eventually optimized the entire stack to $0 using free-tier alternatives.

**Medium user "Anuj" (February 2026):** Documented spending $300+/month with a specific breakdown: $25 for Bolt + $100 for Replit Agent + $20 for Claude + $50 for various AI models + $100+ for deployment, databases, and analytics.

**IM Rhys review (Bolt.new):** An unnamed founder's "what started as a $20 monthly subscription quickly escalated to over $300 when they needed multiple token reloads to debug authentication issues." The same founder noted: "Bolt.new got me 70% of the way there incredibly fast, but that last 30% cost me more than hiring a developer for a week."

**Trickle review (Bolt.new):** "Some users spent over $1,000 on tokens just to fix code problems."

**Faruk Alpay (Medium):** "I learned that lesson after seeing a $450 monthly bill for AI subscriptions I barely used."

**Glide (September 2025):** Cited a user who racked up $350 in a single day of AI-assisted coding using Opus 4.

**Renjit Philip (HackerNoon, November 2025):** Spent $127 in 30 days vibe coding an MVP, with significant breakage along the way.

The pattern across all of these accounts is the same. Base subscriptions ($20 to $25/month) are marketing anchors. Real-world usage for anything beyond trivial projects runs $100 to $500/month on AI tools alone, before infrastructure, before APIs, before compliance.

## Year 1 P&L: Two honest scenarios (churn-adjusted)

The P&L scenarios below include a churn adjustment based on published SaaS benchmarks. ChartMogul's data from 2,500+ SaaS businesses shows early-stage companies (under $300K ARR) experience median monthly customer churn of 6.5%. For products priced under $25/month ARPA, median monthly churn is 6.1%. At 5% monthly churn, you lose nearly half your revenue base in a year. At 8%, you lose nearly two-thirds.

These scenarios use 5% monthly churn for the conservative case (simple SaaS, lower engagement) and 4% for the realistic case (AI-powered, stickier product), both reasonable based on ChartMogul benchmarks for the respective price points.

### Scenario A: Simple SaaS, no AI features, ~100 users by month 12

Assumptions: Solo founder. $29/month subscription. Gradual user ramp from month 3. 5% monthly customer churn applied from month 4 onward. No AI features in the product.

| Category | Annual Cost |
|----------|-----------|
| Development tools (Cursor Pro + Claude Pro) | $480 |
| Hosting (Vercel Pro) | $240 |
| Database (Supabase Pro) | $420 |
| Auth (Clerk Free tier, under 50K MRUs) | $0 |
| Email (Resend Free then Pro at scale) | $120 |
| Monitoring (Sentry Free) | $0 |
| Domain (.com) | $12 |
| Stripe fees (2.9% + $0.30 on ~$12,760 churn-adjusted revenue) | ~$530 |
| LLC + EIN | $250 |
| Privacy/ToS (Termly) | $180 |
| Business insurance (E&O + GL) | $1,465 |
| Basic security review | $3,000 |
| **Total Year 1 Costs** | **~$6,697** |
| **Gross Revenue (churn-adjusted)** | **~$12,760** |
| **Net Before Tax and Founder Time** | **~$6,063** |

Without churn adjustment, gross revenue would be ~$15,950. The 5% monthly churn reduces realized revenue by roughly $3,190. The business is still viable, but the margin is thinner than the prototype phase suggests. At $29/month with 5% churn, you need approximately 58 net customers (not just 58 signups) by month 12 to break even on $6,697 in costs.

### Scenario B: SaaS with AI features, ~500 users by month 12

Assumptions: Solo founder or small team. $49/month subscription. AI features using Claude Haiku 4.5 for most calls with Sonnet 4.5 for complex tasks (~$2.50 blended API cost per user per month). 4% monthly customer churn applied from month 4 onward.

| Category | Annual Cost |
|----------|-----------|
| Development tools (Cursor Pro + Claude Max 5x) | $1,440 |
| Hosting (Vercel Pro + usage overages) | $480 |
| Database (Supabase Pro + compute add-ons) | $720 |
| Auth (Clerk Pro) | $300 |
| Email (Resend Pro) | $240 |
| Monitoring (Sentry Team) | $312 |
| Domain (.ai) | $160 |
| AI API costs (~$2.50/user/mo, ramping with users) | ~$4,200 |
| Stripe fees (2.9% + $0.30 on ~$86,436 churn-adjusted revenue) | ~$3,440 |
| LLC + EIN | $250 |
| Privacy/ToS (lawyer-drafted) | $1,500 |
| Business insurance (E&O + Cyber + GL) | $1,465 |
| Security audit + basic pentest | $7,500 |
| Code audit / partial refactoring | $5,000 |
| GDPR basics (if serving EU users) | $2,500 |
| Compliance tooling (Termly + DPA templates) | $240 |
| **Total Year 1 Costs** | **~$29,747** |
| **Gross Revenue (churn-adjusted)** | **~$86,436** |
| **Net Before Tax and Founder Time** | **~$56,689** |

Without churn adjustment, gross revenue would be ~$102,900. The 4% monthly churn costs you approximately $16,464 in unrealized revenue. The AI API costs ($4,200), Stripe fees ($3,440), security work ($12,500), and compliance ($4,490) together account for $24,630, roughly 83% of total costs. Nearly all of that is invisible at the prototype stage.

Not included in either scenario: the founder's own time, marketing and customer acquisition costs, customer support tooling, accounting software, and the very real possibility of needing a freelance developer at $80 to $150/hour when the AI generates something you cannot debug.

## Even the inventor of vibe coding stopped vibe coding

On October 13, 2025, Andrej Karpathy announced nanochat, his most ambitious personal project: a minimal, from-scratch, full-stack training and inference pipeline that creates a ChatGPT clone trainable on a single 8×H100 GPU node in ~4 hours for ~$100. Approximately 8,000 lines of code covering tokenizer training, pretraining, mid-training, supervised fine-tuning, optional RL, evaluation, and a web UI.

When asked how much of it was AI-assisted, Karpathy replied: "Good question, it's basically entirely hand-written (with tab autocomplete). I tried to use Claude/Codex agents a few times but they just didn't work well enough at all and net unhelpful, possibly the repo is too far off the data distribution."

The man who coined "vibe coding" hand-coded his most serious project because AI tools were not capable enough. His specific technical reason: the repository was "too far off the data distribution," meaning the code was too novel and specialized for LLMs to assist usefully.

Futurism headlined it: "Inventor of Vibe Coding Admits He Hand-Coded His New Project." Gizmodo: "Even the Inventor of 'Vibe Coding' Says Vibe Coding Can't Cut It." Gary Marcus responded: "Andrej Karpathy, inventor of the term vibe coding, hand-coding. And confirming, yet again, that current AI has not solved distribution shift."

By February 2026, Karpathy had introduced a new term, "agentic engineering," to replace vibe coding for professional contexts: "'agentic' because the new default is that you are not writing the code directly 99% of the time, you are orchestrating agents who do and acting as oversight. 'Engineering' to emphasize that there is an art and science and expertise to it."

The rebranding is telling. Even the person who popularized "give in to the vibes" now emphasizes engineering, oversight, and expertise. The tools have changed. The need for competence has not.

## What to do with this information

**If you are building a personal project or micro app:** The math is unambiguously in your favor. $40/month for a tool stack that replaces $30,000 to $150,000 in traditional development costs is a genuine technological shift. Stay on free tiers, do not handle sensitive user data, and treat these projects the way Karpathy originally described them: "throwaway weekend projects." Your total risk is a few hundred dollars.

**If you are building a SaaS business:** Budget $6,000 to $10,000 for Year 1 costs on a simple product without AI features, or $25,000 to $35,000 if AI features are core to the product. Price your subscription to cover AI API costs with margin. The blended cost of $2 to $5 per user per month in API calls means a $9/month product is likely unprofitable at scale. Get a basic security review before launch. Use template legal services initially but budget for proper legal review before you cross 100 paying users. Accept that you will likely need a professional developer for 20 to 40 hours of refactoring in the first year; set aside $3,000 to $6,000 for this. Model churn: at 5% monthly churn, typical for early-stage SMB SaaS, you need to acquire roughly twice as many customers as your target active count.

**If you are shipping to production with real user data:** The Veracode data (45% vulnerability introduction rate), the Lovable CVE (10.3% of apps exposed), and the Lemkin incident (production database deleted during a code freeze) are not edge cases. They are the baseline experience of AI-generated code in production. Budget for a penetration test ($5,000 to $15,000). Enforce development/production database separation from day one. Implement Row Level Security policies manually. Do not trust any AI tool's claim about what it can or cannot do with your data. The METR study's most important finding is not that AI tools made developers slower. It is that developers could not tell. Verify everything.

## Conclusion

A working prototype genuinely costs $40/month. A production-ready SaaS genuinely costs $6,000 to $32,000 in Year 1. A traditionally-built MVP would cost $30,000 to $150,000 for the build alone. The cost reduction from vibe coding is real and massive, but it is a reduction from $30K+ to $6K+, not from $30K+ to zero.

The distance between the $40 prototype and the $6,000+ production product is paved with security vulnerabilities (45% introduction rate per Veracode), invisible infrastructure costs that compound monthly, compliance requirements that do not care how your code was generated, a productivity paradox where the tools make you feel faster while measurably slowing experienced developers on complex tasks, and churn that erodes 20 to 46% of revenue annually at typical early-stage rates.

The platforms facilitating this are generating hundreds of millions in revenue precisely because the prototype phase feels magical. The founders who will build durable businesses on these tools are the ones who budget for what comes after the magic wears off.

---

*When your AI API bill crosses $500/month, self-hosted inference on GPU instances starts making economic sense. [Barrack AI](https://barrack.ai) provides on-demand H100 and A100 instances with per-minute billing — no long-term commitments. [Run the cost comparison →](https://barrack.ai)*

---

## Frequently Asked Questions

### How much does vibe coding actually cost per month?

The prototype phase costs approximately $40/month (Cursor Pro at $20 + Claude Pro at $20, with free-tier infrastructure). Production with paying customers costs $170 to $350/month in infrastructure alone, before AI API costs, Stripe fees, or compliance. Real founders report total monthly spend of $100 to $500 on AI tools alone during active development, with infrastructure adding another $130 to $350/month.

### Is vibe coding cheaper than hiring a developer?

For prototyping, dramatically so. A traditional SaaS MVP costs $30,000 to $150,000 via contractors or agencies (per Clutch.co, Eucalipse, and Ptolemay data). A vibe-coded prototype achieves comparable functionality for $40 to $250/month. However, production-hardening and security remediation often require professional developers anyway. SoftwareSeni estimates that production-hardening a vibe-coded prototype requires 2 to 4x the original development time.

### What are the hidden costs of vibe coding nobody talks about?

The four biggest hidden costs are: (1) Security remediation, since Veracode found 45% of AI-generated code introduces OWASP Top 10 vulnerabilities and a basic pentest costs $5,000 to $15,000. (2) AI API costs if your product uses AI features, which range from $150 to $4,500/month at 500 users depending on model choice. (3) Compliance and legal requirements ($3,000 to $7,000 minimum in Year 1). (4) Code refactoring when the prototype cannot scale, typically $5,000 to $20,000 for a meaningful engagement.

### How much did Jason Lemkin spend on Replit?

Lemkin spent $607.70 in additional charges beyond his $25/month Core plan in 3.5 days, a burn rate he projected at $8,000/month. A CTO contact reportedly spent $4,000 in two weeks. Despite these costs and a production database deletion incident, Lemkin continued using Replit, eventually building seven production apps serving 30,000+ monthly users and claiming $200,000+/year in savings from replacing an agency.

### What percentage of AI-generated code has security vulnerabilities?

According to Veracode's 2025 GenAI Code Security Report (100+ LLMs, 80 coding tasks), 45% of AI-generated code introduces OWASP Top 10 vulnerabilities. Java had a 72% failure rate. Cross-site scripting defenses failed 86% of the time. CodeRabbit's December 2025 study of 470 GitHub PRs found AI-generated code had 1.7x more issues and 2.74x more XSS vulnerabilities than human-authored code. Security performance did not improve with newer or larger models.

### Are AI coding tools actually faster for experienced developers?

The METR randomized controlled trial (July 2025) found 16 experienced open-source developers were 19% slower with AI tools on real-world tasks in large, mature codebases. However, this study tested arguably the hardest use case for AI tools. For non-technical founders building greenfield applications — the core vibe coding audience — productivity gains during initial prototyping are likely real. The data suggests those gains diminish as codebases grow in size and complexity. The Faros AI report found similar patterns at scale: 21% more tasks completed but 91% longer PR review times and flat delivery metrics.

### How much does it cost to build a SaaS the traditional way?

A micro-SaaS MVP costs $10,000 to $25,000 via freelancers or offshore agencies. A standard SaaS MVP costs $60,000 to $150,000. Complex platforms run $150,000 to $500,000+. Eucalipse estimates total Year 1 costs (including infrastructure, compliance, support, and marketing) at $279,000 to $505,000 for a $100K MVP. Clutch.co's average across verified projects is $132,480 with a 13-month timeline.

### What is the typical churn rate for an early-stage SaaS?

ChartMogul data from 2,500+ SaaS businesses shows early-stage companies (under $300K ARR) experience median monthly customer churn of 6.5%. Products priced under $25/month see 6.1% monthly churn. At 5% monthly churn, you lose approximately 46% of your customer base annually. Top-performing SaaS companies achieve negative net churn of -5% to -15% annually through expansion revenue.

### Did Andrej Karpathy stop using vibe coding?

For his most ambitious project (nanochat, an 8,000-line ChatGPT training pipeline), yes. Karpathy stated the code was "basically entirely hand-written" because AI agents were "net unhelpful, possibly the repo is too far off the data distribution." By February 2026, he introduced "agentic engineering" as a replacement term, emphasizing orchestration, oversight, and expertise rather than "giving in to the vibes."

### What happened with the Lovable security vulnerability?

CVE-2025-48757, discovered March 20, 2025, found that 10.3% of Lovable-generated applications (170 out of 1,645 tested) had missing Row Level Security policies. This exposed user databases, payment records, and API keys to unauthenticated access. Escape.tech's broader scan of 5,600 vibe-coded apps found 2,000+ vulnerabilities, 400+ exposed secrets, and 175 instances of exposed personal data.

### How should I price my vibe-coded SaaS to be profitable?

Your AI API cost per user ($0.30 to $9.00/month depending on model) plus infrastructure cost per user ($0.25 to $0.75/month at scale) sets your gross margin floor. A $9/month product using Claude Sonnet at $3/user/month for API calls has roughly 55% gross margin before infrastructure, leaving almost nothing after hosting, Stripe fees (2.9% + $0.30), and compliance. Products priced under $29/month with AI features face tight unit economics. Budget for 5 to 7% monthly churn in your revenue model. At scale, routing high-volume calls to self-hosted open-weight models on GPU instances can reduce the API cost component by 60 to 80%, significantly improving margins.

---

*Sources: Collins Dictionary Word of the Year 2025; MIT Technology Review 10 Breakthrough Technologies 2026; Stack Overflow 2025 Developer Survey; Veracode 2025 GenAI Code Security Report (July 30, 2025); CodeRabbit State of AI vs Human Code Generation (December 17, 2025); Gitclear 2025 AI Code Quality Report; METR RCT on AI Developer Productivity (July 10, 2025); SaaStr/Replit incident (July 2025); Replit Customer Story: SaaStr; Matt Shumer, "Something Big Is Happening" (February 9, 2026); Andrej Karpathy, nanochat announcement (October 13, 2025); TechCrunch, "The rise of micro apps" (January 16, 2026); Faros AI Developer Productivity Report (July 2025); Google DORA Report 2025; Lovable CVE-2025-48757; Escape.tech vibe-coded app scan (October 2025); Apiiro AI code security analysis (September 2025); ChartMogul SaaS churn benchmarks; Baremetrics churn data; Clutch.co developer pricing guide; Eucalipse SaaS Development Cost Guide 2025; Ptolemay SaaS cost analysis; Arc.dev freelance developer rate survey (5,302 developers); Upwork official rate data; SaaS Capital 2025 spending benchmarks. All tool pricing verified against official vendor pages as of February 24, 2026.*

Last updated: February 24, 2026
