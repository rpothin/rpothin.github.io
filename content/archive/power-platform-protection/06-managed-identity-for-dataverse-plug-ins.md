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

```csharp
// powerplatform-managedidentity-pluginbase.cs
// Source: https://gist.github.com/rpothin/acdbc6a523083ff33581280f3993b837
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Extensions;
using Microsoft.Xrm.Sdk.PluginTelemetry;
using System;
using System.Runtime.CompilerServices;
using System.ServiceModel;

namespace managedidentityplugin
{
    /// ...

    /// <summary>
    /// This interface provides an abstraction on top of IServiceProvider for commonly used PowerPlatform Dataverse Plugin development constructs
    /// </summary>
    public interface ILocalPluginContext
    {
        /// ...

        /// <summary>
        /// General Service Provide for things not accounted for in the base class.
        /// </summary>
        IServiceProvider ServiceProvider { get; }

        /// <summary>
        /// Managed Identity Service for things not accounted for in the base class.
        /// </summary>
        IManagedIdentityService ManagedIdentityService { get; }

        /// ...
    }

    /// <summary>
    /// Plug-in context object.
    /// </summary>
    public class LocalPluginContext : ILocalPluginContext
    {
        /// ...

        /// <summary>
        /// General Service Provider for things not accounted for in the base class.
        /// </summary>
        public IServiceProvider ServiceProvider { get; }

        /// <summary>
        /// Managed Identity Service for things not accounted for in the base class.
        /// </summary>
        public IManagedIdentityService ManagedIdentityService { get; private set; }

        /// ...

        /// <summary>
        /// Helper object that stores the services available in this plug-in.
        /// </summary>
        /// <param name="serviceProvider"></param>
        public LocalPluginContext(IServiceProvider serviceProvider)
        {
            if (serviceProvider == null)
            {
                throw new InvalidPluginExecutionException(nameof(serviceProvider));
            }

            ServiceProvider = serviceProvider;
            ManagedIdentityService = (IManagedIdentityService)serviceProvider.GetService(typeof(IManagedIdentityService));

            /// ...

        }

        /// ...
    }
}

```

