---
title: "Automate the integration between Dynamics 365 Sales and Teams"
date: 2020-10-24
tags:
  [
    power-automate,
    microsoft-teams,
    dynamics-365,
    microsoft-graph,
    power-platform,
  ]
description: "A walkthrough of an open-source starter kit that automates the Dynamics 365 Sales and Microsoft Teams integration, covering automatic channel and tab creation across the lead-to-opportunity lifecycle, along with lessons learned and current limitations."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/automate-the-integration-between-dynamics-365-sales-and-teams"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

After my article about Using Power Automate in your Teams creation process, I wanted to go a bit deeper in this subject. The obvious next step was to talk about Team channels and tabs management. But I wanted to make this exploration more concrete by applying those ideas to a business scenario.

Dynamics 365 Sales come with an out-of-the-box integration with Microsoft Teams. This feature allows to create a Dynamics 365 tab in a Team channel when a user click on a button on a record page.

Rather than just creating a new article, I decided to build an open source solution that could help people start automating this integration. In this article I will give you some details regarding this solution but also about some findings I have made building it and some limitations I (we) still need to work on.

[D365Sales-Teams-AutomatedIntegration-StarterKit GitHub repository](https://github.com/rpothin/D365Sales-Teams-AutomatedIntegration-StarterKit)

> This solution is not perfect and there is still lot of things I would like to improve it in the future. But I really hope it will help some people start their journey to an automated integration between Dynamics 365 Sales and Microsoft Teams. And if you want to contribute to this project do not hesitate to contact me. I will be happy to bring you in and work on it with you.

## The key concepts of this integration

Before automating the integration between Dynamics 365 Sales and Microsoft Teams, the first thing to do was to understand how the out-of-the-box feature works.

Behind the scenes when a user clicks on the "Collaborate" button on a record page in Dynamics 365, the system will at least do the two things below:

- Create a Dynamics 365 tab in the targeted Team channel and pointing to the originating record

> The automation of this part was a bit tricky because it was really important to understand the format of the request body for the call to Microsoft Graph. The Provision Dynamics 365 Tab to Microsoft Teams article by Matti Paukkonen was helpful and you should definitely take a look at it if you want to have a good understanding of this piece of the solution.

- Create a Microsoft Teams Collaboration record in Dynamics 365 that will hold many details regarding the tab created in Teams (I do not know exactly how, but this action will also automatically generate a Document Location record that will allow the users to have access the files in the Teams channel where the Dynamics 365 tab has been created)

Have a better understanding of what is going on allowed me to build this first version of the solution.

## The basics of the solution

The main idea behind the solution is to automate the management of a Dynamics 365 tab in Teams during a simple sales process that will go through a Lead and an Opportunity.

Another key idea was to try to keep the conversation made in Teams on a Dynamics 365 tab in the case we do not change of Teams channel (sales process for an existing Account with its associated channel).

The main features you will find in the solutions are:

- Creation of a channel when a new Account is created with a Dynamics 365 tab linked to the Account record
- Creation of a Dynamics 365 tab when a Lead is created in a Prospection channel or in the Parent Account channel if he is linked to one
- "Moving" (deleting the existing tab and created a new one) a Dynamics 365 tab to the Parent Account channel when a Lead is qualified and an Opportunity created for a new Account
- Updating the link to the Dynamics 365 record on a Dynamics 365 tab when a Lead is qualified and an Opportunity created for an existing Account
- Deleting a Dynamics 365 tab when a Lead is disqualified or an Opportunity is closed (as won or as lost)

I also tried to manage all the small updates that could happen along the way (like the update of the Parent Account on a Lead or an Opportunity).

## What I have learned

- Obviously how the integration between Dynamics 365 Sales and Microsoft Teams works
- How to use environment variables in a solution and to manage them in an automated build process: in my build pipeline I eliminate all the environment variable values I export from my development to not include this information in the repository or in the solution in the GitHub release

> The Tip of the Day #1363 give the best way to manage environment variables in Power Automate using a Child Flow. This article was also a good reminder on how to manage Child Flow outputs using the Respond to a PowerApp or flow action.

- How to build a solution and make it available as a GitHub release using GitHub as repository and Azure Pipelines as CI/CD engine: I have learned than making a commit in a GitHub repository from a pipeline in Azure DevOps is a bit different than doing it in an Azure DevOps repository, and I also have learned how to create a GitHub release
- The first steps of building an open source project in GitHub: even if I am still the only contributor on this project, I have tried to follow the best practice regarding the organization of an open source project in GitHub so if someone want to join me the onboarding should not be too complicated

## Current known limitations

- Nothing is done on the organization of the channel "Files" space: when a Dynamics 365 tab is created, the corresponding document location in Dynamics 365 will present the root of the channel "Files" space
- The solution is for now only based on one Team and one "Prospection" channel: if you want to manage a more complex organization in Teams and more structured mapping rules you will need to make few changes in the solution
- All Accounts, Leads and Opportunities are considered: this will definitely not work for organization who have many Accounts, and / or many Leads and Opportunities simultaneously opened

I really think this starter kit is the beginning of something that could benefit many organizations (until Microsoft will come with its own automated integration). But, I am aware that there is still lot of work to do before it could become an "interesting thing".

In the same time, this project is really great to experiment and discover new things around the Power Platform and Microsoft Teams. So, I am sure I am not loosing my time working on this project.

> Again, if you want to contribute to this project do not hesitate to contact me. I will be happy to welcome you on board and to have the chance to work with you.
