---
title: "Empowering Power Platform developers with .Net Interactive notebooks"
date: 2022-07-26
tags: [power-platform, dataverse, dotnet, developer-tools, jupyter-notebooks]
description: "An exploration of how .Net Interactive notebooks in VS Code can help Power Platform developers with support, administration, and learning scenarios — using C# and PowerShell to interact with Dataverse without relying on open-source modules."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/empowering-power-platform-developers-with-net-interactive-notebooks"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Since few months, I am thinking about this idea and now seems to be a good time to share it with the rest of the world.

Early 2022, I have read some content regarding Jupyter Notebooks and started to think it could be a great tool to help Power Platform developers in some scenarios like support, administration, or even learning. First, I thought the available languages proposed were out of my league. But after taking a closer look, I found that .Net could be an option allowing me to explore this technology.

## A first iteration: interesting but a bit complex

At the time of my first tests, the setup to be able to work with Jupyter Notebooks with the .Net kernel was not simple (at least for me). For example, I had to install some unusual components, like Anaconda. But, after some tries, I have finally been able to make it work and start my exploration.

The goal of my first prototype was to cover the following really simple scenario: retrieve the configuration of a user in Dataverse for validation (in case the person reports access issues for example).

> [!NOTE]
> While I was starting this journey, Natraj Yegnaraman published a great article showing how to use the Azure CLI to get a token to interact with the Dataverse Web API (Using Azure CLI to authenticate with Power Apps).

To cover my scenario, I chose PowerShell and combined the Azure CLI to get a token with calls to the Dataverse Web API. I added an abstraction layer with PowerShell functions, like for the calls to the Dataverse Web API, to make the notebook more readable and have some consistency between common actions.

![Power Platform Support — User configuration validation — Initialization](/content/archive/notebooks-pps-validation-init.png)

![Power Platform Support — User configuration validation — Get token](/content/archive/notebooks-pps-validation-token.png)

![Power Platform Support — User configuration validation — Get user configuration](/content/archive/notebooks-pps-validation-get-config.png)

> [!NOTE]
> Obviously, I could have used the Microsoft.Xrm.Data.PowerShell open-source PowerShell module to interact with Dataverse. But I know that some companies are not really comfortable using open-source modules so I wanted to present a solution based only on Microsoft resources.

This first prototype gave me a good overview of the potential of this technology and helped me confirm it could help Power Platform developers in some scenarios. But, at the same time, the complexity of the setup and the requirement of an additional layer (PowerShell functions) to make the notebooks easier to use were counter balancing my good first impression.

So, I left this topic on the side for a while, giving some time to this technology to become more mature, and I think it was a good idea.

## ".Net Interactive Notebooks (Preview)" VS Code extension

A few weeks ago, a .Net Interactive Notebooks VS Code extension was released in preview. And let me tell you, it is a game changer for the setup of a .Net Interactive notebook.

> [!IMPORTANT]
> As described in the Getting Started section of the extension page, you will need the latest .Net 6 SDK to be able to use it.

Now the setup is simple as:

1. Open VS Code
2. Go to Extensions
3. Search for ".Net Interactive Notebooks"
4. Select the first result
5. Click on Install

After a few minutes, you will be good to go.

![.Net Interactive Notebooks VS Code extension — Setup result](/content/archive/notebooks-vscode-extension-setup.png)

The next step will be to initialize the notebook you will work with. The easiest way to do that is to, still in VS Code:

1. Open the Command Palette (Ctrl + Shift + P on Windows / Cmd + Shift + P on Mac)
2. Search for ".Net Interactive"
3. Select ".Net Interactive: Create new blank notebook"
4. Choose the type of notebook you want to create between ".dib" and ".ipynb" — personnaly I use ".dib" because the results of code execution are not stored and the code of the notebook is, from my point of view, more readable (not a JSON) and easier to review, in pull requests for example
5. Select a language for your notebook — to be able to follow me on my journey, I encourage you to choose "C#" for this one
6. In the code cell already present in the notebook you initialized, enter the code below

```csharp
Console.WriteLine("Hello world!");
```

7. To execute your code, click on the Execute button on the left of the code cell or on the Run All button at the top of the notebook

Congratulations, at this point you have a .Net Interactive notebook initialized in VS Code.

![.Net Interactive Notebook in VS Code — "Hello world!" test](/content/archive/notebooks-hello-world.png)

> [!TIP]
> If you are looking for more details about this VS Code extension and the differences between the types of notebooks, Andrew Lock wrote a really great article on this topic.

I hope you will all agree that this method to set up a .Net Interactive notebook in VS Code is simpler than the first one I tried (presented in the first section of this article). But, how could we use this approach to empower Power Platform developers?

## .Net Interactive notebooks and Power Platform

During my exploration of this topic, I kept in mind two key points:

- Do not recreate what already exists
- Ony use (as much as possible) official Microsoft resources to make this approach accessible to most companies (even the ones who are not confident enough to use open-source solutions)

For this demonstration, we will come back to the scenario presented in the first section of this article: retrieve the configuration of a user in Dataverse for validation (in case the person reports access issues for example).

With the Microsoft.PowerPlatform.Dataverse.Client library now generally available, we have a great supported way to interact with Dataverse from .Net code. I also took some inspiration from samples found in the microsoft/PowerApps-Samples GitHub repository.

In your .Net Interactive notebook, you need to add the initialization code to load the required libraries for this scenario.

![Power Platform Notebook Demonstration — Initialization](/content/archive/notebooks-demo-init.png)

Obviously, talking about interactions with Dataverse, the next step is to connect to an environment. With the connection initialization code, the person using the notebook will be able to connect using their own account (better traceability) to the considered environment.

![Power Platform Notebook Demonstration — Connect to Dataverse environment](/content/archive/notebooks-demo-connect-dataverse.png)

To finally cover our demonstration scenario, we still have to search for a user based on a domain name and to get his security roles.

![Power Platform Notebook Demonstration — Search user](/content/archive/notebooks-demo-search-user.png)

![Power Platform Notebook Demonstration — Display user details](/content/archive/notebooks-demo-user-details.png)

![Power Platform Notebook Demonstration — Get user security roles](/content/archive/notebooks-demo-get-security-roles.png)

![Power Platform Notebook Demonstration — Display user security roles details](/content/archive/notebooks-demo-security-roles-details.png)

## Going further by taking advantage of the "multiple languages" capability

I don't know about you, but personally, I find it a bit more difficult to manipulate objects in C# versus in PowerShell. .Net Interactive notebooks allow you to combine different languages of the .Net Interactive family to take advantage of the strength of each one of them.

For example, I can retrieve the security roles of a user in C# using the Microsoft.PowerPlatform.Dataverse.Client library and then pass the result to another code block but this time in PowerShell to display the details of the security roles found.

Here, you should pay close attention to the first line that will enable this magic.

```
#!share --from <origin language> <variable name>
```

![Power Platform Notebook Demonstration — Variable from C# to PowerShell](/content/archive/notebooks-demo-csharp-to-powershell.png)

## Conclusion & Call to action

I am really excited by the potential of this technology and I am convinced it will help us to improve the way we manage our applications and everything related to Power Platform.

If you like this idea, I invite you to contribute to the Power-Platform-Notebooks GitHub repository (created in parallel of this article) by submitting ideas of notebooks in the discussions or even by submitting notebooks or enhancement for existing notebooks using pull requests.

I am really looking forward to what we will build together around this topic!
