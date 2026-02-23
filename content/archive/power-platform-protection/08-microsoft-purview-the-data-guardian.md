---
title: "Power Platform's Protection — Microsoft Purview the data guardian"
date: 2024-12-09
tags: [power-platform, security, microsoft-purview, dataverse, data-governance]
description: "How Microsoft Purview's Data Map, Unified Catalog, and DSPM for AI can be used to classify and govern Dataverse data — including scanning tables for sensitivity labels, onboarding Fabric for Data Quality monitoring, and monitoring AI activity."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/power-platforms-protection-microsoft-purview-the-data-guardian"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

With Microsoft Ignite 2024 behind us, it's evident that Microsoft Purview has become an indispensable tool for organizations striving to adopt AI safely, efficiently, and successfully.

If you are working with business applications — and if you are here, I assume you are working with Power Platform and it applies to you — then you know that data is a significant and growing asset. And with AI this asset can greatly enhance the effectiveness of your organization's operations. Naturally, being such a valuable asset, your data needs robust protection due to the numerous risks it faces.

In my previous article, I discussed the considerations for building secure and responsible AI solutions. This further underscores the importance of data, as its generation accelerates and it becomes central to the quality of outputs from AI solutions you implement and use.

Within the Microsoft ecosystem, Microsoft Purview offers a "comprehensive set of solutions that can help your organization govern, protect, and manage data, wherever it lives" — including Dataverse (currently in Preview).

Follow me to learn more about Microsoft Purview and discover how we, as Power Platform professionals, can use it to better protect the valuable assets stored in Dataverse or consumed through agents built within Copilot Studio.

> [!IMPORTANT]
> The code provided in this article is primarily based on undocumented APIs and should not be used for Production. Microsoft could change them at any time and you would not receive support if it impacts your operations. This code is intended for learning purposes and to enhance understanding of how Microsoft Purview handles scenarios involving Dataverse behind the scenes.

## Why consider Microsoft Purview to protect Dataverse data?

Dataverse serves as the secure, scalable data foundation for Power Platform and Dynamics 365. It supports both low-code and code-first developers in creating robust business applications. By centralizing data in Dataverse, organizations can ensure consistency, accessibility, and security across their applications. This makes Dataverse an indispensable component of the Power Platform ecosystem, providing a reliable and efficient way to manage data.

However, as your organization scales and more teams adopt Dataverse to create business applications and innovate within their environments, it becomes increasingly challenging to keep track of how data is managed and whether it meets expected standards.

Microsoft Purview's journey began a few years ago under the name of Azure Purview. Over the years, it has evolved into a unified data governance and compliance platform, integrating capabilities from Microsoft Compliance Center. Today, Microsoft Purview comprises a comprehensive set of solutions that cover the entire data estate, offering:

- **Unified data governance solutions** that manage data across on-premises, multicloud, and SaaS environments, including Azure, Fabric (aka Power BI), SQL, and Amazon S3. This ensures that your data is consistently governed and easily accessible, regardless of where it resides.
- **Robust data security solutions** to discover and protect sensitive information, ensuring comprehensive coverage across your data estate. This helps safeguard your valuable data assets against potential threats and breaches.
- **Risk and compliance solutions** to minimize compliance risks and meet regulatory requirements. These solutions are accessible through the new Microsoft Purview portal, making it easier for organizations to manage their compliance needs effectively.

By combining data governance and Microsoft 365 compliance solutions, Purview addresses data fragmentation and enhances visibility. This unified approach makes data management more efficient and secure, providing a holistic solution for your organization's data needs.

But what does this mean concretely for Dataverse and Dynamics 365? Are all Microsoft Purview's solutions applicable to this scope? Let's start the exploration to find the answers.

## Microsoft Purview capabilities directly applicable to Dataverse and Dynamics 365

> [!NOTE]
> For the rest of this blog article, we will assume you already have a valid account type in Microsoft Purview with sufficient permissions to follow along.

One element not explicitly called out in Microsoft documentation regarding connecting Dataverse in Microsoft Purview is the fact that to get the best from this capability, you will need to have the following elements from the Information Protection solution ready to use:

- **Sensitivity information types**: used to classify the columns in your Dataverse tables
- **Sensitivity labels**: allowing to identify the most critical information in your Dataverse tables corresponding to their classification

While it is possible to validate that sensitivity labels will correctly be assigned to columns in Dataverse tables through the Microsoft Purview portal, using code for such validations provides a more reliable and repeatable approach.

```powershell
# purview-list-labels-applicable-to-schematized-data-assets.ps1
# Source: https://gist.github.com/rpothin/047d03c7e222bc469fb12efc0f0f4897
# Check if the ExchangeOnlineManagement module is installed; if not, install it
# https://learn.microsoft.com/en-us/powershell/exchange/exchange-online-powershell
if (-not (Get-Module -Name ExchangeOnlineManagement -ListAvailable)) {
    Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber
    Import-Module -Name ExchangeOnlineManagement
} else {
    Import-Module -Name ExchangeOnlineManagement
}

# Prompt the user for a user principal name
$UserPrincipalName = Read-Host -Prompt 'Enter the user principal name'

# Validate the user principal name input
if (-not $UserPrincipalName) {
    Write-Error "User principal name cannot be empty."
    exit
}

# Connect to Security & Compliance PowerShell with an interactive login prompt
# https://learn.microsoft.com/en-us/powershell/exchange/connect-to-scc-powershell#connect-to-security--compliance-powershell-with-an-interactive-login-prompt
try {
    Connect-IPPSSession -UserPrincipalName $UserPrincipalName
} catch {
    Write-Error "Failed to connect to Security & Compliance PowerShell. $_"
    exit
}

# List the sensitivity labels
# https://learn.microsoft.com/en-us/powershell/module/exchange/get-label
try {
    $sensitivityLabels = Get-Label
} catch {
    Write-Error "Failed to retrieve sensitivity labels. $_"
    exit
}

# Filter sensitivity labels to keep only the ones where
# - ContentType contains "SchematizedData"
# - SchematizedDataCondition is not null
$filteredLabels = $sensitivityLabels | Where-Object {
    $_.ContentType -like '*SchematizedData*' -and $_.SchematizedDataCondition -ne $null
}

# Display found labels
$filteredLabels
```

> [!NOTE]
> If you don't have permission to run code for this validation, you can check with one of your colleagues in charge of managing Sensitivity Labels.

Once this initial step is completed, you can head to the Data Map solution of Microsoft Purview to onboard the Dataverse tables you are interested in tracking.

To easily identify which Dataverse tables to onboard into Microsoft Purview, assuming you will be interested in tracking the non-technical tables containing rows, code-based discovery is a practical approach.

```powershell
# dataverse-list-non-system-tables-with-rows.ps1
# Source: https://gist.github.com/rpothin/9a2fe7d9e9b66a908363b2e600f58602
# Login to Azure CLI
az login

# Prompt user to get the full domain name of the considered Power Platform / Dataverse environment (including the suffix like .api.crm.dynamics.com)
$EnvironmentDomain = Read-Host -Prompt 'Enter the full domain name of the Power Platform / Dataverse environment (including the suffix like .api.crm.dynamics.com)'

# Define the Dataverse environment URL
$DataverseEnvironmentUrl = "https://$EnvironmentDomain"

# Get a token for the Dataverse API
$token = az account get-access-token --resource $DataverseEnvironmentUrl --query accessToken -o tsv

# Define the Dataverse API endpoint URL
$DataverseApiEndpoint = "$DataverseEnvironmentUrl/api/data/v9.2"

# Exclusion list of tables to ignore
$ExclusionList = @(
    'roleeditorlayout', 'organizationdatasyncstate', 'aaduser', 'businessunit', 'channelaccessprofile',
    'channelaccessprofilerule', 'connection', 'connectioninstance', 'connectionrole', 'credential',
    'deleteditemreference', 'desktopflowmodule', 'entityrecordfilter', 'expiredprocess', 'fabricaiskill',
    'featurecontrolsetting', 'flowcredentialapplication', 'flowlog', 'flowmachineimage', 'flowmachineimageversion',
    'goal', 'goalrollupquery', 'mailmergetemplate', 'metric', 'mspcat_catalogsubmissionfiles', 'mspcat_packagestore',
    'newprocess', 'organizationdatasyncfnostate', 'position', 'powerbidatasetapdx', 'powerbireportapdx',
    'privilegecheckerlog', 'privilegecheckerrun', 'privilegesremovalsetting', 'queue', 'recordfilter', 'report',
    'reportparameter', 'rollupfield', 'searchattributesettings', 'searchcustomanalyzer', 'searchrelationshipsettings',
    'serviceplanmapping', 'sharedlinksetting', 'sharepointdocumentlocation', 'sharepointsite', 'socialprofile',
    'systemuser', 'territory', 'transactioncurrency', 'translationprocess', 'workqueue', 'workqueueitem'
)

# Get the Dataverse tables to check based on the following criteria:
# - The table is customizable
# - The table can be renamed
# - The schema name of the table does not start with "msdyn_"
# - The table is not in the exclusion list
$url = "$DataverseApiEndpoint/EntityDefinitions?`$select=LogicalName,LogicalCollectionName,SchemaName,CollectionSchemaName&`$filter=IsCustomizable/Value eq true and IsRenameable/Value eq true"
$response = Invoke-RestMethod -Uri $url -Headers @{Authorization = "Bearer $token"}

# Parse the response
$entityDefinitions = $response.value

# Count the number of tables before filtering
$entityDefinitionsCountBeforeFiltering = $entityDefinitions.Count
Write-Host "Number of tables before filtering: $entityDefinitionsCountBeforeFiltering"

# Filter the tables
$filteredEntityDefinitions = $entityDefinitions | Where-Object {
    $_.SchemaName -notlike 'msdyn_*' -and $_.LogicalName -notin $ExclusionList
}

# Count the number of tables after filtering
$entityDefinitionsCountAfterFiltering = $filteredEntityDefinitions.Count
Write-Host "Number of tables after filtering: $entityDefinitionsCountAfterFiltering"

# For all tables to check, do a row count and add the property to the object
foreach ($entityDefinition in $filteredEntityDefinitions) {
    $url = "$DataverseApiEndpoint/$($entityDefinition.LogicalCollectionName)/`$count"
    try {
        $response = Invoke-RestMethod -Uri $url -Headers @{Authorization = "Bearer $token"}
        $rowCount = [int]([regex]::Replace($response, '[^\d]', ''))
    } catch {
        Write-Error "Failed to retrieve row count for $($entityDefinition.LogicalName). $_"
        $rowCount = 0
    }
    $entityDefinition | Add-Member -MemberType NoteProperty -Name RowCount -Value $rowCount -Force
}

# Filter the tables to keep only the ones with a row count greater than 0
$filteredEntityDefinitions = $filteredEntityDefinitions | Where-Object {
    $_.RowCount -gt 0
}

# Order the tables by RowCount in descending order
$filteredEntityDefinitions = $filteredEntityDefinitions | Sort-Object -Property RowCount -Descending

# Count the number of tables with a row count greater than 0
$entityDefinitionsCountWithRowCount = $filteredEntityDefinitions.Count
Write-Host "Number of tables with a row count greater than 0: $entityDefinitionsCountWithRowCount"

