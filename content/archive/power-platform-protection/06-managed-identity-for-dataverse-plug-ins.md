---
title: "Power Platform's protection — Managed Identity for Dataverse plug-ins"
date: 2024-10-02
tags: [power-platform, security, managed-identity, dataverse, azure]
description: "Why Managed Identity is the right identity choice for Dataverse plug-ins integrating with Azure resources, how to configure the end-to-end setup, and the considerations needed to adopt it at scale — from assembly organization to ALM and governance."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/power-platforms-protection-managed-identity-for-dataverse-plug-ins"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Power Platform has taken a big step forward with Virtual Network support to secure communication with Azure resources in a private network. While this is a crucial advancement, it's only one piece of the puzzle. To truly fortify the integration of Power Platform solutions with Azure resources, we also need to enhance security on the identity side.

No one likes managing credentials. From keeping them safe to rotating them frequently, it is often a time-consuming activity. Enter Managed Identity for Dataverse plug-ins, a capability that helps eliminate these challenges. Currently still in preview, it promises a bright future for code-first development by embracing the latest security coding standards for integrating services.

Let's dive into this exciting capability! We'll explore the why, what, and how, and plan the next steps for rolling it out in your organization, covering as much as possible to prepare for its adoption.

## The value proposition of managed identities

In the realm of securing integrations, managing credentials has always been a significant challenge. Traditionally, service principals with secrets or certificates have been used to authenticate. While effective, this approach comes with its own set of complexities and risks.

With service principals using secrets or certificates, we often face the following challenges:

- **Manual Management**: Secrets and certificates need to be manually created, stored, and rotated. This process is not only time-consuming but also prone to human error.
- **Security Risks**: Storing secrets securely and ensuring they are not exposed is a constant concern. If a secret or certificate is compromised, it can lead to unauthorized access and potential data breaches.
- **Operational Overhead**: Regularly rotating secrets and certificates to maintain security adds to the operational burden.

On the other hand, managed identities offer a seamless and secure way to handle authentication without the need for manual credential management. Here's how they transform the security landscape:

- **Resource Binding**: A managed identity is bound to a resource or service, making it the only source from which an authentication request can originate.
- **Enhanced Security**: By removing the need to store secrets or certificates, managed identities significantly reduce the attack surface. Authentication is done without the need for credentials with Entra ID, ensuring a lower exposure risk.
- **Simplified Operations**: With managed identities, the operational overhead associated with credential management is greatly reduced. This allows teams to focus on more strategic tasks rather than routine maintenance.

In essence, managed identities provide a robust and secure solution for authentication in scenarios involving integrations. They align with modern security best practices and offer a streamlined approach where managing credentials is no longer needed, making them the best identity choice from a security perspective.

## Is it relevant for Dataverse plug-ins integrating with Azure resources?

When considering the use of service principals to implement integrations from Dataverse plug-ins, a common question arises: where can we securely store the credentials without exposing them?

There is only one potential option for authenticating with a service principal from a Dataverse plug-in: Secure Configuration for Dataverse plug-ins. However, with this approach, the credentials are stored in a Dataverse table (`sdkmessageprocessingstepsecureconfig`), meaning all System Administrators in the environment can access them. Additionally, as noted in the Microsoft documentation, secure configuration is not solution-aware and is not available in the deployment settings configuration file, so this necessitates custom post-deployment configuration.

> [!NOTE]
> **Update — 2024/10/09:** In focusing on the previous change regarding the `RetrieveEnvironmentVariableSecretValue` action that "cannot be called directly in your code", I completely lost sight of the fact that I was considering secret type environment variables. This makes the recommendation of using the `RetrieveMultiple` method targeting the Environment Variable Definition or Environment Variable Value table useless because the value is indeed stored in an Azure Key Vault, not in Dataverse. So, at the end of the day, before the introduction of managed identities, it seems there was only one potential option: Secure Configuration for Dataverse plug-ins. A big thank you to Diana Birkelbach for the feedback and the discussion that helped me realize this.
>
> **Update — 2024/10/07:** Thanks to Diana Birkelbach's feedback, I have updated the recommendation above. Previously, it stated: "From your Dataverse plug-ins, you can retrieve the credentials using the `RetrieveEnvironmentVariableSecretValue` action." Now, it reads: "From your Dataverse plug-ins, you can retrieve the credentials using the `RetrieveMultiple` method targeting the Environment Variable Definition or Environment Variable Value table based on your scenario (default value or not)." This change was made because the `RetrieveEnvironmentVariableSecretValue` action "cannot be called directly in your code" as mentioned in the documentation.

