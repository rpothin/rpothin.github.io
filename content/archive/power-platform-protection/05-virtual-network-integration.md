---
title: "Power Platform's protection — Virtual Network integration"
date: 2024-09-23
tags: [power-platform, security, virtual-network, azure, infrastructure-as-code]
description: "A deep dive into Virtual Network support for Power Platform — why it matters for securing Dataverse plug-ins and connector traffic, how to set it up with Bicep and PowerShell, and three architectural patterns for scaling the integration."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/power-platforms-protection-virtual-network-integration"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

A bit more than a year after my last article in this series on Microsoft Purview Compliance in the context of Power Platform, I'm back to explore recently added or still pretty new capabilities that promise to help bolster our security posture around Power Platform solutions.

Earlier this year, Microsoft announced a public preview of Virtual Network support for Power Platform. Despite some limitations, this capability shows great promise.

But why is this capability crucial for protecting our Power Platform solutions? And assuming the effort to implement this integration is justified, what steps should we take to deploy it effectively and at scale?

## Why does integrating with a Virtual Network from Power Platform matter?

To have this discussion, it's important to clarify a few core elements.

First, remember that a Microsoft tenant is an identity-oriented concept. Which means that at the beginning of your journey, your Power Platform environments are primarily protected by controls in Entra ID (like Conditional Access Policies, which I discussed in a previous article in this series).

Secondly, Power Platform offers SaaS services hosted on Microsoft infrastructure outside of organizations' private networks. This means that when you want to communicate with a Power Platform service (such as the Dataverse API or a cloud flow with an HTTP trigger) from within your private network, you must pass through network protection layers (like a firewall) that need to authorize this traffic without knowing the exact destination. Conversely, if you want to communicate with resources in your private network from Power Platform resources (using for example a Dataverse plug-in), you need to authorize traffic coming from a non-precisely known source (using Azure Service Tags or the related IP ranges for the considered locations).

Ultimately, this means that if you want to use resources in your private network in conjunction with Power Platform services, you need to expose these resources to a subset of the internet, which represents a significant security risk.

Moreover, without proper configuration, we cannot effectively control the inbound and outbound traffic for a Power Platform environment — it can come from anywhere and be sent anywhere — which also represents a security risk we can't ignore.

> [!NOTE]
> To control inbound traffic to Dataverse for Power Platform environments, you can leverage the IP firewall capability.

Let's quickly go through a concrete example of a risky situation to better understand what is at stake here. Imagine you have an environment authorized to communicate with an Azure Storage Queue (with the related connector not blocked in the DLP policy used for the environment). Here are the two main security risks in this scenario:

- The connector offers a resource-specific connection method (with an access key), meaning that from the Power Platform environment, a connection could be established with a Storage Azure Queue hosted in a different tenant outside of the organization boundaries, potentially leading to data exfiltration.
- Allowing a few IP ranges (from the Power Automate service) on the legitimate Azure Storage Queue exposes the data transitioning/stored there to a data leakage risk if an access key is exfiltrated and used from Power Automate in a Power Platform environment in the same location but in a tenant outside the organization limits.

Virtual Network support for Power Platform brings hope to mitigate some of these risks.

## How does Virtual Network support for Power Platform help address these challenges?

Based on my understanding, the Virtual Network support capability for Power Platform follows the Azure Virtual Network integration concept. This enables PaaS and SaaS services in Azure to behave as if they are part of a Virtual Network, even if they are not fundamentally so. This approach allows resources or services to interact within the boundary of a Virtual Network without being exposed to the internet, or at least with some acceptable filtering.

In our Power Platform context, this means the engine of the services covered by the Virtual Network support capability (Dataverse plug-ins and some connectors) will be injected into the subnets defined in the enterprise policy. This allows them to interact with other Azure resources isolated from the internet through private endpoints, and all outbound traffic from the services considered will have to go through the subnet they are integrated with and comply with the rules implemented, such as those in a Network Security Group (NSG).

Integrating Power Platform services into an Azure subnet as described above could potentially mitigate some of the risks we identified earlier:

- Outbound traffic from the services considered could be controlled using an NSG. If the scenarios covered in the Power Platform are limited to integration with resources in the organization's private network, traffic from Power Platform to elements outside of a defined private network could be blocked. So, even if a connection is created targeting an Azure resource outside of company boundaries, the outbound traffic from Power Platform to the resource would be blocked because it is not compliant with the NSG rules.
- Exposing Azure resources to the internet — even a subset — would become a thing of the past because they could all leverage private endpoints for inbound communication from Power Platform. Exfiltrating keys or credentials to interact with these resources from outside the company boundaries would be futile. Malicious actors would also have to compromise a Power Platform environment using the same enterprise policy to complete data exfiltration.

It should now be pretty obvious that Virtual Network support for Power Platform is a key element to consider for securing Power Platform applications using Azure resources.

## How to setup Virtual Network integration with Power Platform environments?

Microsoft offers a setup guide combined with PowerShell scripts to help you configure Virtual Network integration between Azure resources and a Power Platform environment. However, even though the documentation and provided scripts offer a lot of information for implementing an operational integration, I found that a good understanding of how Azure networking and infrastructure works is required to complete the setup successfully.

