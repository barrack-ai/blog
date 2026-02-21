---
title: "Every AI App Data Breach Since January 2025: 20 Incidents, Same Root Causes"
description: Between January 2025 and February 2026, at least 20 documented security incidents exposed the personal data of tens of millions of users across AI-powered applications. Nearly every single one traces back to the same preventable root causes. Here is every incident, sourced, dated, and cross-referenced.
slug: every-ai-app-data-breach-2025-2026
tags: [ai-security, firebase, data-breach, self-hosted-ai, cloud-gpu, vibe-coding]
keywords: [ai app data leak, firebase misconfiguration, ai chatbot data breach, chat and ask ai breach, supabase rls, vibe coding security, self-hosted llm, gpu cloud, ai app security 2026]
image: /img/ai-data-breach-og.png
authors: [dhaya]
date: 2026-02-21
---

# Every AI App Data Breach Since January 2025: 20 Incidents, Same Root Causes

Between January 2025 and February 2026, at least 20 documented security incidents exposed the personal data of tens of millions of users across AI-powered applications. Nearly every single one traces back to the same preventable root causes: misconfigured Firebase databases, missing Supabase Row Level Security, hardcoded API keys, and exposed cloud backends.

This is not a collection of isolated mistakes.

Three independent large-scale research projects, CovertLabs' Firehound scanning 198 iOS apps, Cybernews' audit of 38,630 Android AI apps, and Escape's analysis of 5,600 vibe-coded applications, all converge on the same conclusion: the AI app ecosystem has a systemic, structural security crisis. The rush to ship AI wrappers, chatbots, and "vibe-coded" products has outpaced even the most basic security practices, leaving hundreds of millions of user records readable by anyone with a browser.

What follows is every documented incident, research finding, and industry statistic. Sourced, dated, and cross-referenced.
<!-- truncate -->

---

## At a glance: every incident

