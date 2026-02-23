---
title: "The Power Platform Infrastructure as Code journey — A bright future"
date: 2024-08-10
tags:
  [
    power-platform,
    infrastructure-as-code,
    terraform,
    governance,
    organizational-change,
  ]
description: "Maya prepares to present her DLP policy IaC strategy to IT leadership — covering how to upskill the team, plan the progressive migration of existing policies, and unlock unexpected benefits like automated testing, reduced privileged access, and risk audits."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/the-power-platform-infrastructure-as-code-journey-a-bright-future"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

A few days have passed since Maya unlocked the complete solution to manage Power Platform DLP policies with Terraform. Now, she sits at her desk, preparing for a pivotal presentation to the IT leadership team. Her mission? To unveil a strategic roadmap that will not only secure the shift to infrastructure as code for DLP policies but potentially extend to other Power Platform elements in the near future.

Yet, as she stares at her screen, Maya faces an unexpected challenge: the intangible. She loves technical challenges — like she showed it in the past days. But organizational and cultural challenges? Those are different beasts. She starts having some doubts. Can she convince the skeptics that this transformation can be done safely and is essential?

With determination and a steaming cup of coffee, Maya steps out for a walk. Perhaps answers will come to her while she frees her mind with a relaxing outdoor activity.

## Preparing the team

Entering the park near her office, Maya starts to think about the first potential issue that might arise during her presentation regarding her proposition of using Terraform to manage Power Platform resources. Her team currently lacks Terraform skills and is unfamiliar with the infrastructure as code approach.

She could attempt to downplay the need for these competencies, suggesting that once the setup is complete, maintaining configuration files would be straightforward. However, Maya knows she would only be fooling herself and her audience. This would not be a reliable option. Unforeseen issues with Terraform configurations or the GitHub workflows could emerge, necessitating basic troubleshooting skills among team members.

Sitting on a bench, Maya starts to consider her options.

Bringing in someone already in the company or hiring externally with strong Terraform and infrastructure knowledge, who is also interested in exploring new horizons — Power Platform — could secure most of the building and maintenance of the Terraform infrastructure as code they need to implement. This person could also take charge of training interested team members for operational continuity. But does such a profile exist, and could they find this person in a reasonable timeline?

On the other hand, Maya believes in investing in the talents already within the team. While not everyone may be interested in learning a new way of working, she already has a few potential candidates in mind. The learning curve is a significant consideration, and the team would need to provide some guarantees before launching the rollout plan Maya envisions.

Then, an idea strikes her. If she is correct, there is a team within the organization leading the Terraform adoption effort. If Maya's team could build a partnership with this team, it would allow her colleagues time to gain the necessary skills to implement and maintain Terraform configurations. She envisions a process where members of the internal Terraform team could be involved in issues and pull requests in the GitHub repository used to manage the Power Platform infrastructure as code, providing guidance and feedback. The goal would be to capitalize on their expertise to accelerate the learning process for Maya's team.

Quickly noting down this promising idea, Maya stands up and continues her walk in the park. It doesn't take long for her to realize that obtaining the skills is only the first step. She still needs to identify a clear path to transition the management of DLP policies from the Power Platform Admin Center portal to an infrastructure as code approach.

## Manage it like a migration initiative

Continuing her walk, Maya passes an abandoned water mill with a board sharing its history. A few years ago, this mill powered the park's electricity needs. Then, a decision was made to replace it and gradually connect the park's electrical elements to the city's network, which fortunately is based on renewable energies. According to the board, they took a progressive approach, tackling different elements in groups to avoid a global electric outage in the park and to manage the work with a small team focusing on a few elements at a time. Impressively, they completed their project in a short amount of time without any major issues.

Such an approach reminds Maya of a well-executed IT migration initiative. However, thinking about the "lift-and-shift" strategies many companies followed to move to the cloud, she knows there are more details to consider than just handling small groups if she wants to maximize this opportunity.

Looking at the abandoned water mill, Maya starts to understand the assumptions her plan should be built on: the outcome should be more secure and better organized Power Platform DLP policies, but the transition should be done with minimal risk.

From this moment on, a plan begins to form in Maya's mind. Starting with the export of the Power Platform DLP policies as infrastructure as code, she could target the existing policies applying to explicitly defined environments, progressing from the less critical to the most critical ones, and leaving their "default" DLP policy — the one applying to all environments except those explicitly excluded — for the end. For each policy, Maya could then follow these steps:

1. Bring the Terraform variable definitions file (tfvars) generated for the considered Power Platform DLP policy under Terraform's management, up to importing the existing resource into the state file.
2. Validate if the connectors used in the environments align with those defined in the Power Platform DLP policy to follow a least-privilege approach (only required connectors should be allowed in a policy).
3. If an environment uses fewer connectors than those defined in the considered Power Platform DLP policy, initialize a new Terraform variable definitions file for a new policy allowing only the required connectors and add the considered environment to it.
4. Go through the plan and apply process for this new DLP policy to deploy it and validate that everything seems correct in Power Platform Admin Center.
5. Remove the environment from the initial policy.

Most of the time, Maya should find packs of three environments (dev, test, and prod) under the same DLP policy that she will be able to move to the same new policy. In this case, she might do the switch in two steps: the first one on non-production environments to validate the change does not introduce a regression, and then the production environment once validations are complete.

When they finally reach their "default" DLP policy — the one applying to all environments except those explicitly excluded — they will be able to validate even more things by putting it under Terraform's management, such as which environments should be covered by this policy and what its configuration should be (based on an analysis of the connectors used in the included environments).

This plan is undeniably ambitious and will require time to implement, but it appears to be the safest route with the potential for the best outcome. As she resumes her walk, Maya considers that highlighting additional benefits of adopting an infrastructure as code approach in her presentation might enhance her chances of convincing her audience that, despite the necessary investment, it remains the best course of action.

## Unexpected benefits

As she nears the end of her walk, Maya begins to realize that adopting an infrastructure as code approach offers several unexpected benefits that could further strengthen her case.

One significant advantage is the ability to test infrastructure as code configurations before they become operational ready. By incorporating automated testing into the development workflow, Maya's team could identify and mitigate potential regression in Terraform configuration changes before they could impact the production environment. This would reduce the risk of making changes and ensure a more stable and reliable process. Automated tests can, in theory, validate the correctness of Terraform configurations, check for compliance with organizational policies, and simulate deployment scenarios to catch errors early.

Another benefit is the reduction in the number of team members requiring the Power Platform administrator role at the tenant level. Traditionally, many team members might need elevated permissions to perform operational tasks within the Power Platform Admin Center. However, with the infrastructure as code approach, these operations would be delegated to the identity configured to run the GitHub workflows, limiting the need for direct access to the Power Platform Admin Center portal by administrators. This not only enhances security by minimizing the number of high-privilege accounts, but also streamlines operational workflows, making it easier to manage and audit access controls.

Lastly, the automation of risk audits for new connectors and the state of DLP policies would become more feasible with infrastructure as code. By leveraging Terraform's capabilities, Maya's team could automatically notify the risk team when new connectors are available to trigger an audit process and validate if they comply or not with the organization's security and compliance standards. The output could become the list of allowed connectors Maya's team could safely consider when receiving a change request regarding DLP policies to determine if a supplemental risk analysis would be required or not for the scenario considered. Additionally, the state of DLP policies being always available, it could be audited at any moment, providing real-time insights into potential risks and ensuring that policies remain aligned with the organization's requirements.

These unexpected benefits not only enhance the technical robustness of Maya's plan but also address broader organizational and security concerns. As she finally heads back to the office, Maya feels more confident that these additional advantages will help convince the IT leadership team of the value and necessity of adopting an infrastructure as code approach.

The day has arrived, and we find Maya concluding her presentation with a passion that belies the stress she felt at the start. She has shared her insights and demonstrated how shifting their approach to managing Power Platform resources could bring numerous benefits to her team and the organization.

With trust and confidence in their voices, the representatives of the IT leadership team, sitting in the room, give Maya their blessing to move forward with her plan. They strongly believe in her and her team's ability to lead the organization to the forefront of Power Platform governance and administration through an infrastructure as code approach.

---

### Infrastructure as Code journey series

1. [Infrastructure as code for Power Platform, a light at the end of the tunnel?](/archive/infrastructure-as-code/01-a-light-at-the-end-of-the-tunnel)
2. [The Power Platform Infrastructure as Code journey — First stop: Inventory](/archive/infrastructure-as-code/02-first-stop-inventory)
3. [The Power Platform Infrastructure as Code journey — Dawn of transformation](/archive/infrastructure-as-code/03-dawn-of-transformation)
4. **The Power Platform Infrastructure as Code journey — A bright future** ← _you are here_
