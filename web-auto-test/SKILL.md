---
name: web-auto-test
description: End-to-end web UI testing and recording with Playwright and Notion. Use when an agent needs one reusable skill to open pages, perform browser actions, handle login-state reuse, detect login/captcha/dashboard states, capture screenshots, and store structured test results under a Notion project page by exact project name, creating the project first if missing.
---

# Web Auto Test

Use this as the single skill for web testing plus project-linked Notion recording.

## What it does

- open pages in Playwright Chromium
- run headless or headful
- fill, click, hover, select, drag, navigate, and take screenshots
- reuse authenticated browser state with Playwright `storageState`
- save new `storageState` after manual login
- detect login-like, captcha-like, and dashboard-like pages
- upload screenshots to Notion
- find a Notion project by exact `项目名称`
- create the project if missing
- append a structured test record into the project page

## Shared runtime

Playwright shared runtime:
- `/home/openclaw-wsl/.openclaw/tools/playwright-runtime`

## Notion target

Project database id:
- `33c84839-dbe4-8044-b676-d1bd188ff0d3`

Title field:
- `项目名称`

## Main entrypoint

```bash
node /home/openclaw-wsl/.openclaw/workspace/skills/web-auto-test/scripts/run-test-and-record.js \
  --project "项目名" \
  --url "https://example.com" \
  --actions '[]' \
  --options '{"postGotoWaitMs":1500,"ignoreHTTPSErrors":true}' \
  --action-summary "打开页面并做基础检查" \
  --note "补充说明"
```

Optional flags:
- `--screenshot <path>`
- `--result <成功|失败|阻塞|...>`
- `--headful`
- `--slow-mo <ms>`
- `--storage-state <path>`
- `--save-storage-state <path>`

## Required Notion rule

Always use this order:

1. Search the project database by exact `项目名称`.
2. If found, append the test record to that project's page body.
3. If not found, create the project first.
4. Then append the same test record.

Do not guess with fuzzy matching unless the user explicitly asks.

## Login and captcha strategy

Default strategy:
- detect login-like pages
- detect captcha-like blocks
- attempt only safe simple actions when clearly appropriate
- if blocked, record `验证码阻塞`

Preferred difficult-login strategy:
1. run in headful mode
2. let the user complete login manually
3. save `storageState`
4. reuse that state in later headless runs

## Files

- Executor: `scripts/run-test-and-record.js`
- Browser runner: `scripts/playwright_runner.js`
- Selector notes: `references/selector-guidelines.md`
- Workflow notes: `references/workflow.md`
- Notion notes: `references/notion-api-plan.md`