| Date | App / Platform | What Leaked | Scale | Root Cause | Fix Time |
|------|---------------|-------------|-------|------------|----------|
| Jan 29, 2025 | DeepSeek | Plaintext chat histories, API keys, backend metadata | 1M+ log lines | Unauthenticated ClickHouse DB | < 1 hour |
| May 29, 2025 | Lovable (CVE-2025-48757) | PII, financial data, dev API keys, admin tokens | 303 endpoints | Missing Supabase RLS | Scan tool added |
| Jun 30, 2025 | McHire (McDonald's) | Names, emails, phones, AI interview transcripts | 64M applicants | Default credentials (123456) + IDOR | Same day |
| Jul 9, 2025 | Base44 (Wix) | Internal chatbots, HR tools, PII, enterprise apps | 170+ apps | Auth bypass via undocumented API | 24 hours |
| Jul 25, 2025 | Tea App (Breach 1) | 13K govt IDs, 59K images, GPS metadata | 72K images (59 GB) | Firebase Storage misconfiguration | 1-2 days |
| Jul 28, 2025 | Tea App (Breach 2) | Private DMs: abortions, abuse, infidelity | 1.1M messages | Firebase DB misconfiguration | 1 day |
| Aug 28, 2025 | Chattee Chat / GiMe Chat | Intimate AI companion messages, NSFW images | 43M messages, 400K users | Unauthenticated Kafka Broker | ~3 weeks |
| Sep 17, 2025 | Wondershare RepairIt | User data, AI models, source code, software binaries | Undisclosed | Hardcoded cloud credentials (CVE-2025-10643/44) | After disclosure |
| Oct 2025 | MagicEdit | AI deepfakes, nudified images, images of minors | 1,099,985 files | Unprotected database | After disclosure |
| Oct 29, 2025 | 5,600 Vibe-Coded Apps (Escape) | Medical records, IBANs, phone numbers, API keys | 2,000+ vulns, 400+ secrets | Supabase RLS missing, hardcoded keys | Varies |
| Jan 10, 2026 | Bondu AI Toy | 50K children's chat transcripts, names, birthdates | 50K+ transcripts | Any Google account = admin access | 10 minutes |
| Jan 15, 2026 | Chat & Ask AI | 300M+ chat messages, emails, phone numbers | 406M records, 18-25M users | Firebase rules: allow read: if true | Hours |
| Jan 19, 2026 | 196 iOS AI Apps (Firehound) | User data across 196 apps in 6 categories | 406M+ records, 18M users | Firebase misconfigurations (98.9%) | Ongoing |
| Jan 30, 2026 | 38,630 Android AI Apps (Cybernews) | Cloud keys, Stripe secrets, AWS creds, 200M+ files | 197K secrets, 730 TB | 72% had hardcoded secrets | N/A (audit) |
| Jan 31, 2026 | Moltbook | 1.5M API tokens, 35K emails, agent messages | 4.75M records | Supabase RLS never enabled | Multiple rounds |
| Feb 11, 2026 | 3 Photo-ID Apps (OZI Tech) | User photos, documents, GPS coordinates | 150K+ users | Firebase misconfiguration | After disclosure |
| Feb 13, 2026 | Orchids | Full remote access to user devices (zero-click) | ~1M users at risk | Vibe-coded platform vulnerability | Unfixed as of pub |

Every incident below is sourced from primary researcher disclosures, CVE databases, court filings, or original reporting.

---

## The Firehound "slopocalypse": 196 out of 198 iOS AI apps leaking data

On **January 19, 2026**, the cybersecurity community account vx-underground posted on X: *"It's the slopocalypse."*

The post highlighted Firehound, an open-source scanner built by security researcher **Harry** ([@Harrris0n](https://x.com/Harrris0n) on X) of **CovertLabs**. The tool downloads iOS apps from the App Store, extracts Firebase configurations from app bundles, and systematically tests for security misconfigurations across Firebase Realtime Database, Firestore, Firebase Storage, Firebase Functions, and Firebase Hosting.

Of the **198 iOS AI apps** scanned, **196 were actively exposing user data** through misconfigured cloud backends. That is a 98.9% failure rate.

The project cataloged over **406 million total records** exposed across these apps, affecting more than **18 million users**. The affected apps spanned Education, Entertainment, Graphics & Design, Health & Fitness, Lifestyle, and Social Networking categories. The top offenders by record count included **Chat & Ask AI** (406 million records), **GenZArt** (18.9 million records), **YPT - Study Group** (13.5 million records), **song.ai.generator** (5.4 million records), and **Chatbot AI** (1.7 million records).

Firehound is available on PyPI as `firehound-scanner`. Its public registry restricts full evidence access to registered security professionals and law enforcement, with a responsible disclosure mechanism for developers to contact CovertLabs, fix their configurations, and get removed from the listing.

---

## Chat & Ask AI: 300 million private messages from 25 million users

The single largest exposure cataloged by Firehound was **Chat & Ask AI**, developed by **Codeway Dijital Hizmetler Anonim Şirketi** (Istanbul, Turkey). The app, an AI wrapper providing access to ChatGPT, Claude, and Gemini with over **50 million total installs** across iOS and Android, had its Google Firebase Security Rules left in a fully public state. Effectively: `allow read: if true;`. Anyone with the project URL could read, modify, or delete the entire database without authentication.

Two sets of numbers exist for this breach, and they come from different sources at different times.

**The Firehound automated registry** (January 15-18, 2026) cataloged **380 million messages**, **18 million users**, and **406,033,606 total records**. The 406 million figure includes all database records: messages plus user profiles, metadata, and settings. These numbers were reported by AppleInsider and AICerts News.

**Harry's disclosure** (reported by 404 Media's Emanuel Maiberg around January 29, 2026) cited approximately **300 million messages** from **25 million users**. Malwarebytes and IDStrong repeated these figures. The discrepancy likely reflects different counting methodologies and measurement dates, with Harry's numbers being rounded estimates from sampling and the Firehound registry reflecting automated database counts.

Exposed data included complete chat histories with AI models, timestamps and model settings, email addresses, phone numbers, user configurations, and data from users of other Codeway apps in the same portfolio. The content of the chats included discussions of illegal activities, suicide methods, drug manufacturing, mental health struggles, and personal financial details.

The timeline: Firehound's registry entry is dated **January 15, 2026**. The Turkish Data Protection Board (KVKK) notification states the breach period was **January 15-20, 2026**. Harry disclosed the vulnerability to Codeway on **January 20, 2026**, and the company patched all its apps within hours via a server-side configuration change. The KVKK issued Decision No. 2026/139 on **January 27, 2026**, ordering a public announcement and assessing approximately 3,700 affected individuals scoped to Turkish users. No CVE was assigned. This was a configuration error, not a software vulnerability.

---

## Cybernews finds 72% of Android AI apps leak hardcoded secrets

Published **January 30, 2026**, Cybernews' research team analyzed **1.8 million Android apps** from Google Play, identifying **38,630 that explicitly claimed AI functionality**. The findings: **72% contained at least one hardcoded secret** embedded directly in application code, with an average of **5.1 secrets leaked per app**. Across the dataset, researchers found **197,092 unique secrets** spanning **3,185 distinct types**.

What leaked: **81.14%** of detected secrets related to Google Cloud Project identifiers, endpoints, and API keys. Researchers also found Facebook app IDs and client tokens, **Stripe live secret keys** providing complete control over payment backends, AWS credentials, and marketing platform tokens for Twitter, Braze, and Intercom. LLM API keys were rarely hardcoded. Only a handful were detected, and most posed low risk.

The infrastructure findings were more alarming. Researchers identified **8,545 active Google Cloud storage buckets**, hundreds of which were publicly accessible, exposing **over 200 million files** totaling approximately **730 terabytes of data**. They found **285 Firebase instances with no authentication whatsoever**, collectively leaking **1.1 GB of user data**. In nearly half of those compromised databases, researchers found evidence of prior automated exploitation: a `poc` (proof of concept) table left by previous attackers.

A parallel Cybernews study of **156,080 iOS apps** (approximately 8% of the App Store) corroborated these findings. **836 Firebase endpoints** required no authentication, exposing **76 billion files (406 TB)** of data.

On **February 11, 2026**, a separate Cybernews investigation into three AI photo identification apps, Dog Breed Identifier Photo Cam, Spider Identifier App by Photo, and Insect Identifier by Photo Cam (all by OZI Technologies, Pakistan), found all three leaking user-uploaded photos, documents, and **GPS location coordinates** via Firebase misconfigurations affecting over **150,000 users** across approximately 2 million total app downloads.

---

## Bondu AI toy: 50,000 conversations with children exposed to anyone with a Gmail account

On **January 10, 2026**, security researcher **Joseph Thacker** was asked by his neighbor about the safety of Bondu, a **$199 AI-powered stuffed dinosaur** marketed to children ages 3-9 that uses Google Gemini and OpenAI GPT-5 to hold conversations. Fellow researcher **Joel Margolis** began investigating and within 30 minutes found that Bondu's web portal at `console.bondu.com` accepted **any Google account login**, granting full admin dashboard access without special credentials.

The exposure included over **50,000 chat transcripts** between children and their AI toys. Essentially the entire conversation history minus manually deleted entries.

Data types included children's full names and birthdates, family member names, children's likes, dislikes, and preferences, parental "objectives" set for children, conversation summaries and full transcripts, and device information including IP addresses, battery levels, and awake status. Researchers also found the ability to update device firmware and reboot devices, plus an IDOR (Insecure Direct Object Reference) vulnerability allowing retrieval of any child's profile by guessing their ID.

Margolis emailed Bondu's support team at 4:43 PM EST on January 10, contacted CEO **Fateen Anam Rafid** via LinkedIn at 5:46 PM, and sent a formal vulnerability report at 6:44 PM. The console was taken offline at **6:54 PM, ten minutes after the CEO was contacted**. The following day, their lead engineer worked until 6 AM fully fixing console authentication, IDOR vulnerabilities, and additional row-level security issues.

WIRED published the original report on **January 29, 2026**. On **February 3, 2026**, U.S. Senator Maggie Hassan sent a formal letter to Bondu demanding answers by February 23. Bondu's internal investigation found **no unauthorized access beyond the two researchers**, and the company subsequently hired an external security firm and created a bug bounty program.

---

## Moltbook: "I didn't write a single line of code," and 1.5 million API tokens proved it

**Moltbook**, a self-described "social network for AI agents" created by **Matt Schlicht** (CEO of Octane AI), launched on **January 28, 2026** and was compromised within three days. On **January 31, 2026**, two independent parties discovered the same critical flaw: **Jameson O'Reilly** of Dvuln (reported to 404 Media) and **Wiz Research** (Gal Nagli, Bandhna Bedi, Daphna Dayan, Katerina Greenstein) who reported directly to Schlicht.

The root cause was a misconfigured Supabase database with **Row Level Security (RLS) never enabled**. The Supabase API key and project URL were exposed in client-side JavaScript. Without RLS, the public API key granted full unauthenticated read and write access to all database tables.

The exposure: approximately **1.5 million API authentication tokens**, **35,000 email addresses** (plus 29,631 early-access signup emails), **4,000 private messages between agents**, and **4.75 million total database records**, including claim tokens, verification codes, and owner relationships for all 32,000+ registered AI agents linked to 17,000 human accounts.

Wiz's disclosure timeline documents the remediation chaos: initial DM contact at 21:48 UTC, first report at 22:06, first partial fix at 23:29, second fix at 00:13, discovery that write access was still open at 00:31, third fix at 00:44, and discovery of additional exposed tables (including a table called `observers` with 29,000 emails) at 00:50. Multiple rounds of remediation were required. The fix would have required just two SQL statements to enable RLS.

Schlicht had publicly stated: *"I didn't write a single line of code for Moltbook."*

Georgia Tech professor **Mark Riedl**, commenting on the Moltbook breach, put it plainly: *"The AI community is re-learning 20 years of cybersecurity. The hard way."*

The architectural fix for every incident in this article is the same. Run your own models on infrastructure you control. More on that at the end.

---

## Tea App: government IDs, 1.1 million messages, and nearly a dozen lawsuits

**Tea** (officially "Tea Dating Advice"), a women-only dating safety app founded by **Sean Cook** (former Salesforce/Shutterfly executive), suffered two consecutive breaches in **July 2025**. Both stemmed from Firebase misconfigurations.

**Breach 1 (July 25, 2025):** An anonymous 4chan user posted a link to Tea's exposed Firebase storage bucket. 404 Media journalist Joseph Cox verified the exposure: approximately **72,000 images** including **13,000 selfies and government-issued IDs** (driver's licenses, passports) from verification, **59,000 images** from posts, comments, and DMs, plus GPS/location metadata totaling **59+ GB of data**.

Tea had promised users that verification selfies and IDs would be deleted after review. The leak proved they were retained.

The data was posted to 4chan and hacking forums. Automated scripts scraped it. Someone created a "Facemash"-style rating site with leaked selfies. Someone else mapped user locations on Google Maps.

**Breach 2 (July 28, 2025):** Independent researcher **Kasra Rahjerdi** discovered a second exposed database containing approximately **1.1 million private direct messages** spanning February 2023 through July 2025. Messages contained discussions about abortions, infidelity, abuse, phone numbers, social media profiles, and meeting locations.

Tea secured the Firebase bucket on July 25-26, then disabled direct messaging on July 29 after the second breach. **Two class-action lawsuits** were filed on July 29 in the Northern District of California. **Nearly a dozen total lawsuits** eventually followed. The app had over **2 million users** and was **#1 on the Apple App Store** at the time of the breach.

---

## Base44: one authentication bypass, every app on the platform compromised

On **July 9, 2025**, Wiz Research discovered a critical authentication bypass in **Base44**, an AI-powered "vibe coding" platform acquired by Wix for **$80 million** in June 2025. The vulnerability was a logic flaw: two undocumented API endpoints (`api/apps/{app_id}/auth/register` and `api/apps/{app_id}/auth/verify-otp`) were exposed without proper authentication. An attacker could obtain the non-secret `app_id` (visible in app URLs and manifest.json), register a new user account, verify via OTP, and log in via SSO, bypassing all authentication controls including enterprise SSO.

Wiz identified **170+ private enterprise applications** potentially affected through CNAME record tracing (all Base44 custom domains point to `base44.onrender.com`). Exposed apps included internal chatbots, knowledge bases, PII and HR operations tools, and automation systems. The platform had over **20,000 users**.

Wiz reported the vulnerability on July 9. **Wix deployed a fix within 24 hours** (July 10), blocking external registration to private applications. Wix confirmed no evidence of exploitation. The public disclosure was published July 29, 2025. Separately, **Imperva researchers** had discovered additional Base44 vulnerabilities (stored XSS, open redirect, JWT token leakage) in March-April 2025, which were fixed over that period. No CVE was assigned for the authentication bypass.

---

## DeepSeek: one million log lines with plaintext chat histories

The first major AI app security incident of the period came on **January 29, 2025**, when **Wiz Research** (Gal Nagli) discovered a publicly accessible, unauthenticated **ClickHouse database** at `oauth2callback.deepseek.com:9000` and `dev.deepseek.com:9000` belonging to **DeepSeek**, the Chinese AI startup behind the DeepSeek R1 reasoning model.

The database contained over **one million lines of log streams** including plaintext chat histories, API keys and secrets, backend operational details, and metadata. Full database control was possible without any authentication.

DeepSeek secured the database **within less than one hour** of Wiz's notification. The incident triggered regulatory responses from **Italy's Garante** (which launched an inquiry and pulled DeepSeek from Italian app stores), **Ireland's DPC**, and the **U.S. National Security Council**.

---

## Lovable: CVE-2025-48757 and 303 vulnerable Supabase endpoints

**Lovable** (formerly GPT Engineer), an AI vibe-coding platform valued at **$1.8 billion** after raising $200 million in August 2025, was found to systematically generate applications with missing Supabase Row Level Security policies.

The vulnerability was first identified by **Matt Palmer** (a Replit employee) in March 2025 when he discovered exposed data in a "Linkable" site. **Daniel Asaria** (a Palantir engineer) independently found the same issue in April 2025.

**CVE-2025-48757** was published on **May 29, 2025**, with a CVSS score of **8.26-9.3**. Lovable's client-driven architecture uses a public `anon_key` to make direct REST API calls to Supabase from the browser. When RLS is absent, anyone can query entire database tables.

Researchers found **170 out of 1,645 Lovable apps** (10.3%) had critical flaws, with **303 vulnerable Supabase endpoints**. Exposed data included PII (names, emails, phone numbers, home addresses), financial data (payment information, personal debt amounts, Stripe payment statuses), developer API keys (Google Maps, Gemini, eBay, Stripe), and admin tokens. Lovable added a security scan tool that flags whether RLS exists but does not test correctness. No full post-mortem was published.

---

## McDonald's AI hiring bot: 64 million applicants, password "123456"

On **June 30, 2025**, security researchers **Ian Carroll** and **Sam Curry** discovered that **McHire**, McDonald's AI-powered hiring platform built by **Paradox.ai** and used by 90% of McDonald's franchisees, had a test account with default credentials active since 2019. Both the username and password were **"123456"**. No multi-factor authentication was configured. An additional IDOR vulnerability in the API allowed sequential enumeration of applicant records.

The exposure potentially affected **64 million job applicants**, with data including names, email addresses, phone numbers, IP addresses, shift preferences, chat transcripts from AI interviews, and personality test data.

Krebs on Security further reported that the same password was reused across Paradox accounts for other Fortune 500 firms including Aramark, Lockheed Martin, Lowe's, and Pepsi.

Paradox.ai disabled the vulnerable account and patched the endpoint **the same day** (July 1, 2025), launched a bug bounty program, and updated password policies. McDonald's publicly expressed disappointment in the vendor.

---

## Chattee Chat and GiMe Chat: 43 million intimate AI companion messages

On **August 28, 2025**, Cybernews researchers discovered that **Chattee Chat - AI Companion** (300,000+ downloads) and **GiMe Chat - AI Companion**, both by Hong Kong developer **Imagime Interactive Limited**, were streaming data through a **publicly exposed, unauthenticated Kafka Broker instance** already indexed by IoT search engines.

The exposure included **43 million private intimate messages** between users and AI companions, **600,000+ images and videos** (mostly NSFW content), IP addresses, device identifiers, in-app purchase logs, and authentication tokens, affecting **400,000+ users**. 66.3% were iOS users. Transaction data revealed some users had spent up to **$18,000** on the apps.

The Kafka Broker was secured on **September 19, 2025** after responsible disclosure. The developer did not respond to media requests.

---

## MagicEdit: 1.1 million AI-generated images, including apparent minors

In **October 2025**, independent cybersecurity researcher **Jeremiah Fowler** discovered a publicly accessible, unprotected, unencrypted database belonging to **MagicEdit** (operated by DreamX, linked to SocialBook/BoostInsider Inc.), an AI-powered image generator and "nudify" tool. His findings were published by WIRED on **December 5, 2025**.

The database contained over **1,099,985 images and video files**, with approximately 10,000 new images being added daily. Nearly all content was pornographic, including explicit AI-generated images, face-swap/"nudified" deepfakes, **images depicting apparent minors**, and unaltered photos of real individuals likely uploaded without consent.

The database was restricted after responsible disclosure. MagicEdit's website and apps were subsequently taken down.

---

## Orchids: a zero-click hack demonstrated live on the BBC

In **December 2025**, UK-based cybersecurity researcher **Etizaz Mohsin** (Digital.ai, with prior experience on Pegasus spyware analysis) discovered a zero-click vulnerability in **Orchids**, an AI vibe-coding platform claiming approximately one million users.

Mohsin spent weeks between December 2025 and February 2026 attempting to contact Orchids via email, LinkedIn, and Discord, sending approximately 12 messages. The company responded only the week of publication, saying they "possibly missed" his warnings because their team of fewer than 10 was "overwhelmed."

On **February 13, 2026**, the BBC published the story (by Joe Tidy), including a live demonstration where Mohsin gained **full remote access to a journalist's laptop**, changing the wallpaper and creating files with no user interaction required. As of the publication date, the vulnerability remained unfixed.

---

## Escape's audit of 5,600 vibe-coded apps found 2,000+ vulnerabilities

On **October 29, 2025**, security firm **Escape** published results of scanning **5,600+ publicly available applications** built on vibe-coding platforms including Lovable (approximately 4,000 apps), Base44 (approximately 159), Create.xyz (approximately 449), Vibe Studio, and Bolt.new. They discovered over **2,000 vulnerabilities**, **400+ exposed secrets** (API keys and tokens), and **175 instances of exposed PII** including medical records, IBANs, phone numbers, and emails. Supabase JWT tokens were routinely exposed in frontend code, enabling unauthorized database access.

The findings reinforced that this is a platform-level, architectural problem, not a series of individual developer mistakes.

Separately, **Wiz Research** published a collaboration with Lovable in **September 2025** identifying four systematic misconfiguration categories in vibe-coded apps: client-side-only authentication, hardcoded API keys in frontend code, insecure or missing Supabase RLS policies, and exposure of internal applications. Wiz assessed that **1 in 5 organizations** build on vibe-coding platforms.

Testing by **Ravenna** in **December 2025** assessed five vibe coding tools across 15 applications and found **69 security vulnerabilities**, including half a dozen critical flaws.

---

## Wondershare RepairIt and Orchids: hardcoded credentials and supply chain risks

In **September 2025**, Trend Micro researchers (Alfredo Oliveira and David Fiser) disclosed two critical vulnerabilities in **Wondershare RepairIt**, an AI-powered image/video repair application:

**CVE-2025-10643** (published September 17, 2025, CVSS 9.1): Incorrect Permission Assignment Authentication Bypass. ZDI advisory ZDI-25-895.

**CVE-2025-10644** (published September 17, 2025, CVSS 9.4): SAS Token Incorrect Permission Assignment Authentication Bypass. ZDI advisory ZDI-25-896.

Hardcoded cloud storage credentials in the app binary enabled read and write access to storage containing user data, AI models, software binaries, container images, and company source code. This created supply chain attack potential: an attacker could replace legitimate software binaries with malicious ones.

---

## The numbers behind the epidemic: industry statistics and research

**Firebase misconfiguration prevalence** has been documented across multiple independent studies over six years.

Comparitech (2020) found **4.8% of all Firebase-using mobile apps** were misconfigured, but estimated **30% of all Google Play apps** use Firebase, meaning the absolute number is enormous. RedHunt Labs found approximately **1 in 5 (18.3%) Firebase databases** are vulnerable. Quokka's 2022 scan found **33.2% of 1.85 million Android apps** misconfigured.

In 2024, researchers mrbruh, xyzeva, and logykk scanned 5 million websites and found **916 with misconfigured Firebase**, exposing **125 million user records** and **19.8 million plaintext credentials**, published at env.fail and summarized by GitGuardian. CovertLabs' 2026 AI-specific scan showed **196 out of 198 iOS AI apps** actively leaking data.

The pattern is consistent: Firebase misconfiguration rates are high across all apps, and dramatically worse among AI apps.

**Intruder** published research in **December 2025** (widely covered in February 2026) scanning approximately **5 million applications** for secrets in JavaScript bundles using a novel spidering-based detection method with Nuclei. They found **42,000+ exposed tokens** across **334 distinct secret types**, including **688 code repository tokens** (GitHub/GitLab, many still active), tokens providing access to private ticketing systems, and secrets enabling posting to private Slack channels. One GitLab personal access token found in a JavaScript file was scoped to allow access to all private repositories within an organization, including CI/CD pipeline secrets for AWS and SSH.

**GitGuardian's State of Secrets Sprawl 2025 report** found **23.8 million secrets** leaked on public GitHub repositories in 2024, a **25% year-over-year increase**. 70% of secrets leaked in 2022 remain active today. 35% of private repositories contained at least one plaintext secret.

The **Veracode 2025 GenAI Code Security Report** (published July 30, 2025) tested 80 curated coding tasks across more than 100 LLMs. When given a choice between a secure and insecure method, **GenAI models chose the insecure option 45% of the time**. Java was the riskiest language with a **72% security failure rate**. Cross-site scripting failed in **86%** of cases. Log injection failed in **88%**. Security performance remained flat despite larger and newer models, indicating a systemic issue rather than an LLM scaling problem.

The **IBM/Ponemon Cost of a Data Breach Report 2025** (published July 30, 2025, covering 600 breached organizations) confirmed that **20% of organizations experienced breaches due to shadow AI**, with shadow AI breaches costing an average of **$670,000 more** than standard incidents ($4.63 million vs. $3.96 million). Shadow AI is now one of the top three costliest breach factors. Meanwhile, **97% of organizations experiencing AI-related breaches lacked proper AI access controls**, and **63%** either don't have an AI governance policy or are still developing one. The global average breach cost was **$4.88 million in 2024** (all-time high) and dropped to **$4.44 million in 2025**, the first decline in five years. U.S. breach costs, however, rose to a record **$10.22 million**.

---

## The academic foundation: this problem was documented in 2019

The pattern of cloud backend data leakage from mobile apps is not new.

In 2019, researchers **Chaoshun Zuo and Zhiqiang Lin** at Ohio State University published "Why Does Your Data Leak? Uncovering the Data Leakage in Cloud from Mobile Apps" at **IEEE S&P 2019**. Using a tool called LeakScope, they evaluated **1,609,983 mobile apps** and found **15,098 unique apps** with cloud backend data leakage vulnerabilities, including 10 apps with 100-500 million users. Over **90% of analyzed apps used Google Firebase** for backend services.

The root causes they identified in 2019, lack of authentication, misuse of keys, misconfiguration of user permissions, are identical to what researchers are finding in 2026, seven years later. The difference is that AI-generated code now systematically reproduces these same mistakes at scale.

---

## A note from me

I run [barrack.ai](https://barrack.ai), a GPU cloud platform. Over the last several months of building and talking to early users and prospects, I have noticed a pattern. The most technically sophisticated people reaching out are not asking about raw compute power or model benchmarks. They are asking about data residency. They want to know where their data goes, who can see their prompts, and whether the VM they rent is actually isolated.

That tells me something about where the market is heading. The people paying closest attention have already stopped trusting third-party AI wrappers with their data.

---

## What this means, and the alternative that already exists

The data tells a clear story. Between January 2025 and February 2026, **every major independent audit** of AI applications, whether scanning iOS apps (CovertLabs), Android apps (Cybernews), vibe-coded web apps (Escape, Wiz), or JavaScript bundles (Intruder), found the same structural failures at epidemic scale. Firebase and Supabase misconfigurations, hardcoded secrets in client-side code, and absent authentication controls are the norm, not the exception, in AI-powered applications.

Three factors converged to create this crisis.

First, the "vibe coding" phenomenon, where AI generates functional applications without security review, has put production systems online at unprecedented speed. Y Combinator CEO Garry Tan reported on March 5, 2025 that **25% of YC's Winter 2025 startups had codebases that were 95% AI-generated**. 41% of all code written in 2024 was AI-generated.

Second, Veracode's research demonstrates that **LLMs systematically choose insecure code patterns** nearly half the time, and this rate does not improve with larger models.

Third, **platform-level architectural decisions** (like Supabase's reliance on client-side `anon_key` or Firebase's permissive default rules) mean that a single missing configuration line can expose an entire application's data.

The incidents documented here exposed hundreds of millions of chat messages, children's conversations with AI toys, government-issued identification documents, intimate messages, AI-generated deepfakes, and 64 million job applicants' records. In nearly every case, the vulnerability was trivially exploitable, required no sophistication, and was fixed within hours to days of responsible disclosure. The Cybernews finding that nearly half of compromised Firebase databases already contained evidence of prior automated exploitation makes the implications of that timeline clear.

**There is an alternative.** Every one of these breaches happened because user data left the user's control and landed in a misconfigured third-party backend. The architectural fix is straightforward: run your own models on infrastructure you control.

Open-source models like DeepSeek V3.2, GLM-5, Qwen3, and Llama 4 now match or exceed the capabilities of the proprietary APIs that these leaky wrapper apps were built on. A single cloud GPU with 80GB of VRAM can serve a 70B-parameter model locally. Your prompts never leave the VM. There is no Firebase to misconfigure. There is no Supabase `anon_key` exposed in a JavaScript bundle. There is no third-party database for a researcher to find with a browser.

If you are building AI features into a product, processing sensitive data through AI workflows, or simply using AI for tasks that involve information you would not want publicly indexed, self-hosting on an isolated cloud GPU is the most direct way to eliminate the entire class of vulnerabilities documented in this article.

**[barrack.ai](https://barrack.ai)** provides on-demand cloud GPUs, from A100s to B300s, with per-minute billing and no contracts. Sign up, add credits, deploy a VM, and SSH in. Your data stays on your machine.

---

*All incidents documented in this article are sourced from primary researcher disclosures, CVE databases, court filings, regulatory decisions, and original reporting by 404 Media, WIRED, Malwarebytes, Cybernews, Wiz Research, and the BBC. No claims in this article are based on assumptions or speculation. If you are a researcher or developer mentioned in this article and believe any detail is inaccurate, contact us and we will correct it immediately.*
