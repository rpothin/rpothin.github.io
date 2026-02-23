---
title: "The Power Platform Infrastructure as Code journey — First stop: Inventory"
date: 2024-07-01
tags:
  [power-platform, infrastructure-as-code, terraform, dlp-policies, governance]
description: "Following Maya, a fictional engineer, as she identifies the pain points of managing DLP policies through the Power Platform Admin Center UI, discovers the Terraform provider, and builds a proof of concept to export existing policies as code."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/the-power-platform-infrastructure-as-code-journey-first-stop-inventory"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Maya, a brilliant young engineer, steps into her new role on the Power Platform team at a sprawling corporate giant. Their mission? To oversee the administration and governance of this critical platform. The stakes are high — the company's Power Platform consumption is already substantial.

With a background in generalist IT administration, Maya brings a fresh perspective to the team. Her penchant for innovation is palpable, and her colleagues eagerly anticipate the creative solutions she'll introduce.

Her first challenge awaits: enhancing the management of Data Loss Prevention policies. It won't be easy, but Maya thrives on challenges. Join us as we follow Maya's journey, one that promises to transform the way Power Platform is governed in her organization.

## The challenge of managing Power Platform DLP policies at scale

Maya, not being an expert in Power Platform, decides to explore the current Data Loss Prevention (DLP) policies within the organization to identify potential improvements. She quickly realizes that over the years, the company's DLP policies have lacked strong guidelines. While there is a "default" policy that applies to all environments except those specifically excluded, there is inconsistency among the various policies and insufficient documentation, making it challenging to switch to a different management approach.

After reviewing the DLP policies in the Power Platform Admin Center and discussing with her team, Maya identifies several pain points with their management through the user interface:

- **Policy Layering and Conflicts**: Administrators must remember that changing a DLP policy for an existing environment or setting up a new one often requires modifying two policies.
- **Visibility of Configuration**: Finding DLP policies where the SQL Server connector is enabled, along with its configuration (blocked actions and endpoint filtering), or identifying which DLP policy applies to a given environment can be time-consuming.
- **Complexity in Setup**: Configuring a new DLP policy, even if it resembles an existing one with minor adjustments, is not a straightforward task for administrators.

Now that Maya thinks about it, these pain points could explain why her team was not really motivated by the idea of tailor-made DLP policies for the specific requirements of each environment group. It would have been almost impossible to maintain such a number of policies in an effective way from Power Platform Admin Center.

Following her investigation, Maya concludes that only a creative approach could help her team improve the management of Power Platform DLP policies.

## What if Infrastructure as Code could help address this challenge?

Maya, in her quest for innovative solutions to address the challenge of the management of DLP policies, stumbles upon a GitHub repository discussing a Terraform provider for Power Platform. Noting that the tool is still experimental, it reminds her of past successes where Infrastructure as Code (IaC) added significant value by enhancing consistency, standardization, and reducing human error.

Switching the team to an IaC and Terraform approach would require some effort, so Maya decides to weigh the pros and cons. Reflecting on the pain points identified during preliminary analysis, IaC seems to help address most of them:

- **Policy Layering and Conflicts**: Adding an environment ID in a repository — even if it could have to be done in different files — seems simpler than navigating multiple screens in Power Platform Admin Center across different DLP policies. Moreover, a healthy ALM process with peer review can further mitigate human error.
- **Visibility of Configuration**: A quick repository search can provide team members with answers about connectors or environments.
- **Complexity in Setup**: Initializing a new DLP policy can be streamlined through code or file copy-pasting, depending on repository organization.

To finalize her proposal, Maya plans to build a proof of concept to demonstrate the potential value of managing DLP policies as code in a repository.

## Exporting the current state as a starting point

After conducting further research, Maya discovered additional repositories that provided guidance on setting up the Terraform provider for Power Platform, but also offering valuable insights regarding implementing DLP policies management — microsoft/power-platform-terraform-quickstarts and rpothin/PowerPlatform-Governance-With-Terraform.

With all prerequisites in place — an Azure subscription for storing state files, a service principal with the necessary permissions, and a GitHub repository for hosting the code — Maya quickly completed the setup, thanks to the excellent guidance found in the identified resources.

Exporting the current state of the DLP policies as code in the repository would represent a significant milestone. This success would demonstrate to Maya's team that using infrastructure as code could be the way to enhance their Power Platform management experience.

To achieve that, Maya utilized resources from the rpothin/PowerPlatform-Governance-With-Terraform repository, which included:

**Terraform configuration to export existing DLP policies** (`power-platform-existing-dlp-policies-main.tf`):

