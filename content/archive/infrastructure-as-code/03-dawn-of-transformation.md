---
title: "The Power Platform Infrastructure as Code journey — Dawn of transformation"
date: 2024-07-19
tags:
  [power-platform, infrastructure-as-code, terraform, dlp-policies, governance]
description: "Maya pushes DLP policy changes from code into Power Platform, converts existing policies to Terraform variable files, and discovers the critical 'terraform import' step needed to onboard already-managed resources without duplicates."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/the-power-platform-infrastructure-as-code-journey-dawn-of-transformation"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

We find Maya standing before her team, a mix of anticipation and determination in her eyes. She's about to unveil her latest breakthrough — a glimpse of what the Terraform provider for Power Platform could enable them to achieve regarding how they manage Data Loss Prevention (DLP) policies.

Her colleagues lean forward, intrigued. Maya's progress has been nothing short of remarkable, achieved in a very short time. They exchange excited glances, recognizing the potential impact of her work. The room buzzes with energy as they listen to her presentation.

"Maya," one of her teammates says, "this could change everything for us. Imagine the efficiency gains, the consistency, and the ability to scale beyond manual configurations."

![Maya presenting her progress on her experimentation and getting support from her team](/content/archive/infrastructure-as-code/03-maya-presenting-progress.jpeg)

"Absolutely," another chimes in. "But we must tread carefully. Breaking an existing DLP policy — even unintentionally — could have serious consequences for the business."

Maya nods, absorbing their feedback. She knows that transitioning to infrastructure as code won't be a simple flip of a switch. It's not just about the technical aspects, it's about winning hearts and minds. She'll need a strategy — a compelling case — to gain buy-in from her peers and management.

Armed with determination and a repository containing the configuration of their existing DLP policies, Maya prepares for the next phase of her experimentation. The journey won't be easy, but she's ready to bridge the gap between code and policy, one line at a time.

## From code to Power Platform

In the first phase of her experimentation, Maya was able to export DLP policies configuration from Power Platform to a source code repository. Now, her focus shifts — she aims to seamlessly push configuration changes from the repository to Power Platform.

As she thinks about the organization of the configuration of the DLP policies within the code, Maya faces a choice. Terraform variable definitions files (tfvars) offer flexibility, but their usage requires thoughtful consideration:

- She ponders whether to consolidate the configuration of all DLP policies into a single file. This approach leaves no room for ambiguity — every detail resides in one place. However, she worries about the file becoming unmanageable as the adoption of Power Platform grows in the organization and potentially also the number of DLP policies to manage.
- On the other hand, she considers isolating each DLP policy's configuration in dedicated files within a clearly identified folder. This approach ensures scalability without undue complexity. Yet, she wonders how to pinpoint the right file for a specific change — a naming convention could help but her team would need to be rigorous.

Adding to the complexity, DLP policy configuration can be intricate. The three available buckets — business, non-business, and blocked — along with custom connectors and their deeper configuration options (endpoints and actions) occupy Maya's thoughts.

After taking the time to reflect, she decides to start with the following considerations:

- one Terraform variable definitions file (tfvars) per DLP policy
- code acting as an abstraction layer that simplifies the configuration, focusing solely on the business bucket — the other two buckets being deduced dynamically

Maya felt lucky finding that one of the GitHub repositories identified during her previous research — rpothin/PowerPlatform-Governance-With-Terraform — seems to have exactly what she is looking for:

**Terraform configuration to manage a Power Platform DLP policy** (`power-platform-dlp-policy-main.tf`):

