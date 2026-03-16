---
slug: qihoo-360-ssl-key-leak-wotrus-ca-fraud
title: "Qihoo 360's AI Product Leaked the Platform's SSL Key, Issued by Its Own CA Banned for Fraud"
description: "Qihoo 360 shipped the wildcard SSL private key for *.myclaw.360.cn inside its AI assistant installer. The certificate was issued by WoTrus CA, Qihoo 360's own subsidiary, previously distrusted by Chrome, Firefox, and Safari under its former name WoSign for certificate fraud."
authors: [dhaya]
tags: [security, ssl, openclaw, qihoo-360, certificate-authority, wotrus, wosign]
image: ./qihoo-360-ssl-key-leak.png
keywords:
  - Qihoo 360 SSL key leak
  - 360 Security Lobster vulnerability
  - 360安全龙虾
  - OpenClaw security
  - WoTrus CA
  - WoSign certificate fraud
  - myclaw.360.cn private key
  - SSL private key leaked
  - China cybersecurity
  - AI agent security
  - wildcard SSL certificate leak
---

# Qihoo 360's AI Product Leaked the Platform's SSL Key, Issued by Its Own CA Banned for Fraud

**Qihoo 360, China's largest cybersecurity company with approximately 460 million users and a valuation of approximately $10 billion, shipped a wildcard SSL private key inside the public installer of its new AI assistant, 360 Security Lobster (360安全龙虾).**

The certificate was issued by WoTrus CA Limited. WoTrus is a subsidiary of Qihoo 360 and the rebranded version of WoSign, a certificate authority that was distrusted by Google Chrome, Mozilla Firefox, and Apple Safari in 2016 for backdating certificates and concealing corporate acquisitions.

Six days before the key was discovered in the installer, Qihoo 360 founder Zhou Hongyi publicly promised that 360 Security Lobster would "not damage the user's system, not delete data, and not leak passwords or other private information on the user's computer."

The original Chinese statement from Zhou Hongyi:

> 保证"龙虾"在用户电脑上不会破坏系统、不删除数据、不泄露密码等隐私信息。

<!--truncate-->

## What Happened

On March 10, 2026, Zhou Hongyi announced 360 Security Lobster (360安全龙虾), a commercial wrapper around the open-source AI agent OpenClaw. The product was positioned as a solution to OpenClaw's three primary problems: high installation barriers (usage threshold too high), unpredictable results (results too random), and security vulnerabilities (security risks too prominent). Zhou described OpenClaw as "a remarkable innovation" but likened it to "an intern" that requires patient training. 360 Security Lobster was framed as the enterprise-grade fix, reducing setup time from approximately six hours to ten minutes.

A follow-up media exchange took place on March 12, and a formal launch event with live demonstration was held on March 14, 2026 at 360's headquarters in Beijing.

On March 16, 2026, security researchers discovered that the installer package contained the wildcard SSL private key for `*.myclaw.360.cn`, stored at:

```
/namiclaw/components/OpenClaw/openclaw.7z/credentials
```

The discovery originated on the Chinese developer forum linux.do, in a post titled "地狱笑话：360的安全龙虾，打包了自己域名的私钥" ("Hell joke: 360's Security Lobster bundled its own domain's private key"). The findings were mirrored via channel.0w0.best and subsequently amplified by X user @realNyarime (who published the actual PEM-encoded certificate data), security researcher Lukasz Olejnik, and the International Cyber Digest.

## Certificate Details

The following details were extracted from the leaked certificate and key using OpenSSL:

```
$ openssl x509 -in myclaw.360.cn.crt -text
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 98:df:ea:fd:c4:c3:23:71:f0:ab:49
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=CN, O=WoTrus CA Limited
        Validity
            Not Before: Mar 12 00:00:00 2026
            Not After : Apr 12 23:59:59 2027
        Subject: CN=*.myclaw.360.cn
```

The MD5 fingerprint of the RSA private key modulus matches the certificate modulus exactly:

```
$ openssl rsa -modulus -noout -in myclaw.360.cn.key | openssl md5
MD5(stdin)= 446097b7674080186a469ecb0945f5af

$ openssl x509 -modulus -noout -in myclaw.360.cn.crt | openssl md5
MD5(stdin)= 446097b7674080186a469ecb0945f5af
```

The matching MD5 fingerprints (`446097b7674080186a469ecb0945f5af`) confirm that the leaked file is the actual private key that signs the certificate, not just a copy of the public certificate.