# Display the tables CollectionSchemaName, LogicalName and RowCount
$filteredEntityDefinitions | Select-Object CollectionSchemaName, LogicalName, RowCount
```

Once the list of Dataverse tables to consider has been identified, you will need to go through the following steps in the Data Map solution in Microsoft Purview:

1. Initialize your data structure by creating a new Domain if needed — for example, it could be one under which you will only register Dataverse related assets.

```powershell
# microsoft-purview-create-domain-if-needed.ps1
# Source: https://gist.github.com/rpothin/bf44826d067cb12e9dfbd8e5a7786da0
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing domains
$domainListUrl = "https://$tenantId-api.purview-service.microsoft.com/account/domains?api-version=2023-12-01-preview"
$domainListResponse = Invoke-RestMethod -Uri $domainListUrl -Headers @{Authorization = "Bearer $token"}
$domainListResponse.value

# Prompt the user to ask if they want to create a new domain or if an existing domain should be used
$createNewDomain = Read-Host -Prompt 'Do you want to create a new domain? (Y/N)'

# If the user wants to create a new domain
if ($createNewDomain.ToUpper() -eq "Y") {
    # Prompt user to get the name and description of the new domain
    $domainName = Read-Host -Prompt 'Enter the name of the new domain'
    $domainDescription = Read-Host -Prompt 'Enter the description of the new domain'

    # Initialize retry counter
    $retryCount = 0
    $maxRetries = 10

    do {
        # Generate a random 6 characters string - could contain 2 digits - for the domain key and make it lowercase
        $domainKey = (-join ((65..90) + (97..122) | Get-Random -Count 6 | ForEach-Object {[char]$_})).ToLower()

        # Validate that the generated domain key is not already used
        $domainKeyExists = $domainListResponse.value | Where-Object { $_.name -eq $domainKey }

        # Increment retry counter
        $retryCount++
    } while ($domainKeyExists -and $retryCount -lt $maxRetries)

    # If the domain key already exists after max retries, throw an error
    if ($domainKeyExists) {
        Write-Error "The generated domain key already exists after $maxRetries retries."
        exit
    }

    # Define the URL to create a new domain
    $createDomainUrl = "https://$tenantId-api.purview-service.microsoft.com/account/domains/$domainKey`?api-version=2023-12-01-preview"

    $body = @{
        name = $domainKey
        containerType = "Domain"
        friendlyName = $domainName
        description = $domainDescription
    }

    # Create the new domain
    $createDomainResponse = Invoke-RestMethod -UseBasicParsing -Uri $createDomainUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json)

    # List the existing domain policies
    $policyListUrl = "https://$tenantId-api.purview-service.microsoft.com/policystore/domainPolicies?api-version=2023-10-01-preview"
    $policyListResponse = Invoke-RestMethod -Uri $policyListUrl -Headers @{Authorization = "Bearer $token"}

    # Get the policy related to the domain created - name equals "policy_domain_{domainKey}"
    $domainPolicy = $policyListResponse.values | Where-Object { $_.name -eq "policy_domain_$domainKey" }

    # Prompt user to get the user principal name for the administration of the domain
    $adminUserPrincipalName = Read-Host -Prompt 'Enter the user principal name for the administration of the domain'

    # Get the ID of the user to add as an administrator of the domain
    $adminUserId = az ad user show --id $adminUserPrincipalName --query id -o tsv

    # Find the attributeRule with the specified id
    $attributeRule = $domainPolicy.properties.attributeRules | Where-Object { $_.id -eq "purviewdomainrole_builtin_domain-administrator:$domainKey" }

    # Find the conditions with the specified attributeName
    $conditions = $attributeRule.dnfCondition | ForEach-Object { $_ | Where-Object { $_.attributeName -eq "principal.microsoft.id" } }

    # Add the new ID to the attributeValueIncludedIn array for each condition
    foreach ($condition in $conditions) {
        $condition.attributeValueIncludedIn += $adminUserId
    }

    # Update back the attributeRule in the domain policy
    $updatedAttributeRules = $domainPolicy.properties.attributeRules | ForEach-Object {
        if ($_.id -eq "purviewdomainrole_builtin_domain-administrator:$domainKey") {
            $attributeRule
        } else {
            $_
        }
    }

    $domainPolicy.properties.attributeRules = $updatedAttributeRules

    # Convert the domainPolicy object to JSON with proper formatting
    $jsonDomainPolicy = $domainPolicy | ConvertTo-Json -Depth 10 -Compress

    # Update the domain policy
    $domainPolicyId = $domainPolicy.id
    $updatePolicyUrl = "https://$tenantId-api.purview-service.microsoft.com/policystore/domainPolicies/$domainPolicyId`?api-version=2023-10-01-preview"
    $updatePolicyResponse = Invoke-RestMethod -UseBasicParsing -Uri $updatePolicyUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $jsonDomainPolicy
} else {
    # Prompt user to get the domain key of the existing domain to use
    $domainKey = Read-Host -Prompt 'Enter the domain key of the existing domain to use (name property of the domain)'
}
```

2. Under your considered Domain, create a new Collection if needed — for example, it could be for the assets related to a single Dataverse environment.

```powershell
# microsoft-purview-create-collection-if-needed.ps1
# Source: https://gist.github.com/rpothin/a00a5e8e14fbe663ba799d74290adbee
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing collections under the considered domain
$collectionsUrl = "https://$tenantId-api.purview-service.microsoft.com/account/collections?api-version=2023-10-01-preview"
$collectionsResponse = Invoke-RestMethod -Uri $collectionsUrl -Headers @{Authorization = "Bearer $token"}

# Filter the collections to keep only the ones where the parent domain is the domain previously considered
$filteredCollections = $collectionsResponse.value | Where-Object { $_.domain -eq $domainKey }
$filteredCollections

# Prompt the user to ask if they want to create a new collection or if an existing collection should be used
$createNewCollection = Read-Host -Prompt 'Do you want to create a new collection? (Y/N)'

# If the user wants to create a new collection
if ($createNewCollection.ToUpper() -eq "Y") {
    # Prompt user to get the name and description of the new collection
    $collectionName = Read-Host -Prompt 'Enter the name of the new collection'
    $collectionDescription = Read-Host -Prompt 'Enter the description of the new collection'

    # Initialize retry counter
    $retryCount = 0
    $maxRetries = 10

    do {
        # Generate a random 6 characters string - could contain 2 digits - for the collection key and make it lowercase
        $collectionKey = (-join ((65..90) + (97..122) | Get-Random -Count 6 | ForEach-Object {[char]$_})).ToLower()

        # Validate that the generated collection key is not already used
        $collectionKeyExists = $collectionsResponse.value | Where-Object { $_.name -eq $collectionKey }

        # Increment retry counter
        $retryCount++
    } while ($collectionKeyExists -and $retryCount -lt $maxRetries)

    # If the collection key already exists after max retries, throw an error
    if ($collectionKeyExists) {
        Write-Error "The generated collection key already exists after $maxRetries retries."
        exit
    }

    # Define the URL to create a new collection
    $createCollectionUrl = "https://$tenantId-api.purview-service.microsoft.com/account/collections/$collectionKey`?api-version=2023-10-01-preview"

    $body = @{
        name = $collectionKey
        parentCollection = @{
            type = "CollectionReference"
            referenceName = $domainKey
        }
        friendlyName = $collectionName
        description = $collectionDescription
    }

    # Create the new collection
    $createCollectionResponse = Invoke-RestMethod -UseBasicParsing -Uri $createCollectionUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json)

    # Get the collection policy
    $policyUrl = "https://$tenantId-api.purview-service.microsoft.com/policystore/metadataPolicies?collectionName=$collectionKey`&api-version=2021-07-01-preview"
    $policyResponse = Invoke-RestMethod -Uri $policyUrl -Headers @{Authorization = "Bearer $token"}
    $collectionPolicy = $policyResponse.values

    # Prompt user to get the user principal name for the administration of the collection
    $adminUserPrincipalName = Read-Host -Prompt 'Enter the user principal name for the administration of the collection'

    # Get the ID of the user to add as an administrator of the collection
    $adminUserId = az ad user show --id $adminUserPrincipalName --query id -o tsv

    # Find the attributeRule with the specified id
    $attributeRule = $collectionPolicy.properties.attributeRules | Where-Object { $_.id -eq "purviewmetadatarole_builtin_collection-administrator:$collectionKey" }

    # Find the conditions with the specified attributeName
    $conditions = $attributeRule.dnfCondition | ForEach-Object { $_ | Where-Object { $_.attributeName -eq "principal.microsoft.id" } }

    # Add the new ID to the attributeValueIncludedIn array for each condition
    foreach ($condition in $conditions) {
        $condition.attributeValueIncludedIn += $adminUserId
    }

    # Update back the attributeRule in the collection policy
    $updatedAttributeRules = $collectionPolicy.properties.attributeRules | ForEach-Object {
        if ($_.id -eq "purviewmetadatarole_builtin_collection-administrator:$collectionKey") {
            $attributeRule
        } else {
            $_
        }
    }

    $collectionPolicy.properties.attributeRules = $updatedAttributeRules

    # Convert the collectionPolicy object to JSON with proper formatting
    $jsonCollectionPolicy = $collectionPolicy | ConvertTo-Json -Depth 10 -Compress

    # Update the collection policy
    $collectionPolicyId = $collectionPolicy.id
    $updatePolicyUrl = "https://$tenantId-api.purview-service.microsoft.com/policystore/metadataPolicies/$collectionPolicyId`?api-version=2021-07-01-preview"
    $updatePolicyResponse = Invoke-RestMethod -UseBasicParsing -Uri $updatePolicyUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $jsonCollectionPolicy
} else {
    # Prompt user to get the collection key of the existing collection to use
    $collectionKey = Read-Host -Prompt 'Enter the collection key of the existing collection to use (name property of the collection)'
}
```

3. Register the considered Dataverse environment as a Data Source under the considered Collection.

```powershell
# microsoft-purview-register-dataverse-data-source-if-needed.ps1
# Source: https://gist.github.com/rpothin/826724059181fae7d24573c4cca3ceaa
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing Data Sources
$dataSourcesUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/dataSources?api-version=2023-10-01-preview"
$dataSourcesResponse = Invoke-RestMethod -Uri $dataSourcesUrl -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"}

# Filter the Data Sources to keep only the ones where
# - kind is "Dataverse"
# - the Parent collection is the collection previously considered
$filteredDataSources = $dataSourcesResponse.value | Where-Object { 
    $_.kind -eq "Dataverse" -and $_.properties.collection.referenceName -eq $collectionKey 
}
$filteredDataSources | Select-Object name, @{Name="webApiEndpoint"; Expression={$_.properties.webApiEndpoint}}

# Prompt the user to ask if they want to create a new Data Source or if an existing one should be used
$createNewDataSource = Read-Host -Prompt 'Do you want to create a new data source? (Y/N)'

