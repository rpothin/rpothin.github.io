---
title: "Power Platform's protection — Defender for Cloud Apps"
date: 2023-06-26
tags:
  [
    power-platform,
    security,
    defender-for-cloud-apps,
    dataverse,
    session-controls,
  ]
description: "An exploration of how Defender for Cloud Apps, acting as a Cloud Access Security Broker (CASB), can complement Azure AD Conditional Access to control access to and activities within Dataverse and model-driven applications."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/power-platforms-protection-defender-for-cloud-apps"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

After a first article talking about using Azure AD Conditional Access to protect Power Platform during the authentication, I thought it could be interesting to explore another key solution for the protection of Power Platform — Microsoft Defender for Cloud Apps.

## What is Defender for Cloud Apps?

Defender for Cloud Apps is a Cloud Access Security Broker (CASB) available as part of the Microsoft Defender portfolio and the Microsoft 365 offering. You might have seen it under its old name: Microsoft Cloud App Security.

As a CASB, Defender for Cloud Apps helps teams across IT, security and compliance to discover, control and protect cloud apps, their data and identities. It acts as a gateway sitting between users and cloud apps, applying security rules to enforce policies in real time.

It exposes key capabilities around:

- **Shadow IT discovery:** identifying cloud apps used in an organization, assessing them and generating a risk score based on more than 90 risk factors.
- **Information protection:** detecting and controlling sensitive information in cloud apps.
- **Threat protection:** identifying anomalous behaviors and remediating or alerting on them.

## How is Defender for Cloud Apps integrated with Azure AD Conditional Access?

In its Conditional Access App Control mode, Defender for Cloud Apps can act as a reverse proxy (man in the middle) on user sessions. This means that the traffic between the user and the cloud app will be routed through Defender for Cloud Apps — giving it the ability to monitor and control the interactions.

To activate the Conditional Access App Control mode, you need to configure a specific enforcement in an Azure AD Conditional Access policy: "Use Conditional Access App Control". With this enforcement configured, when a user tries to access the protected cloud app from a specific browser, the traffic will be routed through Defender for Cloud Apps and the policies you have configured there will be applied.

> [!IMPORTANT]
> This integration only works for browser-based access. Mobile apps or desktop clients used against Dataverse (like Excel) would not be covered.

## App and session policies in Defender for Cloud Apps

From Defender for Cloud Apps, you will be able to configure two types of policies with the Conditional Access App Control mode enabled in an Azure AD Conditional Access policy:

- **Access policies:** to control access to cloud apps
- **Session policies:** to monitor and control user activities in cloud apps

For the specific focus on Power Platform, we will look at how to set up access and session policies for Dataverse.

### Access policy example — Block access to Dataverse from outside the US

In Azure AD Conditional Access, you can configure a policy to redirect to Defender for Cloud Apps users accessing Dataverse from outside the United States. With this configuration, you can then create a Defender for Cloud Apps access policy to block access in this context.

You can [create a Defender for Cloud Apps access policy](https://learn.microsoft.com/en-us/defender-cloud-apps/access-policy-aad) using the portal.

### Session policy example — Block file downloads from Dataverse in specific conditions

Another common use case is blocking file downloads from Dataverse when users are working in risky conditions — for example, when accessing from an unmanaged device or from a specific geographic location.

By configuring a session policy in Defender for Cloud Apps to block downloads, you add a layer of protection at the data level that complements the access-level controls applied by Azure AD Conditional Access.

## Monitoring and alerting

Once Defender for Cloud Apps is in place and policies are configured, you also get:

- A detailed activity log of user interactions with Dataverse and model-driven apps, captured by the Conditional Access App Control proxy.
- Alerts triggered by policy violations, providing your security team with actionable information to investigate.
- Integration with Microsoft Sentinel for centralized SIEM workflows.

## Summary

When combined with Azure AD Conditional Access, Defender for Cloud Apps extends the protection of Power Platform beyond authentication into the session itself. It provides visibility into what users are doing in Dataverse and model-driven apps, and enables you to enforce fine-grained controls like blocking downloads, restricting uploads, or monitoring for anomalous activity — all without modifying the apps themselves.

This makes it a powerful complement to the access policies covered in the first article of this series, giving organizations a more complete defense-in-depth posture for their Power Platform workloads.

---

### Power Platform's Protection series

1. [Power Platform's protection — Azure AD Conditional Access](/archive/power-platform-protection/01-azure-ad-conditional-access)
2. **Power Platform's protection — Defender for Cloud Apps** ← _you are here_
3. [Power Platform's protection — Platform internal capabilities](/archive/power-platform-protection/03-platform-internal-capabilities)
4. [Power Platform's protection — Microsoft Purview Compliance](/archive/power-platform-protection/04-microsoft-purview-compliance)
5. [Power Platform's protection — Virtual Network integration](/archive/power-platform-protection/05-virtual-network-integration)
6. [Power Platform's protection — Managed Identity for Dataverse plug-ins](/archive/power-platform-protection/06-managed-identity-for-dataverse-plug-ins)
7. [Power Platform's Protection — Building secure and responsible Generative AI solutions](/archive/power-platform-protection/07-building-secure-and-responsible-generative-ai-solutions)
8. [Power Platform's Protection — Microsoft Purview the data guardian](/archive/power-platform-protection/08-microsoft-purview-the-data-guardian)
9. [Power Platform's Protection — Microsoft Sentinel, the watchtower](/archive/power-platform-protection/09-microsoft-sentinel-the-watchtower)