The wildcard certificate covers every subdomain on `myclaw.360.cn`. The certificate is valid until April 12, 2027.

## What the Leaked Key Enables

Anyone in possession of this private key can:

- **Impersonate 360's servers** to any client that trusts the certificate.
- **Intercept encrypted traffic** between users and the myclaw.360.cn platform via man-in-the-middle attacks.
- **Forge login pages** that are cryptographically indistinguishable from legitimate ones.
- **Hijack AI agent sessions** running through the platform.

Every user who connected to any subdomain of myclaw.360.cn between the installer's release and whenever the certificate is revoked was potentially exposed. Any traffic intercepted during that period using the leaked key is retroactively compromised. Per CA/Browser Forum Baseline Requirements, certificate authorities must revoke compromised certificates within 24 hours of confirmed key compromise.

## WoTrus CA Issued the Certificate. Qihoo 360 Owns WoTrus.

This is where the story takes a turn that no other English-language report has covered.

The leaked certificate was issued by **WoTrus CA Limited**. WoTrus is the rebranded version of **WoSign CA Limited**, a Chinese certificate authority. Qihoo 360 owns WoSign and, by extension, WoTrus.

The name change was approved by WoTrus's board on **August 24, 2017**. Hong Kong corporate registry records confirm the name history: WoSign eCommerce Services Limited (2010) to WOSIGN CA LIMITED (2013) to WoTrus CA Limited (August 24, 2017). WoSign stated the rebrand was "to clearly distinguish between WoSign old root CA certificate and the upcoming new root CA certificate."

### The WoSign History

In 2015, WoSign secretly acquired StartCom, an Israeli certificate authority founded in 1999, without disclosing the deal to browser vendors who operate certificate root programs. WoSign and StartCom repeatedly denied the acquisition until Mozilla gathered sufficient evidence proving otherwise. The two CAs were found to be sharing infrastructure, staff, policies, and issuance systems while presenting themselves as separate entities.

In 2016, a Mozilla-led investigation uncovered multiple problems in WoSign's certificate issuance process:

- **64 SHA-1 certificates were backdated.** WoSign issued certificates signed with the deprecated SHA-1 algorithm after the industry's cutoff date of January 1, 2016, then backdated them to make it appear as if they had been issued before the deadline. WoSign confirmed 42 were intentionally backdated.
- **The backdating was approved by WoSign's CEO.** Qihoo 360 confirmed that WoSign CEO Richard Wang personally approved the backdating of 42 SHA-1 certificates issued by WoSign and 2 issued by StartCom (for Australian payment processor Tyro).
- **WoSign's StartEncrypt software improperly implemented domain validation**, allowing anyone to obtain certificates for certain websites.

The consequences were severe. All four major browser vendors took action:

- **Apple Safari** blocked new certificates after December 1, 2016, citing "multiple control failures."
- **Google Chrome 56** (January 2017) began restricting new certificates issued after October 21, 2016. **Chrome 61** (September 2017) completed full distrust by removing the whitelist entirely.
- **Mozilla Firefox 51** (January 2017) began restricting new certificates. **Firefox 58** (January 2018) completed full root certificate removal.
- **Microsoft** announced distrust on August 8, 2017, with a September 26, 2017 cutoff.
- **Richard Wang was fired** as CEO of WoSign.
- **StartCom announced shutdown** on November 16, 2017 and stopped issuing certificates on January 1, 2018.
- **WoSign rebranded to WoTrus** on August 24, 2017.

WoTrus subsequently rebuilt its certificate authority systems, had them audited by Cure53, and deployed the new infrastructure on Qihoo 360's servers.

Today, WoTrus's old WoSign root certificates are not trusted by any major browser. The company now operates primarily as a reseller of DigiCert and Certum certificates rather than issuing from its own globally trusted roots.

### The Connection

The certificate that was leaked from the 360 Security Lobster installer was issued by WoTrus CA Limited: the same organization that was previously distrusted by every major browser vendor for certificate fraud, operating under a new name, on Qihoo 360's own infrastructure.

Qihoo 360's AI product leaked a private key from a certificate issued by Qihoo 360's own certificate authority.

## The CNCERT Timeline

The timeline of events adds another layer to this incident.

**March 10, 2026:** China's National Computer Network Emergency Response Technical Team (CNCERT) published a formal security advisory about OpenClaw titled 《关于OpenClaw安全应用的风险提示》(Risk Warning Regarding OpenClaw Security Applications). The advisory was confirmed by Xinhua News Agency and CGTN. It identified four critical risks:

