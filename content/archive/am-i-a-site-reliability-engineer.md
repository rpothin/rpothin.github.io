---
title: "Am I a Site Reliability Engineer?"
date: 2023-02-13
tags: [devops, power-platform, site-reliability-engineering, alm, monitoring]
description: "A personal reflection on SRE principles — what they mean, whether they apply to Power Platform, and how the author's daily work around ALM, reliability, and production management maps onto Site Reliability Engineering practices."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/am-i-a-site-reliability-engineer"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Passionate about DevOps culture for a while, I guess it was just a matter of time before I got interested in Site Reliability Engineering.

From "What is Site Reliability Engineering?", to "Is it applicable to Power Platform?" and passing by "What makes me feel I became a Site Reliability Engineer?", this article will be an opportunity for me to share my thoughts on this with you.

> [!NOTE]
> This article mainly takes into consideration complex systems built with Power Platform. Some points raised could be "irrelevant" in the context of low or medium complexity applications.

## What is Site Reliability Engineering?

![SRE illustration from Google](/content/archive/sre-illustration.jpeg)

A bit like for DevOps, it seems difficult to find a strong definition of Site Reliability Engineering, but for me the following phrase from the Google SRE website summarize pretty well the idea: "SRE is what you get when you treat operations as if it's a software problem."

From my understanding, it is a set of principles and practices documented by Google and followed by many companies to improve reliability and development velocity with complex systems. Both DevOps and SRE promote ways to better manage software, but while DevOps is focusing on the "what", SRE is proposing an approach of the "how".

![Summary of SRE practices](/content/archive/sre-summary-practices.png)

Site Reliability Engineers can come from different backgrounds (software engineers, system administrators, system engineers...) but some key expected skills are (but are not limited to) the ability to write code, to automate manual repetitive tasks and to understand how complex systems work. Their mission is to work with product teams to improve the reliability of the systems, but also to improve the development velocity (time taken from the start of a development up to the deployment in Production).

> [!TIP]
> If you want to learn more about this approach, I strongly encourage you to take a look at the SRE Book by Google.

## What makes me feel I became a Site Reliability Engineer?

A while ago, I began to explore and learn about automated ALM for Power Platform. Most precisely, I first started by implementing automated tests to reduce the risk of regression when introducing changes. I then continued my journey automating export and import of solutions using Azure DevOps. And since then, I continuously try to find better ways to automate ALM for Power Platform.

> [!NOTE]
> At this point, the "You build it, you run it" mindset was what I was trying to achieve with the people I was working with.

In my current job, I started to focus more and more on ways to manage applications in Production and to reduce the risk of having major incidents. From system architecture, to monitoring and errors management, many aspects became more important for me. I wanted to have confidence in the fact that the applications I was working on would be reliable and that we could continuously update them safely.

After some time, I arrived at the conclusion that not everyone shares my interest in these topics (ALM and reliability) or even thinks, like me, that we should focus more on them. Understanding that made me realize that "we" are perhaps not ready (yet) to have multidisciplinary teams working alone on Power Platform applications from requirement gathering to management in Production.

In my daily job, I am currently a member of a "special" group of people focusing on transverse activities and supporting other development teams on many different topics. While others are working on delivering more value to end users, on our side, we are mainly focusing on the Production — how to get there and how to stabilize the system to limit the risk of incidents. ALM, architecture, management of systems in Production, monitoring, errors management are some of the key topics I am working on with my team and it seems pretty similar to SRE activities based on what I have learned about this approach.

## Is SRE applicable to Power Platform?

Like for all technology stacks, complex applications built with Power Platform and supporting critical processes, need to reach a minimal reliability level and to be supported by efficient development processes. Covering these points requires, from my point of view, a specific mindset and also a specific skill set.

First, building the automation and providing the guidance to allow development team to safely and efficiently deploy changes to production require a good understanding of how the platform work, which tools can be used and how, but also a good dose of experience in this field.

Secondly, in production, not being blind regarding applications' state and what is going on is something that requires preparation and needs to be included in the development process. While integrating applications with Azure Application Insights is not really complicated, understanding what you will get from it and converting what you will learn into action is a different story.

But there are so many other points around Power Platform where Site Reliability Engineering could be useful: access management, authentication, security, errors management, integration with Azure, automation of manual tasks (like dev environment reset with specific configurations) ... Having a group of people able to help other development teams reach their goals, whatever the applications complexity or the requirements to be met, could become a key element for companies investing in Power Platform for their digital transformation.

Another good question to consider around this topic could be: "Can Site Reliability Engineering benefit Power Platform applications?"

Personally, I am starting to be convinced that for some companies, using Power Platform to build complex applications supporting critical business processes, investing in Site Reliability Engineering will be one of the keys for success.

If, like me, you are working with Power Platform and some of the key activities of an SRE are part of your daily work, I would like to have a chat with you. So, do not hesitate to contact me, we are perhaps the first (at least to start to be aware of this change) of a movement that could contribute to improving the way we can deliver value with Power Platform.