```hcl
// power-platform-dlp-policy-main.tf
// Source: https://gist.github.com/rpothin/7b101789c4d7d7954c9a005e653ecfaf
terraform {
  required_providers {
    powerplatform = {
      source  = "microsoft/power-platform"
      version = "2.5.0-preview"
    }
  }

  backend "azurerm" {
    use_oidc = true
  }
}

provider "powerplatform" {
  use_oidc = true
}

data "powerplatform_connectors" "all_connectors" {}

resource "powerplatform_data_loss_prevention_policy" "policy" {
  display_name                      = var.display_name
  default_connectors_classification = "Blocked"
  environment_type                  = var.environment_type
  environments                      = var.environments

  business_connectors     = var.business_connectors

  # Dynamically generate non-business connectors based on the business connectors specified
  non_business_connectors = [for conn in data.powerplatform_connectors.all_connectors.connectors : {
    id                           = conn.id
    name                         = conn.name
    default_action_rule_behavior = ""
    action_rules                 = [],
    endpoint_rules               = []
  } if conn.unblockable == true && !contains([for bus_conn in var.business_connectors : bus_conn.id], conn.id)]

  # Dynamically generate blocked connectors based on the business connectors specified
  blocked_connectors      = [for conn in data.powerplatform_connectors.all_connectors.connectors : {
    id                           = conn.id
    default_action_rule_behavior = ""
    action_rules                 = [],
    endpoint_rules               = []
  } if conn.unblockable == false && !contains([for bus_conn in var.business_connectors : bus_conn.id], conn.id)]

  custom_connectors_patterns = var.custom_connectors
}
```

**Input variables declaration** (`power-platform-dlp-policy-variables.tf`):

```hcl
// power-platform-dlp-policy-variables.tf
// Source: https://gist.github.com/rpothin/8c6bca6b945a15595672e94b79c38bed
# Define variables for the DLP policy configuration, including the business connectors group.
variable "display_name" {
  description = "The display name of the DLP policy."
  type        = string
}

variable "environment_type" {
  description = "Default environment handling for the policy (AllEnvironments, ExceptEnvironments, OnlyEnvironments)."
  type        = string
  default     = "OnlyEnvironments"
}

variable "environments" {
  description = "A list of environment IDs to apply the DLP policy to."
  type        = list(string)
}

variable "business_connectors" {
  description = "A set of business connectors configurations."
  type        = set(object({
    id                           = string
    default_action_rule_behavior = string
    action_rules                 = list(object({
      action_id = string
      behavior  = string
    }))
    endpoint_rules               = list(object({
      behavior = string
      endpoint = string
      order    = number
    }))
  }))
}

variable "custom_connectors" {
  description = "A set of custom connectors configurations."
  type        = set(object({
    order            = number
    host_url_pattern = string
    data_group       = string
  }))
}
```

**Example Terraform variable definitions file** (`power-platform-dlp-policy-example.tfvars`):

```hcl
// power-platform-dlp-policy-example.tfvars
// Source: https://gist.github.com/rpothin/a432b1f5a98542a0a64b75f7d116362a
display_name = "Example 1"
environment_type = "OnlyEnvironments"
environments = ["Default-7e7df62f-7cc4-4e63-a250-a277063e1be7"]

business_connectors = [
  {
    id = "/providers/Microsoft.PowerApps/apis/shared_sql"
    default_action_rule_behavior = "Allow"
    action_rules = [
      {
        action_id = "DeleteItem_V2"
        behavior = "Block"
      },
      {
        action_id = "ExecutePassThroughNativeQuery_V2"
        behavior = "Block"
      }
    ]
    endpoint_rules = [
      {
        behavior = "Allow"
        endpoint = "contoso.com"
        order = 1
      },
      {
        behavior = "Deny"
        endpoint = "*"
        order = 2
      }
    ]
  },
  {
    id = "/providers/Microsoft.PowerApps/apis/shared_approvals"
    default_action_rule_behavior = ""
    action_rules = []
    endpoint_rules = []
  },
  {
    id = "/providers/Microsoft.PowerApps/apis/shared_cloudappsecurity"
    default_action_rule_behavior = ""
    action_rules = []
    endpoint_rules = []
  }
]

custom_connectors = [
  {
    order = 1
    host_url_pattern = "https://*.contoso.com"
    data_group = "Blocked"
  },
  {
    order = 2
    host_url_pattern = "*"
    data_group = "Ignore"
  }
]
```

**GitHub workflow to plan and apply the Terraform configuration** (`terraform-plan-apply.yml`):

