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

- A Terraform configuration for the management of a DLP policy resource using the `powerplatform_data_loss_prevention_policy` resource, but also the `powerplatform_connectors` data source
- A Terraform file with input variables declaration for the considered Terraform configuration
- An example of Terraform variable definitions file she will be able to adjust with her organization context
- A GitHub workflow to plan and apply the Terraform configuration combined with a Terraform variable definitions file

Maya sets up everything to create a first DLP policy swiftly. The GitHub workflow performs like a well-oiled machine, deploying a fresh DLP policy with the expected configuration in mere minutes. She's astounded by its efficiency.

And then, fueled by curiosity, Maya adds another connector — found in what seems to be an up-to-date extract of connectors available in the platform from the same GitHub repository. The deployment goes flawlessly. She laughs — a contagious, triumphant sound — leaving her colleagues wondering if she's worked too hard or simply discovered the magic of code.

## Converting exported DLP policies into reusable infrastructure as code

In recent days, Maya achieved two critical milestones: she successfully moved existing DLP policies into a source code repository and began managing new DLP policies through code. However, a crucial piece remains missing: how to convert these exported DLP policies into a format that could be effectively managed using Terraform.

Once again, the rpothin/PowerPlatform-Governance-With-Terraform GitHub repository came to her aid, offering a polyglot notebook specifically designed to transform existing DLP policies into valid Terraform variable definitions files.

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

## The missing piece of the puzzle

After a restful night's sleep, Maya returns to the office, her mind buzzing with determination. She senses that the answer hovers just beyond her grasp, waiting to reveal itself.

Taking a step back, she ponders the challenge she is facing. What she is trying to achieve is clear: shift from manual resource management to infrastructure as code. Yet, something eludes her — the moment she deployed a new version of an existing DLP policy, it spawned an unexpected duplicate.

Frustrated but undeterred, Maya decides to take a modern approach. She turns to the Copilot experience in Microsoft Edge, hoping for clues to resolve her issue. In a concise prompt, she distilled her dilemma: "With Terraform, how to switch from manually managing resources to using infrastructure as code? With my current configuration the first plan and apply give me a duplicated resource while I was expected an updated version of an existing one never managed with Terraform."

Copilot's response illuminated a crucial element: the state file — a pillar in Terraform's orchestration. And there it is — the `terraform import` command, a beacon of hope. Could this be the key to resolving her issue?

Recalling the GitHub repository inspiring her recent work — rpothin/PowerPlatform-Governance-With-Terraform — Maya's memory sparked. There she finds a GitHub workflow designed to bring DLP policies under Terraform's management.

With renewed motivation, she configures the workflow in her repository, purges the duplicate test DLP policy, and wipes its related state file.

Next comes the pivotal moment. Armed with the DLP policy's ID (extracted from its URL), Maya initiates the import process. In no more than a minute, the operation completes, creating a brand-new state file for her test DLP policy without impact in Power Platform.

Encouraged by this breakthrough, she dares to give the "plan and apply" process another try. Her change — a connector added — awaits deployment. The suspense is palpable as she monitors the GitHub workflow. Finally, the green check mark appears — a signal of success. And in the Power Platform Admin Center, Maya confirms her change landed as expected.

It is the end of a long and emotional day closing on an important achievement for Maya. The lines of code she wrote today aren't mere syntax, they're bridges connecting possibility to reality.

But as the office quiets, Maya knows this is still only the beginning. Tomorrow awaits — the rollout strategy, the training sessions, and the unexpected synergies. And beyond that, a new journey — the one that will reveal not just lines of infrastructure as code, but the beating heart of their operational excellence transformation.

---

### Infrastructure as Code journey series

1. [Infrastructure as code for Power Platform, a light at the end of the tunnel?](/archive/infrastructure-as-code/01-a-light-at-the-end-of-the-tunnel)
2. [The Power Platform Infrastructure as Code journey — First stop: Inventory](/archive/infrastructure-as-code/02-first-stop-inventory)
3. **The Power Platform Infrastructure as Code journey — Dawn of transformation** ← _you are here_
4. [The Power Platform Infrastructure as Code journey — A bright future](/archive/infrastructure-as-code/04-a-bright-future)
