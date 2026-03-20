## Navigator

Navigator is a passive graph walker. It does not drive execution — the client (orchestrator) decides when to call each tool. Navigator evaluates the graph and returns the current position.

All Navigator tools return `{ currentStep, instructions, terminal, metadata }`.

- `instructions` — prose describing what the current step requires. The client reads this and acts on it.
- `terminal` — `null` (in progress), `"success"`, `"hitl"`, `"failure"`, or `"join"`.

### Terminal values

- `null`: step is actionable. Client executes the work, then calls `Navigator.Next`.
- `"hitl"`: human input required. Client stops and asks the user before calling `Navigator.Next`.
- `"success"` / `"failure"`: workflow complete. Client stops the loop.
- `"join"`: branch complete. Client stops the child's loop.

## Navigator Tools

- **`Navigator.Init(taskFilePath, workflowType, description, [stepId])`** — attach workflow metadata to a task file. Task stays pending. Optional `stepId` starts at a specific step.
- **`Navigator.Start(taskFilePath)`** — advance from start node to first actionable step. Sets task to in_progress.
- **`Navigator.Current(taskFilePath)`** — read current position without advancing. Read-only.
- **`Navigator.Next(taskFilePath, result)`** — advance to next step. `result` is `"passed"` or `"failed"`. **Called by the orchestrator only** — never by a subagent.
- **`Navigator.SetItems(taskFilePath, items)`** — register sequential sub-items for the current step. Each `Next(passed)` advances to the next item; when all exhausted, the workflow node advances normally.

## Lifecycle

Every workflow task follows the same contract:

**Create**: `TaskCreate` → `Navigator.Init(taskFilePath, workflowType, description)` → `Navigator.Start(taskFilePath)` → core loop
**Resume**: `TaskList` → find task → `Navigator.Current(taskFilePath)` → core loop

**Core loop**: `Navigator.Current(taskFilePath)` to read position, act on `instructions`, then `Navigator.Next(taskFilePath, result)` to advance. Repeat until `terminal` is non-null.

### Pass/fail rules

A step is `"passed"` only when its actual work executed and produced a verifiable result:

1. **Cannot verify = failed.** If verification cannot run, the step is failed.
2. **Skipped = failed.** A step skipped for any reason is failed.
3. **Prerequisites must be met.** If a step requires a running dev server, verify before attempting.
4. **Partial completion = failed.** If some checks pass but others can't execute, the step is failed.
5. **Existing artifacts are not a free pass.** Every step must execute its work.

## Sequential Items

When a step's work splits into discrete units discovered at runtime:

```
Navigator.Current → step says "discover items then call SetItems"
→ delegate to agent to discover items
→ Navigator.SetItems(taskFilePath, ["item1", "item2", ...])
→ Navigator returns: instructions show "Item 1/N: item1"
→ delegate ONE agent: "implement + verify: item1"
→ agent reports back
→ Navigator.Next(taskFilePath, "passed") → advances to item 2
→ repeat until all items done
→ final Next(passed) → advances to next workflow node
```

## Fork/Join (for parallel feature building)

When `instructions` contains `Branches:`, each branch becomes a child task:

1. `TaskCreate` + `Navigator.Init(childTaskFilePath, workflowType, description, stepId=branchEntry)` per branch
2. `Navigator.Start` for children up to `maxConcurrency`
3. Advance each child independently through its core loop
4. When a child reaches `terminal === "join"`, its slot is freed — start next pending child
5. After ALL children complete: `Navigator.Next(parentTaskFilePath, result)` advances the parent

## When Navigator is Used

Navigator is part of **Layer 3** intent routing. Activated by explicit user request:

- "run the full delivery workflow"
- "execute web-app-delivery step by step"
- "walk me through building this app"

Layer 1 (ad-hoc steps) and Layer 2 (pipeline commands) execute without Navigator.

## Write-through

On every Init/Start/Next call, Navigator persists state to the task file. The client should not edit task files directly during active workflows.
