---
title: "Using Power Automate in your Teams creation process"
date: 2020-04-24
tags:
  [
    power-automate,
    microsoft-teams,
    microsoft-graph,
    power-platform,
    custom-connectors,
  ]
description: "Explores three Power Automate-based approaches to automating Microsoft Teams creation — cloning a template team, creating a team from scratch via an Office 365 group, and using the beta Microsoft Graph endpoint — as part of a governed self-service Teams request process."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/using-power-automate-in-your-teams-creation-process"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Teams is a key communication element of the Microsoft ecosystem. Today, more than ever, this solution is at the center of the activities of many companies around the world.

A powerful tool like this one can become a nightmare for IT administrators if you let anyone do what they want in it. On another side, it is sad to see a company completely block the possibility to create Teams for end users.

The objective of this article is to show you how you can use Power Automate to bring some order in your Teams creation process, involving everyone in your company, but implementing some rules.

## Prerequisites

In the demonstrations below, I will use custom connectors built to interact with the Microsoft Graph API (you can find how to build this custom connector in my [previous article](/archive/create-a-custom-connector-for-microsoft-graph)).

In the first custom connector, I will have the following actions configured:

- Clone a Team: [https://learn.microsoft.com/en-us/graph/api/team-clone?view=graph-rest-1.0](https://learn.microsoft.com/en-us/graph/api/team-clone?view=graph-rest-1.0)
- Create a Group: [https://learn.microsoft.com/en-us/graph/teams-create-group-and-team](https://learn.microsoft.com/en-us/graph/teams-create-group-and-team)
- Create a Team under an existing Office 365 group: [https://learn.microsoft.com/en-us/graph/api/team-put-teams?view=graph-rest-1.0&tabs=http](https://learn.microsoft.com/en-us/graph/api/team-put-teams?view=graph-rest-1.0&tabs=http)
- Add an Owner to a Group: [https://learn.microsoft.com/en-us/graph/api/group-post-owners?view=graph-rest-1.0&tabs=http](https://learn.microsoft.com/en-us/graph/api/group-post-owners?view=graph-rest-1.0&tabs=http)
- Add a Member to a Group: [https://learn.microsoft.com/en-us/graph/api/group-post-members?view=graph-rest-1.0&tabs=http](https://learn.microsoft.com/en-us/graph/api/group-post-members?view=graph-rest-1.0&tabs=http)
- Get Team operation status: [https://learn.microsoft.com/en-us/graph/api/resources/teamsasyncoperation?view=graph-rest-1.0](https://learn.microsoft.com/en-us/graph/api/resources/teamsasyncoperation?view=graph-rest-1.0)

And in the second one, we will have actions for the following service of the beta version of the Microsoft Graph API:

- Create a Team (beta): [https://learn.microsoft.com/en-us/graph/api/team-post?view=graph-rest-beta](https://learn.microsoft.com/en-us/graph/api/team-post?view=graph-rest-beta)
- Get Team operation status (beta)

## Our strategy

In this article, we will consider the strategy below to allow the members of our company to easily create a new Team (most precisely, request the creation of a new Team).

1. Know which kind of Teams your company needs the most (ex: customer project, research project...)
2. Create a Team template for each one of them and store their ID somewhere (ex: a custom entity in the Common Data Service)
3. Encourage the members of your company to choose one of this Team templates when they ask for the creation of a new Team
4. But also give the option to request the creation of a blank Team with a preset list of configurations, in the case of there is no Team template corresponding to their need

Obviously, this strategy should come with approval processes, but this would be the only human actions needed for the Teams creation.

Also, I encourage you to regularly review the two first points presented above to keep your Team templates list up to date based on your company's activities.

> [!TIP]
> I did not include the following points in the flows below, but I encourage you to add them if you plan to deploy a solution like this:
>
> - Store the details of each Team creation request (in the CDS for example) and track its status through the execution of the involved flows
> - Integrate an approval process in your flows to validate that every Team creation request respects the governance criteria of your company

## Clone a Team template to create a new one

> [!TIP]
> Timo Pertilä published a great article on configuring a solution for cloning Team templates. I definitively encourage you to read it — even if some things described have changed since it was written, it remains a solid reference.

The cloning of a Team based on a template can be done with a flow like the one detailed below:

- Manually trigger a flow with needed inputs

> [!NOTE]
> This way simplifies the tests, but also allows us to call this flow from another one with the "Run a Child Flow" action.

- Initialize some variables we will use in the flow: the parts of the Team template to report in the new Team, the status of the cloning operation and the ID of the new Team

- Configuration of the "partsToClone" variable needed for the Team cloning based on some of the input parameters

- Control of the "partsToClone" variable configuration before continuing the flow execution. If the variable has been correctly initialized, we finalize its configuration.

- Cloning of the selected Team template and removing of the first character of the "Location" variable return by the Team template cloning operation

- Check the Team template cloning operation status until it is "succeeded" or if too many checking has been made. And if it is "succeeded" update the "teamId" variable with the ID of the new Team.

- Control of the result of the Team template cloning operation, and if it is "succeeded" we continue the execution of the flow

- If everything is good so far, we add the requester of the Team creation as Owner

> [!NOTE]
> The Team creation requester is added as both Member and Owner because adding someone manually as an Owner automatically makes them a Member as well.

- Finally, send a notification (this is an example of what you can do to conclude this kind of flow)

> [!IMPORTANT]
> Keep in mind the following when using the cloning method:
>
> - **Remove the default "Wiki" tab** from channels in your Team template. It is automatically re-added during cloning, resulting in duplicate "Wiki" tabs — one already configured, one not.
> - **App tabs** (e.g., OneNote, Azure DevOps, Power Apps) carry over to the new Team, but each one still needs to be reconfigured manually.
> - **Private channels** are not included in the cloning process and will not appear in the new Team.

## Create a new Team from scratch

The creation of a new Team from scratch is two steps process. First, we will create an Office 365 group, then we will add a Team to it.

I have integrated these steps in the flow below:

- Manually trigger a flow with needed inputs

> [!NOTE]
> This way simplifies the tests, but also allows us to call this flow from another one with the "Run a Child Flow" action.

- Get the details for the user executing the flow and the person who requested the creation of the Team, and then build variables to set the owners of the new Team

- Creation of the Office 365 Group with the following parameters hard coded to be able to add a Team to it later:

> [!NOTE]
> **Group Creation Parameters:**
>
> - **groupTypes:** { "Unified" }
> - **mailEnabled:** true
> - **securityEnabled:** false
>
> **Bindings:**
>
> - `members@odata.bind` Item 1 and `owners@odata.bind` Item 1 are set with the output of the **Current User Owner** variable action.
> - `members@odata.bind` Item 2 and `owners@odata.bind` Item 2 are set with the output of the **Requester Owner** variable action.
>
> The Team creation requester is added as both Member and Owner because adding someone manually as an Owner automatically makes them a Member as well.

- Then we create a Team under our new Office 365 Group (with some parameters hard coded to simplify our demonstration)

- Finally, send a notification (this is an example of what you can do to conclude this kind of flow)

> [!NOTE]
> This flow contains fewer actions than the others, but keep in mind that you will still need to configure the channels and apps in your new Team manually.

## Beta version of the creation of a new Team from scratch

There is now another way to create a Team with a service in the beta version of Microsoft Graph.

In the flow we will present below, we will create a new Team that will be configured based on some inputs:

- Manually trigger a flow with needed inputs

> [!NOTE]
> This way simplifies the tests, but also allows us to call this flow from another one with the "Run a Child Flow" action.

In the "channels" variable, we expect a string like the one below:

```json
[
  {
    "displayName": "Channel Display Name",
    "isFavoriteByDefault": true,
    "description": "Channel description",
    "tabs": [
      {
        "teamsApp@odata.bind": "https://graph.microsoft.com/v1.0/appCatalogs/teamsApps('com.microsoft.teamspace.tab.web')",
        "name": "A Website",
        "configuration": {
          "contentUrl": "/microsoftteams/microsoft-teams"
        }
      }
    ]
  }
]
```

And in the "installedApps" variable, we expect a string like the following one:

```json
[
  {
    "teamsApp@odata.bind": "https://graph.microsoft.com/v1.0/appCatalogs/teamsApps('com.microsoft.teamspace.tab.vsts')"
  }
]
```

- To be able to use the "channels" and "installedApps" variables we have in the inputs of the flow later in the creation of the Team, we have to force their type as JSON with the method below

- Initialize some variables we will use in the flow: one to indicate if the new Team will be searchable and suggested or not, and the other ones to get the status of the creation operation and the ID of the new Team

- Update of the "showInTeamsSearchAndSuggestions" variable based on the "visibility" variable we got in the inputs, and get the details for the user executing the flow to build the variable to set him as Owner of the new Team in the creation operation

- Call the Team creation service with all the parameters we prepared in the previous steps

> [!NOTE]
> Parameter bindings for the Team creation call:
>
> - **owners@odata.bind Item - 1:** set with the output of the "Current User Owner" variable action
> - **channels:** set with the output of the Initialize "channelsArray" variable action
> - **installedApps:** set with the output of the Initialize "installedAppsArray" variable action

- Remove the first character ("/") of the "Location" variable in the response of the Team creation service call

- Check the Team creation operation status until it is "succeeded" or if too many checking has been made. And if it is "succeeded" update the "teamId" variable with the ID of the new Team.

- Control of the result of the Team creation operation, and if it is "succeeded" we continue the execution of the flow

- If everything is good so far, we add the requester of the Team creation as Owner

> [!NOTE]
> The Team creation requester is added as both Member and Owner because adding someone manually as an Owner automatically makes them a Member as well.

- Finally, send a notification (this is an example of what you can do to conclude this kind of flow)

> [!TIP]
> This Team creation service in the beta version of Microsoft Graph is particularly versatile: a single service covers both scenarios from the beginning of this article — creating Teams from templates and creating Teams from scratch. If you store values for the "channels" and "installedApps" variables somewhere (like the CDS) and populate them based on user inputs, they act as templates. If left empty, the result is a blank Team.

In my examples above I stayed simple in my configurations, but obviously, you can go deeper in the configuration of the Office 365 Group, the Team, the SharePoint site...

Obviously, these examples are just the automation part of your Team creation solution. But the Power Platform provides some interesting ways to give your users access to this, like through a canvas app, or even a bot built with Power Virtual Agent. Just bring this automation brick where your users are likely to use it.

Thanks to someone who left a comment on this article, I decided to put the solution I built for this article to GitHub. Here is the link to the procedure if you want to try these flows: [https://github.com/rpothin/Power-Platform-Ideas/tree/main/TeamsCreationAutomationWithPowerAutomate](https://github.com/rpothin/Power-Platform-Ideas/tree/main/TeamsCreationAutomationWithPowerAutomate)
