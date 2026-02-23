---
title: "Power Platform's Protection — Microsoft Sentinel, the watchtower"
date: 2025-02-06
tags: [power-platform, security, microsoft-sentinel, siem, dynamics-365]
description: "A guide to Microsoft Sentinel's growing coverage of Microsoft Business Apps — setting up workspace infrastructure with Bicep and PowerShell, exploring the ASIM parsers, analytics rules, playbooks, hunting queries, and workbooks, and strategies for Power Platform teams to collaborate with security teams."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/power-platforms-protection-microsoft-sentinel-the-watchtower"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Audit logs are a crucial component of the reactive side of a cyber defense strategy. In a previous article, we covered this topic within the context of Power Platform, exploring the capabilities of Microsoft Purview's Audit solution. But relying only on log searches limits their potential to strengthen security. So, how can we move beyond passive auditing and turn these logs into actions?

This is where Microsoft Sentinel steps in. As a comprehensive solution for both Security Information and Event Management (SIEM) and Security Orchestration, Automation, and Response (SOAR), Microsoft Sentinel helps you understand what is happening in your organization by aggregating data from various sources. It can automatically raise alerts and incidents, address them, and help you implement a proactive approach to threat management.

For many Power Platform and Dynamics 365 professionals, this domain might feel unfamiliar. But understanding these tools will empower you to have meaningful discussions with security teams in your organization. By bridging this gap, we can enhance the protection of our Power Platform ecosystem together.

## The evolution of Sentinel's coverage for Microsoft Business Apps

In summer 2022, Microsoft introduced the Sentinel Solution for Dynamics 365, focusing on Customer Engagement applications. This was the first step of Microsoft in their journey to securing Dynamics 365 with Sentinel.

Almost one year after the launch of the Dynamics 365 integration with Sentinel, Microsoft expanded its efforts to protect this part of its ecosystem by introducing integration for Power Platform. Announced in June 2023, this new solution aimed to enable organizations to monitor and secure their low-code solutions through Sentinel's powerful analytics and automation features. By ingesting Power Platform audit logs, it provided proactive anomaly detection, improved oversight of DLP policies, and stronger protection at the platform level.

Let's not forget those working with Dynamics 365 Finance and Operations, who finally gained the ability to leverage Sentinel only one month after the previous announcement, in July 2023. With the introduction of the Microsoft Sentinel Solution for Dynamics 365 Finance and Operations, organizations could also monitor the activity around critical financial and operational data.

But while working on this article, I came across an exciting new development: Microsoft Sentinel solution for Microsoft Business Apps — a unified solution with potential. Announced quietly in a Microsoft Sentinel blog post in November 2024, this solution in preview unifies protection for Dynamics 365 Customer Engagement, Dynamics 365 Finance & Operations, and Power Platform under one umbrella. I love the idea of consolidating coverage for all Microsoft Business Applications into a single Sentinel solution, simplifying management while enhancing threat detection and response. This solution marks an exciting new chapter for organizations interested in leveraging the Microsoft Business Applications ecosystem in a secure way.

## Setting up Microsoft Sentinel for Business Apps

Microsoft provides documentation to manually configure a Sentinel workspace and install the Business Applications solution via the Azure portal. However, a manual setup is not ideal if you need to quickly spin up a new Sentinel workspace to extend what is offered by Microsoft with custom configurations following a proper development flow.

This is where Infrastructure as Code (IaC) and scripting come in. By automating the deployment, you ensure consistency, speed, and scalability. I encourage you to follow this kind of approach over manual configuration.

> [!NOTE]
> If you are interested in exploring the "as code" approach for this requirement, I definitely encourage you to read the following Microsoft blog articles: _Deploy Microsoft Sentinel using Bicep_ and _Deploying and Managing Microsoft Sentinel as Code_. They have been a great source of inspiration for my own implementation proposition below.

First, we will need a Log Analytics Workspace and to add Microsoft Sentinel to it. For this task Bicep is one of the options available.

