---
title: "Create a custom connector for Microsoft Graph"
date: 2020-03-24
tags:
  [power-platform, microsoft-graph, custom-connectors, azure-ad, power-automate]
description: "A step-by-step guide to building a Microsoft Graph custom connector in Power Apps or Power Automate, covering Azure AD app registration with OAuth 2.0, connector security configuration, and adding a first action using the Teams creation API as a live example."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/create-a-custom-connector-for-microsoft-graph"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Even if the number of connectors available in the Power Platform is continuously growing, there is still sometimes the need to interact with services that do not already have their own connector. In those cases, Microsoft provide the capacity to configure custom connectors in Power Apps or Power Automate ([Microsoft documentation about custom connectors](https://learn.microsoft.com/en-us/connectors/custom-connectors/)).

Microsoft Graph is an amazing solution that allow to interact with the Microsoft 365 platform through an API. You will find below some key resources to help you start with Microsoft Graph:

- [Microsoft Graph documentation by Microsoft](https://learn.microsoft.com/en-us/graph/overview)
- [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)

Sadly, today, there is not a Microsoft Graph connector in the Power Platform. So, in this article, we will see how to build a custom connector for Microsoft Graph from scratch, with the objective to build a solution with the Power Platform for on-demand Teams, channels or even tabs creation.

> [!TIP]
> There is also a great set of Microsoft documentation pages about the creation of a Microsoft Graph custom connector, and I invite you to read it.

## Microsoft Graph application registration in Azure Active Directory

The goal of this first step, is to provide a secure way to use our Microsoft Graph custom connector through Azure Active Directory authentication.

To do so, you can follow the steps below:

- Connect to the Azure portal
- Go to the Azure Active Directory service page
- Open the App registrations section
- Continue by clicking on the + New registration button
- Then, in the Register an application page, fill in the following fields:
  - **Name:** enter a meaningful and understandable name (ex: MS Graph App)
  - **Account Types:** select who can access the application — options are:
    - Work accounts in the current tenant only
    - Work accounts in any tenant
    - Work accounts in any tenant and personal Microsoft accounts
  - **Redirect URI:** leave empty for now
- Click on the Register button to finalize the registration of the application (but, we still have things to configure, so stay with me)

At the end of the previous steps, you will be redirected on the Overview page of the new registered application

- Here, copy the Application (client) ID, because we will need it later
- Once this is done, go to the API Permissions section

On this page, we will select the rights we need our application to have to answer to our needs.

- To do so, click on the + Add a permission button.
- In the pane that appears on the right on your screen, choose Microsoft Graph in the "Commonly used Microsoft APIs" section
- Choose Delegated permissions as the type of permissions the application requires

> [!NOTE]
> The two permission types differ in scope:
>
> - **Delegated permissions** are granted to a signed-in user without extending their own permissions within Azure Active Directory on the tenant.
> - **Application permissions** are granted to the application itself and almost always require admin consent.
>
> Always check which permission type is supported by the API you want to use before choosing.

- Then search and select the permissions you want to set on your application
- When it is done, you can click on the Add permissions button at the bottom of the pane

> [!NOTE]
> Whether you need to grant tenant-wide admin consent depends on the permissions you selected. In our case, this is not required to continue.

- Go to the Certificates & Secrets section
- Click on the + New client secret button
- Enter a meaningful and understandable Description
- Choose a retention period for the client secret you are creating for your application (options described below)

Available retention periods:

- Client secret expires 1 year after creation
- Client secret expires 2 years after creation
- Client secret never expires

- Click on the Add button to finalize the creation of the client secret
- Then, copy the Client Secret value, because we will need it later

> [!WARNING]
> If you do not copy the Client Secret value at this moment and leave this page, you will lose it permanently.

At this moment, you should have:

- An application registered in Azure Active Directory with permissions for the Microsoft Graph API
- The Application (client) ID of the application copied somewhere safe
- The Client Secret value of the application copied somewhere safe

And with all that, we will be able to pursue with the creation of the Microsoft Graph custom connector.

## Creation of the Microsoft Graph custom connector

Once you have an application registered in Azure Active Directory for the Microsoft Graph API, you can follow the next steps to create a custom connector based on it:

- Open Power Apps or Power Automate
- Unfold the Data section
- Then, click on Custom Connectors
- Click on the + New custom connector button
- And select the Create from blank option
- Enter a meaningful and understandable Name (ex: "MS Graph Custom"), and then click on the Continue button
- On the first screen, configure the general properties of the custom connector:
  - Upload a connector icon, or set an icon background color
  - **Description:** enter a meaningful description (ex: Custom connector for the MS Graph API)
  - Leave the Connect via on-premises data gateway option unchecked
  - **Scheme:** select HTTPS
  - **Host:** `graph.microsoft.com`
  - **Base URL:** `/v1.0/`

![General configuration of our custom connector](/content/archive/msgraph-connector-general-config.png)

- Once it is all set on this screen, you can click on the Security -> button

- On the Security page, complete the information as described below:
  - **Authentication type:** OAuth 2.0
  - **Identity Provider:** Azure Active Directory
  - **Client id:** paste the Application (client) ID copied during the Azure AD app registration
  - **Client secret:** paste the Client Secret copied during the Azure AD app registration
  - **Login URL:** `https://login.windows.net`
  - **Tenant ID:** `common`
  - **Resource URL:** `https://graph.microsoft.com`
  - **Scope:** leave empty

- Click on the Definition -> button to go to the next section
- Then, click on the Create connector button
- Go back to the Security section (by clicking on 2. Security in the process bar)
- Copy the value generated in the Redirect URL field on the Security page
- Go back to your application registered in Azure Active Directory for the Microsoft Graph API
- Open the Authentication section
- In the existing Redirect URI Web line, enter the Redirect URL copied a few steps earlier
- And finish this update of the registered application by clicking on the Save button

Once all this is done, you will be able to test the connection to your new custom connector by following the steps below:

- Go back to Power Apps (or Power Automate) where you were configuring your custom connector for the Microsoft Graph API (you should be on the Security section)
- Go to the Test section (by clicking on 4. Test in the process bar)
- Click on the + New connection button
- In the pop-up that appears, click on the Create button
- Connect with a Microsoft account
- If you get asked for, give the necessary authorizations to the custom connector by checking the Consent on behalf of your organization option

If the custom connector you created is correctly configured, you will see a new connection with its status set to "Connected" in the list of connections.

That's awesome! But, for now, our custom connector does not have any action. So, let's focus on this point in the next part.

## Configuration of an action in our new Microsoft Graph custom connector

For the demonstration, I have selected the following Microsoft Graph service: Create team

Follow the steps below to see how to configure this action in our new custom connector:

- Go to the Custom Connectors section in Power Apps (or Power Automate)
- Open in edition the custom connector we created earlier
- Go to the Definition section (by clicking on 3. Definition in the process bar)
- Click on the + New action button
- Complete the information in the General section of the page:
  - **Summary:** enter a meaningful summary (ex: Add Team to Office 365 group)
  - **Description:** enter a meaningful description (ex: Add a Team to an existing Office 365 group)
  - **Operation ID:** enter a value without spaces (ex: AddTeamToO365Group)
  - **Visibility:** choose one of the available options

- Then, click on the + Import from sample button in the Request section of the page, and complete the fields in the pane that appears on the right of the screen:
  - **Verb:** `PUT`
  - **URL:** `https://graph.microsoft.com/v1.0/groups/{O365GroupID}/team`
  - **Headers:** `Content-type application/json`
  - **Body:** enter a request sample (example below)

```json
{
  "memberSettings": { "allowCreateUpdateChannels": true },
  "messagingSettings": {
    "allowUserEditMessages": true,
    "allowUserDeleteMessages": true
  },
  "funSettings": { "allowGiphy": true, "giphyContentRating": "strict" }
}
```

- Click on the Import button, to finish the configuration of the Request part of your action
- In the Response section of the page, click on the + Add default response button and complete the fields:
  - **Headers:** `Content-type application/json`
  - **Body:** enter a response sample (example below)

```json
{
  "memberSettings": {
    "allowCreateUpdateChannels": true,
    "allowDeleteChannels": true,
    "allowAddRemoveApps": true,
    "allowCreateUpdateRemoveTabs": true,
    "allowCreateUpdateRemoveConnectors": true
  },
  "guestSettings": {
    "allowCreateUpdateChannels": true,
    "allowDeleteChannels": true
  },
  "messagingSettings": {
    "allowUserEditMessages": true,
    "allowUserDeleteMessages": true,
    "allowOwnerDeleteMessages": true,
    "allowTeamMentions": true,
    "allowChannelMentions": true
  },
  "funSettings": {
    "allowGiphy": true,
    "giphyContentRating": "strict",
    "allowStickersAndMemes": true,
    "allowCustomMemes": true
  }
}
```

- Click on the Import button, to finish the configuration of the Response part of your action
- Finalize the configuration of the action by clicking on the Update connector button

Now that we have an action configured in our custom connector, we can test it directly from here. To do that, follow the procedure below:

- Click on the Test -> button, to access to the Test page of the custom connector
- In the Operations menu, select the action you just created
- Complete the fields, and click on the Test operation button
- Verify that the response you get correspond to what you were expecting

As you can see, it is not really complicated to configure a custom connector for Power Apps and Power Automate that will use the Microsoft Graph API. And I am sure you can see the potential of this kind of solution.

Perhaps, one day, Microsoft will release a standard connector for these services, but until this time you can follow this guide to unlock new possibilities in the Power Platform.

I hope you enjoyed this "guide". In next articles, we will go deeper in some scenarios where we will use this Microsoft Graph custom connector.
