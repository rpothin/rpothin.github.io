---
title: Privacy & Analytics
description: What data this site collects and why
---

# Privacy & Analytics

I want this site to be useful without being creepy.

This page explains **why** I use analytics, **what’s enabled**, and **what you can do if you’d rather not be counted**.

## Why I use analytics

Here’s what I mainly use it for:

- **Motivation:** seeing that the site helps other people is genuinely encouraging.
- **Content direction:** understanding which topics/pages are most useful.
- **Audience understanding:** getting a high-level sense of who visits (in aggregate), so I can write clearer, more relevant content.

## What analytics solution I use

This site uses **Cloudflare Web Analytics** to understand _aggregate_ traffic (e.g. page views/visits and high-level performance metrics) so I can see what’s useful and improve the content.

Cloudflare positions Web Analytics as **privacy-focused** and **cookie-free by default**.

- [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/)
- [Cloudflare Web Analytics docs](https://developers.cloudflare.com/analytics/web-analytics/)
- [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/)

## Third-party processing

Cloudflare provides the analytics service, which means analytics data is processed by **Cloudflare** as a third party when you load pages from this site.

## What data this usually includes (at a high level)

In the Cloudflare dashboard, I’m looking for trends and totals rather than individual visitor behavior.

Concretely, the kind of information I actually see there includes:

- **Traffic totals** like _visits_ and _page views_
- **Performance signals** like _page load time_ and **Core Web Vitals** (LCP, INP, CLS)
- Breakdowns by **URL**, **browser**, **operating system**, and **country/region**
- Sometimes a “top **element**” view for Core Web Vitals debugging (when there’s enough data)

When reviewing metrics, I also filter out obvious noise when possible (for example, excluding bots).

I use this information to answer questions like “which posts are worth expanding?”—not “who are you?”.

## What I’m not doing

- No advertising pixels
- No selling of personal data
- No tracking across other websites by me

More specifically:

- I’m **not** trying to build a profile about you.
- I’m **not** using analytics for ad targeting or retargeting.
- I’m **not** correlating analytics with other datasets to identify visitors.

## What you can do

- If you block analytics scripts (e.g. via a browser setting, tracking protection, or an ad blocker), the site should still work.
- If you prefer not to be counted, using a content blocker / privacy-focused browser is a practical opt-out.

## Do Not Track

Some browsers let you send a **Do Not Track (DNT)** signal. In practice, DNT handling varies widely across the web.

My intent is simple: whether or not you send DNT, I’m only using analytics in an aggregated, privacy-minded way (motivation, content direction, and general audience understanding).

## Questions

If you have questions or spot something suspicious, don't hesitate to open an issue in the repo backing this site: [https://github.com/rpothin/rpothin.github.io](https://github.com/rpothin/rpothin.github.io)
