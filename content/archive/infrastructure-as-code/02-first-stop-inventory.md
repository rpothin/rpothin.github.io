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

- a Terraform configuration using the `powerplatform_data_loss_prevention_policies` data source
- a GitHub workflow to streamline the export of the DLP policies as a JSON file

A quick test yielded promising results, giving Maya confidence that her team could now gain better visibility into the DLP policy configurations.

Maya now feels ready to present the results of her analysis and proof of concept to her team. If the team agrees that infrastructure as code could be a valid option to improve the management of Power Platform Data Loss Prevention policies, this journey will continue.

Maya will face many more steps before being able to demonstrate the full value of such an approach, but this could be the beginning of many similar quests. The governance of Power Platform is indeed full of challenges.

---

### Infrastructure as Code journey series

1. [Infrastructure as code for Power Platform, a light at the end of the tunnel?](/archive/infrastructure-as-code/01-a-light-at-the-end-of-the-tunnel)
2. **The Power Platform Infrastructure as Code journey — First stop: Inventory** ← _you are here_
3. [The Power Platform Infrastructure as Code journey — Dawn of transformation](/archive/infrastructure-as-code/03-dawn-of-transformation)
4. [The Power Platform Infrastructure as Code journey — A bright future](/archive/infrastructure-as-code/04-a-bright-future)
