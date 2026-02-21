---
title: "Help button options in Dynamics 365"
date: 2019-12-04
tags: [dynamics-365, customization, user-experience, help-panes, power-platform]
description: "An overview of the help button options available in Dynamics 365, covering the default Microsoft documentation link, global and entity-specific custom help pages with URL parameters, and the Help Panes preview feature for building interactive in-app guidance."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/help-button-options-in-dynamics-365"
---

> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

## The Default Help Page

Today, in Dynamics 365, you have a little question mark button on the top right of your screen that gives your end users the opportunity to easily get a first level of help.

By default, your Dynamics 365 environment is configured to send you to the [Microsoft Dynamics 365 documentation page](https://learn.microsoft.com/en-us/dynamics365/) if you click on the help button.

> To my mind it is a little bit complicated to keep this default option because the Microsoft documentation is helpful if you do not make customization on your environment, but it is not often the case.

## The Global Custom Help Page

If you want to change this default behavior and provide to your end users a help experience closer to your processes and taking into account your customization, you can configure a global custom help page.

To do so, go to:  
**Advanced Settings > Administration > System Settings > "Set Custom Help URL"** section.

Set **"Use custom Help for customizable entities"** to **"Yes"** and specify a custom help URL in the **"Global custom Help URL"** field.

For example, you can put your user documentation (as step-by-step guides or videos) on a SharePoint site, and specify here the URL.

### URL Parameters for Flexibility

With this option, you can also enable adding parameters to the global custom help URL to bring more flexibility to the help experience for your end users.

Example parameters when opening from a lead form:

- `userlcid=1033`: ID of the language code of the user who opened the help.
- `typename=lead`: Name of the entity where the help was opened from (not specified if opened from a dashboard).
- `entrypoint=form`: Specifies the type of page ("form" or "hierarchychart"). Not present if opened from a dashboard or list.
- `formid=e3b6ddb7-8df0-4410-ac7b-fd32e5053d38`: The GUID of the originating form (only specified if opened from a form).

> Until today, I liked to use the global custom help page option with the user documentation in a SharePoint Document Library.

## The Custom Help Page for a Custom Entity

You can also extend the global custom help page option to manage custom help pages for **custom entities only**.

Steps:

1. Set **"Use custom Help for customizable entities"** to **"Yes"** in System Settings.
2. Open the configuration page of a custom entity within a solution (in the classic interface).
3. Activate the option **"Use custom help"** and specify the URL you want to reach.

> Unfortunately, it seems this feature is not currently working with the Unified Interface.  
> See: [Forum thread on Dynamics CE Unified Interface custom help URL](https://community.dynamics.com/crm/f/microsoft-dynamics-crm-forum/371287/dynamics-ce-aka-crm---custome-help-url-on-unified-interface)

## Help Panes (Preview)

Your last option, the **custom help panes**, is available since version **9.1.0.10300**. This feature has great potential to build an interactive help experience in Dynamics 365 for your end users.

See documentation: [Create custom help pages](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-custom-help-pages)

> We will enter into the details about the configuration of Help Panes in a next article because we have a lot to cover.
