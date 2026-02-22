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

> [!NOTE]
> If you don't have permission to run code for this validation, you can check with one of your colleagues in charge of managing Sensitivity Labels.

Once this initial step is completed, you can head to the Data Map solution of Microsoft Purview to onboard the Dataverse tables you are interested in tracking.

To easily identify which Dataverse tables to onboard into Microsoft Purview, assuming you will be interested in tracking the non-technical tables containing rows, code-based discovery is a practical approach.

Once the list of Dataverse tables to consider has been identified, you will need to go through the following steps in the Data Map solution in Microsoft Purview:

1. Initialize your data structure by creating a new Domain if needed — for example, it could be one under which you will only register Dataverse related assets.
2. Under your considered Domain, create a new Collection if needed — for example, it could be for the assets related to a single Dataverse environment.
3. Register the considered Dataverse environment as a Data Source under the considered Collection.
4. Give permissions to the Purview Managed Identity in the Dataverse environment to be able to scan it.
5. Configure and run a Scan from the Data Source related to the considered Dataverse environment, selecting the tables previously identified.

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

Then configure Microsoft Purview to scan a Fabric workspace:

> [!NOTE]
> Initially I planned to leverage the Purview account managed identity to run Data Map scans. Unfortunately, it seems in our context (Fabric shortcut for Dataverse) a service principal is required for Data Map scans, while the Purview account managed identity must be used for Data Quality scans.
>
> Additionally, to scan Fabric workspaces from Microsoft Purview, certain permissions need to be configured in Fabric for the relevant identities.
>
> Lastly, and importantly, 'metadata harvest for Fabric' still appears to be in preview.

Configure and run a Data Map scan for the Fabric Data Source by selecting the Workspace with the Lakehouse related to the considered Dataverse environment (capability currently in Preview).

> [!NOTE]
> As mentioned in the Microsoft documentation, classification and labelling are not currently supported for the Fabric Data Source. It is why from my perspective it is interesting to consider a combination with the Dataverse Data Source to benefit from more Microsoft Purview capabilities.

Once the Fabric assets related to the considered Dataverse environment are ready in the Data Map solution of Microsoft Purview, we can switch to the Unified Catalog solution where we will be able to set up the monitoring of the quality of our data:

1. Set up a Governance domain if needed.
2. Set up a Data product under the considered Governance domain if needed.
3. In the considered Data Product, add the Lakehouse tables related to the considered Dataverse environment you want to analyze as data assets.
4. Set up a connection to Fabric for your Governance domain to be able to run Data Quality scans.
5. Define Data Quality rules — such as checking for empty/blank fields — on the data assets.
6. Run a Data Quality Scan for the considered Dataverse table.
7. Analyze the result of the scan and the quality of your data.

And if you don't know where to start regarding the rules for the Data Quality scans, Microsoft Purview also offers a capability to profile data in a Data Asset and get insights to help decide how Data Quality scans should be configured.

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
