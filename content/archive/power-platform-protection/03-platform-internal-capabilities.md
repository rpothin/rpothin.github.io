---
title: "Power Platform's protection — Platform internal capabilities"
date: 2023-07-30
tags: [power-platform, security, dataverse, governance, managed-environments]
description: "A tour of Power Platform's native security capabilities — DLP policies, environment security groups, Dataverse security roles, tenant isolation, IP cookie binding, IP firewall, and Customer Lockbox — and how they combine into a layered protection strategy."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/power-platforms-protection-platform-internal-capabilities"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Having spent some time during the last months working on securing Power Platform, I thought it could be interesting to write a series of articles regarding this topic to share what I learned.

After two first articles talking about Microsoft products different than Power Platform — Azure AD Conditional Access and then Defender for Cloud Apps — I think we should spend some time exploring what the platform itself has to offer for its own protection.

## Back to basics

Power Platform offers many different capabilities which can help secure its consumption and, even if I am pretty confident most of them are already included in your governance strategy, I think it would still be interesting to quickly go through some of these basics just in case.

- Connectors are at the center of Power Platform, allowing us to interact with data in and outside the platform. Controlling which connector can interact with which one and also which operations it can execute can be done using Data loss prevention policies. So, if you want to mitigate the risk of having internal data exfiltrated outside of your organization boundaries I strongly encourage you to take a close look at your DLP policies configuration.
- The best way to secure access to your Power Platform environments is to configure an Azure AD security group on each one of them. If a user is not a member of the Azure AD group configured on an environment, it will not be possible to add them as a user.

  ![Error message trying to add a user not member of the considered Azure AD group to a Power Platform environment](/content/archive/power-platform-protection/ppic-env-group-error.png)

- Inside an environment with Dataverse, access to data and capabilities is based on well-known concepts: the organizational structure (business units and teams), but also and mostly the security roles assigned to the users. For example, going with only one business unit and only one security role for all your users will not often be the right approach to be compliant with the least privilege access principle of the Zero Trust security strategy.
- In the cases where access to Dataverse data requires a bit more flexibility, column security profiles can help you configure more granular permissions on specific columns (for example, the access to the date of birth could be limited to an application user for background operations, but the age accessible to a larger group of users).

> [!TIP]
> Whether we are talking about organizational structure, security roles or column security profiles, I encourage you to find the right balance between security and complexity. If your data is well secured but your production environment is unmanageable, it will not be a sustainable approach.

Power Platform also offers newer security capabilities we will discover in the next sections that will contribute to improving the security posture around the consumption of the services included in the platform.

## Tenant level isolation

Announced generally available early June 2023, Power Platform Tenant Isolation is a capability allowing to control if interactions with other tenants are allowed and, if yes, to apply rules to these interactions.

> [!NOTE]
> Working on the configuration of this feature, keep in mind a few points like it can take "about an hour for the latest tenant isolation policy changes to be assessed against active apps and flows" or like the Tenant Isolation rules will not be enforced for the Azure DevOps connector.

If you just enable the Tenant Isolation capability, you will block all inbound and outbound interactions with other tenants. Once fully enabled, you will witness errors on connections with other tenants inside your own tenant, but also inside other tenants trying to interact with resources in yours.

![Power Platform Tenant Isolation enabled without rules](/content/archive/power-platform-protection/ppic-tenant-isolation-enabled.png)

![Error on a connection in an existing cloud flow after enabling Power Platform Tenant Isolation](/content/archive/power-platform-protection/ppic-tenant-isolation-flow-error.png)

To configure a Tenant Isolation rule, you will need information — tenant domain or ID — that you can find in the "Overview" page of Microsoft Entra ID (formerly Azure AD).

![Where to find a tenant domain or ID for the configuration of Tenant Isolation rules](/content/archive/power-platform-protection/ppic-tenant-domain-id.png)

For example, an outbound rule can allow interactions from your tenant to a specific partner tenant identified by its ID. With this rule, cloud flows inside your tenant can stop raising errors on connections with that partner tenant — but interactions in the other direction will still be blocked unless an inbound rule is configured.

![Example of an outbound rule configured in the Power Platform Tenant Isolation page](/content/archive/power-platform-protection/ppic-tenant-isolation-outbound-rule.png)

![Error trying to configure a connection to a tenant without inbound rules in the Tenant Isolation configuration](/content/archive/power-platform-protection/ppic-tenant-isolation-inbound-error.png)

> [!WARNING]
> If you work with partners and include them in your Tenant Isolation rules, don't forget to ask them to do the same to be as much protected as possible. If they don't and they are compromised, your tenant will also become at risk due to the permissive rules configured on your side.

Tenant isolation is definitely a must have if you want to protect your tenant from a Power Platform perspective while controlling with which other tenants you want to allow interactions.

## Managed Environments security capabilities

Managed Environments is a suite of capabilities that aim to help organizations improve Power Platform governance and to safely scale its adoption. Generally available since October 2022, it also offers valuable security features that we will explore together.

Session hijacking exploits or "Pass-the-cookie" attacks could have a critical impact on your business but do not represent a risk easy to mitigate. Fortunately, Dataverse, with the IP address based cookie binding feature, offers since the end of January 2023 when it became generally available a way to protect your organization against this scenario. Moreover, its activation is simple — you just need to go to the "Privacy + Security" settings page of your environment, switch the "Enable IP address based cookie binding" toggle to "On" and save your changes.

