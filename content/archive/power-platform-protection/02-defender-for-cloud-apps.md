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

After a first article talking about using Azure AD Conditional Access to protect Power Platform during the authentication, I thought it could be interesting to explore another key solution of the Microsoft cloud that will allow us to apply controls while using Power Platform: Defender for Cloud Apps.

> [!NOTE]
> In this article we will mainly focus on securing Dataverse / model driven applications using Defender for Cloud Apps.

## What does Defender for Cloud Apps cover?

Defender for Cloud Apps is a Cloud Access Security Broker (CASB) which means it is positioned between users and cloud applications to enforce security policies.

The key areas covered by CASB solutions, like Defender for Cloud Apps, are:

- Provide visibility on cloud services used
- Use data loss prevention (DLP) to secure data
- Protect against threats using mechanisms like adaptive access control (AAC) or malware mitigation
- Help ensure compliance by providing reports and dashboards

In the context of Dataverse / model driven applications, Defender for Cloud Apps can be used as a reverse proxy to:

- Have complementary controls regarding the access of a user
- Have real-time session-level monitoring with the ability to take different actions (like blocking it)

> [!NOTE]
> To be able to configure and apply these controls from Defender for Cloud Apps to a user in the context of Dataverse / model driven applications, we need an Azure AD Conditional Access policy where the "Use Conditional Access App Control" field is set to "Use custom policy..." and the selected cloud app is Common Data Service.

Regarding managing your Defender for Cloud Apps policies using code, it seems the best solution is to use the Defender for Cloud Apps REST API. And because we are talking about calling a REST API, you can use the language and the framework of your choice to be able to have a robust mechanism to handle the configuration of your elements in Defender for Cloud Apps.

## Complementary access controls

> [!NOTE]
> In the Microsoft ecosystem, access controls can be enforced from at least 2 solutions: Azure AD Conditional Access policies or Defender for Cloud Apps access controls. Choosing one approach or the other or even combining both will depend on your context and your constraints.

Creating an access control policy in Defender for Cloud Apps is pretty simple and well documented by Microsoft: [Create a Defender for Cloud Apps access policy](https://learn.microsoft.com/en-us/defender-cloud-apps/access-policy-aad)

In our context, to apply access controls to Dataverse / model driven applications, you will need to select the Microsoft Dynamics 365 app (under Microsoft Online Services).

> [!NOTE]
> Even if the name of the app in Defender for Cloud Apps can create some confusion, it is the one that will allow you to apply controls on Dataverse / model driven applications (and not just on Dynamics 365).

For example, you could decide to redirect the users to Defender for Cloud Apps based on the location in the Azure AD Conditional Access policy (for example, if the authentication comes from the United States) and then in the Defender for Cloud Apps access control block the access if the device is not supported (for example, if the device tag is not "Intune compliant" or "Hybrid Azure AD joined").

Between Azure AD Conditional Access policies and Defender for Cloud Apps access controls we have all the required tools to protect access to Dataverse / model driven applications based on specified conditions. But Defender for Cloud Apps can go a bit further and help us control what a user can do using this cloud service and more precisely how.

> [!NOTE]
> During my tests I found the "Microsoft Power Platform — General" app (all "\*.powerapps.com" domains) in Defender for Cloud Apps. But unfortunately, I have not been able to correctly use this app, for example to block access to a canvas app (even if the app is configured in an Azure AD Conditional Access policy to redirect the user to Defender for Cloud Apps).

## Session policies to control what can be done

If you want to apply controls on behaviors in specific situations, Defender for Cloud Apps session policies could be the capability you will need to take a look at.

Some of the available controls are (this is definitely not an exhaustive list):

- Test, block or require step-up authentication on the upload of files
- Test, block, protect (apply sensitivity label) or require step-up authentication on the download of files
- Test, block or require step-up authentication for cut / copy or paste activities
- Test, block or require step-up authentication for print activities

> [!NOTE]
> The "Require step-up authentication" action was in "Preview" state at the time of writing this article. Check the current state of this feature before using it in Production.

And for almost all these controls you can add more granularity by applying inspection on the considered content or file.

For example, we could configure a Defender for Cloud Apps session policy that will apply a block action if a user tries to download a file (without file matching or inspection method to keep it simple).

When a Defender for Cloud Apps session policy is enabled for the "Microsoft Dynamics 365" app, the user in scope will see a welcome message when accessing a model driven app. After clicking through, you can validate that you are accessing your application through Defender for Cloud Apps as a reverse proxy by checking the URL — you should see `.mcas.ms` appended to the usual domain name.

In our case, if a user tries to download a file, they will be blocked and see a configured error message.

The possibilities of control with Defender for Cloud Apps policies and the granularity offered with the inspection option make this capability really flexible and powerful. But blocking user activities is definitely not the end of the journey. In the next section we will explore what other capabilities Defender for Cloud Apps has to offer to continue to improve our security posture for Power Platform.

## Blocking access or activities is just a start

One part of the configuration of the policies I did not present earlier was the last one regarding the alerts. In Defender for Cloud Apps access controls or session policies, you can configure alerts. Doing so will allow your security teams to monitor non-authorized behaviors and eventually identify a potential threat (for example, you could have alerts on tries of file downloads with different extensions because someone is trying to see if you specified file extensions in your session policy so they could finally find one authorized and exfiltrate data).

> [!WARNING]
> Be careful with sending alerts as email because it can cause "alert fatigue" which is never good for your teams.

If you enable the creation of alerts in your Defender for Cloud Apps policies, the generated alerts and the related incidents will be directly accessible through the Microsoft 365 Defender portal.

Defender for Cloud Apps also offers an integration with Power Automate through playbooks configurable as cloud flows with the Defender for Cloud Apps connector. For example, you could find that out-of-the-box email notifications in case of alerts on high severity policies is not enough and decide to configure a playbook to send notifications in the Teams channel of the considered security team.

> [!NOTE]
> To be able to use the Defender for Cloud Apps connector (based on the Defender for Cloud Apps REST API) in Power Automate and configure playbooks you will need to configure an application context access to the API.

Lastly, through activity logs or the advanced hunting capability in Defender for Cloud Apps your security team will be able to monitor the behavior of the users consuming Power Platform services and continuously improve the controls or add new ones.

Defender for Cloud Apps is really a powerful solution with many different capabilities that can be applied to Power Platform to improve the way the applications are consumed from a security perspective.

In this article we only explored at a high level what can be achieved through this solution, but you can definitely configure the controls based on your own needs and requirements.

With Defender for Cloud Apps, we have seen that we are able to have a good visibility on how Power Platform applications are consumed and even apply some controls on some of these activities. But at this level we don't yet have visibility on what's going on inside an environment itself — on the activities in Dataverse. In my next article we will try to see how we could address this security requirement.

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