# If the user wants to create a new Data Source
if ($createNewDataSource.ToUpper() -eq "Y") {
    # Prompt user to get the name and full domain name of the considered Power Platform / Dataverse environment (including the suffix like .api.crm.dynamics.com) of the new Dataverse Data Source
    $dataSourceName = Read-Host -Prompt 'Enter the name of the new Dataverse Data Source without spaces'
    $environmentDomain = Read-Host -Prompt 'Enter the full domain name of the Power Platform / Dataverse environment (including the suffix like .api.crm.dynamics.com)'

    # Define the Dataverse API endpoint URL
    $dataverseEnvironmentUrl = "https://$environmentDomain"
    $dataSourceWebApiEndpoint = "$dataverseEnvironmentUrl/api/data/v9.2"

    # Define the URL to create a new Dataverse Data Source
    $createDataSourceUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/dataSources/$dataSourceName`?api-version=2023-10-01-preview"

    $body = @{
        kind = "Dataverse"
        name = $dataSourceName
        properties = @{
            webApiEndpoint = $dataSourceWebApiEndpoint
            collection = @{
                type = "CollectionReference"
                referenceName = $collectionKey
            }
        }
    }

    # Create the new Dataverse Data Source
    $response = Invoke-RestMethod -UseBasicParsing -Uri $createDataSourceUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json)
} else {
    # Prompt user to get the name of the existing Data Source to use
    $dataSourceName = Read-Host -Prompt 'Enter the name of the existing Data Source to use'
}
```

4. Give permissions to the Purview Managed Identity in the Dataverse environment to be able to scan it.

```powershell
# give-microsoft-purview-managed-identity-access-to-dataverse-environment.ps1
# Source: https://gist.github.com/rpothin/cfed79feeb6fe0d6318c271428fab994
# Login to Azure CLI
az login

# Login to Power Platform CLI
pac auth create

# Prompt the user to get the name of the Purview account and the resource group where it is located
$accountName = Read-Host -Prompt 'Enter the name of the Purview account'
$resourceGroupName = Read-Host -Prompt 'Enter the name of the resource group where the Purview account is located'

# Get the object ID of the managed identity of the Purview account
$managedIdentityObjectId = az resource show --name $accountName --resource-group $resourceGroupName --resource-type "Microsoft.Purview/accounts" --query identity.principalId -o tsv

# Get the application ID of the managed identity of the Purview account
$managedIdentityAppId = az ad sp show --id $managedIdentityObjectId --query appId -o tsv

# Prompt the user to get the full domain name of the Power Platform / Dataverse environment
$environmentDomain = Read-Host -Prompt 'Enter the full domain name of the Power Platform / Dataverse environment (including the suffix like .api.crm.dynamics.com)'

# Define the Dataverse API endpoint URL
$dataverseEnvironmentUrl = "https://$environmentDomain"
$dataSourceWebApiEndpoint = "$dataverseEnvironmentUrl/api/data/v9.2"

# Add the managed identity of the Purview account as a user in the Dataverse environment with the Service Reader role
pac admin assign-user --environment $dataverseEnvironmentUrl --user $managedIdentityAppId --role "Service Reader" --application-user

# Get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# Prompt the user to get the name of the scan to create
$scanName = Read-Host -Prompt 'Enter the name of the scan to create'

# Test the connection to the Dataverse environment
$testConnectivityUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans/$scanName/testConnectivity?api-version=2018-12-01-preview"

$body = @{
    scan = @{
        name = $scanName
        kind = "DataverseMsi"
        properties = @{
            webApiEndpoint = $dataSourceWebApiEndpoint
            credential = $null
            scanScopeType = "AutoDetect"
            collection = @{
                type = "CollectionReference"
                referenceName = $collectionKey
            }
        }
    }
}

$response = Invoke-RestMethod -Method Post -Uri $testConnectivityUrl -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 3 -Compress) -StatusCodeVariable statusCode

if ($statusCode -eq 200) {
    Write-Host "Connection test successful." -ForegroundColor Green
} else {
    Write-Host "Connection test failed with status code: $statusCode" -ForegroundColor Red
}
```

5. Configure and run a Scan from the Data Source related to the considered Dataverse environment, selecting the tables previously identified.

```powershell
# microsoft-purview-create-scan-for-dataverse-data-source-if-needed.ps1
# Source: https://gist.github.com/rpothin/be9adc6a8b9b924affc0a81cfcd5d1b9
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing scans
$scansUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans?api-version=2023-09-01"
$scansResponse = Invoke-RestMethod -Uri $scansUrl -Headers @{Authorization = "Bearer $token"}

$scansResponse.value

# Prompt the user to ask if they want to create a new Scan or if an existing one should be used
$createNewScan = Read-Host -Prompt 'Do you want to create a new Scan? (Y/N)'

# If the user wants to create a new Scan
if ($createNewScan.ToUpper() -eq "Y") {
    # Prompt the user to get the name of the scan to create
    $scanName = Read-Host -Prompt 'Enter the name of the scan to create'

    # Prompt the user for the full domain name of the considered Power Platform / Dataverse environment (including the suffix like .api.crm.dynamics.com)
    $environmentDomain = Read-Host -Prompt 'Enter the full domain name of the Power Platform / Dataverse environment (including the suffix like .api.crm.dynamics.com)'

    # Define the Dataverse API endpoint URL
    $dataverseEnvironmentUrl = "https://$environmentDomain"
    $dataSourceWebApiEndpoint = "$dataverseEnvironmentUrl/api/data/v9.2"

    # Test the connection to the Dataverse environment
    $testConnectivityUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans/$scanName/testConnectivity?api-version=2018-12-01-preview"

    $testBody = @{
        scan = @{
            name = $scanName
            kind = "DataverseMsi"
            properties = @{
                webApiEndpoint = $dataSourceWebApiEndpoint
                credential = $null
                scanScopeType = "AutoDetect"
                collection = @{
                    type = "CollectionReference"
                    referenceName = $collectionKey
                }
            }
        }
    }

    $testResponse = Invoke-RestMethod -Method Post -Uri $testConnectivityUrl -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($testBody | ConvertTo-Json -Depth 3 -Compress) -StatusCodeVariable statusCode

    if ($statusCode -eq 200) {
        Write-Host "Connection test successful." -ForegroundColor Green
    } else {
        Write-Host "Connection test failed with status code: $statusCode" -ForegroundColor Red
    }
    
    # Create a new scan
    $createScanUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans/$scanName`?api-version=2023-09-01"

    $createScanBody = @{
        name = $scanName
        kind = "DataverseMsi"
        properties = @{
            webApiEndpoint = $dataSourceWebApiEndpoint
            credential = $null
            scanScopeType = "AutoDetect"
            collection = @{
                type = "CollectionReference"
                referenceName = $collectionKey
            }
        }
        scanRulesetType = "System"
        scanRulesetName = "Dataverse"
    }

    $createScanResponse = Invoke-RestMethod -UseBasicParsing -Uri $createScanUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($createScanBody | ConvertTo-Json)

    # Enumerate the items from the Dataverse Data Source in the context of the new scan
    $enumerateItemsUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans/$scanName/enumerateItems?api-version=2018-12-01-preview"

    $enumerateItemsBody = @{
        scan = @{
            properties = @{
                webApiEndpoint = $dataSourceWebApiEndpoint
                scanRulesetName = "Dataverse"
                scanRulesetType = "System"
                scanScopeType = "AutoDetect"
                collection = @{
                    type = "CollectionReference"
                    referenceName = $collectionKey
                }
                domain = $domainKey
            }
            kind = "DataverseMsi"
            dataSourceName = "environmenta_metadata"
            name = $scanName
            id = "datasources/environmenta_metadata/scans/$scanName"
        }
    }

    $dataverseTables = Invoke-RestMethod -UseBasicParsing -Uri $enumerateItemsUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($enumerateItemsBody | ConvertTo-Json -Depth 3)

    # Define the URI prefixes to include in the filters
    $baseUrl = "$dataverseEnvironmentUrl/"
    $includeUriPrefixes = @($baseUrl) + 
        ($filteredEntityDefinitions | ForEach-Object {
            "$baseUrl$($_.LogicalName.ToLower())"
        })

    # Define the URI prefixes to exclude in the filters
    $excludeUriPrefixes = @($dataverseTables.items | ForEach-Object {
        $_.name
    } | Where-Object {
        $_ -notin $filteredEntityDefinitions.LogicalName
    } | ForEach-Object {
        "$baseUrl$($_.ToLower())"
    })

    # Add filters to the new scan
    $filtersUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans/$scanName/filters/custom?api-version=2018-12-01-preview"

    $filtersBody = @{
        properties = @{
            excludeUriPrefixes = $excludeUriPrefixes
            includeUriPrefixes = $includeUriPrefixes
            excludeRegexes = $null
            includeRegexes = $null
        }
    }

    $filtersResponse = Invoke-RestMethod -UseBasicParsing -Uri $filtersUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($filtersBody | ConvertTo-Json)
} else {
    # Prompt user to get the name of the existing Scan to use
    $scanName = Read-Host -Prompt 'Enter the name of the existing Scan to use'
}
```

```powershell
# microsoft-purview-run-scan-against-data-source.ps1
# Source: https://gist.github.com/rpothin/6897008b21de3b541f84246a64ddb862
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# Run the considered scan
$scanUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans/$scanName/run?api-version=2023-09-01"

$body = @{
    scanLevel = "Full"
}

$response = Invoke-RestMethod -UseBasicParsing -Uri $scanUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json)
```

After a successful scan, you will see schema classifications and sensitivity labels applied to the columns of your scanned Dataverse tables.

> [!TIP]
> Doing these steps in the Microsoft Purview portal is also an option. I just have a preference for code alternatives because it feels more reliable and easier to repeat.

In addition to the availability of scanning Dataverse tables, another crucial capability of Microsoft Purview is examining the available Regulations in the Compliance Manager solution. By applying a filter on Service, you can find regulations relevant to the Dynamics 365 context, and create Assessments to evaluate your compliance against selected regulations.

By maintaining a classified inventory of Dataverse tables and applying sensitivity labels to critical columns, organizations establish a foundation for robust data governance. However, Microsoft Purview has more to offer for enhancing data quality and extending governance capabilities further. This is where the integration of Microsoft Purview with Fabric offers exciting new opportunities.

## Maximizing Microsoft Purview potential for Dataverse leveraging Fabric

Data Quality, under the Unified Catalog solution, is another interesting capability of Microsoft Purview. Unfortunately, Dataverse is not currently on the list of supported data sources for this functionality. However, with Fabric being listed and having a way to easily link Dataverse to OneLake, there is a great opportunity to do more with Dataverse data.

> [!NOTE]
> The focus of this article is not on the integration of Dataverse with Fabric, so I will assume for the next steps that you already have the link in place. If not, you can follow the Microsoft documentation or watch the Dataverse integration with Microsoft Fabric video from Scott Sewell to set up the basics and follow along.

At a high level, the process of onboarding Fabric to Microsoft Purview will be similar to the one we followed above for Dataverse, with some adjustments. Let's take a look.

First, register Fabric as a Data Source under the considered Domain.

```powershell
# microsoft-purview-register-fabric-data-source-if-needed.ps1
# Source: https://gist.github.com/rpothin/f30ee2bae701223502e3643e4491b144
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing Data Sources
$dataSourcesUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/dataSources?api-version=2023-10-01-preview"
$dataSourcesResponse = Invoke-RestMethod -Uri $dataSourcesUrl -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"}

# Filter the Data Sources to keep only the ones where
# - kind is "Fabric"
# - the Parent collection is the domain previously considered - the one above the collections where the Dataverse Data Sources are
$filteredDataSources = $dataSourcesResponse.value | Where-Object { 
    $_.kind -eq "Fabric" -and $_.properties.collection.referenceName -eq $domainKey 
}
$filteredDataSources | Select-Object name, @{Name="tenant"; Expression={$_.properties.tenant}}

