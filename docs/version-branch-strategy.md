# Version and Branch Strategy

Status: agreed planning separation and implementation lineage; planning only
Date: 2026-08-21

## Current repository topology

| Product/version label | Git branch | Commit at audit | State | Interpretation |
|---|---|---:|---|---|
| Stable baseline | `main` | `d71a6ea` | Existing stable line | Base of the documentation-only V3 planning branch; not the intended V3 product-code foundation. |
| Active v2 scenario line | `feature/scenario-generic-pipeline` | `dc34433` | Checked out in the current worktree; actively being developed | Contains the generic scenario pipeline and its committed Project Factory, BankNext, Care360, and FutureReady packs. |
| Historical precursor | `feat/domain-agnostic-scenario-mode` | `fdf709f` | Not active | Earlier domain-agnostic scenario work. |
| v3 planning/content line | `codex/project-factory-v3` | `d71a6ea` base; planning/content commits begin at `ea1fa29` | Dedicated worktree at `/Users/irfan/projects/AISim-v3`; V3 planning baseline and provisional content pack | Intentionally starts from `main` for planning isolation only. It is not the V3 implementation branch. |
| future v3 implementation line | `codex/project-factory-v3-impl` | Frozen `Branch1-version-2` / `dc34433` | Created at `/Users/irfan/projects/AISim-v3-impl`; code baseline only | Additive V3 extension of the V2 scenario pipeline, preserving non-V3 behaviour. |

Git commits do not themselves use the labels “v1,” “v2,” or “v3.” The product labels above are the agreed working vocabulary, not inferred release tags.

## What has and has not happened

### Done

- Created `codex/project-factory-v3` from `main` at `d71a6ea`.
- Kept `feature/scenario-generic-pipeline` checked out and unchanged as the active v2 line.
- Created and then relocated the dedicated V3 worktree to `/Users/irfan/projects/AISim-v3` so it is not an untracked subdirectory of the active V2 worktree.
- Committed the self-contained V3 planning baseline in `ea1fa29`.
- Committed the provisional Project Factory V3 content pack in `aa2622e`.

### Explicitly not done

- No v2 scenario code has been merged, rebased, cherry-picked, or copied into v3.
- No v3 code has been implemented; the new implementation worktree currently contains only the inherited V2 code at the frozen baseline.
- No deployment, hosting, or production branch configuration has been changed.
- The active V2 worktree has not been switched.

## Working-tree state

The shared worktree at `/Users/irfan/projects/AISim` remains attached to `feature/scenario-generic-pipeline`. Its uncommitted source planning documents and unrelated local/generated artefacts were preserved and were not reset, deleted, or committed to V2.

The separate V3 worktree contains V3-named copies of the approved planning artefacts and the provisional Project Factory V3 content pack. The planning baseline was committed before content authoring, so the pack has a clear, independent design baseline. No V2 application code has been copied into the V3 worktree.

## Why the planning branch starts from `main`

The product owner requested that v3 remain separate from the active v2 integration effort. Starting the v3 branch at `main` creates a clean version boundary:

- v2 remains deployable and independently testable.
- v3 planning can continue without accidentally changing or inheriting active v2 work.
- The future integration is a deliberate engineering decision with a reviewable diff, not an implicit consequence of branch creation.

V3 architecture planning may refer to V2 seams and code because V2 is the
intended implementation foundation. This is analysis, not integration. The
planning branch's `main` ancestry must not be mistaken for a decision to build
the V3 product independently from V2.

## Agreed implementation-branch approach

The V3 implementation branch has now been created from the named frozen commit
of `feature/scenario-generic-pipeline`. Bring across the reviewed
documentation-only V3 planning commits as a separate, reviewable operation.
V3 therefore starts with the working V2 scenario pipeline and adds opt-in V3
schema, rules, content, and UI without changing V2 behaviour for existing
packs.

The current planning branch remains intact as the decision/content record. A
documentation-only cherry-pick into the V2-based implementation branch is the
default transfer mechanism because it avoids rewriting the planning record and
does not merge unrelated `main` code into V2.

The branch cut is complete. No documentation cherry-pick, code merge, or
application change is authorised by this strategy alone. The exact V2 freeze
commit and implementation-branch name are now recorded; documentation transfer
and engine implementation remain separate approval gates.

## V3 implementation readiness

V3 code work begins only after all of the following:

1. A dedicated V3 worktree and branch boundary exist.
2. The Project Factory V3 product contract, backlog, and authoring template are committed to the intended planning line.
3. A frozen V2 implementation point is named by commit/tag/branch policy.
4. Compatibility expectations for v1/v2 saves, Standard mode, deployment, and test suites are agreed.
5. The agreed alternative review plan is documented and the content baseline is committed.
6. The product owner explicitly authorises V3 engine implementation on the V2-based branch.
