# Version and Branch Strategy

Status: agreed branch separation; planning only
Date: 2026-08-21

## Current repository topology

| Product/version label | Git branch | Commit at audit | State | Interpretation |
|---|---|---:|---|---|
| Stable baseline | `main` | `d71a6ea` | Existing stable line | Treated as the base for v3 separation, based on product-owner direction. |
| Active v2 scenario line | `feature/scenario-generic-pipeline` | `dc34433` | Checked out in the current worktree; actively being developed | Contains the generic scenario pipeline and its committed Project Factory, BankNext, Care360, and FutureReady packs. |
| Historical precursor | `feat/domain-agnostic-scenario-mode` | `fdf709f` | Not active | Earlier domain-agnostic scenario work. |
| v3 planning line | `codex/project-factory-v3` | `d71a6ea` base; planning/content commits `ea1fa29`, `aa2622e`, `8b4f330` | Dedicated sibling worktree at `/Users/irfan/projects/AISim-v3`; V3 planning baseline and provisional content pack committed | Intentionally starts from `main`, with no v2 code integration yet. |

Git commits do not themselves use the labels “v1,” “v2,” or “v3.” The product labels above are the agreed working vocabulary, not inferred release tags.

## What has and has not happened

### Done

- Created `codex/project-factory-v3` from `main` at `d71a6ea`.
- Kept `feature/scenario-generic-pipeline` checked out and unchanged as the active v2 line.
- Created and relocated the dedicated V3 worktree to `/Users/irfan/projects/AISim-v3` so it does not appear as an untracked subdirectory in the V2 worktree.
- Committed the V3 planning baseline in `ea1fa29` and the provisional Project Factory V3 content pack in `aa2622e`; `8b4f330` records the commit outcome.

### Explicitly not done

- No v2 scenario code has been merged, rebased, cherry-picked, or copied into v3.
- No v3 code has been implemented.
- No deployment, hosting, or production branch configuration has been changed.
- The active V2 worktree has not been switched.

## Working-tree state

The shared worktree at `/Users/irfan/projects/AISim` remains attached to `feature/scenario-generic-pipeline`. Its uncommitted planning documents and unrelated local/generated artefacts were preserved and were not reset, deleted, or committed to V2.

The sibling V3 worktree contains V3-named planning artefacts and the provisional Project Factory V3 content pack. It was committed before any V3 implementation begins. No V2 application code has been copied into V3.

## Why v3 starts from `main`

The product owner requested that v3 remain separate from the active v2 integration effort. Starting the v3 branch at `main` creates a clean version boundary:

- v2 remains deployable and independently testable.
- v3 planning can continue without accidentally changing or inheriting active v2 work.
- The future integration is a deliberate engineering decision with a reviewable diff, not an implicit consequence of branch creation.

V3 architecture planning may refer to v2 seams and code because v2 is the intended integration target. This is analysis, not integration.

## Future integration decision — deferred

When v3 implementation is authorised, choose one of these approaches based on v2 stability:

| Option | When appropriate | Consequence |
|---|---|---|
| Merge v2 into v3 | v2 is stable enough to be the implementation base | V3 gains the scenario pipeline via one explicit integration commit, then introduces v2-depth changes. |
| Rebase v3 planning commits onto v2 | v3 contains only clean, independent planning/content commits | Produces linear history, but rewrites v3 commit IDs. |
| Cherry-pick selected v3 commits into a successor of v2 | Only a small, well-isolated subset should move | Requires careful dependency review; avoid for broad engine changes. |

Do not choose an integration method until v2 has a defined stability point, v3 work is committed in logical units, and compatibility tests have been selected.

## V3 implementation readiness

V3 code work begins only after all of the following:

1. A dedicated V3 worktree and branch boundary exist.
2. The Project Factory V3 product contract, backlog, authoring template, and provisional content pack are committed to the intended planning line.
3. A v2 integration point is named by commit/tag/branch policy.
4. Compatibility expectations for v1/v2 saves, Standard mode, deployment, and test suites are agreed.
5. The product owner explicitly authorises the deferred code-integration step.