# If there is not already a Fabric Data Source, prompt the user to ask if they want to create a new Data Source
if ($filteredDataSources.Count -eq 0) {
    $createNewDataSource = Read-Host -Prompt 'Do you want to create a new data source? (Y/N)'
} else {
    $createNewDataSource = "N"
}

# If the user wants to create a new Data Source
if ($createNewDataSource.ToUpper() -eq "Y") {
    $dataSourceName = "Fabric"

    # Define the URL to create a new Dataverse Data Source
    $createDataSourceUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/dataSources/$dataSourceName`?api-version=2023-10-01-preview"

    $body = @{
        kind = "Fabric"
        name = $dataSourceName
        properties = @{
            tenant = $tenantId
            collection = @{
            type = "CollectionReference"
            referenceName = $domainKey
            }
        }
    }

    # Create the new Fabric Data Source
    $response = Invoke-RestMethod -UseBasicParsing -Uri $createDataSourceUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 3)
} else {
    # Prompt user to get the name of the existing Data Source to use
    $dataSourceName = Read-Host -Prompt 'Enter the name of the existing Data Source to use'
}
```

Then configure Microsoft Purview to scan a Fabric workspace:

> [!NOTE]
> Initially I planned to leverage the Purview account managed identity to run Data Map scans. Unfortunately, it seems in our context (Fabric shortcut for Dataverse) a service principal is required for Data Map scans, while the Purview account managed identity must be used for Data Quality scans.
>
> Additionally, to scan Fabric workspaces from Microsoft Purview, certain permissions need to be configured in Fabric for the relevant identities.
>
> Lastly, and importantly, 'metadata harvest for Fabric' still appears to be in preview.

Configure a service principal with access to Fabric for Data Map scans:

```powershell
# microsoft-purview-service-principal-connection-to-microsoft-fabric.ps1
# Source: https://gist.github.com/rpothin/7111d2d2b21d47535f8fc38bb17f289d
# Login to Azure CLI
az login

# Prompt the user to ask if they want to create a new security group to manage the access of the Purview account managed identity to the Power BI / Fabric Admin API
$createNewSecurityGroup = Read-Host -Prompt 'Do you want to create a new security group to manage the access of the Purview account managed identity to the Power BI / Fabric Admin API? (Y/N)'

# If the user wants to create a new security group
if ($createNewSecurityGroup.ToUpper() -eq "Y") {
    # Prompt user to get the name and the description of the security group to create in Entra ID (aka Azure AD)
    $securityGroupName = Read-Host -Prompt 'Enter the name of the security group to create in Entra ID (aka Azure AD)'
    $securityGroupDescription = Read-Host -Prompt 'Enter the description of the security group to create in Entra ID (aka Azure AD)'

    # Create the security group in Entra ID (aka Azure AD) using Azure CLI
    az ad group create --display-name $securityGroupName --description $securityGroupDescription --mail-nickname $securityGroupName --query objectId -o tsv
} else {
    # Prompt user to get the name and object ID of the existing security group to use in Entra ID (aka Azure AD)
    $securityGroupName = Read-Host -Prompt 'Enter the name of the existing security group to use in Entra ID (aka Azure AD)'
}

# Prompt the user to ask if they want to create a service principal for the Fabric scans from Power BI
$createServicePrincipal = Read-Host -Prompt 'Do you want to create a service principal for the Fabric scans from Power BI? (Y/N)'

# If the user wants to create a service principal
if ($createServicePrincipal.ToUpper() -eq "Y") {
    # Prompt the user for the name of the service principal that will be used for Fabric scans from Power BI
    $servicePrincipalName = Read-Host -Prompt 'Enter the name of the service principal that will be used for Fabric scans from Power BI'

    # Create a new service principal in Entra ID (aka Azure AD) using Azure CLI and get its application id
    $servicePrincipalAppId = az ad sp create-for-rbac --name $servicePrincipalName --query appId -o tsv
} else {
    # Prompt the user for the name of the existing service principal that will be used for Fabric scans from Power BI
    $servicePrincipalName = Read-Host -Prompt 'Enter the name of the existing service principal that will be used for Fabric scans from Power BI'

    # Get the application id of the existing service principal
    $servicePrincipalAppId = az ad sp list --display-name $servicePrincipalName --query "[0].appId" -o tsv
}

# Generate a secret for the service principal
$servicePrincipalSecret = az ad sp credential reset --id $servicePrincipalAppId --query password -o tsv

# Get the object id of the service principal 
$servicePrincipalObjectId = az ad sp show --id $servicePrincipalAppId --query id -o tsv

# Add the service principal to the security group in Entra ID (aka Azure AD) using Azure CLI
az ad group member add --group $securityGroupName --member-id $servicePrincipalObjectId

# Prompt the user to ask if they want to create a Key Vault to store the secret
$createKeyVault = Read-Host -Prompt 'Do you want to create a Key Vault to store the secret? (Y/N)'

# If the user wants to create a Key Vault
if ($createKeyVault.ToUpper() -eq "Y") {
    # Prompt the user for the name of a Key Vault to store the secret and the resource group where the Key Vault will be created
    $keyVaultName = Read-Host -Prompt 'Enter the name of the Key Vault to store the secret'
    $resourceGroupName = Read-Host -Prompt 'Enter the name of the resource group where the Key Vault will be created'

    # Create a new Key Vault in the specified resource group using Azure CLI
    az keyvault create --name $keyVaultName --resource-group $resourceGroupName
} else {
    # Prompt the user for the name of the existing Key Vault where the secret will be stored
    $keyVaultName = Read-Host -Prompt 'Enter the name of the existing Key Vault where the secret will be stored'
}

# Assign to the logged in user the role "Key Vault Secrets Officer" on the Key Vault
$scope = az keyvault show --name $keyVaultName --query id -o tsv
$assigneeObjectId = az ad signed-in-user show --query id -o tsv
az role assignment create --role "Key Vault Secrets Officer" --assignee-object-id $assigneeObjectId --scope $scope

# Prompt the user to get the name of the Purview account and the resource group where it is located
$accountName = Read-Host -Prompt 'Enter the name of the Purview account'
$resourceGroupName = Read-Host -Prompt 'Enter the name of the resource group where the Purview account is located'

# Get the object ID of the managed identity of the Purview account
$managedIdentityObjectId = az resource show --name $accountName --resource-group $resourceGroupName --resource-type "Microsoft.Purview/accounts" --query identity.principalId -o tsv

# Add the Purview account managed identity to the security group in Entra ID (aka Azure AD) using Azure CLI
az ad group member add --group $securityGroupName --member-id $managedIdentityObjectId

# Assign to the managed identity of the Purview account the role "Key Vault Secrets User" on the Key Vault
az role assignment create --role "Key Vault Secrets User" --assignee-object-id $managedIdentityObjectId --scope $scope

# Add the secret of the service principal to the Key Vault
$setKeyVaultSecret = az keyvault secret set --vault-name $keyVaultName --name "FabricScanServicePrincipalSecret" --value $servicePrincipalSecret

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# Define the URL to create a Key Vault connection in Purview
$keyVaultConnectionCreationUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/azureKeyVaults/$keyVaultName`?api-version=2023-10-01-preview"

$body = @{
    name = $keyVaultName
    properties = @{
      description = ""
      baseUrl = "https://$keyVaultName.vault.azure.net/"
      domain = @{
        type = "DomainReference"
        referenceName = $domainKey
      }
    }
}

# Create a Key Vault connection in Purview
$keyVaultConnection = Invoke-RestMethod -UseBasicParsing -Uri $keyVaultConnectionCreationUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json)

# Define the URL to create credentials for the service principal in Purview
$credentialsCreationUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/credentials/FabricScansServicePrincipal?api-version=2023-10-01-preview"

$body = @{
    name = "FabricScansServicePrincipal"
    properties = @{
      description = ""
      typeProperties = @{
        tenant = $tenantId
        servicePrincipalId = $servicePrincipalAppId
        servicePrincipalKey = @{
          type = "AzureKeyVaultSecret"
          secretName = "FabricScanServicePrincipalSecret"
          secretVersion = ""
          store = @{
            referenceName = $keyVaultName
            type = "LinkedServiceReference"
          }
        }
      }
      domain = @{
        type = "DomainReference"
        referenceName = $domainKey
      }
    }
    kind = "ServicePrincipal"
}

# Create credentials for the service principal in Purview
$credentials = Invoke-RestMethod -UseBasicParsing -Uri $credentialsCreationUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 4)

# Check if the MicrosoftPowerBIMgmt PowerShell module is installed, and if not, install it
# https://learn.microsoft.com/en-us/powershell/module/microsoftpowerbimgmt.workspaces
if (-not (Get-Module -Name MicrosoftPowerBIMgmt -ListAvailable)) {
    Install-Module -Name MicrosoftPowerBIMgmt -Force -AllowClobber
    Import-Module -Name MicrosoftPowerBIMgmt
} else {
    Import-Module -Name MicrosoftPowerBIMgmt
}

# Connect to the Power BI service
Connect-PowerBIServiceAccount

# Prompt the user for the name of the workspace to consider
$workspaceName = Read-Host -Prompt 'Enter the name of the workspace to consider'

# Get the workspace id from its name
$workspaceId = (Get-PowerBIWorkspace -Name $workspaceName).Id

# Add the service principal to the workspace as a Contributor
# Adding the group to the Contributor role of the workspace does not seem to be reliable - I personally got errors running scans in Purview after adding the group to the Contributor role and had to add the managed identity directly to make it work
Add-PowerBIWorkspaceUser -Id $workspaceId -AccessRight Contributor -PrincipalType App -Identifier $servicePrincipalObjectId

# Add the managed identity of the Purview account to the Contributor role of the workspace
# Adding the group to the Contributor role of the workspace does not seem to be reliable - I personally got errors running scans in Purview after adding the group to the Contributor role and had to add the managed identity directly to make it work
Add-PowerBIWorkspaceUser -Id $workspaceId -AccessRight Contributor -PrincipalType App -Identifier $managedIdentityObjectId
```

Configure the Purview account managed identity with access to Fabric for Data Quality scans:

```powershell
# adding-purview-account-managed-identity-to-security-group-and-give-viewer-access-to-fabric-workspace.ps1
# Source: https://gist.github.com/rpothin/66b438a97439addfac04cb2ca9e757d8
# Login to Azure CLI
az login

# Prompt the user to ask if they want to create a new security group to manage the access of the Purview account managed identity to the Power BI / Fabric Admin API
$createNewSecurityGroup = Read-Host -Prompt 'Do you want to create a new security group to manage the access of the Purview account managed identity to the Power BI / Fabric Admin API? (Y/N)'

# If the user wants to create a new security group
if ($createNewSecurityGroup.ToUpper() -eq "Y") {
    # Prompt user to get the name and the description of the security group to create in Entra ID (aka Azure AD)
    $securityGroupName = Read-Host -Prompt 'Enter the name of the security group to create in Entra ID (aka Azure AD)'
    $securityGroupDescription = Read-Host -Prompt 'Enter the description of the security group to create in Entra ID (aka Azure AD)'

    # Create the security group in Entra ID (aka Azure AD) using Azure CLI
    az ad group create --display-name $securityGroupName --description $securityGroupDescription --mail-nickname $securityGroupName --query objectId -o tsv
} else {
    # Prompt user to get the name and object ID of the existing security group to use in Entra ID (aka Azure AD)
    $securityGroupName = Read-Host -Prompt 'Enter the name of the existing security group to use in Entra ID (aka Azure AD)'
}