```bicep
// microsoft-sentinel-workspace.bicep
// Source: https://gist.github.com/rpothin/3e3e225386e50fbca1591068a55d0c45
@description('Name of the Log Analytics Workspace')
param logAnalyticsWorkspaceName string

@description('Log Analytics Workspace Pricing Tier')
param logAnalyticsWorkspaceSkuName string = 'PerGB2018'

@description('Resource Group Location')
param location string

@description('Tags for resources')
param tags object = {}

@description('Retention period in days for the Log Analytics Workspace')
param retentionInDays int = 30

// Create log analytics workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: logAnalyticsWorkspaceSkuName
    }
    retentionInDays: retentionInDays
  }
}

// Add Microsoft Sentinel to the log analytics workspace
resource microsoftSentinel 'Microsoft.OperationsManagement/solutions@2015-11-01-preview' = {
  name: 'SecurityInsights(${logAnalyticsWorkspaceName})'
  location: location
  tags: tags
  plan: {
    name: 'SecurityInsights(${logAnalyticsWorkspaceName})'
    product: 'OMSGallery/SecurityInsights'
    publisher: 'Microsoft'
    promotionCode: ''
  }
  properties: {
    workspaceResourceId: logAnalyticsWorkspace.id
  }
}

output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
```

While deploying a Sentinel workspace with Bicep is straightforward, installing solutions into it via IaC is currently not well-supported. Fortunately, with some PowerShell scripting and API calls, we can automate the installation of the Microsoft Business Applications solution.

```powershell
# install-microsoft-business-applications-solution-into-microsoft-sentinel-workspace.ps1
# Source: https://gist.github.com/rpothin/390c6a79d06ec7ad3c8b25ead8906a81

# Connect to Azure CLI with device code
az login --use-device-code

# Get a token to be able to use the https://management.azure.com/ api
$token = az account get-access-token --resource "https://management.azure.com/" --query accessToken -o tsv

#region Navigation to the considered Log Analytics workspace

# List the available subscriptions and prompt the user to select one
az account list --query "[].{Name:name, SubscriptionId:id}" -o json | ConvertFrom-Json | Format-Table -AutoSize
# Get the subscription id from the user
$subscriptionId = Read-Host "Enter the subscription id"

# List the resource groups under the selected subscription
az group list --subscription $subscriptionId --query "[].{Name:name, Location:location}" -o json | ConvertFrom-Json | Format-Table -AutoSize
# Get the resource group name from the user
$resourceGroupName = Read-Host "Enter the resource group name"

# List the log analytics workspaces under the selected resource group
$workspaces = az monitor log-analytics workspace list --resource-group $resourceGroupName --subscription $subscriptionId --query "[].{Name:name, Location:location}" -o json | ConvertFrom-Json
$workspaces | Format-Table -AutoSize

# Get the log analytics workspace name from the user
$workspaceName = Read-Host "Enter the log analytics workspace name"

$consideredWorkspace = $workspaces | Where-Object { $_.name -eq $workspaceName }

#endregion

#region Get Microsoft Business Applications Sentinel solution packaged content

try {
    $uri = "https://management.azure.com/subscriptions/$subscriptionId/resourceGroups/$resourceGroupName/providers/Microsoft.OperationalInsights/workspaces/$workspaceName/providers/Microsoft.SecurityInsights/contentProductPackages?api-version=2024-09-01"
    $response = Invoke-WebRequest -Uri $uri -Headers @{Authorization = "Bearer $token"} -Method Get
    $responseContent = $response.Content | ConvertFrom-Json
    $responseContentValue = $responseContent.value

    $solutionDetails = $responseContentValue | Where-Object { $_.properties.displayName -eq "Microsoft Business Applications" } | Select-Object id,name
    if (-not $solutionDetails) {
        throw "Microsoft Business Applications solution not found."
    }

    $solutionURL = "https://management.azure.com" + $solutionDetails.id + "?api-version=2024-09-01"
    $responseSolution = Invoke-WebRequest -Uri $solutionURL -Headers @{Authorization = "Bearer $token"} -Method Get
    $responseSolutionContent = $responseSolution.Content | ConvertFrom-Json
    $solutionAvailableVersion = $responseSolutionContent.properties.version
    $solutionPackagedContent = $responseSolutionContent.properties.packagedContent
} catch {
    Write-Error "Failed to retrieve Microsoft Business Applications Sentinel solution: $_"
    exit 1
}

#endregion

#region Install the Microsoft Business Applications Sentinel solution

try {
    $uri = "https://management.azure.com/batch?api-version=2020-06-01"
    $deploymentName = "BizAppsSentinelSolutionInstall-" + (Get-Date).ToString("yyyyMMddHHmmss")

    $body = @{
        requests = @(
            @{
                content = @{
                    properties = @{
                        parameters = @{
                            "workspace"          = @{"value" = $workspaceName }
                            "workspace-location" = @{"value" = $consideredWorkspace.Location }
                        }
                        template = $solutionPackagedContent
                        mode = "Incremental"
                    }
                }
                httpMethod = "PUT"
                name = [guid]::NewGuid().ToString()
                requestHeaderDetails = @{ commandName = "Microsoft_Azure_SentinelUS.ContenthubClickBulkInstall/put" }
                url = "/subscriptions/$subscriptionId/resourcegroups/$resourceGroupName/providers/Microsoft.Resources/deployments/$deploymentName`?api-version=2020-06-01"
            }
        )
    }

    $response = Invoke-WebRequest -Uri $uri -Headers @{ Authorization = "Bearer $token" } -Method Post -Body ($body | ConvertTo-Json -Depth 50) -ContentType "application/json"
    if ($response.StatusCode -ne 200) {
        throw "Failed to install Microsoft Business Applications Sentinel solution."
    }
} catch {
    Write-Error "Failed to install Microsoft Business Applications Sentinel solution: $_"
    exit 1
}

