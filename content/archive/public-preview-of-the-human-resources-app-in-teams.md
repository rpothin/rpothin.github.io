---
title: "Public Preview of the Human Resources app in Teams"
date: 2020-05-23
tags: [dynamics-365, microsoft-teams, human-resources, power-platform]
description: "A quick look at the public preview of the Human Resources app in Microsoft Teams, highlighting available features, missing capabilities like time-off balance forecasting, and known bot errors users may encounter."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/public-preview-of-the-human-resources-app-in-teams"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

The Human Resources app in Teams is in public preview for two days now. I took advantage of this time to make some tests and register a quick tour video of the available features in this application.

For me, the most important missing feature in this application for now is the time-off balances forecasting in the Time off tab. As mentioned in the Microsoft documentation page, they already have identified this point, so they will perhaps (fingers crossed) try to work on it soon.

And I am sure Microsoft has multiple ideas for the bot they will implement in the future (like "When is my next time-off?" or "Give me the next public holidays").

## Note

Perhaps you will encounter one of the behaviors below trying to chat with the bot in the application:

- Message: "I found multiple leave types with that name."

- Error: "Operation returned an invalid status code 'RequestEntityTooLarge'"

In that case, try to use the Human Resources app in Teams with a user with the "Employee" role in Dynamics 365 Human Resources.

Thanks to the Product team who helped me with this issue with a great reactivity!
