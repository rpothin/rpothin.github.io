---
title: "Q&A about ALM and Power Platform"
date: 2021-05-03
tags: [power-platform, alm, git, branching-strategy, devops]
description: "Answers to practical questions from a fellow Microsoft MVP on branching strategies, repository content decisions, and the recommended end-to-end flow for delivering Power Platform solutions from development to production."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/q-and-a-about-alm-and-power-platform"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

A friend in the Microsoft MVP community, Théophile CHIN-NIN, has contacted me last week with some questions about ALM and Power Platform. I thought it would be a good idea to share my answers here, in the case that someone else would be interested by this subject.

## Does a branch per environment (Dev / Test / Prod) in the repository is a relevant strategy?

Here we are talking about branching strategy. I really like this topic, even if it is not an easy one.

You will find some examples of well know branching strategies below:

- Git Flow with long lived branches and sometimes difficult merge situations
- GitHub Flow with short lived feature branches and deployment to production from a feature branch before merging to the main branch
- Trunk Based Development / Release Flow with short lived feature branches and deployment to production made from a release branch

Obviously, and just like with ALM strategy and DevOps culture, you will need to find the best branching strategy for your team and mainly based on the way you work. Sometimes going by the book with one of the strategies above will be a good play, but perhaps you will need to combine principles from different strategies.

In my projects, I try to promote a branching strategy close to the "Trunk Based Development" / "Release Flow" strategies. The main branch will contain all the approved and tested work that could be push to production. Short lived feature and hotfix branches will be used to do the work. And finally, the release branch will be for what we currently have in production. During a deployment phase we will have two release branches (the new one in deployment and the previous one just in case), but as soon everything seems good to everyone, we will delete the "old" release branch.

![Illustration of the branching strategy - Example of the deployment of Release 1.1](/content/archive/qna-branching-strategy.jpeg)

The main reasons why I consider a release branch are:

- to not slow down development approaching a deployment to production (you know, when you have to froze the scope for the release)
- to be able to work on a hotfix from the exact same version that we have in production

To answer to the question, sometimes your environment strategy can be aligned with your branching strategy. For example, you Dev environment could be use with your feature branches, your Test environment with your main branch and your production with your (last) release branch.

## What do we need to store in the repository? (unmanaged solutions only or also managed solutions)

I often see people storing the solutions as unmanaged and managed in the repository. I think it is because they do not want to use a build environment to generate a managed solution from the unmanaged one. And I understand the reason, because the management of this kind of environment can be heavy. But in that case, each small change in your solution will impact two files in your repository (the unmanaged one and the managed one), making a bit more difficult the review of the pull requests.

Personally, I prefer to store only the unmanaged solution in the repository because I think it makes it easier to understand what you have in your repository and what is changing when you have a pull request. Obviously, doing that requires to be able to correctly manage build(s) environment(s). I like the idea of "just in time" (JIT) build environments, where you automatically create an environment to generate a managed solution from an unmanaged one, then delete it when this specific task is done.

And if you want to learn why I recommend to also store your pipelines in YAML in your repository you can take a look at the following content: Use YAML files in Azure DevOps to manage deployment of solutions

## How do you see the flow of work (update in a solution) up to production?

For a feature (new one or update of an existing one), I like to follow the steps below:

1. Create a new branch from my main branch
2. Push the version of the solution in my new branch to my development environment to be sure to work on the last "approved" version (I like the idea of "just in time" development environments too 😁)
3. Do the work in the development environment and use a pipeline / workflow triggered manually to export my work to my branch in the repository
4. When my work is done and tested, I will create a pull request to get feedbacks from the rest of the team and perhaps execute automatically some validations, like the Solution Checker
5. When the pull request is approved and my work merged to the main branch, it will be automatically deployed to a test environment (managed solution) — and do not forget to delete the "just in time" development 😉
6. When some features are ready to go to production, we can create a new release branch and manually trigger a pipeline that will push the changes up to production (perhaps you will deploy first to other environments for last validations)
7. When the deployment to production is declared successful, you can delete the previous release branch and keep only the last one

![Illustration of the flow of work for Power Platform development](/content/archive/qna-flow-of-work.jpeg)

For hotfixes, it is a little bit different. You need to create your branch from the release branch (it should be the one corresponding to what you have in production). And after the merge of your pull request to the main branch (to be sure to have your hotfix for the next release), you can use the cherry-pick feature to apply the same hotfix to the considered release branch. Then you can finish the cycle by deploying the new version of your release branch to production.

## Power Platform development is not really like classic development, how can I save my work to the repository at the end of the day?

For me, the easiest way to address this requirement is to have a pipeline / workflow you can trigger manually to export and unpack as unmanaged the solution(s) you are working on from a development environment to the considered feature / hotfix branch.

I hope these questions and my answers will help you have a better understanding of what you can achieve around ALM for Power Platform solutions.

Do not hesitate to contact me if you have other questions or just if you want to talk about ALM for Power Platform. I will be happy to share with you my vision around this subject or to confront it to yours.