```yaml
# terraform-plan-apply.yml
# Source: https://gist.github.com/rpothin/16255fb2742735ec689fdea4a080b6f0
name: terraform-plan-apply
# Plan and apply a terraform configuration

# Workflow triggered mannually passing the terraform configuration and the terraform variable file
on:
  workflow_dispatch:
    inputs:
      terraform_configuration:
        type: choice
        description: "The name of the Terraform configuration to plan and apply"
        required: true
        options:
          - dlp-policies
          - billing-policies
      terraform_var_file:
        type: string
        description: "The name of the Terraform variable file to use"
        required: true

# Concurrency configuration for the current workflow - Keep only the latest workflow queued for the considered group
concurrency:
  group: terraform-plan-apply-${{ github.event.inputs.terraform_configuration }}-${{ github.event.inputs.terraform_var_file }}
  cancel-in-progress: true

run-name: Plan and apply ${{ github.event.inputs.terraform_configuration }} with ${{ github.event.inputs.terraform_var_file }} by @${{ github.actor }}

# Set up permissions for deploying with secretless Azure federated credentials
# https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure?tabs=azure-portal%2Clinux#set-up-azure-login-with-openid-connect-authentication
permissions:
  id-token: write
  contents: read

#These environment variables are used by the terraform azure provider to setup OIDD authenticate.
env:
  ARM_TENANT_ID: "${{ secrets.AZURE_TENANT_ID }}"
  ARM_CLIENT_ID: "${{ secrets.AZURE_CLIENT_ID }}"
  ARM_SUBSCRIPTION_ID: "${{ secrets.AZURE_SUBSCRIPTION_ID }}"
  POWER_PLATFORM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
  POWER_PLATFORM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
  TARGET_DIR: ${{ github.workspace }}/src/${{ github.event.inputs.terraform_configuration }}
  TF_STATE_RESOURCE_GROUP_NAME: ${{ secrets.TF_STATE_RESOURCE_GROUP_NAME }}
  TF_STATE_STORAGE_ACCOUNT_NAME: ${{ secrets.TF_STATE_STORAGE_ACCOUNT_NAME }}
  TF_STATE_CONTAINER_NAME: ${{ secrets.TF_STATE_CONTAINER_NAME }}
  TF_STATE_KEY: ${{ github.event.inputs.terraform_configuration }}-${{ github.event.inputs.terraform_var_file }}.terraform.tfstate
  TF_VAR_FILE: tfvars/${{ github.event.inputs.terraform_var_file }}.tfvars
  TF_CLI_CONFIG_FILE: ${{ github.workspace }}/src/mirror.tfrc
  ARM_SKIP_PROVIDER_REGISTRATION: true #this is needed since we are running terraform with read-only permissions

jobs:
  terraform-plan:
    name: "Terraform Plan"
    runs-on: ubuntu-latest
    outputs:
      tfplanExitCode: ${{ steps.tf-plan.outputs.exitcode }}

    steps:
      # Action used to checkout the main branch in the current repository
      #   Community action: https://github.com/actions/checkout
      - name: Checkout
        uses: actions/checkout@v4.1.1

      # Install the latest version of the Terraform CLI
      #   Community action: https://github.com/hashicorp/setup-terraform
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_wrapper: false

      # Log in to Azure using the Azure login action and with OpenID Connect (OIDC) federated credentials
      #  Community action: https://github.com/Azure/login
      - name: Log in with Azure (Federated Credentials)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      # Download the Terraform Power Platform provider from GitHub
      - name: Download Terraform Power Platform Provider
        env:
          GITHUB_TOKEN: ${{ secrets.PAT_DOWNLOAD_RELEASE }}
          PROVIDER_VERSION: ${{ vars.POWER_PLATFORM_PROVIDER_VERSION }}
          PROVIDER_REPO: ${{ vars.POWER_PLATFORM_PROVIDER_REPOSITORY }}
          DOWNLOAD_DIR: /usr/share/terraform/providers/registry.terraform.io/microsoft/power-platform
        run: |
          gh release download "$PROVIDER_VERSION" --repo "$PROVIDER_REPO" --pattern "*.zip" --dir "$DOWNLOAD_DIR" --clobber
          ls -la "$DOWNLOAD_DIR"

      # Initialize a new or existing Terraform working directory by creating initial files, loading any remote state, downloading modules, etc.
      - name: Terraform Init
        run: terraform -chdir=$TARGET_DIR init -backend-config="storage_account_name=$TF_STATE_STORAGE_ACCOUNT_NAME" -backend-config="resource_group_name=$TF_STATE_RESOURCE_GROUP_NAME" -backend-config="container_name=$TF_STATE_CONTAINER_NAME" -backend-config="key=$TF_STATE_KEY"

      # Run terraform validate to check the syntax of the configuration files
      - name: Terraform Validate
        run: terraform -chdir=$TARGET_DIR validate

      # Generates an execution plan for Terraform
      # An exit code of 0 indicated no changes, 1 a terraform failure, 2 there are pending changes.
      - name: Terraform Plan
        id: tf-plan
        run: |
          export exitcode=0
          terraform -chdir=$TARGET_DIR plan -detailed-exitcode -no-color -out tfplan -var-file=$TF_VAR_FILE || export exitcode=$?

          echo "exitcode=$exitcode" >> $GITHUB_OUTPUT

          if [ $exitcode -eq 1 ]; then
            echo Terraform Plan Failed!
            exit 1
          else 
            exit 0
          fi

      # Save plan to artifacts
      #   Community action: https://github.com/actions/upload-artifact
      - name: Publish Terraform Plan
        uses: actions/upload-artifact@v4.3.1
        with:
          name: tfplan
          path: ${{ env.TARGET_DIR }}/tfplan

  terraform-apply:
    name: "Terraform Apply"
    needs: [terraform-plan]
    if: github.ref == 'refs/heads/main' && needs.terraform-plan.outputs.tfplanExitCode == 2
    runs-on: ubuntu-latest

    steps:
      # Action used to checkout the main branch in the current repository
      #   Community action: https://github.com/actions/checkout
      - name: Checkout
        uses: actions/checkout@v4.1.1

      # Install the latest version of the Terraform CLI
      #   Community action: https://github.com/hashicorp/setup-terraform
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_wrapper: false

      # Log in to Azure using the Azure login action and with OpenID Connect (OIDC) federated credentials
      #  Community action: https://github.com/Azure/login
      - name: Log in with Azure (Federated Credentials)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      # Download the Terraform Power Platform provider from GitHub
      - name: Download Terraform Power Platform Provider
        env:
          GITHUB_TOKEN: ${{ secrets.PAT_DOWNLOAD_RELEASE }}
          PROVIDER_VERSION: ${{ vars.POWER_PLATFORM_PROVIDER_VERSION }}
          PROVIDER_REPO: ${{ vars.POWER_PLATFORM_PROVIDER_REPOSITORY }}
          DOWNLOAD_DIR: /usr/share/terraform/providers/registry.terraform.io/microsoft/power-platform
        run: |
          gh release download "$PROVIDER_VERSION" --repo "$PROVIDER_REPO" --pattern "*.zip" --dir "$DOWNLOAD_DIR" --clobber
          ls -la "$DOWNLOAD_DIR"

      # Initialize a new or existing Terraform working directory by creating initial files, loading any remote state, downloading modules, etc.
      - name: Terraform Init
        run: terraform -chdir=$TARGET_DIR init -backend-config="storage_account_name=$TF_STATE_STORAGE_ACCOUNT_NAME" -backend-config="resource_group_name=$TF_STATE_RESOURCE_GROUP_NAME" -backend-config="container_name=$TF_STATE_CONTAINER_NAME" -backend-config="key=$TF_STATE_KEY"

      # Download saved plan from artifacts
      #   Community action: https://github.com/actions/download-artifact
      - name: Download Terraform Plan
        uses: actions/download-artifact@v4.1.4
        with:
          name: tfplan
          path: ${{ env.TARGET_DIR }}

      # Terraform Apply
      - name: Terraform Apply
        run: terraform -chdir=$TARGET_DIR apply -auto-approve tfplan
```

