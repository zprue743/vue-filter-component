# Repository instructions

- This project is a GitHub repository. Use the GitHub CLI (`gh`) as the primary CLI for repository hosting workflows.
- Do not modify local, worktree, or global Git configuration for this repository.
- The user's global Git configuration is authenticated for GitLab; do not inspect, access, alter, or perform any GitLab operation while working in this project.
- This is a Vue 3 and TypeScript project.
- Do not introduce additional application or UI frameworks.
- Add dependencies only when truly necessary, and only choose open-source packages that are highly stable, mature, actively maintained, and well supported.
- Add concise code comments for non-obvious behavior and design decisions. Document every public component, prop, emitted event, exported type, property, and helper with JSDoc that provides useful editor hover guidance; do not add comments that merely restate the code.
- Every Vue SFC must have a dedicated unit-test file. Whenever a `.vue` file changes, update its unit tests in the same change so its public behavior, props, emitted events, and important user interactions remain covered.