1. **Prompt injection (提示词注入风险):** Attackers embedding hidden malicious instructions in web pages can trick OpenClaw into leaking user system keys.
2. **Misoperation (误操作风险):** The agent may misinterpret commands and permanently delete emails, core production data, or other critical files.
3. **Malicious plugin injection (功能插件投毒风险):** Multiple OpenClaw plugins have been confirmed as malicious. Once installed, they steal keys, deploy trojan backdoors, and turn devices into zombie bots.
4. **Unpatched vulnerabilities (安全漏洞风险):** Multiple medium and high-risk vulnerabilities have been publicly disclosed, with exploitation leading to system compromise and data leakage.

This was CNCERT's second warning about OpenClaw. China's MIIT/NVDB had issued an earlier alert on February 5, 2026, followed by another on March 8.

**March 10, 2026 (same day):** Zhou Hongyi announced 360 Security Lobster, explicitly positioning it as the enterprise-grade solution to the exact problems CNCERT warned about.

**March 12, 2026:** WoTrus CA issued the wildcard SSL certificate for `*.myclaw.360.cn`.

**March 14, 2026:** Formal launch event with live demonstration at 360 headquarters.

**March 16, 2026:** Security researchers discovered the wildcard SSL private key sitting inside the installer package.

The product that was announced as the fix for OpenClaw's security problems shipped with a more fundamental vulnerability than any that OpenClaw itself had been warned about.

## Qihoo 360's Broader Security Record

This is not an isolated incident. Qihoo 360 has been involved in multiple security and trust controversies over the past 15 years.

### 2010: Backdoor Allegations in 360 Products

In February 2010, Rising Software published an article titled "Rising Exposes the Scandal: Qihoo 360 Installs Backdoor on Users' Computers." The article reported that 360 products secretly opened a backdoor when installed, leading to potential data leaks. Qihoo 360 claimed the vulnerability had been fixed, but Rising stated the backdoor persisted in version 6.1.5.1009. The resulting lawsuit concluded in November 2011, with Qihoo 360 winning the case.

### 2014: iCloud Man-in-the-Middle Attack

In October 2014, GreatFire.org reported that the Great Firewall of China was conducting a man-in-the-middle attack against Apple's iCloud using a fake security certificate, coinciding with the iPhone 6 launch in China. Users of Chrome and Firefox received proper warnings and were blocked from proceeding. GreatFire.org specifically stated that "Qihoo's popular Chinese 360 secure browser is anything but and will load the MITMed page directly." While 360 Browser displayed warnings in the address bar, it still allowed the page to load, potentially leading to cookie leakage and credential theft.

### 2016: WoSign/StartCom Certificate Fraud

As detailed above, Qihoo 360's subsidiary WoSign was distrusted by all four major browser vendors for backdating certificates and concealing the acquisition of StartCom.

### 2020: Children's Smartwatch Surveillance Backdoor

In October 2020, Norwegian security firm Mnemonic (researchers Harrison Sand and Erlend Leiknes) published findings on the Xplora 4 children's smartwatch, manufactured by Qihoo 360 and rebranded for European and US markets by Norwegian firm Xplora Technologies. Mnemonic discovered deliberate backdoor capabilities activated via encrypted SMS commands using an RC4 encryption key set during production. The researchers found intents in Qihoo's code with names including `WIRETAP_INCOMING`, `WIRETAP_BY_CALL_BACK`, `REMOTE_SNAPSHOT`, and `SEND_SMS_LOCATION`. Mnemonic concluded: "The backdoor itself is not a vulnerability. It is a feature set developed with intent." Since the RC4 key was set during production, researchers stated "we can safely assume that Qihoo 360 has this key." Xplora had sold over 350,000 smartwatches globally. Qihoo 360 declined to comment.

### 2020: US Entity List

In May 2020, the US Bureau of Industry and Security placed Qihoo 360 on its Entity List. The Federal Register designation (85 Fed. Reg. 34503, published June 5, 2020) cited concerns related to supporting procurement of items for military end-use in China. Qihoo 360 was among 24 entities designated in this action. Zhou Hongyi later stated he believes the sanctions were retaliation for 360's reports exposing CIA and NSA hacking operations targeting China, published in March 2020.

### 2022: DoD Chinese Military Company Designation

In October 2022, the United States Department of Defense added 360 Security Technology Inc. to its Section 1260H list of "Chinese military companies" operating in the US. The company remains on the updated January 2025 list. Under Section 805 of the FY 2024 NDAA, the DoD will be prohibited from executing new contracts with listed entities effective June 30, 2026.