Maya sets up everything to create a first DLP policy swiftly. The GitHub workflow performs like a well-oiled machine, deploying a fresh DLP policy with the expected configuration in mere minutes. She's astounded by its efficiency.

![Maya really happy with the result of her first DLP policy deployment with Terraform](/content/archive/infrastructure-as-code/03-maya-happy-dlp-deployment.jpeg)

And then, fueled by curiosity, Maya adds another connector — found in what seems to be an up-to-date extract of connectors available in the platform from the same GitHub repository. The deployment goes flawlessly. She laughs — a contagious, triumphant sound — leaving her colleagues wondering if she's worked too hard or simply discovered the magic of code.

## Converting exported DLP policies into reusable infrastructure as code

In recent days, Maya achieved two critical milestones: she successfully moved existing DLP policies into a source code repository and began managing new DLP policies through code. However, a crucial piece remains missing: how to convert these exported DLP policies into a format that could be effectively managed using Terraform.

Once again, the rpothin/PowerPlatform-Governance-With-Terraform GitHub repository came to her aid, offering a polyglot notebook specifically designed to transform existing DLP policies into valid Terraform variable definitions files.

In the polyglot notebook Maya discovered, a PowerShell code block performs precisely these tasks:

```powershell
# convert-existing-dlp-policies-to-tfvars.ps1
# Source: https://gist.github.com/rpothin/a90f95d0be12c2fa673de00945ba51d7
# Extract exsiting DLP policies
$existingDlpPoliciesFileContent = Get-Content '../src/existing-dlp-policies/existing-dlp-policies.json' | ConvertFrom-Json

# Initialize an array to store the new tfvars file names
$newTfvarsFileNames = @()

# Go through each existing to generate a tfvars file
foreach ($policy in $existingDlpPoliciesFileContent.all_dlp_policies.value.policies) {
    # Initialize an empty string
    $tfvarsContent = ""

    # Add the policy details
    $tfvarsContent += "display_name = `"$($policy.display_name)`""
    $tfvarsContent += "`n"
    $tfvarsContent += "environment_type = `"$($policy.environment_type)`""
    $tfvarsContent += "`n"
    $tfvarsContent += "environments = [`"" + ($policy.environments -join '","') + "`"]"
    $tfvarsContent += "`n"
    $tfvarsContent += "`n"

    # Add the business connectors details
    $tfvarsContent += "business_connectors = ["
    foreach ($businessConnector in $policy.business_connectors) {
        $tfvarsContent += "`n"
        $tfvarsContent += "  {"
        $tfvarsContent += "`n"
        $tfvarsContent += "    id = `"$($businessConnector.id)`""
        $tfvarsContent += "`n"
        $tfvarsContent += "    default_action_rule_behavior = `"$($businessConnector.default_action_rule_behavior)`""
        $tfvarsContent += "`n"

        # Add the action rules details
        if ($businessConnector.action_rules) {
            $tfvarsContent += "    action_rules = ["
            foreach ($actionRule in $businessConnector.action_rules) {
                $tfvarsContent += "`n"
                $tfvarsContent += "      {"
                $tfvarsContent += "`n"
                $tfvarsContent += "        action_id = `"$($actionRule.action_id)`""
                $tfvarsContent += "`n"
                $tfvarsContent += "        behavior = `"$($actionRule.behavior)`""
                $tfvarsContent += "`n"
                $tfvarsContent += "      },"
            }
            $tfvarsContent = $tfvarsContent.TrimEnd(",")
            $tfvarsContent += "`n"
            $tfvarsContent += "    ]"
            $tfvarsContent += "`n"
        } else {
            $tfvarsContent += "    action_rules = []"
            $tfvarsContent += "`n"
        }

        # Add the endpoint rules details
        if ($businessConnector.endpoint_rules) {
            $tfvarsContent += "    endpoint_rules = ["
            foreach ($endpointRule in $businessConnector.endpoint_rules) {
                $tfvarsContent += "`n"
                $tfvarsContent += "      {"
                $tfvarsContent += "`n"
                $tfvarsContent += "        behavior = `"$($endpointRule.behavior)`""
                $tfvarsContent += "`n"
                $tfvarsContent += "        endpoint = `"$($endpointRule.endpoint)`""
                $tfvarsContent += "`n"
                $tfvarsContent += "        order = $($endpointRule.order)"
                $tfvarsContent += "`n"
                $tfvarsContent += "      },"
            }
            $tfvarsContent = $tfvarsContent.TrimEnd(",")
            $tfvarsContent += "`n"
            $tfvarsContent += "    ]"
            $tfvarsContent += "`n"
        } else {
            $tfvarsContent += "    endpoint_rules = []"
            $tfvarsContent += "`n"
        }

        $tfvarsContent += "  },"
    }

    $tfvarsContent = $tfvarsContent.TrimEnd(",")
    $tfvarsContent += "`n"
    $tfvarsContent += "]"
    $tfvarsContent += "`n"
    $tfvarsContent += "`n"

    # Add the custom connectors details
    $tfvarsContent += "custom_connectors = ["
    foreach ($customConnector in $policy.custom_connectors_patterns) {
        $tfvarsContent += "`n"
        $tfvarsContent += "  {"
        $tfvarsContent += "`n"
        $tfvarsContent += "    order = $($customConnector.order)"
        $tfvarsContent += "`n"
        $tfvarsContent += "    host_url_pattern = `"$($customConnector.host_url_pattern)`""
        $tfvarsContent += "`n"
        $tfvarsContent += "    data_group = `"$($customConnector.data_group)`""
        $tfvarsContent += "`n"
        $tfvarsContent += "  },"
    }

    $tfvarsContent = $tfvarsContent.TrimEnd(",")
    $tfvarsContent += "`n"
    $tfvarsContent += "]"

    # Build tfvars file name from policy display name
    # Replace spaces with "-" and convert to lowercase
    $tfvarsFileName = $policy.display_name -replace ' ', '-'
    $tfvarsFileName = $tfvarsFileName.ToLower()

    # Write the tfvars string to a file
    Set-Content -Path "../src/dlp-policies/$tfvarsFileName.tfvars" -Value $tfvarsContent

    # Add the tfvars file name to the array
    $newTfvarsFileNames += $tfvarsFileName
}

