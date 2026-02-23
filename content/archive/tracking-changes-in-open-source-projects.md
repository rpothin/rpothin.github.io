---
title: "Tracking changes in open source projects"
date: 2021-08-04
tags: [open-source, devops, github, git, changelog]
description: "A practical guide to adopting the keep-a-changelog convention in open source projects, including how to create and back-date git tags to build a meaningful, auditable version history."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/tracking-changes-in-open-source-projects"
---

> [!NOTE]
> **Archive notice:** This post was originally published on Medium. It is preserved here as part of my writing history. Some content may be outdated.

Few weeks back, I was thinking how I could clearly share details about the evolution of one of my open source projects in GitHub. As it is not one where I plan to generate releases (it is a GitHub repository template with GitHub workflows), I started looking for other ways to achieve this.

It is during this quest that I have discovered the concept of "Changelog" through an amazing project: [keep a changelog](https://keepachangelog.com/).

## What is a changelog?

For me a changelog is a file in your repository providing details about what have changed between the different versions of your solution.

As you can guess, it is a really important file for an open source project because many people can be involved and they need to understand what happened and what is in progress. It is clearly a great way to give a good visibility on the evolution of the solution. And it can benefit everyone (even yourself as a maintainer).

## What the "keep a changelog" project propose?

It is pretty simple, the keep a changelog project come with a "CHANGELOG.md" example including good practices.

One a little bit hidden gem in the example (at the end) is the definition of the link behind the version numbers following the format below:

```markdown
[considered version number]: https://github.com/<organization or user>/<repository>/compare/v<previous version number>...v<considered version number>
```

Example:

```markdown
[0.0.3]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.0.2...v0.0.3
```

Opening a link in this format, you will be able to easily see the differences between two versions of your solution.

## How to manage the versions?

In reality, the versions I am talking about since the beginning of this article, are git tags.

In GitHub, tags are generated when you create a release. So, if you have releases in your project, it should be pretty easy to build your changelog (if you don't already have one of course 😉).

If you want to create a tag without a release in GitHub (because you don't have binaries to share for example) you can use the following commands from a local copy of your repository:

```bash
git tag <tag>
git push <remote> <tag>
```

Example:

```bash
git tag v1.2.3
git push origin v1.2.3
```

If you want to add a tag to a commit in the past and want to display the correct date on it, <!-- TODO: review — original linked to an external explanation of GIT_COMMITTER_DATE; link URL not preserved in Medium export -->
you can use the following bash commands - explained in details in additional resources (⚠ these commands will only work in bash):

```bash
git checkout <commit>
GIT_COMMITTER_DATE="$(git show --format=%aD | head -1)" \
git tag -a <tag> -m"<tag>"
git checkout main
git push <remote> <tag>
```

Example:

```bash
git checkout 9fceb02
GIT_COMMITTER_DATE="$(git show --format=%aD | head -1)" \
git tag -a v1.2.3 -m"v1.2.3"
git checkout main
git push origin v1.2.3
```

From my point of view, the keep a changelog project provide a great example with good practices to help open source maintainers start or improve their changelog.

The only personal touch I added are some emojis for the types of changes because I find it more fun like that 😊

Do not hesitate to take a look at [my first changelog](https://github.com/rpothin/PowerPlatform-ALM-With-GitHub-Template/blob/main/CHANGELOG.md). It is (and perhaps will always be) a work in progress, but it already helps me a lot to follow what I am changing in the solution.