### 2018: i-Soon Investment

In 2018, Qihoo 360 invested in Shanghai-based i-Soon (Anxun Information). i-Soon was later exposed in a 2024 data leak as a Chinese government-linked hacking contractor.

## How a Private Key Ends Up in a Public Installer

Shipping a private key in a client-facing package is a build pipeline failure. In standard CI/CD practice, private keys are stored in secrets management systems (such as HashiCorp Vault, AWS Secrets Manager, or similar tools) and are never included in build artifacts.

For a private key to end up inside a ZIP file within a public installer, one of the following must have occurred:

- The private key was stored in the source repository alongside the application code, and the build process included it in the distribution archive without exclusion rules.
- The build environment had access to the key, and the packaging script collected it without proper file filtering.
- The key was manually placed in the project directory during development or testing and was never removed before the release build.

Each of these scenarios points to a failure in basic security hygiene. Private keys should never exist in directories that are included in client-facing packages. Automated checks in the build pipeline should flag the presence of key files (`.pem`, `.key`, or files matching private key headers) in distribution archives.

For a cybersecurity company with approximately 460 million users and a dedicated certificate authority subsidiary, this is not a sophisticated attack surface to manage. It is a checklist item.

## The OpenClaw Security Crisis

This incident does not exist in isolation. OpenClaw, the open-source AI agent that 360 Security Lobster wraps, has been at the center of multiple security incidents since its viral adoption in early 2026.

**CNCERT advisory (March 10, 2026):** Formal warning about prompt injection, credential theft, malicious plugins, and unpatched vulnerabilities. Following the advisory, Chinese government agencies and state-owned enterprises including the largest banks received notices warning against installing OpenClaw on office devices. Some employees were banned from installing OpenClaw on both office computers and personal phones connected to company networks. Multiple universities also issued bans requiring immediate uninstallation.

**Gartner assessment (late January 2026):** Gartner published research note ID 7381830 describing OpenClaw as posing "unacceptable cybersecurity liability" for business users. The firm recommended enterprises block OpenClaw downloads and traffic immediately and only run it in isolated nonproduction virtual machines with throwaway credentials.

**Infostealer malware targeting OpenClaw (February 2026):** Hudson Rock CTO Alon Gal identified a Vidar infostealer variant on February 13, 2026 targeting OpenClaw's `.openclaw` configuration directory. The malware stole `openclaw.json` (containing gateway authentication tokens), `device.json` (containing public and private key pairs), and `soul.md` files (containing detailed personal behavioral logs). Hudson Rock called it "a significant milestone: the transition from stealing browser credentials to harvesting the 'souls' and identities of personal AI agents."

**Malicious installers via Bing AI search (February 2026):** Huntress researchers Jai Minton and Ryan Dowd discovered a malicious GitHub repository "openclaw-installer" that poisoned Bing AI search results between February 2 and 10, 2026. The malware included Vidar stealer, GhostSocks backconnect proxy (linked to Black Basta ransomware), and on macOS, AMOS (Atomic macOS Stealer).

**135,000+ exposed instances (February 2026):** SecurityScorecard's STRIKE team found over 135,000 unique IPs running exposed OpenClaw instances across 82 countries by February 9, 2026. Over 15,000 instances were vulnerable to remote code execution. OpenClaw's default Docker deployment bound to 0.0.0.0:18789 with authentication disabled.

360 Security Lobster was supposed to solve these problems. Instead, it introduced a new one that is, by any measure, worse than the vulnerabilities it was designed to address. A leaked wildcard SSL private key for the platform's entire domain is a more severe security failure than any of the OpenClaw vulnerabilities that CNCERT warned about.

## What Should Happen Next

For this incident to be properly resolved, the following steps are necessary:

1. **Immediate certificate revocation.** WoTrus CA must revoke the compromised certificate for `*.myclaw.360.cn` and issue a replacement. Per CA/Browser Forum Baseline Requirements, this must happen within 24 hours of confirmed key compromise. Until revocation is confirmed, any connection to a myclaw.360.cn subdomain should be considered potentially compromised.

2. **Public disclosure of the exposure window.** Qihoo 360 should disclose how many users downloaded the installer containing the private key and how many active connections to myclaw.360.cn were established during the exposure period (March 10 to present).

3. **Build pipeline audit.** An independent review of the build and release process that allowed a private key to be included in a public distribution package.