$newTfvarsFileNames
```

Maya had never encountered polyglot notebooks before, but their promise intrigues her. Although the provided solution for this use case seems straightforward, the combination of markdown cells for comments and the ability to execute multiple code cells at once holds immense value for her team.

In the polyglot notebook Maya discovered, a PowerShell code block performs precisely these tasks. At a high level, the proposed solution involves: taking the exported DLP policies, extracting information required by the Terraform configuration, and generating one Terraform variable definition file per DLP policy.

Skeptical but hopeful, Maya decides to run all the code cells in one go. To her delight, within seconds, she obtains Terraform variable definition files — one for each DLP policy deployed in Power Platform — and they are configured as expected.

Emboldened by her initial success, Maya proceeds to test the end-to-end process:

- She creates a test DLP policy with a simple configuration in Power Platform Admin Center
- She performs a fresh export of the existing DLP policies
- She converts the extracted DLP policies into Terraform variable definition files
- She implements a small change — adding a connector — into the Terraform variable definition file corresponding to her test DLP policy
- She runs a deployment — plan and apply — targeting her test DLP policy

But alas, reality diverged from her expectations. The result is not as anticipated. Somewhere along this path, Maya inadvertently created an alternate version of the test DLP policy — a deviation from her manually crafted one.

What had she missed? She did not yet know, but the urgency weighed on her. To make this infrastructure-as-code approach viable for her organization, she must uncover the missing link — a bridge between the old and the new.

![Maya finding her onboarding process of DLP policies in infrastructure as code is not working as expected](/content/archive/infrastructure-as-code/03-maya-onboarding-not-working.jpeg)

## The missing piece of the puzzle

After a restful night's sleep, Maya returns to the office, her mind buzzing with determination. She senses that the answer hovers just beyond her grasp, waiting to reveal itself.

Taking a step back, she ponders the challenge she is facing. What she is trying to achieve is clear: shift from manual resource management to infrastructure as code. Yet, something eludes her — the moment she deployed a new version of an existing DLP policy, it spawned an unexpected duplicate.

Frustrated but undeterred, Maya decides to take a modern approach. She turns to the Copilot experience in Microsoft Edge, hoping for clues to resolve her issue. In a concise prompt, she distilled her dilemma: "With Terraform, how to switch from manually managing resources to using infrastructure as code? With my current configuration the first plan and apply give me a duplicated resource while I was expected an updated version of an existing one never managed with Terraform."

Copilot's response illuminated a crucial element: the state file — a pillar in Terraform's orchestration. And there it is — the `terraform import` command, a beacon of hope. Could this be the key to resolving her issue?

Recalling the GitHub repository inspiring her recent work — rpothin/PowerPlatform-Governance-With-Terraform — Maya's memory sparked. There she finds a GitHub workflow designed to bring DLP policies under Terraform's management.

```yaml
# terraform-import.yml
# Source: https://gist.github.com/rpothin/4e71df10aea12b211081ead41f1e40ce
name: terraform-import
# Import a resource into a Terraform state file