# Prompt the user to get the name of the Purview account and the resource group where it is located
$accountName = Read-Host -Prompt 'Enter the name of the Purview account'
$resourceGroupName = Read-Host -Prompt 'Enter the name of the resource group where the Purview account is located'

# Get the object ID of the managed identity of the Purview account
$managedIdentityObjectId = az resource show --name $accountName --resource-group $resourceGroupName --resource-type "Microsoft.Purview/accounts" --query identity.principalId -o tsv

# Add the Purview account managed identity to the security group in Entra ID (aka Azure AD) using Azure CLI
az ad group member add --group $securityGroupName --member-id $managedIdentityObjectId

# The rest of the identified Fabric settings - adding the group to each one - will have to be done in the Fabric Admin portal (https://app.fabric.microsoft.com/admin-portal/tenantSettings)
# Unfortunately, I did not find a way to automate this part using APIs captured in the browser network tab

# Get the ID of the considered security group in Entra ID (aka Azure AD)
$securityGroupId = az ad group show --group $securityGroupName --query id -o tsv

# Check if the MicrosoftPowerBIMgmt PowerShell module is installed, and if not, install it
# https://learn.microsoft.com/en-us/powershell/module/microsoftpowerbimgmt.workspaces
if (-not (Get-Module -Name MicrosoftPowerBIMgmt -ListAvailable)) {
    Install-Module -Name MicrosoftPowerBIMgmt -Force -AllowClobber
    Import-Module -Name MicrosoftPowerBIMgmt
} else {
    Import-Module -Name MicrosoftPowerBIMgmt
}

# Connect to the Power BI service
Connect-PowerBIServiceAccount

# Prompt the user for the name of the workspace to consider
$workspaceName = Read-Host -Prompt 'Enter the name of the workspace to consider'

# Get the workspace id from its name
$workspaceId = (Get-PowerBIWorkspace -Name $workspaceName).Id

# Add the managed identity of the Purview account to the Contributor role of the workspace
# Adding the group to the Contributor role of the workspace does not seem to be reliable - I personally got errors running scans in Purview after adding the group to the Contributor role and had to add the managed identity directly to make it work
Add-PowerBIWorkspaceUser -Id $workspaceId -AccessRight Contributor -PrincipalType App -Identifier $managedIdentityObjectId
```

Configure and run a Data Map scan for the Fabric Data Source by selecting the Workspace with the Lakehouse related to the considered Dataverse environment (capability currently in Preview).

```powershell
# microsoft-purview-create-scan-for-fabric-data-source-if-needed.ps1
# Source: https://gist.github.com/rpothin/869c133d2352b888ef589c49f2635e09
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing scans
$scansUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans?api-version=2023-09-01"
$scansResponse = Invoke-RestMethod -Uri $scansUrl -Headers @{Authorization = "Bearer $token"}

$scansResponse.value

# Prompt the user to ask if they want to create a new Scan or if an existing one should be used
$createNewScan = Read-Host -Prompt 'Do you want to create a new Scan? (Y/N)'

