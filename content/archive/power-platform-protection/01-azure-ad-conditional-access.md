---
title: "Power Platform's protection — Azure AD Conditional Access"
date: 2023-06-15
tags: [power-platform, security, entra-id, conditional-access, zero-trust]
description: "A detailed walkthrough of how Azure AD (now Entra ID) Conditional Access policies can protect Power Platform services, individual canvas apps, and workload identities — with practical configuration examples for each scenario."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/power-platforms-protection-azure-ad-conditional-access"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Having spent some time during the last months working on securing Power Platform, I thought it could be interesting to write a series of articles regarding this topic to share what I learned.

And what would be a better place to start than talking about securing access to Power Platform through Azure AD Conditional Access policies?

## What is Azure AD Conditional Access?

The main goal of Azure AD Conditional Access is to use "signals" (like "is the user in the scope of the policy", "is the service or application in the scope of the policy", IP location, device configuration...) to determine if an identity can access a service or an application.

In summary, Azure AD Conditional Access applies an if-then statement to access request to identify what needs to be done.

> [!NOTE]
> **Example:** If a user in group A tries to access Dataverse from outside of the United States, block the request.

Important points to consider regarding Azure AD Conditional Access is that "[...] policies are enforced after first-factor authentication is completed" and it "[...] isn't intended to be an organization's first line of defense for scenarios like denial-of-service (DoS) attacks, but it can use signals from these events to determine access" (source: [What is Conditional Access? — Microsoft Entra | Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)). In other words, Azure AD Conditional Access policies apply during the authentication, but after that the rules are not continuously checked. If a token has been generated under valid conditions, it can be used in different and invalid conditions during its lifetime.

> [!NOTE]
> This conclusion regarding the continuity of the evaluation of the Azure AD Conditional Access policies is not entirely accurate. Indeed, in some scenarios, Continuous access evaluation (a capability of Azure AD Conditional Access) will reevaluate policies rules with a latency up to 15 minutes.

Before closing this introduction section, I wanted to leave you with 2 points that I also consider pretty important:

- Think carefully about the organization and the naming convention for your Azure AD Conditional Access policies. You definitely don't want to be confused going through the list of policies, but rather to be able to easily and clearly understand what's the role of a policy is and also understand quickly which enforcements will be applied in which scenario.
- Manage your Azure AD Conditional Access policies (and other related assets like named locations) like any other core asset of your information system — using code, testing your policies and monitoring them.

> [!TIP]
> The Microsoft.Graph.Identity.SignIns PowerShell module, part of the Microsoft Graph PowerShell SDK, seems to offer a great way to manage Azure AD Conditional Access policies (and other related assets like named locations) with code. <!-- TODO: review — dead link removed: https://github.com/microsoftgraph/msgraph-sdk-powershell/tree/dev/samples/5-ConditionalAccess --> You can find an interesting sample in the microsoftgraph/msgraph-sdk-powershell GitHub repository.
>
> Testing can be done by initializing an Azure AD Conditional Access policy in "Report-only" mode or by using the "What If" tool to simulate a scenario and validate the expected enforcement.
>
> Monitoring of Azure AD Conditional Access policies can be done using Azure AD sign-in logs or leveraging the integration of Azure AD with Azure Monitor, simplifying the analysis of the logs.

## Protect Power Platform services

The first key area we will explore will be securing access to key Power Platform services (like Power Apps maker portal or Dataverse) by a user.

Currently the "apps" related to Power Platform you can consider configuring in an Azure AD Conditional Access policy are:

- Common Data Service: for Dataverse (accessing data or capabilities)
- Microsoft Flow: for the Power Automate maker portal (configuration or running components like cloud flows)
- Microsoft PowerApps: for the Power Apps maker portal (configuration or playing an app)

You will find below a few examples of Azure AD Conditional Access policies you could consider to secure the access to these Power Platform services by your users:

- Requiring multifactor authentication (MFA) for Power Platform Administrators accessing Power Platform services

> [!NOTE]
> If the user is only eligible to the Power Platform Administrator role, the policy will apply the enforcement (MFA in our example) only if the Azure AD role has been activated through Azure AD Privileged Identity Management. Also, if you assign Azure AD roles through group membership, based on some tests, it seems the Azure AD Conditional Access policy will not apply the enforcements as expected.

- Blocking a user trying to access Dataverse data from a desktop app (like Excel)

- Redirecting to Defender for Cloud Apps users accessing Dataverse from outside United States to apply more security rules (like blocking files download)

> [!NOTE]
> This scenario is explored further in the [Defender for Cloud Apps article](/archive/power-platform-protection/02-defender-for-cloud-apps).

