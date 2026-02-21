---
title: "My resume built with the Power Platform"
date: 2020-06-12
tags: [power-platform, power-apps, power-bi, power-virtual-agents, canvas-apps]
description: "A fun personal project exploring every component of the Power Platform — Common Data Service, model-driven app, canvas apps for phone and tablet, Power BI report, and a Power Virtual Agents bot — all to build and present a resume in a novel way."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/my-resume-built-with-the-power-platform"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

After the Virtual Hack4Good MBAS 2020 event, Dona Sarkar published an inspiring article you should definitively read.

Reading this great article, an idea came to my mind. I always struggled building a resume that was satisfying myself (mostly due to the format). So, I thought: What if I built my resume with the Power Platform?

And here we are! I leveraged all the components of the Power Platform to build my resume and in this article, I will present to you the different parts of this solution.

## I used the CDS to store the data

For me, the Common Data Service is an effective way to store data. It is why I decided to configure some custom entities here to build my resume.

Obviously, this data model is perfectible, but it is a good start to build my resume with the Power Platform.

I built this data model so it could be used for example in an organization to present the profile of their members in an interesting new way.

## My resume as a model-driven app

Due to my history with Dynamics 365 CE applications, I obviously began this journey with a model-driven app.

To make this model-driven app more appealing I have used some PCFs made by amazing members of the community:

- International Telephone Input: to help in the configuration of a phone number and to display the flag of the corresponding country
- Country Picker: to make easy the country's selection, to display the flag of the selected country and to have access to some information related to it
- Social Media Icons: to present the social media links in the coolest possible way
- HoverCard Details List: to allow to display a long text directly from a view

## My resume as a canvas app for phone

The next stop of this journey was a canvas app for a phone. I said to myself: it could be cool to be able to present my resume on my phone during an interview.

So, I began to build it and along the way I learned how to make a component used to bring a slider menu to life. And, for one screen of this app, I wanted to have a five stars filter for a gallery. But as I did not find any, I decided to build one myself as a component.

## My resume as a canvas app for tablet

A canvas app for tablet allow to present the same things but differently. So, I also built a version of my resume in this format.

It gave me the chance to discover another interesting mechanism available in Power Apps: using a sub gallery to expand and collapse gallery items.

A huge part of this project was about Power Apps (3 apps 😮), but I was also able to explore the other parts of the Power Platform.

## My resume in a Power BI report

At work we use Power BI reports to present information in a powerful visual way. So, why not use this incredible tool to present a resume.

When building this Power BI report, I discovered two interesting things:

- how to display details about a selected record in a table using a measure (example below) and a card visual

```dax
UniqueExperienceDescription = IF(HASONEVALUE(WorkExperiences[cra8f_description]),VALUES(WorkExperiences[cra8f_description]),"")
```

- how to replace a boolean value (not fun) by an emoji using a custom column (example below)

```dax
CurrentExperience = SWITCH(WorkExperiences[cra8f_currentexperience],TRUE,"☑️",FALSE,"☐️")
```

I also used an embedded canvas app to display details about a selected record in a table. Personally, I think that integrate a canvas app in a Power BI reports is an amazing way to make your reports more interactive.

## My resume available through a virtual assistant

Finally, what would be a Power Platform solution for my resume without a virtual assistant built with Power Virtual Agent to help me share my story with the world.

It is probably because it was the Power Platform solution that I knew the least, but it is undoubtedly on this part of my project that I learned the most.

Here is a summary of what I learned and used in PVA to build my virtual assistant:

- It is possible to use custom entities to manage some lists of options in a question
- Flows in actions is the best (the only?) way to get some information stored outside of PVA, like in the Common Data Service
- You can format messages using markdown

This was a really funny project to work on. The best part is that I really learned many things working building these different versions of my resume with the Power Platform. What best format to present your profile than the platform you work with daily, isn't it? 😉