# If the user wants to create a new Scan
if ($createNewScan.ToUpper() -eq "Y") {
    # Prompt the user to get the name of the scan to create
    $scanName = Read-Host -Prompt 'Enter the name of the scan to create'

    # Test the connection to Fabric
    $testConnectivityUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans/$scanName/testConnectivity?api-version=2018-12-01-preview"

    $testBody = @{
        scan = @{
          name = $scanName
          kind = "FabricCredential"
          properties = @{
            includePersonalWorkspaces = $false
            credential = @{
              referenceName = "FabricScansServicePrincipal"
              credentialType = "ServicePrincipal"
            }
            collection = @{
              type = "CollectionReference"
              referenceName = $collectionKey
            }
          }
        }
    }

    $testResponse = Invoke-RestMethod -Method Post -Uri $testConnectivityUrl -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($testBody | ConvertTo-Json -Depth 3 -Compress) -StatusCodeVariable statusCode

    if ($statusCode -eq 200) {
        Write-Host "Connection test successful." -ForegroundColor Green
    } else {
        Write-Host "Connection test failed with status code: $statusCode" -ForegroundColor Red
    }
    
    # Create a new scan
    $createScanUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans/$scanName`?api-version=2023-09-01"

    $createScanBody = @{
        name = $scanName
          kind = "FabricCredential"
          properties = @{
            includePersonalWorkspaces = $false
            credential = @{
              referenceName = "FabricScansServicePrincipal"
              credentialType = "ServicePrincipal"
            }
            collection = @{
              type = "CollectionReference"
              referenceName = $collectionKey
            }
        }
    }

    $createScanResponse = Invoke-RestMethod -UseBasicParsing -Uri $createScanUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($createScanBody | ConvertTo-Json -Depth 3)

    # List available workspaces in Fabric
    $workspacesUrl = "https://$tenantId-api.purview-service.microsoft.com/catalog/api/browse?api-version=2022-11-03"

    $workspacesBody = @{
      navigationMode = "assetType"
      itemPath = @{
        path = "fabric_workspace"
      }
      connectionProperties = @{
        dataSource = @{
          dataSourceType = "Fabric"
          tenant = $tenantId
          host = "api.powerbi.com"
        }
        credential = @{
          referenceName = "FabricScansServicePrincipal"
          credentialType = "ServicePrincipal"
        }
      }
      properties = @{
        scopeMode = "Admin"
        includePersonalWorkspaces = $false
        isScopeScan = $true
      }
      top = 5000
    }

    $workspacesResponse = Invoke-RestMethod -Method Post -Uri $workspacesUrl -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($workspacesBody | ConvertTo-Json -Depth 3)
    $workspaces = $workspacesResponse.items | Select-Object name, @{Name="itemPath"; Expression={$_.itemPath.path}}, @{Name="fullPath"; Expression={"$($_.type)/$($_.itemPath.path)"}}
    $workspaces

    # Prompt the user to ask the name of the workspace to scan
    $workspaceName = Read-Host -Prompt 'Enter the name of the workspace to scan'

    # Get the full path of the workspace
    $workspaceFullPath = ($workspaces | Where-Object { $_.name -eq $workspaceName }).fullPath

    # Add filters to the new scan
    $filtersUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$($dataSourceName.ToLower())/scans/$scanName/filters/custom?api-version=2023-10-01-preview"

    $filtersBody = @{
        properties = @{
            excludeUriPrefixes = @()
            includeUriPrefixes = @()
            includeItemPaths = @( $workspaceFullPath )
        }
    }

    $filtersResponse = Invoke-RestMethod -UseBasicParsing -Uri $filtersUrl -Method "PUT" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($filtersBody | ConvertTo-Json)
} else {
    # Prompt user to get the name of the existing Scan to use
    $scanName = Read-Host -Prompt 'Enter the name of the existing Scan to use'
}
```

```powershell
# microsoft-purview-run-incremental-scan-against-data-source.ps1
# Source: https://gist.github.com/rpothin/52d3ffa22c4e5b4627f3a17c011e24c7
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# Run the considered scan
$scanUrl = "https://$tenantId-api.purview-service.microsoft.com/scan/datasources/$dataSourceName/scans/$scanName/run?api-version=2023-09-01"

$body = @{
    scanLevel = "Incremental"
}

$response = Invoke-RestMethod -UseBasicParsing -Uri $scanUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json)
```

> [!NOTE]
> As mentioned in the Microsoft documentation, classification and labelling are not currently supported for the Fabric Data Source. It is why from my perspective it is interesting to consider a combination with the Dataverse Data Source to benefit from more Microsoft Purview capabilities.

Once the Fabric assets related to the considered Dataverse environment are ready in the Data Map solution of Microsoft Purview, we can switch to the Unified Catalog solution where we will be able to set up the monitoring of the quality of our data:

1. Set up a Governance domain if needed.

```powershell
# microsoft-purview-create-business-domain-if-needed.ps1
# Source: https://gist.github.com/rpothin/6ffbfb3e4d241359ba1104a52ff480a7
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing business domains
$businessDomainListUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/catalog/businessdomains"
$businessDomainListResponse = Invoke-RestMethod -Uri $businessDomainListUrl -Headers @{Authorization = "Bearer $token"}
$businessDomainListResponse.value | Select-Object id, name, type, description

# Prompt the user to ask if they want to create a new business domain or if an existing business domain should be used
$createNewBusinessDomain = Read-Host -Prompt 'Do you want to create a new business domain? (Y/N)'

# If the user wants to create a new business domain
if ($createNewBusinessDomain.ToUpper() -eq "Y") {
    # Prompt user to get the name, type and description of the new business domain
    $businessDomainName = Read-Host -Prompt 'Enter the name of the new business domain'
    $businessDomainDescription = Read-Host -Prompt 'Enter the description of the new business domain'

    # Allowed values for the type of the business domain: FunctionalUnit, LineOfBusiness, Regulatory, DataDomain and Project
    # While the provided value is not in the allowed values, prompt the user to enter a valid value in a limit of 3 retries
    # If the user does not provide a valid value after 3 retries, throw an error
    $allowedBusinessDomainTypes = @("FunctionalUnit", "LineOfBusiness", "Regulatory", "DataDomain", "Project")
    $retryCount = 0
    $maxRetries = 3

    do {
        $businessDomainType = Read-Host -Prompt 'Enter the type of the new business domain (FunctionalUnit, LineOfBusiness, Regulatory, DataDomain, Project)'

        $retryCount++
    } while ($businessDomainType -notin $allowedBusinessDomainTypes -and $retryCount -lt $maxRetries)

    # Define the URL to create a new business domain
    $createBusinessDomainUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/catalog/businessdomains"

    $body = @{
        status = "Draft"
        name = $businessDomainName
        description = "<div>$businessDomainDescription</div>"
        type = $businessDomainType
    }

    # Create the new business domain
    $createBusinessDomainResponse = Invoke-RestMethod -UseBasicParsing -Uri $createBusinessDomainUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json)

    # Get the id of the new business domain
    $businessDomainId = $createBusinessDomainResponse.id
} else {
    # Prompt user to get the business domain id of the existing business domain to use
    $businessDomainId = Read-Host -Prompt 'Enter the id of the existing business domain to use'
}
```

2. Set up a Data product under the considered Governance domain if needed.

```powershell
# microsoft-purview-create-data-product-if-needed.ps1
# Source: https://gist.github.com/rpothin/a71892a2c4805cec335ba848fc4cbbd5
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing data products
$dataProductListUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/catalog/dataproducts"
$dataProductListResponse = Invoke-RestMethod -Uri $dataProductListUrl -Headers @{Authorization = "Bearer $token"}
$dataProductListResponse.value | Select-Object id, name, type, domain, description, businessUse

# Prompt the user to ask if they want to create a new data product or if an existing data product should be used
$createNewDataProduct = Read-Host -Prompt 'Do you want to create a new data product? (Y/N)'

# If the user wants to create a new data product
if ($createNewDataProduct.ToUpper() -eq "Y") {
    # Validate that the domain id is set to avoid creating an orphan data product, and throw an error if it is not set
    if (-not $businessDomainId) {
        throw "The business domain id is not set. Please select an existing business domain or create a new one."
    }

    # Prompt user to get the details of the new data product
    $dataProductName = Read-Host -Prompt 'Enter the name of the new data product'
    $dataProductDescription = Read-Host -Prompt 'Enter the description of the new data product'
    $dataProductBusinessUse = Read-Host -Prompt 'Enter the business use of the new data product'

    # Prompt user to get the user principal name (UPN) of the owner of the new data product
    $dataProductOwner = Read-Host -Prompt 'Enter the user principal name (UPN) of the owner of the new data product'

    # Get the id of the owner of the new data product using Azure CLI
    $dataProductOwnerId = az ad user show --id $dataProductOwner --query id -o tsv

    # Allowed values for the type of the data product: Dataset, MasterDataAndReferenceData, BusinessSystemOrApplication, ModelTypes, DashboardsOrReports and Operational 
    # While the provided value is not in the allowed values, prompt the user to enter a valid value in a limit of 3 retries
    # If the user does not provide a valid value after 3 retries, throw an error
    $allowedDataProductTypes = @( "Dataset", "MasterDataAndReferenceData", "BusinessSystemOrApplication", "ModelTypes", "DashboardsOrReports", "Operational" )
    $retryCount = 0
    $maxRetries = 3

    do {
        $dataProductType = Read-Host -Prompt 'Enter the type of the new data product (Dataset, MasterDataAndReferenceData, BusinessSystemOrApplication, ModelTypes, DashboardsOrReports, Operational)'

        $retryCount++
    } while ($dataProductType -notin $allowedDataProductTypes -and $retryCount -lt $maxRetries)

    # Define the URL to create a new data product
    $createDataProductUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/catalog/dataproducts"

    $body = @{
        name = $dataProductName
        domain = $businessDomainId
        type = $dataProductType
        audience = @()
        description = "<div>$dataProductDescription</div>"
        businessUse = "<div>$dataProductBusinessUse</div>"
        contacts = @{
            owner = @(
                @{
                    id = $dataProductOwnerId
                    description = "Creator"
                }
            )
            expert = @()
            databaseAdmin = @()
        }
        termsOfUse = @()
        documentation = @()
        status = "Draft"
    }

    # Create the new data product
    $createDataProductResponse = Invoke-RestMethod -UseBasicParsing -Uri $createDataProductUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 3)

    # Get the id of the new data product
    $dataProductId = $createDataProductResponse.id
} else {
    # Prompt user to get the data product id of the existing data product to use
    $dataProductId = Read-Host -Prompt 'Enter the id of the existing data product to use'
}
```

3. In the considered Data Product, add the Lakehouse tables related to the considered Dataverse environment you want to analyze as data assets.

```powershell
# microsoft-purview-add-lakehouse-table-as-data-asset-under-data-product.ps1
# Source: https://gist.github.com/rpothin/209793bd211d366df7e679979a24593b
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the available Lakehouse Tables
$dataAssetListUrl = "https://$tenantId-api.purview-service.microsoft.com/catalog/api/search/query?api-version=2023-02-01-preview&includeTermHierarchy=false"

# Prompt the user for keywords to search for Lakehouse Tables
$keywords = Read-Host -Prompt 'Enter keywords to search for Lakehouse Tables'

$body = @{
  keywords = $keywords
  filter = @{
    and = @(
      @{ or = @(@{ assetType = "Fabric" }) }
      @{ or = @(@{ entityType = "fabric_lakehouse_table" }) }
      @{
        not = @{
          or = @(
            @{ attributeName = "size"; operator = "eq"; attributeValue = 0 }
            @{ attributeName = "fileSize"; operator = "eq"; attributeValue = 0 }
          )
        }
      }
      @{ not = @{ classification = "MICROSOFT.SYSTEM.TEMP_FILE" } }
      @{
        not = @{
          or = @(
            @{ entityType = "AtlasGlossaryTerm" }
            @{ entityType = "AtlasGlossary" }
          )
        }
      }
    )
  }
  limit = 50
  offset = 0
  facets = @(
    @{ facet = "assetType"; count = 0; sort = @{ count = "desc" } }
    @{ facet = "collectionId"; count = 10; sort = @{ count = "desc" } }
    @{ facet = "classification"; count = 11; sort = @{ count = "desc" } }
    @{ facet = "sensitiveInfoType"; count = 10; sort = @{ count = "desc" } }
    @{ facet = "contactId"; count = 10; sort = @{ count = "desc" } }
    @{ facet = "entityType"; count = 0; sort = @{ count = "desc" } }
    @{ facet = "termGuid"; count = 10; sort = @{ count = "desc" } }
    @{ facet = "tag"; count = 0; sort = @{ count = "desc" } }
    @{ facet = "sensitivityLabelId"; count = 10; sort = @{ count = "desc" } }
  )
  taxonomySetting = @{
    assetTypes = @("Fabric")
    facet = @{ count = 10; sort = @{ count = "desc" } }
  }
  enableRankingFunction = $false
}

$dataAssetListResponse = Invoke-RestMethod -UseBasicParsing -Uri $dataAssetListUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 6)
$dataAssetListResponse.value | Select-Object id, displayText, qualifiedName, domainId, collectionId

# Prompt the user for the id of the asset to consider for the new data asset under the considered data product
$dataAssetId = Read-Host -Prompt 'Enter the id of the Lakehouse Table to consider for the new data asset under the considered data product'

# Get the details of the Lakehouse Table
$selectedDataAssetDetails = $dataAssetListResponse.value | Where-Object id -eq $dataAssetId
$selecteDataAssetRootPath = $selectedDataAssetDetails.qualifiedName -replace "https://app.fabric.microsoft.com/groups/", "https://onelake.dfs.fabric.microsoft.com//" -replace "/lakehouses/", "/" -replace "/tables/", "/Tables/"

## Schema
$selectedDataAssetSchema = @()
$selectedDataAssetReferredEntities = "https://$tenantId-api.purview-service.microsoft.com/catalog/api/atlas/v2/entity/bulk?excludeRelationshipTypes=dataset_process_inputs&excludeRelationshipTypes=process_dataset_outputs&excludeRelationshipTypes=process_parent&excludeRelationshipTypes=direct_lineage_dataset_dataset&guid=$dataAssetId&includeTermsInMinExtInfo=true&minExtInfo=true"

$selectedDataAssetReferredEntitiesResponse = Invoke-RestMethod -UseBasicParsing -Uri $selectedDataAssetReferredEntities -Method "GET" -Headers @{Authorization = "Bearer $token"}
$selectedDataAssetReferredEntities = $selectedDataAssetReferredEntitiesResponse.referredEntities

foreach ($referredEntity in $selectedDataAssetReferredEntities.PSObject.Properties) {
  $referredEntityAttributes = $referredEntity.Value.attributes
  $selectedDataAssetSchema += @{
    name = $referredEntityAttributes.name
    description = ""
    classifications = @()
    type = $referredEntityAttributes.dataType
  }
}

## Lineage
$selectedDataAssetLineageResponse = "https://$tenantId-api.purview-service.microsoft.com/catalog/api/atlas/v2/lineage/$dataAssetId`?direction=BOTH&forceNewApi=true&includeParent=true&width=6&getDerivedLineage=false"
$selectedDataAssetLineageResponse = Invoke-RestMethod -UseBasicParsing -Uri $selectedDataAssetLineageResponse -Method "GET" -Headers @{Authorization = "Bearer $token"}
$selectedDataAssetLineageResponse.PSObject.Properties.Remove('childrenCount')
$selectedDataAssetLineage = $selectedDataAssetLineageResponse

# Prompt the user to get the name of the considered Purview account
$accountName = Read-Host -Prompt 'Enter the name of the Purview account'

# Prompt the user to get the user principal name (UPN) of the owner of the new data asset
$dataAssetOwner = Read-Host -Prompt 'Enter the user principal name (UPN) of the owner of the new data asset'

# Get the id of the owner of the new data asset using Azure CLI
$dataAssetOwnerId = az ad user show --id $dataAssetOwner --query id -o tsv

# Create a new data asset under the considered data product with the details of the Lakehouse Table
$createDataAssetUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/catalog/dataassets"

$body = @{
  key = $dataAssetId
  name = $selectedDataAssetDetails.name
  description = ""
  descriptionStripped = ""
  source = @{
    type = "PurviewDataMap"
    fqn = $selectedDataAssetDetails.qualifiedName
    accountName = $accountName
    assetId = $dataAssetId
    assetType = $selectedDataAssetDetails.entityType
    assetAttributes = @{
      rootPath = $selecteDataAssetRootPath
    }
  }
  contacts = @{
    owner = @(
      @{
        id = $dataAssetOwnerId
      }
    )
    expert = @()
    databaseAdmin = @()
  }
  classifications = @()
  type = "General"
  typeProperties = @{}
  schema = $selectedDataAssetSchema
  lineage = $selectedDataAssetLineage
}

$createDataAssetResponse = Invoke-RestMethod -UseBasicParsing -Uri $createDataAssetUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 9)

# Get the id of the new data asset
$createdDataAssetId = $createDataAssetResponse.id

# Create the relationship between the considered data product and the new data asset
$createDataProductDataAssetRelationshipUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/catalog/dataproducts/$dataProductId/relationships?entityType=DataAsset"

$body = @{
  entityId = $createdDataAssetId
  description = ""
  relationshipType = "Related"
}

$createDataProductDataAssetRelationshipResponse = Invoke-RestMethod -UseBasicParsing -Uri $createDataProductDataAssetRelationshipUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json)
```

```powershell
# microsoft-purview-add-lakehouse-semantic-model-as-data-asset-under-data-product.ps1
# Source: https://gist.github.com/rpothin/0e624786fcd2d8f2b1306081ccfd83be
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the available Lakehouse Semantic Models
$lakehouseSemanticModelListUrl = "https://$tenantId-api.purview-service.microsoft.com/catalog/api/search/query?api-version=2023-02-01-preview&includeTermHierarchy=false"

$body = @{
  keywords = $null
  filter = @{
    and = @(
      @{ or = @(@{ assetType = "Fabric" }) }
      @{ or = @(@{ objectType = "Tables" }) }
      @{
        not = @{
          or = @(
            @{ attributeName = "size"; operator = "eq"; attributeValue = 0 }
            @{ attributeName = "fileSize"; operator = "eq"; attributeValue = 0 }
          )
        }
      }
      @{ not = @{ classification = "MICROSOFT.SYSTEM.TEMP_FILE" } }
      @{
        not = @{
          or = @(
            @{ entityType = "AtlasGlossaryTerm" }
            @{ entityType = "AtlasGlossary" }
          )
        }
      }
    )
  }
  limit = 25
  offset = 0
  facets = @(
    @{ facet = "assetType"; count = 0; sort = @{ count = "desc" } }
    @{ facet = "collectionId"; count = 10; sort = @{ count = "desc" } }
    @{ facet = "classification"; count = 11; sort = @{ count = "desc" } }
    @{ facet = "sensitiveInfoType"; count = 10; sort = @{ count = "desc" } }
    @{ facet = "contactId"; count = 10; sort = @{ count = "desc" } }
    @{ facet = "entityType"; count = 0; sort = @{ count = "desc" } }
    @{ facet = "termGuid"; count = 10; sort = @{ count = "desc" } }
    @{ facet = "tag"; count = 0; sort = @{ count = "desc" } }
    @{ facet = "sensitivityLabelId"; count = 10; sort = @{ count = "desc" } }
  )
  taxonomySetting = @{
    assetTypes = @("Fabric")
    facet = @{ count = 10; sort = @{ count = "desc" } }
  }
  enableRankingFunction = $false
}

