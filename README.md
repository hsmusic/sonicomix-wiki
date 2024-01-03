# SoniComix - Sonic Comics Wiki

This is an experimental wiki forking [hsmusic](https://github.com/hsmusic/hsmusic-wiki) to see just how adaptable its codebase is to rather different content!

You can view a build of the website (which may or may not be up to date) at [sonicomix.hsmusic.wiki](https://sonicomix.hsmusic.wiki). Data and media files for SoniComix are available at [sonicomix-content](https://github.com/hsmusic/sonicomix-content).

### git Branch Hierarchy

Due to its nature, SoniComix involves trimming a lot of the particular site content and features that HSMusic provides, while leaving most of the guts. In order to facilitate updating SoniComix with upstream HSMusic, as well as patching infrastructural features we introduce in SoniComix into HSMusic, we've jury-rigged a hierarchy of branches:

* `hsm/preview` is a 1-to-1 remote tracking copy of the "preview" branch on HSMusic.
* `soni/clean` holds the canonical description of how we strip HSMusic-specific content and leave just the useful internals. It's based and regularly rebased on `hsm/preview` to prepare a "clean slate" for other branches to work off of.
* `soni/main` holds all the actual content and page particulars for SoniComix. It's based (and rebased) on `soni/clean`, so that its commits are always working off a clean slate. Rebasing `soni/main` should generally be painless as long as it hasn't touched lines of code too close to internals updated by a recent rebase of `soni/clean`. (SoniComix doesn't have a concept of "release", "staging" and "preview" like HSMusic - `soni/main` is the canonical working branch.)

Speculative branches never hold any unique content, and are always reset in particular ways to get a useful working environment. They're used to merge featuers that are coming, but not yet present, in `hsm/preview` (i.e. upstream `preview`).

* `hsm/speculative` is always reset to `hsm/preview`, then rebased/merged with the relevant feature branches (e.g. [`hsm/composite-subroutines`](https://github.com/hsmusic/hsmusic-wiki/pull/342)). (Feature branches should also be rebased against `hsm/preview`.)
* `soni/clean-speculative` is always reset to `soni/clean`, then rebased on `hsm/speculative`. It's basically saying "how would we represent the blank slate relative to speculative features?" This may involve resolving conflicts if the speculative features involve changing wiki-specific features are represented.
* `soni/main-speculative` is always reset to `soni/main`, then rebased on `soni/clean-speculative`. Similarly to above, this is saying "how would we add SoniComix-specific content onto the updated blank slate including speculative features?" It may involve resolving conflicts or updating existing patterns in a similar way.

While we generally perform work on `soni/main-speculative`, we *commit* to `soni/main`, because it's the canonical representation. This can be a bit problematic for actually leaving `soni/main` in a functional state though, since it doesn't have the speculative changes that code written in `soni/main-speculative` may depend on - so in principle we'd like to write there and commit to separate branches off `soni/main-speculative`, just rebasing as appropriate when the relevant features are merged into `hsm/preview` and so the SoniComix feature branch is ready to merge into `soni/main`.

It's sort of a mess that we're still working out! But it's helped give some hard practice with git branches and rebasing. We're still learning!
