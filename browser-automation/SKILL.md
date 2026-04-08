---
name: browser-automation
description: Drive websites with Playwright in headless Chromium for repeatable browser checks and UI actions. Use when an agent needs to open pages, wait for elements, fill inputs, click buttons, press keys, capture screenshots, or collect visible page text during web UI debugging or smoke testing.
---

# Browser Automation

Use the bundled Playwright runner for deterministic headless browser actions.

## What this skill is for

Use this skill to:
- open a URL in headless Chromium
- wait for page load and fonts
- locate elements with CSS selectors
- fill inputs
- click buttons or links
- press keys
- hover, check, uncheck, and select options
- click by text, label, or role
- drag elements when the page supports native drag behaviour
- navigate between pages during a flow
- capture screenshots
- capture element screenshots
- collect visible text and basic page signals for debugging

Do not use this skill as the main strategy for CAPTCHA, slider verification, or other anti-bot systems. For those pages, use this skill for smoke checks, element discovery, and pre/post-action inspection.

## Files

- Runner: `scripts/playwright_runner.js`
- Notes: `references/selector-guidelines.md`

Read the selector notes when the page is hard to target reliably.

## Runtime

Default shared runtime:
- `/home/openclaw-wsl/.openclaw/tools/playwright-runtime`

The runner resolves `playwright` from that shared runtime first. If it is unavailable, it falls back to the caller project.

## Invocation

Run the runner with:

```bash
node /home/openclaw-wsl/.openclaw/workspace/skills/browser-automation/scripts/playwright_runner.js <URL> [SCREENSHOT_PATH] [ACTIONS_JSON] [OPTIONS_JSON]
```

Arguments:
- `URL`: target page
- `SCREENSHOT_PATH`: final screenshot path; default is `./artifacts/playwright-smoke.png`
- `ACTIONS_JSON`: JSON array of actions; default `[]`
- `OPTIONS_JSON`: JSON object for page options; default `{}`

## Supported actions

Each action is a JSON object with a `type`.

### waitForSelector

```json
{"type":"waitForSelector","selector":"input[placeholder='请输入用户名']","state":"visible","timeout":15000}
```

### fill

```json
{"type":"fill","selector":"input[placeholder='请输入用户名']","value":"demo"}
```

### click

```json
{"type":"click","selector":"button"}
```

### press

```json
{"type":"press","selector":"input","key":"Enter"}
```

### waitForTimeout

```json
{"type":"waitForTimeout","ms":1000}
```

### hover

```json
{"type":"hover","selector":".menu-item"}
```

### check / uncheck

```json
{"type":"check","selector":"input[type=checkbox]"}
```

### select

```json
{"type":"select","selector":"select","value":"option-1"}
```

### clickText

```json
{"type":"clickText","text":"登录","exact":true}
```

### fillByLabel

```json
{"type":"fillByLabel","label":"用户名","value":"demo"}
```

### clickByRole

```json
{"type":"clickByRole","role":"button","name":"登录"}
```

### goto

```json
{"type":"goto","url":"https://example.com/dashboard"}
```

### locatorScreenshot

```json
{"type":"locatorScreenshot","selector":".panel","path":"/tmp/panel.png"}
```

### drag

```json
{"type":"drag","from":".drag-handle","to":".drop-target"}
```

### screenshot

```json
{"type":"screenshot","path":"/tmp/step.png","fullPage":true}
```

## Supported options

Example:

```json
{
  "viewport": {"width": 1440, "height": 900},
  "waitUntil": "domcontentloaded",
  "gotoTimeout": 30000,
  "postGotoWaitMs": 2000,
  "ignoreHTTPSErrors": true,
  "headless": true,
  "slowMo": 0,
  "storageStatePath": "/path/to/state.json",
  "saveStorageStatePath": "/path/to/output-state.json"
}
```

## Working pattern

1. Start with a no-action smoke run.
2. Add `waitForSelector` before interaction.
3. Use precise selectors, not broad selectors like `input` or `button` when multiple matches exist.
4. Add a short `waitForTimeout` after major UI changes if needed.
5. Collect `visibleText` from runner output to confirm page state.
6. Save screenshots before and after risky actions.

## Example: login form smoke interaction

```bash
node /home/openclaw-wsl/.openclaw/workspace/skills/browser-automation/scripts/playwright_runner.js \
  "https://example.com/login" \
  "/tmp/login-test.png" \
  '[
    {"type":"waitForSelector","selector":"input[name="username"]"},
    {"type":"fill","selector":"input[name="username"]","value":"demo"},
    {"type":"fill","selector":"input[name="password"]","value":"secret"},
    {"type":"click","selector":"button[type="submit"]"},
    {"type":"waitForTimeout","ms":1000}
  ]' \
  '{"postGotoWaitMs":1500}'
```

## Output

The runner prints JSON like:

```json
{
  "ok": true,
  "url": "https://example.com",
  "title": "Example",
  "screenshot": "/tmp/out.png",
  "visibleText": ["text line 1", "text line 2"],
  "signals": {
    "url": "https://example.com",
    "inputs": [],
    "buttons": [],
    "links": [],
    "headings": []
  }
}
```

If a selector is wrong or ambiguous, the runner exits non-zero and prints an error JSON.

## Notes

- Prefer CSS selectors that anchor on stable attributes: `name`, `placeholder`, `data-*`, `type`, or unique class chains.
- When the page uses Chinese text, ensure Linux fonts are installed, such as `fonts-noto-cjk`.
- Keep the shared runtime intact even if project folders are deleted.
- Use `headless: false` when a human needs to watch or complete login manually.
- Use `storageStatePath` to reuse a prior authenticated session.
- Use `saveStorageStatePath` right after manual login to persist reusable auth state.
- If the page uses anti-bot verification, stop after safe diagnostics unless the user explicitly wants deeper analysis.
