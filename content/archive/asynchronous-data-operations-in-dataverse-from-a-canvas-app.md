---
title: "Asynchronous data operations in Dataverse from a canvas app"
date: 2021-08-23
tags: [power-platform, dataverse, canvas-app, power-automate, power-fx]
description: "A walkthrough of an asynchronous design pattern where a canvas app uses the Patch function to create a Dataverse record that triggers a cloud flow, with the app polling for completion and notifying the user once data operations are done."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/asynchronous-data-operations-in-dataverse-from-a-canvas-app"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Let's consider a moment a scenario where we would like to make data operations in Microsoft Dataverse from a canvas app.

Obviously, we could:

- make a synchronous call to a cloud flow from the canvas app that will handle the data operations and send back a response
- orchestrate everything directly in the canvas app using the "Patch" function and Power Fx

But both of these methods have some disadvantages:

- if the cloud flow is turned off or if the Power Automate services are not available (from a networking or a compute perspective for example) you will lose the data operations requested by the canvas app user
- if the cloud flow run is too long and the canvas app wait an answer, the user experience risk to be disappointing (and you can't really simply close the canvas app after calling the cloud flow either)
- depending on the complexity of the considered data operations, it can be difficult to implement that directly using the "Patch" function and Power Fx

One alternative would be to create or update a record from the canvas app using the "Patch" function and to have a cloud flow triggered by the event on this record. At the end of the data operations the user would be notified directly in the canvas app. In this article we will go through the details we need to consider if we want a solution like this one to work.

## The demonstration scenario

In a canvas app a user will provide a "Last Name" and click on a button to create a "Contact Creation Request" record in Microsoft Dataverse using the "Patch" function.

The creation of the "Contact Creation Request" record in Microsoft Dataverse will trigger a cloud flow that will create a "Contact" record in Microsoft Dataverse based on the information in the request created from the canvas app.

Once the canvas app will detect that the "Contact" record requested has been created in Microsoft Dataverse, a notification will be displayed to the user.

## 1. The "Contact Creation Request"

In the canvas app, the `OnSelect` event of the button uses the Power Fx `Patch` function to create a "Contact Creation Request" record in Dataverse. `TextInput_ContactLastName` is the text input component where the user enters the last name of the "Contact" to create in Microsoft Dataverse.

## 2. The cloud flow for the creation of the "Contact"

To be able to execute the cloud flow in the context of the canvas app user (at the origin of the "Contact Creation Request" record) it needs to be configured as follows:

- Connector: Microsoft Dataverse
- Trigger: When a row is added, modified or deleted with the "Run as" properties set to "Modifying user" or to "Row owner" (in our case we can choose "Row owner" because we don't manipulate the owner of the "Contact Creation Request" record)
- Step: Add a new row with the "Use invoker's connection" option enabled

This configuration of the cloud flow allows us to have the canvas app user in the "Created by" and "Modified by" columns of the "Contact" record that will be created (see ["Created by" / "Modified by" columns behavior in a canvas app + cloud flow + Dataverse scenario](/archive/created-by-modified-by-columns-behavior-in-a-canvas-app-cloud-flow-dataverse-scenario) for more details).

## 3. The detection of the creation of the "Contact" and the notification

With this approach, we don't have visibility on the "Contact" record creation from the canvas app. So, we need to find a way to get this information to be able to notify the user when the data operations are done (in our case the "Contact" record creation).

To achieve this, we will use the components below in the canvas app:

- a "Timer" to refresh the "Contacts" collection and to check if the requested "Contact" record has been created
- a "Toggle" to trigger the notification to the user

You will find below more details on the configuration of the canvas app for our demonstration scenario:

- `OnVisible` event of the considered screen
- `OnSelect` event of the button for the "Contact Creation Request" record creation
- `Duration` property of the timer component set to `5000` (for 5 seconds between each cycle)
- On the timer component, `Repeat` property set to `true` and `Auto start` set to `false`
- `OnTimerEnd` event of the timer component
- `OnCheck` event of the toggle component

Even if our demonstration scenario is really simple, it shows you the concept. Obviously, in a more complex use case you will need to be more creative to achieve a similar result.

For example, if we consider a scenario with a cloud flow creating multiple child records for a record created from the canvas app, we could add a boolean field on the parent record that would be updated at the end of the cloud flow to indicate that everything has been correctly initialized and we would have a check on the value of this field with the "LookUp" function in the canvas app.

Also, keep in mind that if the cloud flow run is too long this scenario will not be more helpful than another one. You will definitely need to consider options like allowing the user to move in the canvas app (making a bit more complex the notification of the end of the data operations) or integrating a more direct notification mechanism (email or teams notification) directly from the cloud flow with a "landing page" in the canvas app telling the user where he will be able to find the notification of the end of the data operations.