#endregion
```

> [!NOTE]
> Updating your installation of the Microsoft Business Applications when a new version is available also seems possible.

```powershell
# update-installed-microsoft-business-applications-solution.ps1
# Source: https://gist.github.com/rpothin/02f1b799a0250737cf1baa5f162d8972

# Source: https://techcommunity.microsoft.com/blog/microsoftsentinelblog/deploy-microsoft-sentinel-using-bicep/4270970

# Connect to Azure CLI with device code
az login --use-device-code

# Get a token to be able to use the https://management.azure.com/ api
$token = az account get-access-token --resource "https://management.azure.com/" --query accessToken -o tsv

#region Navigation to the considered Log Analytics workspace

# List the available subscriptions and prompt the user to select one
az account list --query "[].{Name:name, SubscriptionId:id}" -o json | ConvertFrom-Json | Format-Table -AutoSize

# Get the subscription id from the user
$subscriptionId = Read-Host "Enter the subscription id"

# List the resource groups under the selected subscription
az group list --subscription $subscriptionId --query "[].{Name:name, Location:location}" -o json | ConvertFrom-Json | Format-Table -AutoSize

# Get the resource group name from the user
$resourceGroupName = Read-Host "Enter the resource group name"

# List the log analytics workspaces under the selected resource group
$workspaces = az monitor log-analytics workspace list --resource-group $resourceGroupName --subscription $subscriptionId --query "[].{Name:name, Location:location}" -o json | ConvertFrom-Json

$workspaces | Format-Table -AutoSize

# Get the log analytics workspace name from the user
$workspaceName = Read-Host "Enter the log analytics workspace name"

$consideredWorkspace = $workspaces | Where-Object { $_.name -eq $workspaceName }

#endregion

#region Get Microsoft Business Applications Sentinel solution packaged content

