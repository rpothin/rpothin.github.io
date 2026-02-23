---
title: "Configure Help Panes in Dynamics 365"
date: 2019-12-11
tags: [dynamics-365, help-panes, model-driven-apps, power-apps, customization]
description: "A deep dive into configuring Help Panes in Dynamics 365 model-driven apps, covering how to enable the feature, the full range of formatting and insertion options available in the editor, and how coach marks and balloons can be used to build interactive in-app guidance."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/configure-help-panes-in-dynamics-365-67cbec2d6955"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

## Introduction

As presented in my [previous article](/archive/help-button-options-in-dynamics-365), the Help Panes feature is available since the 9.1.0.10300 version. The Microsoft documentation page ["Create guided help for your Unified Interface app"](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-custom-help-pages) is an excellent start, but in this article we will try to go deeper into what you can achieve with Help Panes, with more visuals.

## Prerequisites

Like mentioned in the Microsoft documentation, to use Help Panes you need to have:

- Version **9.1.0.10300** or later installed on your environment.
- Global **create, read, write, delete, append, and append to** permissions on the Help Page privilege (System Administrator and System Customizer roles have this by default).
- The Help Panes feature **enabled** on your environment.

## Where and How to Enable the Help Panes Feature

To enable this feature:

1. Go to **Advanced Settings > Administration > System Settings > "Set Custom Help URL"** section.
2. Set **"Use custom Help for customizable entities"** to **"No"** (if not already set).
3. Select **"Yes"** for **"Enable Custom Help Panes and Guided Tasks"**.

## What Can We Really Do in a Help Pane?

This is a powerful tool that Microsoft brings to Dynamics 365 (and by extension to all model-driven apps built in Power Apps). In almost all pages of a custom model-driven app, you can open and edit the related Help Pane to add different types of information for your end users.

To access the Help Pane of a page, click the **Help button** (question mark) at the top right of your screen.

To edit the Help Pane, click the **"three dots" button** near the close (X) icon and then click **"Edit"**.

### Format Tab

In the "Format" tab, you can apply:

- **Bold**
- _Italic_
- _Underline_
- ~~Strike through~~
- Bullet list
- Numbered list
- Remove link (when cursor is on a link)

### Insert Tab

In the "Insert" tab, you can add:

- Section
- Image
- Video
- Link (Note: "Existing help page" option is not yet available)
- Coach mark
- Balloon

## Configured Help Pane Example

On the Lead entity's main form, coach marks and balloons can be combined with rich text to create a complete help experience that guides end users through key workflows.

## Good to Know

In out-of-the-box model-driven apps (e.g., **Customer Service Hub**), some Help Panes already contain links to Microsoft Documentation.

But don't worry—you can still configure these Help Panes by following the same steps.

## Conclusion

<div class="video-container">
  <iframe
    src="https://www.youtube-nocookie.com/embed/HSXHwQzDY4o"
    title="Improve User Adoption With Help Panes In Model Driven Apps - 365 Power Up Tampa 2020"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</div>

Now that we've explored all the configuration options for Help Panes, the next step is integrating their management into the application's life cycle. That will be covered in a future article.

This feature offers a collaborative advantage: while some team members configure Help Panes, others can continue working on app development and configuration.
