---
title: "Power Platform enthusiast's point of view on DevOps culture"
date: 2020-12-31
tags: [power-platform, devops, devops-culture, alm, citizen-developer]
description: "A year-end reflection on what DevOps truly means — beyond tooling and automation — and how the DevOps mindset can reshape the way Power Platform developers and citizen developers work together to deliver value."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/power-platform-enthusiasts-point-of-view-on-devops-culture"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Unfortunately, I think there is today some misunderstandings around what DevOps is. It seems that for many people (including myself) and many companies DevOps is only about automate as many things as possible and store everything in source control.

Since few weeks, I started to learn a bit more about DevOps and I am more and more convinced that it is really something that will change our way to build and maintain applications in the future (perhaps sooner than we can imagine).

My goal for the upcoming years is to spread the word about the DevOps culture in the Power Platform community. This article aims to be an introduction to that work I plan to start in the next few weeks.

## My DevOps journey so far

I started this journey back in 2018 working on automated testing for Dynamics CRM 2016 On-Premise using FakeXrmEasy and EasyRepro. I wanted to work on this subject since a while, but never took the time (or had the opportunity) before.

Then, in 2019, working on Dynamics 365 Sales, Project Service Automation and Human Resources (aka Talent), I discovered integration and delivery automation using spkl. But I quickly switched to Azure DevOps when I have seen Microsoft was working on an extension dedicated to Power Apps (Power Apps Build Tools).

2020 was the year where DevOps became a passion for me. I continued to work with Azure DevOps and the extension dedicated to Power Apps (renamed Power Platform Build Tools). I even got the chance to share my thoughts and present some demonstrations about "ALM process for Power Platform solutions" at 3 community events (NYC Power Platform 2020, Power Platform French Summit 2020 and Maple Power 2020). To conclude this year, I have started an open-source project in GitHub to show that is it now possible to entirely manage the ALM process for Power Platform solutions directly from GitHub: PowerPlatform-ALM-With-GitHub-Template

## What is DevOps for me?

Based on what I said above, you will perhaps think that for me DevOps consists only in automating things regarding application lifecycle management.

It is true that, for now, I have only worked on ALM automation. But I think that deep inside I always knew that DevOps was a lot more than that...

Since few months I have read lot of articles, documentation pages, listened podcasts, watched videos and followed people talking about DevOps to try to get a better understanding of this culture that is (slowly but surely) changing our way of working in IT. One of the key things that started to make me think about this subject every day was the DevOps definition Donovan Brown from Microsoft came up with.

"What is DevOps?" by Donovan Brown from Microsoft

I really like this definition because it is a simple way to show that DevOps is really not an easy subject to master. You have different elements involved and in particular people. So, even if this definition does not explicitly say the word, we can guess reading it that DevOps is more a culture than anything else.

The next big step in my learning of the DevOps culture was the discovery of an amazing book: "The Phoenix Project: A Novel about IT, DevOps, and Helping Your Business Win". This book really opened my eyes about this topic. I strongly advise you to read it if you want to understand what your company is perhaps going through and how you can find a way to improve your IT organization implementing the DevOps culture.

Today, for me, DevOps regroups many important concepts (trust, communication, transparency, automation, feedback loop, experimentation, reliability...) which the only goal is to help you improve the flow to deliver value to end users. For IT Teams it will make their work more enjoyable and give more sense to what they do every day. And for organizations, it is becoming a vital challenge to implement this culture, because the first one to have it will have a strong advantage against its competitors (deliver new features with high quality quicker can really make the difference).

## DevOps with the Power Platform

The Power Platform is one of Microsoft's answer "[...] to empower every person and every organization on the planet to achieve more.".

From a DevOps perspective, this powerful platform brings some challenges:

- so many kinds of applications / projects in terms of typology and complexity can be built with it
- a new group of people is now building applications (citizen developers)
- the platform is still pretty new, and some key features (like monitoring) are not yet mature

For me, the first point means that it will be complicated to have a miracle recipe we will be able to apply to any organization. Hopefully, many of them will be able to share some tools or practices. But as each one has its way to use the Power Platform and its company culture, the path to a DevOps culture and the result will certainly be different. The success of applying the DevOps culture to Power Platform development for a company will be in the deep comprehension of this mindset to be able to find the right answers at the right time to unlock the right constraint.

One of the key challenges the DevOps culture aims to improve was the way the different IT teams (developers, QA, operations...) work together. So, bringing citizen developers in the game can definitely become a new chapter of the story. We will need to figure out how to train and onboard this new group to the DevOps culture. Citizen developers, like any other developers, will need to take responsibility of what they build and the quality of their work (obviously they will need the help of the IT teams to achieve these goals). I am sure IT teams in charge of production environments do not want to be clueless if applications break in the middle of the night.

My third point concerns the feedback loop and the confidence for experimentation. Until we have a robust monitoring system for the Power Platform, it will be difficult to analyze the adoption of a particular feature or to verify that our last deployment in production did not have an impact on the performance of the applications.

As you can see, we still have some things we need to work on if we want to apply the DevOps culture to Power Platform development. But I think Microsoft and some community members are working really hard to make this a reality in a near future. Just keep in mind it will not be all about tools and automation. A huge part of this evolution in our way to work will be based on culture change and training.

In upcoming articles, I will explore different parts of the DevOps culture, always from the eyes of the Power Platform enthusiast I am.

If we follow the same journey as Bill in the "The Phoenix Project: A Novel about IT, DevOps, and Helping Your Business Win" book, our first stops (articles) will be about how to improve the flow of tasks from the developers to the production environment.