try {
    # Search the Microsoft Business Applications solution in the list of solutions available for the considered Log Analytics workspace
    $uri = "https://management.azure.com/subscriptions/$subscriptionId/resourceGroups/$resourceGroupName/providers/Microsoft.OperationalInsights/workspaces/$workspaceName/providers/Microsoft.SecurityInsights/contentProductPackages?api-version=2024-09-01"
    $response = Invoke-WebRequest -Uri $uri -Headers @{Authorization = "Bearer $token"} -Method Get

    $responseContent = $response.Content | ConvertFrom-Json
    $responseContentValue = $responseContent.value

    $solutionDetails = $responseContentValue | Where-Object { $_.properties.displayName -eq "Microsoft Business Applications" } | Select-Object id,name

    if (-not $solutionDetails) {
        throw "Microsoft Business Applications solution not found."
    }

    # Get the Microsoft Business Applications Sentinel solution packaged content
    $solutionURL = "https://management.azure.com" + $solutionDetails.id + "?api-version=2024-09-01"
    $responseSolution = Invoke-WebRequest -Uri $solutionURL -Headers @{Authorization = "Bearer $token"} -Method Get

    $responseSolutionContent = $responseSolution.Content | ConvertFrom-Json
    $solutionAvailableVersion = $responseSolutionContent.properties.version
    $solutionPackagedContent = $responseSolutionContent.properties.packagedContent
} catch {
    Write-Error "Failed to retrieve Microsoft Business Applications Sentinel solution: $_"
    exit 1
}

#endregion

#region Update of the Microsoft Business Applications Sentinel solution if new version available

# Get the state of the Microsoft Business Applications Sentinel solution installed in the considered Microsoft Sentinel Workspace
$uri = "https://management.azure.com/subscriptions/$subscriptionId/resourceGroups/$resourceGroupName/providers/Microsoft.OperationalInsights/workspaces/$workspaceName/providers/Microsoft.SecurityInsights/contentpackages?api-version=2023-04-01-preview&%24filter=(properties%2FcontentId%20eq%20'sentinel4dynamics365.powerplatform')"
$response = Invoke-WebRequest -Uri $uri -Headers @{Authorization = "Bearer $token"} -Method Get

$responseContent = $response.Content | ConvertFrom-Json
$solutionInstalledVersion = $responseContent.value.properties.version

# Update the Microsoft Business Applications Sentinel solution if a new version is available
if ($solutionInstalledVersion -ne $solutionAvailableVersion) {
    try {
        $uri = "https://management.azure.com/batch?api-version=2020-06-01"

        $deploymentName = "BizAppsSentinelSolutionUpdate-" + (Get-Date).ToString("yyyyMMddHHmmss")

        $body = @{
            requests = @(
                @{
                    content = @{
                        properties = @{
                            parameters = @{
                                "workspace"          = @{"value" = $workspaceName }
                                "workspace-location" = @{"value" = $consideredWorkspace.Location }
                            }
                            template = $solutionPackagedContent
                            mode = "Incremental"
                        }
                    }
                    httpMethod = "PUT"
                    name = [guid]::NewGuid().ToString()
                    requestHeaderDetails = @{
                        commandName = "Microsoft_Azure_SentinelUS.ContenthubClickBulkInstall/put"
                    }
                    url = "/subscriptions/$subscriptionId/resourcegroups/$resourceGroupName/providers/Microsoft.Resources/deployments/$deploymentName`?api-version=2020-06-01"
                }
            )
        }

        # POST to uri
        $response = Invoke-WebRequest -Uri $uri -Headers @{ Authorization = "Bearer $token" } -Method Post -Body ($body | ConvertTo-Json -Depth 50) -ContentType "application/json"

        if ($response.StatusCode -ne 200) {
            throw "Failed to update Microsoft Business Applications Sentinel solution."
        }
    } catch {
        Write-Error "Failed to update Microsoft Business Applications Sentinel solution: $_"
        exit 1
    }
}

