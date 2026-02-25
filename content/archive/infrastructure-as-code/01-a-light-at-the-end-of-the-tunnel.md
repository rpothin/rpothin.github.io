---
title: "Infrastructure as code for Power Platform, a light at the end of the tunnel?"
date: 2024-06-08
tags: [power-platform, infrastructure-as-code, terraform, governance, devops]
description: "An introduction to the Power Platform Terraform provider — why infrastructure as code matters for platform governance, how the provider works at a high level, and what trade-offs teams should weigh before adopting it."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/infrastructure-as-code-for-power-platform-a-light-at-the-end-of-the-tunnel"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

At the end of 2023, my fellow MVP Natraj Yegnaraman shared an interesting post about the Power Platform Terraform provider being mentioned for the first time on the Azure Podcast — even if my reaction showed I was not indifferent.

![Natraj Yegnaraman post regarding Azure Podcast episode 477 where Power Platform Terraform provider was mentioned for the first time](/content/archive/infrastructure-as-code/01-natraj-azure-podcast-tweet.png)

Most recently, Natraj shared another post announcing the preview of the Power Platform Terraform provider.

![Natraj's post announcing the preview of Power Platform Terraform provider](/content/archive/infrastructure-as-code/01-natraj-terraform-preview-tweet.png)

Even if some of us were a bit sad to receive a Terraform provider while we were waiting for a Bicep-oriented approach to manage Power Platform assets with infrastructure as code, it was still big news and the beginning of a new journey for me.

![Illustration of Power Platform and Terraform better together](/content/archive/infrastructure-as-code/01-power-platform-terraform-together.png)

> [!WARNING]
> One of the most important things to keep in mind is that the Power Platform Terraform provider is in the experimental phase (at the time where I write this article) and should definitely not be used in Production — or at least it will be at your own risk because no active support will be provided.

## Why infrastructure as code matters even for Power Platform?

Infrastructure as code is not a new concept in the cloud infrastructure world, but has not really (or at least not a lot or not publicly) been discussed in the context of Power Platform.

However, this practice has many benefits — like some presented below — that it would be unwise not to consider in our context.

- **Efficiency and Speed**: Infrastructure as code (IaC) allows for the rapid deployment and configuration of resources through automation, reducing the time it takes to set up and manage them.
- **Consistency and Standardization**: IaC helps maintain consistency across multiple deployments, ensuring that each resource is configured according to the defined standards. This is crucial as it ensures reliable and predictable outcomes.
- **Version Control and Collaboration**: IaC integrates with version control systems, allowing teams to collaborate on the development of infrastructure, track changes, and roll back to previous versions if necessary.
- **Cost Management**: By automating the deployment process, IaC helps in reducing operational costs. It also allows for better tracking of resource usage, which can lead to more cost-effective decisions for the services considered.
- **Risk Mitigation**: IaC can help in reducing the risk of human error during setup and management. This means higher reliability and lower downtime.
- **Compliance and Security**: IaC can enforce security policies and compliance requirements programmatically, providing a secure foundation for the applications built on top of the infrastructure.

Wherever you are in your Power Platform adoption journey and whatever scale your organization is, such approach could provide benefits in exchange of some investment in the training of your team(s) in charge of the management and the governance of the platform.

## What is the Power Platform Terraform provider and how does it work?

Terraform is an infrastructure as code tool providing an extensibility model a team at Microsoft decided to take advantage of to build a provider on top of Power Platform APIs to offer a new approach for the management of key configurations some of us are dealing with almost daily.

In the Power Platform Terraform provider you will be able to find 2 different groups of elements:

- **Data sources** (like connectors or environment locations) allowing Terraform to use information defined in Power Platform
- **Resources** (like Data Loss Prevention policies or tenant settings) giving the ability to manage configurations in Power Platform

To be able to use this provider you will need:

- An Azure subscription where you will configure a Storage Account with a Blob Container to be able to securely store the state files used by Terraform
- A service principal configured as defined in the provider documentation
- A basic understanding of how infrastructure as code, and most precisely Terraform, works

Then to configure and deploy your first Power Platform configuration using the Terraform provider you will be able to follow the high-level steps below:

1. Create a `.tf` file.
2. At the beginning of this file, define a `terraform` block for global settings (like the Power Platform Terraform provider as required) and include at least one `provider` block that specifies details on interacting with the chosen provider — in this instance, the authentication method for the Power Platform Terraform provider.
3. Define the Power Platform resource to configure (for example a data loss prevention policy) — for some of them, defining a data source could simplify the configuration (like getting available connectors for the configuration of a data loss prevention policy).
4. Run a series of Terraform commands: `terraform init` (to initialize the working directory containing your Terraform configuration file), `terraform plan` (to create an execution plan based on the current state in the state file, the "real" state of the resource and the changes in the configuration), and finally `terraform apply` (to execute the plan and apply the configuration changes).

To continue your exploration of what can be achieved using this approach, you can find more examples of code in the following repositories:

- [microsoft/power-platform-terraform-quickstarts](https://github.com/microsoft/power-platform-terraform-quickstarts)
- [rpothin/PowerPlatform-Governance-With-Terraform](https://github.com/rpothin/PowerPlatform-Governance-With-Terraform)

## The limitations / constraints of such approach

Before considering an eventual switch to managing Power Platform with infrastructure as code, specifically using the Terraform provider, there are a few points I would like to encourage you to consider:

- At the time when this article is written, Power Platform Terraform provider is an experimental capability and should not be used in Production. This also means that you will not find it in the official Terraform registry for the moment and that some extra steps (like the download of a release from the GitHub repository of the provider) will be required to be able to use it.
- Terraform requires maintaining and understanding state files, unlike Bicep where only the "real" state returned by the APIs is taken into account.
- Adopting Terraform for Power Platform management implies a full transition to infrastructure as code. I personally don't believe that a hybrid model (some manual changes of configurations managed with infrastructure as code still allowed) could be sustainable because it would imply many reconciliations in your code and in the state files.
- The provider relies on APIs that may not always be publicly documented and are subject to change. Moreover, based on the information I have, the provider is not directly maintained by the Power Platform product group. This could cause delays in taking into account changes to APIs used in the provider.
- Your team needs to have a good understanding of infrastructure as code concepts and how Terraform works to be able to maintain the configurations. It is pretty different than what a Power Platform administrator is used to doing.
- If your Power Platform governance is already pretty advanced and you have many resources you are thinking of transitioning to infrastructure as code, it is very likely that you will need to consider migration initiatives.

If you put into balance the pros and the cons of using the Power Platform Terraform provider to manage your configurations it is pretty clear that this approach will not be for all teams and all organizations.

But I am personally convinced that starting at a certain scale and if you prepare your team for such shift (training), it could be a choice that will make the difference coming to the required effort to maintain Power Platform in a healthy state.

In future articles, we will go through some scenarios where I think the Power Platform Terraform provider could provide great value. Stay tuned!

<div class="video-container">
  <iframe
    src="https://www.youtube-nocookie.com/embed/E8ZBybdeWYQ"
    title="Enhancing Power Platform Governance Through Terraform: Embracing Infrastructure as Code"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</div>

---

### Infrastructure as Code journey series

1. **Infrastructure as code for Power Platform, a light at the end of the tunnel?** ← _you are here_
2. [The Power Platform Infrastructure as Code journey — First stop: Inventory](/archive/infrastructure-as-code/02-first-stop-inventory)
3. [The Power Platform Infrastructure as Code journey — Dawn of transformation](/archive/infrastructure-as-code/03-dawn-of-transformation)
4. [The Power Platform Infrastructure as Code journey — A bright future](/archive/infrastructure-as-code/04-a-bright-future)