$dataProductListResponse = Invoke-RestMethod -UseBasicParsing -Uri $lakehouseSemanticModelListUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 6)
$dataProductListResponse.value | Select-Object id, displayText, qualifiedName, domainId, collectionId

# Prompt the user for the id of the Lakehouse Semantic Model to consider for the new data asset under the considered data product
$lakehouseSemanticModelId = Read-Host -Prompt 'Enter the id of the Lakehouse Semantic Model to consider for the new data asset under the considered data product'

# Get the details of the Lakehouse Semantic Model
$lakehouseSemanticModelDetailsUrl = "https://$tenantId-api.purview-service.microsoft.com/catalog/api/atlas/v2/lineage/$lakehouseSemanticModelId`?direction=BOTH&forceNewApi=true&includeParent=true&width=6&getDerivedLineage=false"

$lakehouseSemanticModelDetailsResponse = Invoke-RestMethod -Uri $lakehouseSemanticModelDetailsUrl -Headers @{Authorization = "Bearer $token"}

# Prompt the user to get the name of the considered Purview account
$accountName = Read-Host -Prompt 'Enter the name of the Purview account'

# Prompt the user to get the user principal name (UPN) of the owner of the new data asset
$dataAssetOwner = Read-Host -Prompt 'Enter the user principal name (UPN) of the owner of the new data asset'

# Get the id of the owner of the new data asset using Azure CLI
$dataAssetOwnerId = az ad user show --id $dataAssetOwner --query id -o tsv

# Create a new data asset under the considered data product with the details of the Lakehouse Semantic Model
$createDataAssetUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/catalog/dataassets"

$body = @{
  key = $lakehouseSemanticModelId
  name = $dataProductListResponse.value | Where-Object { $_.id -eq $lakehouseSemanticModelId } | Select-Object -ExpandProperty displayText
  description = ""
  descriptionStripped = ""
  source = @{
    type = "PurviewDataMap"
    fqn = $dataProductListResponse.value | Where-Object { $_.id -eq $lakehouseSemanticModelId } | Select-Object -ExpandProperty qualifiedName
    accountName = $accountName
    assetId = $lakehouseSemanticModelId
    assetType = $dataProductListResponse.value | Where-Object { $_.id -eq $lakehouseSemanticModelId } | Select-Object -ExpandProperty entityType
  }
  contacts = @{
    owner = @(
      @{
        id = $dataAssetOwnerId
      }
    )
    expert = @()
    databaseAdmin = @()
  }
  classifications = @()
  schema = @()
  type = "General"
  typeProperties = @{}
  lineage = $lakehouseSemanticModelDetailsResponse
}

$createDataAssetResponse = Invoke-RestMethod -UseBasicParsing -Uri $createDataAssetUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 6)

# Get the id of the new data asset
$dataAssetId = $createDataAssetResponse.id

# Create the relationship between the considered data product and the new data asset
$createDataProductDataAssetRelationshipUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/catalog/dataproducts/$dataProductId/relationships?entityType=DataAsset"

$body = @{
  entityId = $dataAssetId
  description = ""
  relationshipType = "Related"
}

$createDataProductDataAssetRelationshipResponse = Invoke-RestMethod -UseBasicParsing -Uri $createDataProductDataAssetRelationshipUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json)
```

4. Set up a connection to Fabric for your Governance domain to be able to run Data Quality scans.

```powershell
# microsoft-purview-create-new-fabric-connection-if-needed.ps1
# Source: https://gist.github.com/rpothin/6fbfab215faf6b48766b9f819b14ec2f
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing data sources for the considered business domain
$dataSourcesUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/data-sources"
$dataSourcesResponse = Invoke-RestMethod -Uri $dataSourcesUrl -Headers @{Authorization = "Bearer $token"}
$dataSourcesResponse.value | Where-Object { $_.type -eq "OneLake" }

# Prompt the user to ask if they want to create a new data source or if an existing data source should be used
$createNewDataSource = Read-Host -Prompt 'Do you want to create a new connection? (Y/N)'

# If the user wants to create a new data source
if ($createNewDataSource.ToUpper() -eq "Y") {
    # Prompt user to get the details of the new data source
    $dataSourceName = Read-Host -Prompt 'Enter the name of the new connection'
    $dataSourceDescription = Read-Host -Prompt 'Enter the description of the new connection'

    # Define the URL to test the connectivity to Fabric
    $connectivityTestUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/datasource-connectivity"

    $body = @{
        datasource = @{
            businessDomain = @{
                referenceId = $businessDomainId
                type = "BusinessDomainReference"
            }
            name = $dataSourceName
            # Id is the name without spaces
            id = $dataSourceName -replace " ", ""
            type = "OneLake"
            credential = @{
                type = "ManagedServiceIdentity"
                typeProperties = @{
                    scopes = @(
                    @{
                        scope = @{
                        type = "OneLake"
                        includes = @()
                        }
                    }
                    )
                }
            }
            typeProperties = @{
            tenantId = $tenantId
            }
        }
    }

    # Test the connectivity to Fabric
    try {
        Invoke-RestMethod -UseBasicParsing -Uri $connectivityTestUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 7)
        Write-Host "Connection test successful." -ForegroundColor Green
    } catch {
        Write-Host "Connection test failed with status: $($connectivityTestResponse.status)" -ForegroundColor Red
        throw "Connection test failed."
    }

    # Define the URL to create a new data source
    $createDataSourceUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/data-sources?performAdditionalRoleChecks=true"

    $body = @{
        businessDomain = @{
            referenceId = $businessDomainId
            type = "BusinessDomainReference"
        }
        name = $dataSourceName
        id = $dataSourceName -replace " ", ""
        type = "OneLake"
        credential = @{
            type = "ManagedServiceIdentity"
            typeProperties = @{
            scopes = @(
                @{
                scope = @{
                    type = "OneLake"
                    includes = @()
                }
                }
            )
            }
        }
        description = $dataSourceDescription
        typeProperties = @{
            tenantId = $tenantId
        }
    }

    # Create the new data source
    $createDataSourceResponse = Invoke-RestMethod -UseBasicParsing -Uri $createDataSourceUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 7)

    # Get the id of the new data source
    $dataSourceId = $createDataSourceResponse.id
} else {
    # Prompt user to get the data source id of the existing data source to use
    $dataSourceId = Read-Host -Prompt 'Enter the id of the existing data source to use'
}
```

```powershell
# microsoft-purviw-create-connection-to-fabric-for-data-quality-scans.ps1
# Source: https://gist.github.com/rpothin/63681b13e39942c5caa998ebde368788
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing data sources for the considered business domain
$dataSourcesUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/data-sources"
$dataSourcesResponse = Invoke-RestMethod -Uri $dataSourcesUrl -Headers @{Authorization = "Bearer $token"}
$dataSourcesResponse.value | Where-Object { $_.type -eq "OneLake" }

# Prompt the user to ask if they want to create a new data source or if an existing data source should be used
$createNewDataSource = Read-Host -Prompt 'Do you want to create a new connection? (Y/N)'

# If the user wants to create a new data source
if ($createNewDataSource.ToUpper() -eq "Y") {
    # Prompt user to get the details of the new data source
    $dataSourceName = Read-Host -Prompt 'Enter the name of the new connection'
    $dataSourceDescription = Read-Host -Prompt 'Enter the description of the new connection'

    # Define the URL to test the connectivity to Fabric
    $connectivityTestUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/datasource-connectivity"

    $body = @{
        datasource = @{
            businessDomain = @{
                referenceId = $businessDomainId
                type = "BusinessDomainReference"
            }
            name = $dataSourceName
            id = $dataSourceName -replace " ", ""
            type = "OneLake"
            credential = @{
                type = "ManagedServiceIdentity"
                typeProperties = @{
                    scopes = @(
                    @{
                        scope = @{
                        type = "OneLake"
                        includes = @()
                        }
                    }
                    )
                }
            }
            typeProperties = @{
            tenantId = $tenantId
            }
        }
    }

    # Test the connectivity to Fabric
    try {
        Invoke-RestMethod -UseBasicParsing -Uri $connectivityTestUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 7)
        Write-Host "Connection test successful." -ForegroundColor Green
    } catch {
        Write-Host "Connection test failed with status: $($connectivityTestResponse.status)" -ForegroundColor Red
        throw "Connection test failed."
    }

    # Define the URL to create a new data source
    $createDataSourceUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/data-sources?performAdditionalRoleChecks=true"

    $body = @{
        businessDomain = @{
            referenceId = $businessDomainId
            type = "BusinessDomainReference"
        }
        name = $dataSourceName
        id = $dataSourceName -replace " ", ""
        type = "OneLake"
        credential = @{
            type = "ManagedServiceIdentity"
            typeProperties = @{
            scopes = @(
                @{
                scope = @{
                    type = "OneLake"
                    includes = @()
                }
                }
            )
            }
        }
        description = $dataSourceDescription
        typeProperties = @{
            tenantId = $tenantId
        }
    }

    # Create the new data source
    $createDataSourceResponse = Invoke-RestMethod -UseBasicParsing -Uri $createDataSourceUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 7)

    # Get the id of the new data source
    $dataSourceId = $createDataSourceResponse.id
} else {
    # Prompt user to get the data source id of the existing data source to use
    $dataSourceId = Read-Host -Prompt 'Enter the id of the existing data source to use'
}
```

5. Define Data Quality rules — such as checking for empty/blank fields — on the data assets.

```powershell
# microsoft-purview-add-data-quality-rule-to-data-asset.ps1
# Source: https://gist.github.com/rpothin/7950817cdb7c804b8c64b875b776f0d2
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# List the existing Data Quality rule for the considered data product
$dataQualityRulesUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/data-products/$dataProductId/data-assets/$createdDataAssetId/global-rules"
$dataQualityRulesResponse = Invoke-RestMethod -Uri $dataQualityRulesUrl -Headers @{Authorization = "Bearer $token"}
$dataQualityRulesResponse | Select-Object id, name, type, typeProperties | ConvertTo-Json -Depth 4

# Prompt the user to ask if they want to create a new Data Quality rule
$createNewDataQualityRule = Read-Host -Prompt 'Do you want to create a new Data Quality rule? (Y/N)'