# Workflow triggered mannually passing:
# - the terraform configuration
# - the terraform variable file
# - the type of resource to import
# - the resource id
on:
  workflow_dispatch:
    inputs:
      terraform_configuration:
        type: choice
        description: "The name of the Terraform configuration to import a resource into"
        required: true
        options:
          - dlp-policies
          - billing-policies
      terraform_var_file:
        type: string
        description: "The name of the Terraform variable file to use"
        required: true
      resource_type:
        type: choice
        description: "The type of resource to import"
        required: true
        options:
          - powerplatform_data_loss_prevention_policy.policy
      resource_id:
        description: "The resource id"
        required: true

# Concurrency configuration for the current workflow - Keep only the latest workflow queued for the considered group
concurrency:
  group: terraform-import-${{ github.event.inputs.terraform_configuration }}-${{ github.event.inputs.terraform_var_file }}
  cancel-in-progress: true

run-name: Import resource into ${{ github.event.inputs.terraform_configuration }} with ${{ github.event.inputs.terraform_var_file }} by @${{ github.actor }}

# Set up permissions for deploying with secretless Azure federated credentials
# https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure?tabs=azure-portal%2Clinux#set-up-azure-login-with-openid-connect-authentication
permissions:
  id-token: write
  contents: read

# These environment variables are used by the terraform azure provider to setup OIDD authenticate.
env:
  ARM_TENANT_ID: "${{ secrets.AZURE_TENANT_ID }}"
  ARM_CLIENT_ID: "${{ secrets.AZURE_CLIENT_ID }}"
  ARM_SUBSCRIPTION_ID: "${{ secrets.AZURE_SUBSCRIPTION_ID }}"
  POWER_PLATFORM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
  POWER_PLATFORM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
  TARGET_DIR: ${{ github.workspace }}/src/${{ github.event.inputs.terraform_configuration }}
  TF_STATE_RESOURCE_GROUP_NAME: ${{ secrets.TF_STATE_RESOURCE_GROUP_NAME }}
  TF_STATE_STORAGE_ACCOUNT_NAME: ${{ secrets.TF_STATE_STORAGE_ACCOUNT_NAME }}
  TF_STATE_CONTAINER_NAME: ${{ secrets.TF_STATE_CONTAINER_NAME }}
  TF_STATE_KEY: ${{ github.event.inputs.terraform_configuration }}-${{ github.event.inputs.terraform_var_file }}.terraform.tfstate
  TF_VAR_FILE: tfvars/${{ github.event.inputs.terraform_var_file }}.tfvars
  TF_CLI_CONFIG_FILE: ${{ github.workspace }}/src/mirror.tfrc
  ARM_SKIP_PROVIDER_REGISTRATION: true #this is needed since we are running terraform with read-only permissions

