---
title: "Integrate Help Panes in your ALM process"
date: 2019-12-23
tags: [dynamics-365, help-panes, alm, model-driven-apps, power-platform]
description: "Explains how to integrate Dynamics 365 Help Pane configurations into solutions so they can travel through your ALM pipeline alongside feature development, covering both adding existing Help Pages and creating new ones directly from a solution."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/integrate-help-panes-in-your-alm-process"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

## Introduction

We have seen in a [previous article](/archive/configure-help-panes-in-dynamics-365) how it is pretty simple to configure Help Panes in a model-driven app and how it can help you improve user adoption. But there is more!

Imagine you need to update a Help Pane on a form because a new feature was added, and you want to guide end users in its usage—directly in production. Timing can be tricky. Either you update the Help Pane too early or too late, and either way users could be confused by the misaligned guidance.

For me, one of the best advantages of Help Panes is that you can integrate their configurations directly into **solutions** to transport them between environments. That way, the people managing Help Panes can work alongside those building features, and their changes will follow the same pipeline as the rest of the app.

## Prerequisites

To manage Help Pages configurations:

1. Open a **solution**
2. Switch to **classic mode**
3. Go to the **Help Pages** section

## Add an Existing Help Page to a Solution

This is the easiest way to integrate a Help Page into a solution. Configure the Help Page directly from the model-driven app, and then add it to your solution to move between environments.

To do this:

1. In the **Help Pages** section of your solution (classic mode), click **Add Existing**
2. Select the Help Pages you want to include

Don't forget to **save** and **publish** your changes to the solution.

## Create a New Help Page from a Solution

This method is more complex and requires a good understanding of how Help Pages are configured. It can be useful when working on similar projects with reusable content (e.g., Lead in one project and Prospect in another, but with shared features).

Steps:

1. In the **Help Pages** section of your solution, click **New**

### Help Page Form Fields

- **Display Name**: Title displayed at the top of the Help Pane
- **Path**: Defines the page where the Help Pane will be shown
- **Content Type**: Usually `text/pphml` (typo likely in source—should be `text/html`)
- **Content**: The content code for the Help Pane. Refer to [Microsoft's documentation](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-custom-help-pages#custom-help-xml-definition) for details.
- **Locale**: The language in which the Help Pane is displayed

> Note: For now, if you create a Help Page from a solution, you still have to add it with **Add Existing** afterward.

Once the new Help Page has been created and added, remember to **save** and **publish** your solution.

## Conclusion

Once Help Pane configurations are integrated into a solution, you can follow your usual ALM process to move it across environments.

This article concludes my overview of the Help Panes feature in model-driven apps. I hope it provided enough information to consider how Help Panes can improve user adoption in your projects.