As you can see, Azure AD Conditional Access offers many ways to protect the consumption of Power Platform services by your users by checking signals and applying enforcement if necessary.

## Protect individual canvas apps

> [!NOTE]
> Please, keep in mind that this capability is still presented as in preview state in Microsoft documentation.

In the case of canvas apps not using Dataverse, the policies presented in the previous section would not be really useful. Fortunately, there is a way to clearly identify a canvas app in Azure AD Conditional Access by configuring an Authentication Context to be able to apply policies to it.

> [!TIP]
> To link an Azure AD Conditional Access Authentication Context to a canvas app you need to use the `Set-AdminPowerAppConditionalAccessAuthenticationContextIds` PowerShell command. And you can also use the `Get-AdminPowerAppConditionalAccessAuthenticationContextIds` command to check if there is an Azure AD Conditional Access Authentication Context linked to a canvas app.

By going through 2 more examples of Azure AD Conditional Access policies, we will see how we can also protect the access to a canvas app not using Dataverse:

- Blocking the access to a canvas app for a user if not on a specific device configuration (browser not allowed)

- Requiring multifactor authentication for a user with accessing a canvas app with a medium user and sign-in risk

With this additional capability of Azure AD Conditional Access (Authentication Context), we can secure access to Power Platform by users pretty well and cover lot of different scenarios.

## Workload identities and Dataverse scenarios

Users are not the only identity type which can interact with Dataverse. In the context of integrations where other systems need to communicate with Dataverse we often used workload identities.

Even if it requires additional licenses, Azure AD Conditional Access offers a way to apply policies to workload identities protecting access to Dataverse from this angle too.

> [!NOTE]
>
> <!-- TODO: review — dead link removed: https://www.microsoft.com/en-us/security/business/microsoft-entra-workload-id --> There is a trial plan for "Microsoft Entra Workload Identities" available through Microsoft Security.

For example, we could configure an Azure AD Conditional Access policy to block the access to Dataverse by a workload identity if the authentication does not come from an Azure Functions app in the Canada East Azure region.

First, we need to configure a Named Location using the IP ranges of the AppService Azure Service Tags for the Canada East region:

1. Get the IP ranges of the AppService Azure Service Tags of the Canada East Azure region using the `az network list-service-tags` command from Azure CLI
2. Create a Named Location with IP ranges in Azure AD Conditional Access with the result from step 1 using the `New-MgIdentityConditionalAccessNamedLocation` command of the Microsoft Graph PowerShell module

Then we will move forward with the configuration of the Azure AD Conditional Access policy to block workload identities trying to access Dataverse from a different place than an Azure Functions app in the Canada East Azure region.

> [!NOTE]
> To control the access of workload identities, the only available option is currently to select the "All cloud apps" option — but, don't worry, it includes Dataverse.

These are just some scenarios you could cover with Azure AD Conditional Access to protect Power Platform from an access perspective. Signals like device compliance or device configuration should also definitely be part of your plan.

Once you have these policies in place (and well named and organized), you will be more confident regarding the fact that an identity will not be able to gain access to Power Platform services if the expected conditions are not met.

But obviously, connection is only the first step in the consumption of Power Platform services and protecting it is only a part of a larger objective — having a good security posture. In upcoming articles, we will continue to explore other capabilities of the Microsoft cloud that will help improve our level of protection of Power Platform.

---

### Power Platform's Protection series

1. **Power Platform's protection — Azure AD Conditional Access** ← _you are here_
2. [Power Platform's protection — Defender for Cloud Apps](/archive/power-platform-protection/02-defender-for-cloud-apps)
3. [Power Platform's protection — Platform internal capabilities](/archive/power-platform-protection/03-platform-internal-capabilities)
4. [Power Platform's protection — Microsoft Purview Compliance](/archive/power-platform-protection/04-microsoft-purview-compliance)
5. [Power Platform's protection — Virtual Network integration](/archive/power-platform-protection/05-virtual-network-integration)
6. [Power Platform's protection — Managed Identity for Dataverse plug-ins](/archive/power-platform-protection/06-managed-identity-for-dataverse-plug-ins)
7. [Power Platform's Protection — Building secure and responsible Generative AI solutions](/archive/power-platform-protection/07-building-secure-and-responsible-generative-ai-solutions)
8. [Power Platform's Protection — Microsoft Purview the data guardian](/archive/power-platform-protection/08-microsoft-purview-the-data-guardian)
9. [Power Platform's Protection — Microsoft Sentinel, the watchtower](/archive/power-platform-protection/09-microsoft-sentinel-the-watchtower)