```hcl
// power-platform-existing-dlp-policies-main.tf
// Source: https://gist.github.com/rpothin/a715f931e23317d16c82d488608b3713
terraform {
  required_providers {
    powerplatform = {
      source  = "microsoft/power-platform"
      version = "2.4.1-preview"
    }
  }

  backend "azurerm" {
    use_oidc = true
  }
}

provider "powerplatform" {
  use_oidc = true
}

data "powerplatform_data_loss_prevention_policies" "all_dlp_policies" {}

output "all_dlp_policies" {
  value = data.powerplatform_data_loss_prevention_policies.all_dlp_policies
  description = "All DLP policies"
}
```

**GitHub workflow to run Terraform output and export the configuration** (`terraform-output.yml`):

```yaml
# terraform-output.yml
# Source: https://gist.github.com/rpothin/b34f33111fe60cc03fe80fcd56543a9f
name: terraform-output
# Get the data in Terraform configurations as JSON files

# Workflow scheduled to run every day at 03:00 AM EST (UTC-5) but can also be run manually
on:
  workflow_dispatch:
  schedule:
    - cron: '0 8 * * *'

# Concurrency configuration for the current workflow - Keep only the latest workflow queued for the considered group
concurrency:
  group: terraform-output
  cancel-in-progress: true

run-name: Terraform output

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
  TF_STATE_RESOURCE_GROUP_NAME: ${{ secrets.TF_STATE_RESOURCE_GROUP_NAME }}
  TF_STATE_STORAGE_ACCOUNT_NAME: ${{ secrets.TF_STATE_STORAGE_ACCOUNT_NAME }}
  TF_STATE_CONTAINER_NAME: ${{ secrets.TF_STATE_CONTAINER_NAME }}
  TF_CLI_CONFIG_FILE: ${{ github.workspace }}/src/mirror.tfrc
  ARM_SKIP_PROVIDER_REGISTRATION: true #this is needed since we are running terraform with read-only permissions

jobs:
    terraform-output:
        strategy:
          matrix:
            terraform_configuration: [ 'power-platform-connectors', 'existing-dlp-policies' ]
        name: 'Terraform Output'
        runs-on: ubuntu-latest
        permissions: write-all
        env:
          TARGET_DIR: ${{ github.workspace }}/src/${{ matrix.terraform_configuration }}
          TF_STATE_KEY: ${{ matrix.terraform_configuration }}.terraform.tfstate
        
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
                terraform -chdir=$TARGET_DIR plan -detailed-exitcode -no-color -out tfplan || export exitcode=$?

                echo "exitcode=$exitcode" >> $GITHUB_OUTPUT
                
                if [ $exitcode -eq 1 ]; then
                  echo Terraform Plan Failed!
                  exit 1
                else 
                  exit 0
                fi

            # Terraform Apply
            - name: Terraform Apply
              run: terraform -chdir=$TARGET_DIR apply -auto-approve

            # Get the data in Terraform configurations as JSON files
            - name: Terraform Output
              run: terraform -chdir=$TARGET_DIR output -json > ${{ github.workspace }}/src/${{ matrix.terraform_configuration }}/${{ matrix.terraform_configuration }}.json

            # Commit and push the changes to the repository
            - name: Commit changes
              run: |
                git config --global user.name 'action@github.com'
                git config --global user.email 'GitHub Action'
                
                git add .
                git diff --staged --quiet || git commit -m "Update ${{ matrix.terraform_configuration }}.json"
                
                git push origin main || true
```

A quick test yielded promising results, giving Maya confidence that her team could now gain better visibility into the DLP policy configurations.

Maya now feels ready to present the results of her analysis and proof of concept to her team. If the team agrees that infrastructure as code could be a valid option to improve the management of Power Platform Data Loss Prevention policies, this journey will continue.

Maya will face many more steps before being able to demonstrate the full value of such an approach, but this could be the beginning of many similar quests. The governance of Power Platform is indeed full of challenges.

---

### Infrastructure as Code journey series

1. [Infrastructure as code for Power Platform, a light at the end of the tunnel?](/archive/infrastructure-as-code/01-a-light-at-the-end-of-the-tunnel)
2. **The Power Platform Infrastructure as Code journey — First stop: Inventory** ← _you are here_
3. [The Power Platform Infrastructure as Code journey — Dawn of transformation](/archive/infrastructure-as-code/03-dawn-of-transformation)
4. [The Power Platform Infrastructure as Code journey — A bright future](/archive/infrastructure-as-code/04-a-bright-future)