#endregion
```

At this point, the key remaining task is to enable the data connectors provided by the solution and relevant to your Power Platform and Dynamics 365 usage to be able to start ingesting data into your Microsoft Sentinel workspace. Even if it could theoretically be done with some effort using code, finishing this last mile in the Azure portal is a practical approach:

1. Open your Microsoft Sentinel workspace
2. Open the Data Connectors page
3. Click on the connector you want to connect
4. At the bottom of the right-side pane presenting the connector, click on the "Open connector page" button
5. Click on the "Connect" button and wait for the status in the left-side pane to become "Connected"

Now we wait for the next data ingestion to be able to continue our exploration of how Microsoft Sentinel can help improve our security posture around Power Platform.

## Detecting and responding to Power Platform and Dynamics 365 threats

Bringing Power Platform and Dynamics 365 data into Sentinel is only the first step of our journey. Fortunately, the Microsoft Business Applications solution also includes powerful tools to help you search, analyze, detect, and respond to threats effectively.

From the Content Hub page of your Microsoft Sentinel workspace, you can click on the Manage button in the left pane after selecting the considered solution to be able to explore it in detail.

Here, you will be able to explore the different types of components available:

- **Advanced Security Information Model (ASIM) parsers**: user-defined functions written in Kusto Query Language (KQL) that help transform and enhance data for easier analysis. For example, `MSBizAppsOrgSettings` lists Power Platform environment settings details to simplify incident response and threat hunting.

- **Threat Detection Analytics Rules**: automated rules that continuously scan collected data to detect anomalies. For instance, _Dataverse — Organization settings modified_ monitors changes to Power Platform environment settings and raises alerts when modifications occur.

- **Playbooks**: Logic Apps that automate responses to security incidents. A great example is _Dataverse: Add user to blocklist using Teams approval workflow_, which gives the opportunity to the security team to automatically prevent a user from authenticating against Dataverse using a conditional access policy when a threat is detected.

> [!NOTE]
> To be able to manually run a playbook like that, you need to configure the playbook permissions from Microsoft Sentinel workspace settings and add the resource groups where your playbooks are. You also need to give to the users who will potentially run them the "Logic App Contributor" role in the playbooks and the "Automation Contributor" role in the Log Analytics Workspace behind Microsoft Sentinel.

- **Hunting Queries**: KQL queries that allow security teams to investigate suspicious activity manually starting from a hypothesis. One example is _Dataverse — Cross-environment data export activity_, which looks for unusual export behaviors across environments.

- **Workbooks**: visual insights into security data. Currently, only the _Dynamics 365 Activity_ workbook is available, offering dashboards for Dataverse, email activity, and other related events.

With these elements your security teams have access to end-to-end threat detection and response for Power Platform and Dynamics 365. Data connectors bring in crucial telemetry, analytics rules continuously monitor for threats, and playbooks automate response actions.

But security is not a one-time setup. Hunting queries enable security teams to proactively investigate threats, refine detection mechanisms, and continuously strengthen automated protections. Staying ahead of threats requires ongoing monitoring and adaptation, and Sentinel equips you with the tools to do just that.

## Taking the Microsoft Sentinel solution for Microsoft Business Apps further

Microsoft Sentinel solution for Microsoft Business Apps provides great foundations to improve the protection of Power Platform and Dynamics 365. But as you potentially guessed reading the article up to this point, each organization has their specificities and will need to go through the process of building on top of these foundations to tailor Microsoft Sentinel to their own priorities and processes.

One key gap organizations may need to address is the lack of full coverage for Power Platform-related data in the Microsoft Business Apps solution. Currently, there is no built-in data connector for Power Apps activity. However, you can bridge this gap by deploying a Function App to ingest Office 365 Management API data into Sentinel. This would allow you to track relevant audit log records — at least 45 for Power Apps events and 79 for events related to Power Platform Connectors.

Also, analytics rules provided in the solution may not exactly align with your organization's needs. Take, for example, the _Dataverse — Organization settings modified_ analytics rule. While useful, it is too broad and could lead to alert fatigue, overwhelming security teams with non-critical notifications. Instead of using it as-is, consider creating a customized alternative focusing on high-impact changes — such as modifications to critical Power Platform settings (IP cookie binding, IP firewall...).

In extension, this principle — taking what the solution provides as an inspiration more than production-ready components — also applies pretty well to the rest of what is included in the solution: playbooks, hunting queries, parsers and workbooks.

As always, technology alone isn't enough to successfully implement Microsoft Sentinel for Power Platform security. To be able to achieve this, a bridge will need to be built in the organization between groups with different backgrounds, skillsets and visions. As a Power Platform professional, either you can wait for the security teams to come to you or you can be proactive and try to contact them to put this effort in motion.

> [!NOTE]
> If your organization does not already use Microsoft Sentinel and if it is not in your roadmap, the discussion will be pretty different because you will potentially have less resources out there to help you implement a comprehensive strategy for Power Platform and Dynamics 365. But I still encourage you to take the first step toward your security teams. I am sure they will appreciate your effort and interest in this matter.

The collaboration between Power Platform professionals and security teams could take many different forms. You will find below a few examples of what it could look like in your organization:

- **Security teams own Sentinel — No visibility for Power Platform professionals**: Microsoft Sentinel is fully owned and managed by the security teams and Power Platform professionals support them by answering questions and passing requests from the business but without direct visibility on Microsoft Sentinel.
- **Security teams own Sentinel — Read-only access to data for Power Platform professionals**: Microsoft Sentinel is fully owned and managed by the security teams but a read-only access to Power Platform related data is provided to Power Platform professionals to encourage proactive recommendations and investigation of potential risks.
- **Co-ownership of Power Platform security in Sentinel**: Power Platform scope in Microsoft Sentinel is co-owned and co-managed by the security teams and Power Platform professionals with a joint effort to continuously improve Power Platform protection by improving the configurations and the processes.

From my perspective, choosing the right model for your organization will depend mainly on how open your security teams are to share ownership of Power Platform security and how involved Power Platform professionals want to be in this mission. Regardless of the model, one thing is clear: collaboration will be essential to make such an initiative a success. By working together, security and Power Platform teams can strengthen protection, minimize risks, and improve response times.

Microsoft Sentinel provides a valuable opportunity to gain deep visibility into Power Platform activity. It helps organizations understand security risks, refine automated threat detection and respond continuously.

Whether your organization has already onboarded Microsoft Sentinel or is planning to do so, as a Power Platform professional, you cannot overlook its growing importance in strengthening the platform's security posture. From identifying critical data with Microsoft Purview to configuring audit logs effectively and leveraging insights in Microsoft Sentinel — each step plays a crucial role in preventing threats from turning into security incidents. By taking proactive steps today, you can help ensure that Power Platform remains a secure and trusted foundation for driving your organization's success.

---

### Power Platform's Protection series

1. [Power Platform's protection — Azure AD Conditional Access](/archive/power-platform-protection/01-azure-ad-conditional-access)
2. [Power Platform's protection — Defender for Cloud Apps](/archive/power-platform-protection/02-defender-for-cloud-apps)
3. [Power Platform's protection — Platform internal capabilities](/archive/power-platform-protection/03-platform-internal-capabilities)
4. [Power Platform's protection — Microsoft Purview Compliance](/archive/power-platform-protection/04-microsoft-purview-compliance)
5. [Power Platform's protection — Virtual Network integration](/archive/power-platform-protection/05-virtual-network-integration)
6. [Power Platform's protection — Managed Identity for Dataverse plug-ins](/archive/power-platform-protection/06-managed-identity-for-dataverse-plug-ins)
7. [Power Platform's Protection — Building secure and responsible Generative AI solutions](/archive/power-platform-protection/07-building-secure-and-responsible-generative-ai-solutions)
8. [Power Platform's Protection — Microsoft Purview the data guardian](/archive/power-platform-protection/08-microsoft-purview-the-data-guardian)
9. **Power Platform's Protection — Microsoft Sentinel, the watchtower** ← _you are here_