# If the user wants to create a new Data Quality rule
if ($createNewDataQualityRule.ToUpper() -eq "Y") {
    # Prompt the user to select the type of the new Data Quality rule
    $allowedDataQualityRuleTypes = @("Timeliness", "Duplicate", "NotNull", "Unique", "TypeMatch", "Regex")
    $allowedDataQualityRuleTypesString = $allowedDataQualityRuleTypes -join ", "
    $retryCount = 0
    $maxRetries = 3

    do {
        $prompt = "Enter the type of the new Data Quality rule ($allowedDataQualityRuleTypesString)"
        $dataQualityRuleType = Read-Host -Prompt $prompt

        $retryCount++
    } while ($dataQualityRuleType -notin $allowedDataQualityRuleTypes -and $retryCount -lt $maxRetries)

    # Definition of the variables for the configuration of the rule depending on the type using a switch statement
    switch ($dataQualityRuleType) {
        "Timeliness" {
            $timeDifferenceInMilliseconds = Read-Host -Prompt 'Enter the time difference in milliseconds to consider knowing that 1 month = 2592000000 milliseconds'
            $dataQualityRuleName = "Freshness"
            $dataQualityRuleTypeProperties = @{
                timeDifference = [long]$timeDifferenceInMilliseconds
            }
        }
        "Duplicate" {
            $dataQualityRuleColumns = Read-Host -Prompt 'Enter the logical name of the columns separated by a comma to consider for duplicates checking'
            $dataQualityRuleColumnsString = $dataQualityRuleColumns -split "," -join "_"
            $dataQualityRuleName = "Duplicate_rows_$dataQualityRuleColumnsString"
            $dataQualityRuleTypeProperties = @{
                columns = @()
            }
            $dataQualityRuleColumns -split "," | ForEach-Object {
                $dataQualityRuleTypeProperties.columns += @{
                    type = "Column"
                    value = $_
                }
            }
        }
        "NotNull" {
            $dataQualityRuleColumn = Read-Host -Prompt 'Enter the logical name of the column that should not be empty'
            $dataQualityRuleName = "Empty/blank_fields_$dataQualityRuleColumn"
            $dataQualityRuleTypeProperties = @{
                column = @{
                    type = "Column"
                    value = $dataQualityRuleColumn
                }
            }
        }
        "Unique" {
            $dataQualityRuleColumn = Read-Host -Prompt 'Enter the logical name of the column that should contain unique values'
            $dataQualityRuleName = "Unique_values_$dataQualityRuleColumn"
            $dataQualityRuleTypeProperties = @{
                column = @{
                    type = "Column"
                    value = $dataQualityRuleColumn
                }
            }
        }
        "TypeMatch" {
            $dataQualityRuleColumn = Read-Host -Prompt 'Enter the logical name of the column that should match the expected data type'
            $dataQualityRuleName = "Data_type_match_$dataQualityRuleColumn"
            $dataQualityRuleTypeProperties = @{
                column = @{
                    type = "Column"
                    value = $dataQualityRuleColumn
                }
            }
        }
        "Regex" {
            $dataQualityRuleColumn = Read-Host -Prompt 'Enter the logical name of the column that should match the regular expression'
            $dataQualityRuleRegex = Read-Host -Prompt 'Enter the regular expression to match'
            $dataQualityRuleName = "String_format_match_$dataQualityRuleColumn"
            $dataQualityRuleTypeProperties = @{
                column = @{
                    type = "Column"
                    value = $dataQualityRuleColumn
                }
                pattern = $dataQualityRuleRegex
            }
        }
    }

    # Define the URL to create a new Data Quality rule
    $createDataQualityRuleUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/data-products/$dataProductId/data-assets/$createdDataAssetId/global-rules"

    $body = @{
        id = [guid]::NewGuid().ToString()
        name = $dataQualityRuleName
        description = ""
        type = $dataQualityRuleType
        status = "Active"
        typeProperties = $dataQualityRuleTypeProperties
        businessDomain = @{
            referenceId = $businessDomainId
            type = "BusinessDomainReference"
        }
        dataProduct = @{
            referenceId = $dataProductId
            type = "DataProductReference"
        }
        dataAsset = @{
            referenceId = $createdDataAssetId
            type = "DataAssetReference"
        }
    }

    # Create the new Data Quality rule
    $createDataQualityRuleResponse = Invoke-RestMethod -UseBasicParsing -Uri $createDataQualityRuleUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 4)
}
```

6. Run a Data Quality Scan for the considered Dataverse table.

```powershell
# microsoft-purview-run-data-quality-scan.ps1
# Source: https://gist.github.com/rpothin/8129ae1a1b9be6a403cc3ef214da6dc4
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# Trigger a Data Quality scan for the considered Data Asset
$triggerDataQualityScanUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/data-products/$dataProductId/data-assets/$createdDataAssetId/observations"

$body = @{
    datasetToDatasourceMappings = @(
        @{
            datasetAliasName = $createDataAssetResponse.name
            datasourceId = $dataSourceId
        }
    )
}

$triggerDataQualityScanResponse = Invoke-RestMethod -UseBasicParsing -Uri $triggerDataQualityScanUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 4)
```

7. Analyze the result of the scan and the quality of your data.

And if you don't know where to start regarding the rules for the Data Quality scans, Microsoft Purview also offers a capability to profile data in a Data Asset and get insights to help decide how Data Quality scans should be configured.

```powershell
# microsoft-purview-profile-data.ps1
# Source: https://gist.github.com/rpothin/e98cc1b54bfcf2bb305a13160180bfda
# Login to Azure CLI
az login

# Using Azure CLI get the ID of the current tenant
$tenantId = az account show --query tenantId -o tsv
Write-Host "Tenant ID: $tenantId"

# Get a token for Microsoft Purview API
$token = az account get-access-token --resource "https://purview.azure.net" --query accessToken -o tsv

# Get columns suggestions for the considered Data Asset
$columnsSuggestionsUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/data-products/$dataProductId/data-assets/$createdDataAssetId/profiles/config/suggestions?dataSourceId=$dataSourceId"

$columnsSuggestionsResponse = Invoke-RestMethod -Uri $columnsSuggestionsUrl -Headers @{Authorization = "Bearer $token"}

$keyColumns = @()

# If columns suggested
if ($columnsSuggestionsResponse.keyColumns) {
    # Present suggested columns
    $columnsSuggestionsResponse.keyColumns | Select-Object name

    # Prompt the user to ask if they would like to profile data from the suggested columns
    $profileSuggestedColumns = Read-Host -Prompt 'Do you want to profile data from the suggested columns? (Y/N)'

    # If the user wants to profile data from the suggested columns
    if ($profileSuggestedColumns.ToUpper() -eq "Y") {
        # Define the key columns as an array of object with only one property - name
        foreach ($keyColumn in $columnsSuggestionsResponse.keyColumns) {
            $keyColumns += @{
                name = $keyColumn.name
            }
        }
    }
}

# If no column suggested or the user does not want to profile data from the suggested columns
if (-not $keyColumns) {
    # Prompt the user to enter the names of the columns to profile
    $keyColumn = Read-Host -Prompt 'Enter the logical name of the columns to profile separated by a comma'

    $keyColumn -split "," | ForEach-Object {
        $keyColumns += @{
            name = $_
        }
    }
}

# Check before moving forward
if (-not $keyColumns) {
    throw "No columns to profile."
}

# Define the URL to profile data from the suggested columns
$profileDataUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/data-products/$dataProductId/data-assets/$createdDataAssetId/profiles"

# Get the file system and folder path of the data source
$dataSourceMetadataUrl = "https://$tenantId-api.purview-service.microsoft.com/datagovernance/quality/business-domains/$businessDomainId/data-products/$dataProductId/data-assets/$createdDataAssetId/asset-metadata"
$dataSourceMetadataResponse = Invoke-RestMethod -Uri $dataSourceMetadataUrl -Headers @{Authorization = "Bearer $token"}

# Define the body considering the following schema
$body = @{
    type = "Delta"
    typeProperties = $dataSourceMetadataResponse.typeProperties.inputDatasets[0].dataset.typeProperties
    dataSourceId = $dataSourceId
    configuration = @{
        keyColumns = $keyColumns
    }
}

# Profile data from the suggested columns
$profileDataResponse = Invoke-RestMethod -UseBasicParsing -Uri $profileDataUrl -Method "POST" -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body ($body | ConvertTo-Json -Depth 4)
```

The insights gathered following this track will enable you to plan actions to improve your data quality state in Dataverse, which will have multiple beneficial impacts — from the quality of the service to your customers to the efficiency of the AI applications leveraging Dataverse data as knowledge.

## Purview's watch extended from data to AI activity

When it comes to proactively monitoring AI activity in your organization, the Data Security Posture Management for AI (DSPM for AI) solution within Microsoft Purview is, in my perspective, an essential component to include in your toolkit. With Copilot Studio being one way to contribute Microsoft Copilot Experiences by building agents, the associated activities will be surfaced in DSPM for AI. As a Power Platform professional, understanding the insights this Microsoft Purview solution provides can help you ensure the safe and secure adoption of custom-built agents within your organization.

> [!NOTE]
> Due to limited activity in my tenant and a lack of access to Microsoft 365 Copilot, I cannot provide homemade visuals of this solution. However, I found a great segment focusing on AI protection in the "Data Security Posture Management (DSPM), new to Microsoft Purview" video by Microsoft Mechanics — I encourage you to watch it to discover DSPM for AI.

The Get Started section of the Overview page of the DSPM solution offers guidance on how to properly secure AI activity using Microsoft Purview, particularly the installation of the Microsoft Purview Compliance browser extension which "collects signals that help you detect" when browsing and sharing sensitive data with AI websites.

The Reports page of DSPM AI offers diagrams to help you track AI adoption, identify insider risks, and understand how AI is used to detect potentially risky behaviors that require attention. These visuals allow you to form hypotheses about AI activity within your organization.

Once you have identified trends from the Reports section, you will be able to dive deeper by exploring the activity logs under Activity Explorer to confirm your hypotheses and track the efficiency of your remediations.

Currently, the experience in DSPM for AI seems mainly focused on users' interactions with AI. The future will tell us if this approach will adapt to the era of autonomous agents.

Microsoft Purview can empower Power Platform professionals to secure and govern Dataverse data effectively, contributing to the groundwork for robust security and compliance strategies. By leveraging features such as sensitivity labeling, data classification, and integrations with tools like Fabric for data quality monitoring, organizations can ensure that their Power Platform applications remain secure while supporting innovative business processes.

As organizations advance their use of AI through agents built with Copilot Studio, the Microsoft Purview Data Security Posture Management (DSPM) solution becomes increasingly crucial. Currently, DSPM focuses on user interactions with AI. However, its evolution must encompass monitoring and governance of autonomous agents, ensuring robust safeguards in this emerging landscape.

Microsoft Purview Audit solution is part of a path that will lead us to Microsoft Sentinel. In my next article, I will guide you in the exploration of this other important component from the Microsoft ecosystem to improve your security posture.

---

### Power Platform's Protection series

1. [Power Platform's protection — Azure AD Conditional Access](/archive/power-platform-protection/01-azure-ad-conditional-access)
2. [Power Platform's protection — Defender for Cloud Apps](/archive/power-platform-protection/02-defender-for-cloud-apps)
3. [Power Platform's protection — Platform internal capabilities](/archive/power-platform-protection/03-platform-internal-capabilities)
4. [Power Platform's protection — Microsoft Purview Compliance](/archive/power-platform-protection/04-microsoft-purview-compliance)
5. [Power Platform's protection — Virtual Network integration](/archive/power-platform-protection/05-virtual-network-integration)
6. [Power Platform's protection — Managed Identity for Dataverse plug-ins](/archive/power-platform-protection/06-managed-identity-for-dataverse-plug-ins)
7. [Power Platform's Protection — Building secure and responsible Generative AI solutions](/archive/power-platform-protection/07-building-secure-and-responsible-generative-ai-solutions)
8. **Power Platform's Protection — Microsoft Purview the data guardian** ← _you are here_
9. [Power Platform's Protection — Microsoft Sentinel, the watchtower](/archive/power-platform-protection/09-microsoft-sentinel-the-watchtower)
