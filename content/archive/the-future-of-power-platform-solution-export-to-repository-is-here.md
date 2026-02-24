---
title: "The future of Power Platform solution export to repository is here!"
date: 2022-09-29
tags: [power-platform, alm, power-platform-cli, source-control, devops]
description: "First impressions of the pac solution clone and sync commands, which streamline getting Power Platform solutions into a repository by eliminating the traditional export-then-unpack workflow."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/the-future-of-power-platform-solution-export-to-repository-is-here"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

When someone like Mike Factorial shares interesting news about new Power Platform CLI commands, it is really difficult to not be curious and want to try the things talked about. So here I am, sharing my first impressions about some `pac solution` commands: `clone` and `sync`. I hope you will find that interesting and exciting!

![Mike Factorial sharing news on Twitter related to some pac solution commands](/content/archive/pac-solution-mike-factorial-tweet.png)

> [!NOTE]
> These commands are not really new (`pac solution clone` was introduced in version 1.1.6 released in 2019 and `pac solution sync` was introduced in version 1.17.6 released more recently — less than 2 months ago). A big thank you to Diana Birkelbach who brought this point to my attention (and who wrote a blog article about the `pac solution clone` command) and helped me improve the information in this article.

## The "old" way to get a Power Platform solution in a repository

Yesterday, if you were looking to store the details of a Power Platform solution to a repository you normally had to go through the steps below:

1. Export the solution
2. Unpack it

Completing these 2 steps was possible by:

- going to the Power Apps maker portal if you were doing things manually
- using the following commands of Power Platform CLI: `pac solution export`, then `pac solution unpack`
- using the following tasks of Power Platform Build Tools extension in Azure DevOps: Power Platform Export Solution, then Power Platform Unpack Solution
- using the following actions from the microsoft/powerplatform-actions repository in GitHub: `export-solution`, then `unpack-solution`

## Overview of pac solution clone / sync commands usage

From my point of view, the `pac solution clone` command will be a good option to generate the "new / right" folder structure in your repository (or locally) for an existing unmanaged solution deployed in an environment.

> [!TIP]
> To create a new solution directly from the repository an alternative could be to use the `pac solution init` command.

![Example of call to the pac solution clone command](/content/archive/pac-solution-clone-command.png)

After this first step, you should now have the "new / right" folder structure for your solution in your repository (or locally).

The next step will be to work on your solution in the Power Apps maker portal and to get your changes in your repository (or locally).

To complete this last step, you will need to be positioned in the folder generated earlier, and then you will be able to execute the `pac solution sync` command.

![Example of call to the pac solution sync command](/content/archive/pac-solution-sync-command.png)

And just like that, you will get the changes done in the Power Apps maker portal in your repository (or locally).

## The main changes with pac solution clone / sync

From my point of view, the key changes with this new method are:

- not having a zip file to manage (export and unpack)
- being capable of getting the content of a solution to a repository (or locally) in only one step
- having a different folder structure for the unpacked solution compared to the traditional export and unpack approach

![Solution folder structure comparison depending on the method](/content/archive/pac-solution-folder-structure.png)

- being able to directly add references to an existing solution (like for PCF components) using the `pac solution add-reference` command because the folder structure in the repository (or locally) is already "right"

I personally consider removing the solution zip file from the process of getting changes from Power Platform to a repository a big step in the right direction (but I can't really imagine what it will mean for people who worked with this solution zip files for longer than me).

Even if from a performance perspective my first tests did not show a notable improvement with the new method, I think that using the `clone` and `sync` commands could definitely contribute to the improvement of the development and ALM processes with Power Platform.