An important thing to consider is that the setup consists of two distinct phases that take place in different parts of the Microsoft ecosystem: first in Azure (steps 1 to 4) and then in Power Platform (step 5). Depending on the role and responsibility model in your organization, this may impact which teams need to be involved and when to complete the setup.

From my perspective, Azure configuration should be done as much as possible using infrastructure as code, sometimes combined with Azure CLI. The required Azure elements include:

- Infrastructure as code in Bicep: modules for virtual network and enterprise policy, followed by a combination of the modules
- Deployment code in PowerShell with Azure CLI

Once the Azure elements are in place, you can link Power Platform environments from the same region (with Managed Environment enabled) to the configured network injection enterprise policy.

At this point, you will have the minimal setup to start communicating privately from a Power Platform environment to Azure resources. To test this setup, I added an Azure Key Vault with a private endpoint and disabled public access to the resource group, then implemented a custom API to manually list the available secrets through the network injection enterprise policy.

While reaching this milestone is significant, it is clear that what brought us here will hardly take us further. Several elements need to be considered to make this process reliable and scalable to support the security needs of an entire organization.

## What strategies can we consider to manage this network control at scale?

As mentioned earlier in this article, your implementation strategy will be closely linked to how responsibilities are distributed among the involved parties and the governance maturity in your organization.

Here are a few key elements you should include in your strategy, regardless of the approach you choose:

- **Manage Azure Configuration with Infrastructure as Code**: use tools like Bicep, Terraform, or Pulumi.
- **Governance by the Power Platform Team**: The Azure elements directly involved in the configuration of the Virtual Network integration with Power Platform environments (primary and failover Virtual Networks with subnets, network security groups, and Power Platform network injection enterprise policy) should be managed or at least overseen by the Power Platform governance team. This position comes from the fact that this capability extends the configuration of Power Platform environments, similar to DLP policies.

From my perspective, there are a few strategies you could apply, and the choice will depend on your organization's maturity in various dimensions (networking, Azure governance, Power Platform governance, etc.):

- **Single Set of Virtual Networks**: the Azure network resources are managed by the Power Platform governance team in their Azure subscription, with a service principal with the Network Contributor role on the Virtual Networks shared with the development team to allow them to configure private endpoints for their resources. This approach simplifies the setup for the development team, who only need to manage their resources, while the Power Platform governance team controls the network traffic using network security groups.

- **Peered Virtual Networks**: each party (Power Platform governance team and development team) has a set of Virtual Networks and subnets peered together. This enables network traffic to flow from the Power Platform environments through the network injection enterprise policy to the resources via private endpoints. This approach offers more flexibility to the development team, who can manage the distribution of private endpoints in subnets in the peered Virtual Network without needing to communicate with the Power Platform governance team. However, it does not mean that the control of the traffic is out of the hands of the Power Platform governance team.

- **Hub and Spoke Model**: all network traffic between two Virtual Networks goes through the hub for DNS resolution and inspection by firewalls. At an enterprise scale, this approach aims to better secure, monitor, and control all network traffic. This option is an evolution of the previous one and typically involves close collaboration with network teams to obtain private IP ranges and configure firewall rules to authorize traffic between the Virtual Networks involved in the Power Platform Virtual Network injection.

I would recommend choosing the hub and spoke model only if your organization already has it in place and there is a compliance requirement to follow this approach, as it is definitely more complex. For the other proposed strategies, the choice will depend on the level of flexibility your development teams are looking for. You could start with the first model, which is easier for the development teams, and as your organization matures, you can introduce the second model to offer more flexibility for development teams seeking that.

Can we say that the setup and management of Virtual Network support for Power Platform is easy and accessible? Unfortunately, I don't think so.

Is it still a capability that should be considered by all organizations to improve the protection of their most critical solutions? Absolutely! I have no doubt that the effort required to implement this capability is worth it from a security perspective.

Virtual Network support for Power Platform is not the first capability involving Azure and infrastructure as code skills around Power Platform, but it continues to demonstrate that Power Platform governance teams should continue — or start — investing time in gaining the skills needed to leverage these valuable features.

---

### Power Platform's Protection series

1. [Power Platform's protection — Azure AD Conditional Access](/archive/power-platform-protection/01-azure-ad-conditional-access)
2. [Power Platform's protection — Defender for Cloud Apps](/archive/power-platform-protection/02-defender-for-cloud-apps)
3. [Power Platform's protection — Platform internal capabilities](/archive/power-platform-protection/03-platform-internal-capabilities)
4. [Power Platform's protection — Microsoft Purview Compliance](/archive/power-platform-protection/04-microsoft-purview-compliance)
5. **Power Platform's protection — Virtual Network integration** ← _you are here_
6. [Power Platform's protection — Managed Identity for Dataverse plug-ins](/archive/power-platform-protection/06-managed-identity-for-dataverse-plug-ins)
7. [Power Platform's Protection — Building secure and responsible Generative AI solutions](/archive/power-platform-protection/07-building-secure-and-responsible-generative-ai-solutions)
8. [Power Platform's Protection — Microsoft Purview the data guardian](/archive/power-platform-protection/08-microsoft-purview-the-data-guardian)
9. [Power Platform's Protection — Microsoft Sentinel, the watchtower](/archive/power-platform-protection/09-microsoft-sentinel-the-watchtower)
