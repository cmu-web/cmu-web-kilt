# Carnegie Mellon Web Kilt: Notes for AI Agents

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [DEVELOPMENT.md](DEVELOPMENT.md)
before changing anything. The rules agents most often break here:

- Hotlink CMU's template from www.cmu.edu; never copy its rules or values
  into the kit. Use the template's classes first, and add a `cmu-` class only
  for what the template doesn't do.
- Prefix kit classes, custom properties and hooks with `cmu-`, with `--` for
  modifiers. Existing ones are interfaces other sites use: don't rename or
  remove one without saying how sites migrate.
- A new class comes with its live example and its docs on the component's
  page, in the same change. Edit the example's markup inside `div.kit-demo`;
  the docs script writes the code sample.
- After changing the docs, run the generators that apply
  (`npm run components`, `npm run opengraph`, `npm run data`) and commit
  their output with the source. Never edit generated content by hand.
- Docs and code never cite a project or an outside site as an example ("as
  on ..."); describe the pattern instead.
- Wording rules go in a gray Style callout (`cmu-callout` with a `cmu-label`
  reading "Style"), not a checklist.
- Kilt icons come from Bootstrap Icons, never Octicons; the template's own
  icons stay as they are.
- Examples use Buggy, the made-up Spring Carnival Sweepstakes site (see
  CONTRIBUTING.md, Example content).
- Made-up people only (e.g., Andrew Carnegie, ac00).
- Follow the Web Kilt's [writing conventions](https://webkilt.andrew.cmu.edu/0/conventions.html).
- Versions use semantic versioning as plain numbers (e.g., `0.1.0`).
