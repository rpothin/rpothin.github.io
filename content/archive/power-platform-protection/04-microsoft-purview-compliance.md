---
title: "Power Platform's protection — Microsoft Purview Compliance"
date: 2023-08-17
tags: [power-platform, security, microsoft-purview, audit-logs, compliance]
description: "How Microsoft Purview Compliance's auditing solution surfaces Power Apps, Power Automate, DLP, connector, and Dataverse activities — illustrated through realistic threat scenarios for both administrator-level and user-level monitoring."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/power-platforms-protection-microsoft-purview-compliance"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Having spent some time during the last months working on securing Power Platform, I thought it could be interesting to write a series of articles regarding this topic to share what I learned.

With the previous article about Power Platform internal security capabilities, we have done a pretty good tour of the proactive controls we can apply to the consumption of Power Platform services. In security and compliance, reactive processes are also important and it is why in this article we will explore how Microsoft Purview Compliance can play a key role in it.

## What's the value proposition?

When you have issues with a Power Platform application, I am sure you like to have logs to rely on to be able to understand what is going on. In comparison, if you have doubts regarding the integrity of a user, I am convinced you would be disappointed not having traces to validate your hypothesis.

Microsoft Purview Compliance offers auditing solutions which are really the starting point to address security and compliance requirements. Based on your configuration, this solution will allow you to have traces for many different types of activities going on in your organization, whether it is done by an administrator or a user.

Using a simple searching interface, you will have access to Power Platform and Dataverse traces to (non-exhaustive list below):

- do investigations regarding an identified security risk
- try to confirm potential security risks based on hypothesis
- export specific audit logs to respond to compliance obligations

> [!WARNING]
> I have not been able to find most of the audit logs presented here using the new search experience, and I had to come back to the classic one to find the activities I was looking for. I hope Microsoft will fix this before the retirement of the classic search experience currently planned for October 2023.

From a Power Platform and Dataverse perspective, Microsoft Purview Compliance auditing solution currently covers the parts below:

- Power Apps activities
- Power Automate activities
- Power Platform connectors activities — with general availability announced recently
- Data Loss Prevention activities
- Dataverse activities — allowing adjustments based on your requirements
- Power BI activities

In this article I will present scenarios from two angles: administrator / maker versus user. It could be a bit confusing due to the fact that it is different from the way this topic is presented in Microsoft documentation (by service or platform capability). But, from a security perspective, I personally find this approach more intuitive. The goal of the presented scenarios will be to demonstrate how audit logs in Microsoft Purview Compliance can help you understand what happened.

## Administration and configuration activities monitoring

Scenario 1: a compromised user account has been used to create a canvas app linked to a cloud flow and shared with other users to exfiltrate data, the users thinking it was a legitimate app helping them in their daily activities.

In that case, audit logs like the ones below could help to get a better understanding of what happened:

- Power Apps — Created app
- Power Apps — Published app
- Power Apps — Edited app permission
- Power Automate — Created flow

Scenario 2: a malicious production environment administrator will deploy a custom connector as a trap for users to spread it (using it in canvas apps or cloud flows) and allowing the exfiltration of data.

Detecting activities around custom connectors and connections being now possible in Microsoft Purview Compliance audit logs, in this scenario we could search for activities like:

- Power Platform Connector — API created
- Power Platform Connector — API permission added or edited
- Power Platform Connector — Connection created

Scenario 3: a rogue Power Platform administrator will temporarily update a data loss prevention policy and create a cloud flow to send files outside of the organization boundaries — using a non-authorized connector simplifying files exfiltration.

Being also covered for Data Loss Prevention policies management activities in the audit logs in Microsoft Purview Compliance, an investigation could focus the analysis on the following elements:

- Power Platform DLP — Updated DLP Policy
- Power Automate — Created flow

Obviously, in all these scenarios the logs from Microsoft Purview Compliance are not sufficient to get a global picture of the situation. But they definitely can help bring the puzzle pieces together and understand how the malicious actor has been able to exfiltrate data.

## User activities monitoring

Administrators and makers can definitely abuse their power or malicious actors can hijack these privileged accounts to attack your organization. But even an account with just access to valuable data can be involved in data exfiltration activities.

Scenario A: a hijacked user account with access to interesting data is used to retrieve all the data the user has access to in a Dataverse environment.

In that case, and if your Dataverse configuration is relevant, multiple "Retrieve Multiple" activities (or even "Relevance Search" activities) will appear in audit logs search results in Microsoft Purview Compliance.

> [!WARNING]
> In this kind of scenario, I discourage you from focusing your analysis on the "Export to Excel" activities because there are other ways to bypass this mechanism to exfiltrate the data. Obviously, too many "Export to Excel" activities from the same user is often not a good sign, but it is not because you don't have these kinds of activities that nothing suspicious is going on.

Scenario B: a bribed user launching many different applications in a short period of time, like they are looking for every valuable data they could exfiltrate and send to an external actor.

I am assuming this kind of behavior is always a bit difficult to identify, but at least in Microsoft Purview Compliance we would have audit logs for the "Power Apps — Launched app" activity we could leverage in an investigation.

## Focus on Dataverse configuration for auditing

To be able to receive Dataverse audit logs into Microsoft Purview Compliance you will need to:

- have your environment of type "Production" — like mentioned in the requirements in the Microsoft documentation
- have the audit started ("Start Auditing") and the option "Read logs" checked on your environment — based on your requirements you will perhaps also want to check the "Log access" option
- if you want to have audit logs for the consultation of a record or a list of records in a table you can follow the "Enable or disable auditing for an entity" procedure in the Microsoft documentation

> [!WARNING]
> Currently, this audit configuration is only available in the classic ("old") interface on the tables main page.

Small final note for this section: be careful with the consumption of your Dataverse storage capacity by audit logs. Based on your configuration and the activity of your users it can increase pretty fast. Microsoft provides recommendations to manage this part whether by configuring a retain period for the logs, manually cleaning the audit table or by configuring a recurring bulk delete job.

Power Platform and Dataverse offer a native integration with Microsoft Purview Compliance which makes audit logs easy to leverage to keep an eye on key activities from a security and compliance perspective.

But on the other hand, and even if Microsoft Purview Compliance offers a way to search audit logs, it is not really simple to do some exploration or even take actions when malicious activities are detected.

In the next article we will see how we can take our security reactive processes to the next level using the audit logs received in Microsoft Purview Compliance.

---

### Power Platform's Protection series

1. [Power Platform's protection — Azure AD Conditional Access](/archive/power-platform-protection/01-azure-ad-conditional-access)
2. [Power Platform's protection — Defender for Cloud Apps](/archive/power-platform-protection/02-defender-for-cloud-apps)
3. [Power Platform's protection — Platform internal capabilities](/archive/power-platform-protection/03-platform-internal-capabilities)
4. **Power Platform's protection — Microsoft Purview Compliance** ← _you are here_
5. [Power Platform's protection — Virtual Network integration](/archive/power-platform-protection/05-virtual-network-integration)
6. [Power Platform's protection — Managed Identity for Dataverse plug-ins](/archive/power-platform-protection/06-managed-identity-for-dataverse-plug-ins)
7. [Power Platform's Protection — Building secure and responsible Generative AI solutions](/archive/power-platform-protection/07-building-secure-and-responsible-generative-ai-solutions)
8. [Power Platform's Protection — Microsoft Purview the data guardian](/archive/power-platform-protection/08-microsoft-purview-the-data-guardian)
9. [Power Platform's Protection — Microsoft Sentinel, the watchtower](/archive/power-platform-protection/09-microsoft-sentinel-the-watchtower)