In both scenarios, a simple mistake like logging credentials in trace logs could expose resources where the service principal has permissions if it's exposed to internet even partially. This is why using managed identities makes perfect sense in this context. Managed identities eliminate the risk of exposing credentials because there are no credentials to expose.

Now that the reasons why using managed identities from Dataverse plug-ins is beneficial are clear enough, let's dive into the configuration process.

## How to use a managed identity from a Dataverse plug-in?

> [!NOTE]
> Exploring this capability, I found a great article and a great GitHub project from Scott Durow providing insights on how to set up a Dataverse plug-in to leverage a managed identity.

Here are the steps to achieve an operational Dataverse plug-in that authenticates to an Azure resource using a managed identity:

1. **Initialize the Dataverse Plug-in**: Use the `pac plugin init` Power Platform CLI command.
2. **Replace some code in `PluginBase.cs`**: Add in the `PluginBase.cs` file the elements related to `IManagedIdentityService` (source: Scott Durow's article).
3. **Add a method to get a token**: In your plug-in code, add a method to obtain a token for the considered managed identity (source: Scott Durow's article).
4. **Build your assembly**: Use the `dotnet build` .NET CLI command.
5. **Create and sign a certificate**: Create a certificate and then sign the plug-in assembly with it. For simplicity, I used a self-signed certificate, but you should consider a valid certificate for real use (source: Scott Durow's article).
6. **Register your plug-in**: Register your plug-in into your environment using the Plugin Registration Tool, which you can open with the `pac tool prt` Power Platform CLI command.
7. **Configure an Application Registration or User-Assigned Managed Identity**: Depending on your scenario, configure an application registration or a user-assigned managed identity. For my test, I chose a user-assigned managed identity to interact with an Azure Key Vault.
8. **Configure Federated Identity Credentials**: Configure the federated identity credentials on your managed identity to secure its consumption from a defined source.
9. **Grant access to Azure resources**: Grant access to the Azure resources you want to integrate with your managed identity using the `az role assignment create` Azure CLI command.
10. **Create the Managed Identity record in Dataverse**: Create the managed identity record in Dataverse and bind it with a plug-in assembly, using tools like Power Platform CLI with the `pac pfx run` command (source: Scott Durow's GitHub project PowerShell scripts).

Not being a seasoned .Net developer, I struggled a bit with the plug-in assembly configuration, from the code itself to signing it with a self-signed certificate. Additionally, I lost some time due to an incorrect format for the issuer in the federated identity credentials configuration — I forgot to remove the "-" in the Power Platform environment ID prefix.

These challenges illustrate that the setup process requires different kinds of knowledge and some focus, but once you figure out the recipe, the setup is finally not too complex.

## Considerations to accelerate the adoption of Managed Identities

From configuring your first Dataverse plug-in with Managed Identity to using it at scale in your organization, you will need to consider a few points to have a reliable approach.

### User-assigned managed identity OR Application registration?

It's important to remember that the key to making this approach secure is the federated identity credentials, not the identity type you choose, meaning both options are valid.

- **User-Assigned Managed Identities**: Best if you plan to integrate only with Azure resources.
- **Application Registrations**: Suitable if your integration scenario involves services supporting only service principals/application registrations (like Dataverse).

### Dataverse plug-ins and Managed Identities organization

If you typically have most of your Dataverse plug-ins code in a single assembly, even if it covers different scenarios or integrations with various resources or services, consider reorganizing your code to follow the least privilege security principle when implementing Managed Identities.

In scenarios where Dataverse plug-ins integrate independently with different Azure resources, avoid concentrating all plug-ins in one assembly integrated with different Azure resources using only one managed identity.

Instead, follow a pattern of specialized assemblies where Dataverse plug-ins focus on integration with only one Azure resource through a dedicated managed identity.

### ALM story for Dataverse plug-ins with Managed Identities

On the Power Platform side, Managed Identities are solution-aware elements you can add to your solution (available under **Add existing > More > Other > Managed Identity**). In your exported solution, you will find the details configured in the `managedidentity` table and the link between the Managed Identity and the Dataverse plug-in assembly in the `customizations.xml` file.

This means that when you import the solution to downstream environments, the Managed Identity will be automatically created and linked to the Dataverse plug-in assembly.

However, the current issue with this approach is that the Managed Identity used in a Dataverse plug-in assembly will be the same across environments, from Development to Production. This doesn't align with the security principle of separating Production elements from non-Production ones.

> [!WARNING]
> Scott Durow has made available a workaround (PowerShell scripts) in his GitHub project to help you configure Managed Identities during the deployment of a solution to downstream environments. Please keep in mind that the Managed Identity capability is still in preview and should not be used in Production. Additionally, since this workaround involves manipulating the `customizations.xml` file and introducing unmanaged layers in downstream environments, it should be used carefully and only for exploration purposes.

### Monitoring and governance

With this capability rolled out in your organization, it will be important to monitor aspects such as:

- Which Power Platform environments have Managed Identities configured?
- Are they all linked to a Dataverse plug-in assembly?
- What are the managed identities used for, and with which service/resource are they integrating?
- Which Power Platform environments have Secure Configuration for Dataverse plug-ins or Secret type Environment Variables that could be replaced by managed identities?

Considering these integrations (with Azure resources or other services) that could leverage managed identities from Dataverse plug-ins as the realm of pro-developers, from a governance perspective, I recommend (re-)considering using Dataverse plug-ins with a Managed Identity for these scenarios and strongly promoting this pattern to improve the security of this kind of Power Platform solution.

Unlike Virtual Network support for Power Platform, which requires the involvement of different teams (from networking to Power Platform administrators), Managed Identity can be fully handled by a development team without external intervention, making it more accessible. While the configuration may not be straightforward the first time, with the right tooling, templates, and documentation, most development teams will grasp it quickly.

However, let's be honest: it is combined together with Virtual Network support that Managed Identities will truly elevate the security of your Power Platform solutions involving integrations with Azure resources.

While Managed Identity is still in preview, I encourage you to prepare for the next phase where rolling out both of these capabilities will become a clear objective for most organizations with enterprise-scale Power Platform solutions.

---

### Power Platform's Protection series

1. [Power Platform's protection — Azure AD Conditional Access](/archive/power-platform-protection/01-azure-ad-conditional-access)
2. [Power Platform's protection — Defender for Cloud Apps](/archive/power-platform-protection/02-defender-for-cloud-apps)
3. [Power Platform's protection — Platform internal capabilities](/archive/power-platform-protection/03-platform-internal-capabilities)
4. [Power Platform's protection — Microsoft Purview Compliance](/archive/power-platform-protection/04-microsoft-purview-compliance)
5. [Power Platform's protection — Virtual Network integration](/archive/power-platform-protection/05-virtual-network-integration)
6. **Power Platform's protection — Managed Identity for Dataverse plug-ins** ← _you are here_
7. [Power Platform's Protection — Building secure and responsible Generative AI solutions](/archive/power-platform-protection/07-building-secure-and-responsible-generative-ai-solutions)
8. [Power Platform's Protection — Microsoft Purview the data guardian](/archive/power-platform-protection/08-microsoft-purview-the-data-guardian)
9. [Power Platform's Protection — Microsoft Sentinel, the watchtower](/archive/power-platform-protection/09-microsoft-sentinel-the-watchtower)