jobs:
  terraform-import:
    name: "Terraform Import"
    runs-on: ubuntu-latest

    steps:
      # Action used to checkout the main branch in the current repository
      #   Community action: https://github.com/actions/checkout
      - name: Checkout
        uses: actions/checkout@v4.1.1

      # Install the latest version of the Terraform CLI
      #   Community action: https://github.com/hashicorp/setup-terraform
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_wrapper: false

      # Log in to Azure using the Azure login action and with OpenID Connect (OIDC) federated credentials
      #  Community action: https://github.com/Azure/login
      - name: Log in with Azure (Federated Credentials)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      # Download the Terraform Power Platform provider from GitHub
      - name: Download Terraform Power Platform Provider
        env:
          GITHUB_TOKEN: ${{ secrets.PAT_DOWNLOAD_RELEASE }}
          PROVIDER_VERSION: ${{ vars.POWER_PLATFORM_PROVIDER_VERSION }}
          PROVIDER_REPO: ${{ vars.POWER_PLATFORM_PROVIDER_REPOSITORY }}
          DOWNLOAD_DIR: /usr/share/terraform/providers/registry.terraform.io/microsoft/power-platform
        run: |
          gh release download "$PROVIDER_VERSION" --repo "$PROVIDER_REPO" --pattern "*.zip" --dir "$DOWNLOAD_DIR" --clobber
          ls -la "$DOWNLOAD_DIR"

      # Initialize a new or existing Terraform working directory by creating initial files, loading any remote state, downloading modules, etc.
      - name: Terraform Init
        run: terraform -chdir=$TARGET_DIR init -backend-config="storage_account_name=$TF_STATE_STORAGE_ACCOUNT_NAME" -backend-config="resource_group_name=$TF_STATE_RESOURCE_GROUP_NAME" -backend-config="container_name=$TF_STATE_CONTAINER_NAME" -backend-config="key=$TF_STATE_KEY"

      # Run terraform validate to check the syntax of the configuration files
      - name: Terraform Validate
        run: terraform -chdir=$TARGET_DIR validate

      # Run terraform import to import a resource into the Terraform state file
      - name: Terraform Import
        run: terraform -chdir=$TARGET_DIR import -var-file=$TF_VAR_FILE ${{ github.event.inputs.resource_type }} ${{ github.event.inputs.resource_id }}
