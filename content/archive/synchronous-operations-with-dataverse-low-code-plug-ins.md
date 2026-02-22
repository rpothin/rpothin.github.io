---
title: "Synchronous operations with Dataverse low-code plug-ins"
date: 2023-06-05
tags: [power-platform, dataverse, low-code, power-fx, alm]
description: "An early look at Dataverse low-code plug-ins — instant and automated flavors — including what they look like behind the scenes in source control, and why they could blur the line between low-code and code-first development."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/synchronous-operations-with-dataverse-low-code-plug-ins"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Whether you were looking for a replacement for "classic" workflows for synchronous operations since a long time or you could be interested in replacing "simple" child flows used in different scenarios, Dataverse low-code plug-ins could definitely be an interesting approach for you.

> [!WARNING]
> This feature is in "experimental" state and should definitely not be used in a Production context. What we will talk about in this article is more a preview of what the future in this area could be.
>
> Update on 2024-02-14: Dataverse low-code plug-ins are now in "Preview" state. But it does not change the fact that it should still not be used in a Production context.

## Overview

Dataverse low-code plug-ins come in two different flavors:

- Instant plug-ins: equivalent to Dataverse custom APIs or Power Automate child flows, they will allow you to execute business logic with some inputs and eventually return outputs from many places like canvas apps, custom pages or cloud flows
- Automated plug-ins: equivalent to Dataverse synchronous plug-ins or Dataverse synchronous background workflows, they will allow you to automatically execute business logic on events on Dataverse records, like create or update

One really interesting idea Dataverse low-code plug-ins bring to the table is the capacity to build business logic that goes beyond Dataverse boundaries, exploiting the connectors available in the Power Platform.

> [!NOTE]
> Currently this capacity is limited to the SQL Server execute stored procedures (V2) action but we can easily imagine it is just a start.

A few other important points to consider regarding the current state of this feature are:

- The management of the Dataverse low-code plug-ins need to go through a (great) custom model driven app built by the Microsoft Power CAT team — congratulations to them for their amazing work on it by the way!
- Application lifecycle management (ALM) is only supported for instant plug-ins for the moment and we will need to be more patient for automated plug-ins

Last but not least, Microsoft took the time to prepare a few examples of Dataverse low-code plugins you could try and explore to better understand the capabilities of this feature.

> [!TIP]
> These examples are available with the Dataverse Accelerator App I talked about earlier, and I definitely encourage you to take a look at them.

## What's going on behind the scenes?

When you create Dataverse low-code plug-ins, obviously there are a few things going on behind the scenes.

The first thing you could quickly discover in the "Solutions" section of the Power Apps maker portal is that there is a new "FxExpression" object type where you will find one line per Dataverse low-code plug-in you have in your environment.

Unfortunately, at the moment, if you try to access the details of a FxExpression you will get the following unpleasant error message: "The record you are trying to access does not have a form to display. Please contact your administrator for assistance.". But I am sure Microsoft will provide a form for FxEpressions in an upcoming version.

> [!NOTE]
> The next details are provided thanks to a strange passion of the author of this article to take a look at object dependencies to understand how things work inside Dataverse.

For instant plug-ins, we can see that an FxExpression have

- a custom API as dependent object (obviously coming with request and response parameters depending on the inputs and outputs configured)
- required objects related to the business logic configured (for example, the "User" table and the "Primary Email" column in the "User" table for the "Send in-app notification" sample FxExpression)

For automated plug-ins we find only tables and columns as dependent objects (depending on the business logic implemented) — so definitely not enough clues to help us understand how this part of the capability works.

Doing a quick search in all the objects in the environment with the name of an automated plug-in FxExpression, we can discover a Plug-In Step — definitely involved in this kind of Dataverse low-code plug-in.

Checking the dependencies of this Plug-In Step, we finally find a Plug-In Type named "Microsoft.PowerFx.Evaluator" and coming from the "msft_PowerfxRuleSolution" solution.

> [!NOTE]
> This analysis gives us, from my point of view, interesting reasons to help us understand the difference regarding application lifecycle management (ALM) support between instant (custom API with parameters) and automated plug-ins (plug-in type from a Microsoft solution perhaps not available on all environments by default).

## What FxExpression objects look like in source control?

I cloned locally a solution containing FxExpression objects to show you what they are made of.

A FxExpression object in source code can contain up to 3 files:

> [!NOTE]
> The "cat_Sendin-appnotification" FxExpression, for example, contains only a "fxexpression.json" file with not much in it because it is related to one of the examples of Dataverse low-code plugins provided by Microsoft — obviously managed.

- **fxexpression.json**: metadata of the FxExpression object with details like name, unique name, parameters (if it is an instant plug-in), status (statecode and statuscode) and if it is customizable or not

- **expression.yaml**: PowerFx code configured in the related Dataverse low-code plug-in

- **dependencies.json**: some dependencies which seems required to make the considered Dataverse low-code plug-in work

> [!NOTE]
> In my example, the "cr6ab_Createaccountandprimarycontact" FxExpression, I am bit surprised by the content of the "dependencies.json" file because my business logic has dependencies with some columns of the "contact" table, but also with the "name" column of the "account" table. But this result is consistent with the dependencies listed in the Power Apps maker portal.

Whether for low-code developers or code-first developers, I think this new Dataverse low-code plug-ins capability will bring value to Power Platform but also blur the line between low-code and code-first development.

In one hand, instant plug-ins will give a way between instant cloud flows and custom APIs to apply business logic on inputs and eventually return outputs. And on the other hand, automated plug-ins will offer an alternative to synchronous background operations (aka "classic" workflows) — for the low-code side — and synchronous plug-ins — for the code-first side.

As a code-first developer I can definitely imagine "simple" scenarios where a code-first approach (involving to manage C# code outside of the solution and complexifying a bit the ALM strategy) would be too much, but where I would still like to have visibility on some code — cloud flows not offering this.