![Illustration of the activation of the “IP address based cookie binding” feature](/content/archive/power-platform-protection/ppic-ip-cookie-binding.png)

> [!NOTE]
> Once "IP address based cookie binding" is enabled you can also provide "Reverse proxy IP addresses" — like Defender for Cloud Apps — if it is something you use in your organization. If you don't do that, there is a risk your users will often get errors, even if it seems their IP is not changing.

If the IP of a user changes while using Dataverse (through a model driven app for example), they will see an error message in their browser. A malicious actor who has been able to exfiltrate a user's cookie and tries to use it from a different IP will be similarly blocked.

![Error displayed in the browser if the IP of a user changes](/content/archive/power-platform-protection/ppic-ip-change-error.png)

![Similar error got by a malicious actor executing requests with an exfiltrated cookie](/content/archive/power-platform-protection/ppic-exfiltrated-cookie-error.png)

In the Zero Trust security strategy, identity protection goes alongside another important pillar: network protection. For this part, Dataverse has an incoming capability to cover your organization: IP address based firewall rule (which was still in Preview at the publication of this article and therefore should not be yet used in Production). Moreover, it gives you some flexibility regarding Service Tags, Microsoft trusted services and also application users.

As recommended by Microsoft, trying this feature should be done with the "Enable IP address based firewall rule (Preview)" toggle set to "On" in the "Privacy + Security" settings page of an environment, by entering a known IP range, and validating (multiple times) that the "Enable IP firewall in audit only mode." option is checked. Also, if you want to analyze IP firewall in audit only mode, don't forget to enable audit on your environment.

![Simple configuration of IP address based firewall rule](/content/archive/power-platform-protection/ppic-ip-firewall-rule.png)

> [!WARNING]
> As mentioned in the Microsoft documentation, if you are locked out of your environment you will need to contact Microsoft support to get it unlocked.

With this configuration, consuming Dataverse outside of the configured IP range should generate audit logs.

![IPFirewallAccessDenied audit log example to illustrate the feature in audit mode](/content/archive/power-platform-protection/ppic-ip-firewall-audit-log.png)

If you disable the "Enable IP firewall in audit only mode." option, users with an IP not in the allowed list should be blocked with an explicit error message.

> [!NOTE]
> I was not able to validate the expected behavior in audit only mode during my initial tests in Developer or Trial type environments. Perhaps my configuration was not ideal for a test of this capability in Preview.
>
> **Update (2024-01-30):** Following a question I recently received about this capability, I have done a new test (in audit mode) and I was happy to see that I now get logs in the Audit Summary View when accessing Dataverse data from an IP not in the allowed rules.

The last capability I wanted to share with you should help your organization be more compliant and to have better control of your data privacy. Even if it is a bit more situational, since it became generally available in January 2023, Customer Lockbox in Power Platform and Dynamics 365 allows you to approve and monitor Microsoft support's group requests to access your data.

The activation of this feature is done at the tenant level (in PPAC, under Policies) and will automatically apply to all your Managed Environments.

![Activation of Customer Lockbox in Power Platform Admin Center](/content/archive/power-platform-protection/ppic-customer-lockbox.png)

Once Customer Lockbox is enabled:

- Global administrators and Power Platform administrators will get approval requests (email notification, but also through a page in PPAC) if Microsoft support's group needs to access data in the context of a support request
- Approval of access to data by Microsoft support's group will create an audit log in Microsoft 365 Defender

From my point of view Power Platform has many must-have security capabilities that could definitely have a positive impact on the security posture of organizations. It is without a doubt not enough to cover the entire chain of consumption of data with Power Platform, but investing in these configurations definitely seems to be a good start.

Until now in the "Power Platform's protection" series we covered many different controls we can apply to secure the consumption of Power Platform in a proactive way. In the next part of the series, we will explore the reactive capability Microsoft cloud offers to cover this space.

---

### Power Platform's Protection series

1. [Power Platform's protection — Azure AD Conditional Access](/archive/power-platform-protection/01-azure-ad-conditional-access)
2. [Power Platform's protection — Defender for Cloud Apps](/archive/power-platform-protection/02-defender-for-cloud-apps)
3. **Power Platform's protection — Platform internal capabilities** ← _you are here_
4. [Power Platform's protection — Microsoft Purview Compliance](/archive/power-platform-protection/04-microsoft-purview-compliance)
5. [Power Platform's protection — Virtual Network integration](/archive/power-platform-protection/05-virtual-network-integration)
6. [Power Platform's protection — Managed Identity for Dataverse plug-ins](/archive/power-platform-protection/06-managed-identity-for-dataverse-plug-ins)
7. [Power Platform's Protection — Building secure and responsible Generative AI solutions](/archive/power-platform-protection/07-building-secure-and-responsible-generative-ai-solutions)
8. [Power Platform's Protection — Microsoft Purview the data guardian](/archive/power-platform-protection/08-microsoft-purview-the-data-guardian)
9. [Power Platform's Protection — Microsoft Sentinel, the watchtower](/archive/power-platform-protection/09-microsoft-sentinel-the-watchtower)