4. **User notification.** All users who connected to myclaw.360.cn during the exposure period should be notified of the potential compromise and advised to rotate any credentials entered on the platform.

As of the time of publication, Qihoo 360 has not issued a public statement regarding this incident.

## FAQ

### What is 360 Security Lobster?

360 Security Lobster (360安全龙虾) is a commercial product by Qihoo 360 that wraps the open-source AI agent OpenClaw. It was announced on March 10, 2026 by Qihoo 360 founder Zhou Hongyi as a solution to OpenClaw's security vulnerabilities, installation complexity, and unpredictable behavior. The product integrates 16 Chinese domestic LLMs and over 100 pre-built skills, with pricing starting at 169 yuan for LLM tokens. A hardware version called 360安全龙虾Box offers physical isolation for enterprise and government users.

### What was leaked?

The wildcard SSL private key for `*.myclaw.360.cn` was found inside the public installer package at the path `/namiclaw/components/OpenClaw/openclaw.7z/credentials`. The private key modulus matches the certificate modulus exactly, confirmed by matching MD5 fingerprints (`446097b7674080186a469ecb0945f5af`).

### Who issued the certificate?

WoTrus CA Limited, a Chinese certificate authority that is a subsidiary of Qihoo 360. WoTrus is the rebranded version of WoSign (name changed August 24, 2017), which was distrusted by Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge in 2016-2017 for certificate fraud.

### What can an attacker do with the leaked private key?

An attacker in possession of the private key can impersonate any subdomain of myclaw.360.cn, intercept encrypted traffic between users and the platform, forge login pages that appear cryptographically legitimate, and potentially hijack AI agent sessions.

### How many users are affected?

Qihoo 360 has approximately 460 million users across its product ecosystem (based on historical reporting; Statista reports 416 million monthly active PC users as of end 2022). The specific number of 360 Security Lobster downloads and active myclaw.360.cn connections during the exposure period has not been disclosed.

### Has Qihoo 360 responded?

As of March 16, 2026, Qihoo 360 has not issued a public statement regarding this incident.

### Has the certificate been revoked?

As of the time of publication, no evidence of certificate revocation has been found. All sources discuss what 360 "should" or "will need to" do in future tense. WoTrus CA, the issuer, is a subsidiary of Qihoo 360.

### What is the connection between WoTrus and WoSign?

WoTrus CA Limited is the rebranded version of WoSign CA Limited. The name change was approved on August 24, 2017. Qihoo 360 owns both entities. WoSign was distrusted by all major browser vendors in 2016-2017 after a Mozilla-led investigation found that WoSign had backdated 64 SHA-1 certificates (42 confirmed intentional) and secretly acquired the Israeli CA StartCom without disclosure. WoTrus now operates primarily as a reseller of DigiCert and Certum certificates.

### What is OpenClaw?

OpenClaw is an open-source AI agent framework (formerly known as Clawdbot and Moltbot) that connects to messaging apps and can execute tasks on a host machine. It has been the subject of multiple security advisories in 2026, including formal warnings from China's CNCERT and MIIT, a risk assessment from Gartner describing it as posing "unacceptable cybersecurity liability" for business users, and active targeting by infostealer malware. Chinese government agencies, banks, and universities have banned its use.

### Who discovered the leak?

The leak was first reported on the Chinese developer forum linux.do, then mirrored via channel.0w0.best. X user @realNyarime published the actual PEM-encoded certificate data. Security researcher Lukasz Olejnik (affiliated with King's College London) and the International Cyber Digest subsequently amplified the findings for an English-language audience.

### Why is this significant for AI security?

This incident demonstrates that the rush to ship AI products is outpacing basic security practices. A cybersecurity company with approximately 460 million users, a $10 billion valuation, and its own certificate authority subsidiary shipped a product with a private key in the installer. The product was specifically marketed as a security solution for the exact vulnerabilities that China's national CERT had warned about on the same day.

### What is Qihoo 360?

360 Security Technology Inc. (Shanghai Stock Exchange ticker: 601360) is China's largest cybersecurity company. The business was founded by Qi Xiangdong in June 2005, with Zhou Hongyi joining in August 2006 as an angel investor. Both are considered co-founders. The company is headquartered in Chaoyang District, Beijing. In May 2020, it was placed on the US Entity List. In October 2022, the US Department of Defense designated it a "Chinese military company."

---

*Dhayabaran V is the founder of [Barrack AI](https://barrack.ai), a GPU cloud platform providing dedicated and bare metal GPU infrastructure.*
