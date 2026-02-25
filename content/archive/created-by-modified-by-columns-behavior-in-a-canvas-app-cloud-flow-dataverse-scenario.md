---
title: '"Created by" / "Modified by" columns behavior in a canvas app + cloud flow + Dataverse scenario'
date: 2021-08-16
tags: [power-platform, dataverse, canvas-app, power-automate, cloud-flow]
description: "An investigation into why 'Created by' and 'Modified by' columns in Dataverse don't reflect the actual end user when records are created via cloud flows triggered from canvas apps — and which connector configurations correctly resolve the issue."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/created-by-modified-by-columns-behavior-in-a-canvas-app-cloud-flow-dataverse-scenario"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Working on the development of a canvas app allowing a user to trigger a cloud flow creating a main records and associated child records in Dataverse, we noticed a disturbing behavior on the "Created by" and "Modified by" columns. The value in these columns did not correspond to the person using the canvas app.

After a little analysis, we found that the inconsistence of the value of these columns was coming from the configuration of the Dataverse connection in the cloud flow called from the canvas app.

In this article we will go through some configurations for this scenario and we will see that the outcomes can be really different.

## Details about the tests presented below

In a canvas app a user will provide a "Last Name" and click on a button to create a "Contact" in Dataverse. The click on the button will trigger a cloud flow.

The configurations and the tests should be done with different users to be able to demonstrate our points. In our case, "Pete Mitchell" will do the configurations and "Raphael Pothin" will test the scenarios.

![Canvas app for the tests of data creation with cloud flows](/content/archive/created-by-canvas-app-tests.png)

## Dataverse connector with a user connection ❌

![Microsoft Dataverse connector icon](/content/archive/dataverse-connector-icon.png)

- Connector: Microsoft Dataverse
- Connection configuration: By following the "classic" creation process or by creating a connection (or a connection reference if you are in a solution) on an action of this connector from a cloud flow.

  ![Connection reference creation for the Microsoft Dataverse connector inside a cloud flow with a user](/content/archive/created-by-user-connection-ref.png)

- Outcome: The person using the canvas app is not the one in the "Created by" and "Modified by" columns. These fields are populated with the name of the user who created the Microsoft Dataverse connection used inside the cloud flow called from the canvas app.

  ![Contact creation outcome with a Dataverse user connection](/content/archive/created-by-user-connection-outcome.png)

In the development phase this configuration can be enough, but I strongly encourage you to not use this approach in production. From an audit perspective or just considering the consistency of the data, it is pretty obvious that this configuration is not a good one.

## Dataverse connector with a service principal connection 🆗

![Microsoft Dataverse connector icon](/content/archive/dataverse-connector-icon.png)

- Connector: Microsoft Dataverse
- Connection configuration: By creating a connection (or a connection reference if you are in a solution) on an action of this connector from a cloud flow, selecting the "Connect with service principal" option and providing the app registration details.

  ![Connection reference creation for the Microsoft Dataverse connector inside a cloud flow with a service principal](/content/archive/created-by-sp-connection-ref.png)

- Outcome: The person using the canvas app is not the one in the "Created by" and "Modified by" columns. These fields are populated the name of the service principal used for the creation of the Microsoft Dataverse connection used inside the cloud flow called from the canvas app.

  ![Contact creation outcome with a service principal Dataverse connection](/content/archive/created-by-sp-connection-outcome.png)

I find this approach cleaner than the previous one (with the Dataverse user connection). If you don't need to have the user at the origin of the creation of the record in the "Created by" and "Modified by" columns this configuration is definitely the simplest one to implement.

## Dataverse (legacy) connector with a service principal connection ✅

![Microsoft Dataverse (legacy) connector icon](/content/archive/dataverse-legacy-connector-icon.png)

- Connector: Microsoft Dataverse (legacy)
- Connection configuration: By creating a connection (or a connection reference if you are in a solution) on an action of this connector from a cloud flow, selecting the "Connect with service principal" option and providing the app registration details.

  ![Connection reference creation for the Microsoft Dataverse (legacy) connector inside a cloud flow with a service principal](/content/archive/created-by-legacy-sp-connection-ref.png)

- Outcome: The person using the canvas app is the one we found in the "Created by" and "Modified by" columns 🎉

  ![Contact creation outcome with a service principal Dataverse (legacy) connection](/content/archive/created-by-legacy-sp-connection-outcome.png)

Finally, we found a configuration allowing us to have the correct information in the "Created by" and "Modified by" columns in the considered scenario. Currently, it seems we can only have the expected behavior with the Microsoft Dataverse (legacy) connector. But I am convinced that Microsoft will bring this feature to the Microsoft Dataverse connector at some point to reach parity.

## Patch then cloud flow with Dataverse connector with a service principal connection ✅

![Microsoft Dataverse connector icon](/content/archive/dataverse-connector-icon.png)

In the previous section, we have seen that currently the only way to have the user behind the canvas app in the "Created by" and "Modified by" columns in a Dataverse record created using a cloud flow triggered from the canvas app is by using the Microsoft Dataverse (legacy) connector.

But I think it is not the only way 😋 I perhaps found an alternative for people who really wants to use the Microsoft Dataverse connector.

- Connector: Microsoft Dataverse
- Configuration: Configure the creation of an intermediate record (in our case a Contact Creation Request) directly from the canvas app using the "Patch" function. The creation of this intermediate record in Dataverse will trigger a cloud flow using the Microsoft Dataverse connector configured with a service principal (like in a previous section of this article). In this cloud flow, we also need to choose either "Modifying user" or "Row owner" for the "Run as" property of the trigger, and to check the "Use invoker's connection" option on all Dataverse actions.

  ![Configuration of cloud flow with a service principal Dataverse connection and impersonation](/content/archive/created-by-impersonation-config.png)

- Outcome: The person using the canvas app is the one we found in the "Created by" and "Modified by" columns 🎉 It takes few seconds because we are now in an asynchronous design, but a notification on top of the canvas app indicate to the user that the record requested has been created 🤩

  ![Contact creation outcome with a patch followed which triggers a cloud flow with a service principal Dataverse connection](/content/archive/created-by-impersonation-outcome.png)

This design also allows us to have the expected behavior for the "Created by" and "Modified by" columns but it requires more efforts for the implementation. In a follow up article, I will describe what is the "magic" behind this solution 😉

I was really surprised to discover that cloud flows using the Microsoft Dataverse connector and called from a canvas app do not allow us today to have the person behind the app in the "Created by" and "Modified by" columns.

Fortunately, there are alternatives we can implement to have a better behavior for these columns in this kind of scenario.

Last point to consider is that the configurations where the outcome is the person behind the canvas app is the one in the "Created by" and "Modified by" columns use impersonation for Dataverse web API calls behind the scene. So, these solutions should be better from an API limits perspective but also regarding cloud flow limits 👍🏼