```

With renewed motivation, she configures the workflow in her repository, purges the duplicate test DLP policy, and wipes its related state file.

Next comes the pivotal moment. Armed with the DLP policy's ID (extracted from its URL), Maya initiates the import process. In no more than a minute, the operation completes, creating a brand-new state file for her test DLP policy without impact in Power Platform.

Encouraged by this breakthrough, she dares to give the "plan and apply" process another try. Her change — a connector added — awaits deployment. The suspense is palpable as she monitors the GitHub workflow. Finally, the green check mark appears — a signal of success. And in the Power Platform Admin Center, Maya confirms her change landed as expected.

It is the end of a long and emotional day closing on an important achievement for Maya. The lines of code she wrote today aren't mere syntax, they're bridges connecting possibility to reality.

![Maya leaving the office full of hope after her recent achievements](/content/archive/infrastructure-as-code/03-maya-leaving-office-hopeful.jpeg)

But as the office quiets, Maya knows this is still only the beginning. Tomorrow awaits — the rollout strategy, the training sessions, and the unexpected synergies. And beyond that, a new journey — the one that will reveal not just lines of infrastructure as code, but the beating heart of their operational excellence transformation.

---

### Infrastructure as Code journey series

1. [Infrastructure as code for Power Platform, a light at the end of the tunnel?](/archive/infrastructure-as-code/01-a-light-at-the-end-of-the-tunnel)
2. [The Power Platform Infrastructure as Code journey — First stop: Inventory](/archive/infrastructure-as-code/02-first-stop-inventory)
3. **The Power Platform Infrastructure as Code journey — Dawn of transformation** ← _you are here_
4. [The Power Platform Infrastructure as Code journey — A bright future](/archive/infrastructure-as-code/04-a-bright-future)