3. **Add a method to get a token**: In your plug-in code, add a method to obtain a token for the considered managed identity (source: Scott Durow's article).

```csharp
// powerplatform-managedidentity-GetAccessTokenManagedIdentity.cs
// Source: https://gist.github.com/rpothin/69463791f96714c4c7cd462b4ef5b0d8
/// <summary>
/// Acquires an access token using managed identity for the specified scopes.
/// </summary>
/// <param name="scopes">An array of scopes for which the token is requested. Typically, this includes resource URLs.</param>
/// <param name="localPluginContext">The local plugin context which provides tracing and managed identity services.</param>
/// <returns>A string representing the acquired access token.</returns>
/// <exception cref="Exception">Thrown when the token acquisition fails.</exception>
private string GetAccessTokenManagedIdentity(string[] scopes, ILocalPluginContext localPluginContext)
{
    // Initialize empty token
    string token = string.Empty;

    try
    {
        localPluginContext.TracingService.Trace("Scopes in GetAccessTokenManagedIdentity: " + string.Join(", ", scopes));
        token = localPluginContext.ManagedIdentityService.AcquireToken(scopes);
        // scope here is the resource URL :: example --> https://org9dfaa538.api.crm.dynamics.com/.default
    }
    catch (Exception ex)
    {
        localPluginContext.Trace($"Failed to acquire token {ex.Message}");
    }

    return token;
}
```
4. **Build your assembly**: Use the `dotnet build` .NET CLI command.
5. **Create and sign a certificate**: Create a certificate and then sign the plug-in assembly with it. For simplicity, I used a self-signed certificate, but you should consider a valid certificate for real use (source: Scott Durow's article).

```powershell
// powerplatform-managedidentity-certificate-signpluginassembly.ps1
// Source: https://gist.github.com/rpothin/fad8fe8bd3bec747108db9c9e82375f5
# Pre-requisite: plug-in assembly already built using for example 'dotnet build'

# 1. Generate a self-signed certificate
$cert = New-SelfSignedCertificate -Subject "CN=$name, O=corp, C=$name.com" -DnsName "www.$name.com" -Type CodeSigning -KeyUsage DigitalSignature -CertStoreLocation Cert:\CurrentUser\My -FriendlyName $friendlyName

# Note: The cert object contains a Thumbprint property we will use for the configuration of the federated credentials of the managed identity so keep it available

# 2. Set a password for the private key (optional)
$pw = ConvertTo-SecureString -String $password -Force -AsPlainText

# 3. Export the certificate as a PFX file
$certificatePath = ".\certificate.pfx"
Export-PfxCertificate -Cert $cert -FilePath $certificatePath -Password $pw

# 4. Sign the plug-in assembly with the certificate
# Note: The signtool utility is part of the Windows SDK (Software Development Kit). You can find it in the installation directory of the Windows SDK. If you haven't already installed the Windows SDK, you can download it from here: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
$signToolPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe"
Start-Process -FilePath $signToolPath -ArgumentList "sign /fd $fileDigestAlgorithm /f `"$certificatePath`" /p `"$password`" `"$dllPath`"" -NoNewWindow -Wait
```

6. **Register your plug-in**: Register your plug-in into your environment using the Plugin Registration Tool, which you can open with the `pac tool prt` Power Platform CLI command.
7. **Configure an Application Registration or User-Assigned Managed Identity**: Depending on your scenario, configure an application registration or a user-assigned managed identity. For my test, I chose a user-assigned managed identity to interact with an Azure Key Vault.

```powershell
// powerplatform-managedidentity-azureconfiguration.ps1
// Source: https://gist.github.com/rpothin/f222ce58bc8154002461ee370fca4e0c
### Initialization
# Generate the issuer URL based on the environment ID.
$environmentIdPrefix = $environmentId.Substring(0, $environmentId.Length - 2).Replace("-", "")
$environmentIdSuffix = $environmentId.Substring($environmentId.Length - 2)
$issuer = "https://$environmentIdPrefix.$environmentIdSuffix.environment.api.powerplatform.com/sts"

# Generate the subject identifier based on the certificate thumbprint (extracted during the configuration of the certificate) and the environment ID.
$subjectIdentifier = "component:pluginassembly,thumbprint:$certificateThumbprint,environment:$environmentId"

### User-assigned managed identity - Best choice for integration with Azure resources only
# 1. Create a user-assigned managed identity.
$userAssignedManagedIdentityAsJson = az identity create --name $userAssignedManagedIdentityName --resource-group $resourceGroupName
$userAssignedManagedIdentity = $userAssignedManagedIdentityAsJson | ConvertFrom-Json

# 2. Configure federated identity credentials for the user-assigned managed identity.
az identity federated-credential create --name $federatedIdentityCredentialName --identity-name $userAssignedManagedIdentityName --resource-group $resourceGroupName --issuer $issuer --subject $subjectIdentifier

$managedIdentityClientId = $userAssignedManagedIdentity.clientId

### Application registration - Best choice for integration with services / resources not in Azure (ex: other Dataverse environment)
# 1. Create an application registration.
$applicationRegistrationAsJson = az ad app create --display-name $applicationRegistrationName
$applicationRegistration = $applicationRegistrationAsJson | ConvertFrom-Json

# 2. Configure federated identity credentials for the application registration.
$parameters = @{
	name = $federatedIdentityCredentialName
	issuer = $issuer
	subject = $subjectIdentifier
	audiences = @("api://azureadtokenexchange") # Lowercase to avoid the error mentioned in the following blog article: https://itmustbecode.com/how-to-secure-a-dataverse-plug-in-with-managed-identity-using-plugin-identity-manager-for-xrmtoolbox/
}

$parametersJsonString = $parameters | ConvertTo-Json -Compress
$parametersFilePath = "parameters.json"
$parametersJsonString | Out-File -FilePath $parametersFilePath -Encoding utf8

az ad app federated-credential create --id $applicationRegistration.appId --parameters @$parametersFilePath

Remove-Item $parametersFilePath

$managedIdentityClientId = $applicationRegistration.appId

### Assign role on resources to managed identity
# (Example) Assign the Key Vault Secrets User role to the user-assigned managed identity.
az role assignment create --assignee $managedIdentityClientId --role "Key Vault Secrets User" --scope $keyVaultId
```

8. **Configure Federated Identity Credentials**: Configure the federated identity credentials on your managed identity to secure its consumption from a defined source.
9. **Grant access to Azure resources**: Grant access to the Azure resources you want to integrate with your managed identity using the `az role assignment create` Azure CLI command.
10. **Create the Managed Identity record in Dataverse**: Create the managed identity record in Dataverse and bind it with a plug-in assembly, using tools like Power Platform CLI with the `pac pfx run` command (source: Scott Durow's GitHub project PowerShell scripts).

```powershell
// powerplatform-managedidentity-dataverseconfiguration.ps1
// Source: https://gist.github.com/rpothin/e19be92c07461649db77ce984d7f6cbb
### Initialization
# Empty pfx script
$pfxScript = ""

# Create an empty folder named pfx-scripts
$folderPath = Join-Path -Path (Get-Location) -ChildPath "pfx-scripts"
if (-not (Test-Path -Path $folderPath)) {
    New-Item -Path $folderPath -ItemType Directory
}

### List managed identities not created by SYSTEM
$pfxScript = @"
    ShowColumns(
        Filter(
            'Managed Identities',
            'Created By'.'Full Name' <> "SYSTEM"
        ),
        'ManagedIdentity Id',
        TenantId,
        ApplicationId,
        Name
    )
"@

$listManagedIdentitiesPfxScriptPath = Join-Path -Path $folderPath -ChildPath "list-managed-identities.pfx"

Set-Content -Path $listManagedIdentitiesPfxScriptPath -Value $pfxScript

pac pfx run --file $listManagedIdentitiesPfxScriptPath --echo

### Create a new managed identity
$pfxScript = @"
Collect(
    'Managed Identities',
    {
        Name: "$managedIdentityName",
        ApplicationId:GUID("$applicationId"),
        TenantId:GUID("$tenantId"),
        'Credential Source':'Credential Source (Managed Identities)'.IsManaged,
        'Subject Scope':'Subject Scope (Managed Identities)'.EnviornmentScope
    }
).'ManagedIdentity Id'
"@
    
$createManagedIdentityPfxScriptPath = Join-Path -Path $folderPath -ChildPath "create-managed-identity.pfx"

Set-Content -Path $createManagedIdentityPfxScriptPath -Value $pfxScript

pac pfx run --file $createManagedIdentityPfxScriptPath --echo

### List plug-in assemblies not created by SYSTEM
$pfxScript = @"
    AddColumns(
        ShowColumns(
            Filter(
                'Plug-in Assemblies',
                'Created By'.'Full Name' <> "SYSTEM"
            ),
            PluginAssemblyId,
            Name,
            ManagedIdentityId
        ),
        ManagedIdentityName,
        LookUp(
            'Managed Identities',
            'ManagedIdentity Id' = ThisRecord.'ManagedIdentity Id'
        ).Name
    )
"@

$listPluginAssembliesPfxScriptPath = Join-Path -Path $folderPath -ChildPath "list-plugin-assemblies.pfx"

Set-Content -Path $listPluginAssembliesPfxScriptPath -Value $pfxScript

pac pfx run --file $listPluginAssembliesPfxScriptPath --echo

### Link the managed identity to the plug-in assembly
$pfxScript = @"
    Patch(
        'Plug-in Assemblies',
        LookUp(
            'Plug-in Assemblies',
            PluginAssemblyId = GUID("$pluginAssemblyId")
        ),
        {
            ManagedIdentityId: LookUp(
                'Managed Identities',
                ApplicationId = GUID("$applicationId") && TenantId = GUID("$tenantId")
            )
        }
    )
"@

$linkManagedIdentityToPluginAssemblyPfxScriptPath = Join-Path -Path $folderPath -ChildPath "link-managed-identity-to-plugin-assembly.pfx"

Set-Content -Path $linkManagedIdentityToPluginAssemblyPfxScriptPath -Value $pfxScript

pac pfx run --file $linkManagedIdentityToPluginAssemblyPfxScriptPath --echo

### Delete folder with the pfx scripts
Remove-Item -Path $folderPath -Recurse -Force
```

Alternatively, you can use SQL queries with the SQL 4 CDS plugin in XrmToolBox:

```sql
-- powerplatform-managedidentity-dataverseconfiguration.sql
-- Source: https://gist.github.com/rpothin/827309aed3cb91d67e3ecbb38479ecb2
-- 1. Selects specific columns from the 'managedidentity' table where the 'createdbyname' is not 'SYSTEM',
--    and orders the results by 'modifiedon' in descending order.
SELECT   managedidentityid,
         applicationid,
         name,
         createdby,
         createdon,
         credentialsource,
         credentialsourcename,
         subjectscope,
         subjectscopename,
         tenantid
FROM     managedidentity
WHERE    createdbyname <> 'SYSTEM'
ORDER BY modifiedon DESC;

-- 2. Inserts a new record into the 'managedidentity' table with specified values for 'applicationid', 
--    'credentialsource', 'subjectscope', and 'tenantid'.
INSERT  INTO managedidentity (applicationid, name, credentialsource, subjectscope, tenantid)
VALUES                      ('61124aa6-920d-4a5d-bb5c-4b6a41d50eee', 'mi-dataverse-plugin', 2, 1, '7e7df62f-7cc4-4e63-a250-a277063e1be7');

-- 3. Selects specific columns from the 'pluginassembly' table where the 'createdbyname' is not 'SYSTEM',
--    and orders the results by 'modifiedon' in descending order.
SELECT   pluginassemblyid,
         pluginassemblyidunique,
         name,
         managedidentityid
FROM     pluginassembly
WHERE    createdbyname <> 'SYSTEM'
ORDER BY modifiedon DESC;

-- 4. Updates the 'managedidentityid' in the 'pluginassembly' table for a specific 'pluginassemblyid'.
UPDATE pluginassembly
SET    managedidentityid = '12d83b39-9078-ef11-ac21-002248b1be27'
WHERE  pluginassemblyid = '53b2fbdb-f0f4-410f-8a27-6bdb06f1737b';

-- ⚠️ If your update is targeting an assembly not signed with a valid certificate you will get the following error: "Plugin assembly must be signed with valid certificate to associate to Managed Identity"
```

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
