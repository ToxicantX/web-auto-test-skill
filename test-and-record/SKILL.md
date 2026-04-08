---
name: test-and-record
description: Test web pages with Playwright and record the results into Notion under a project workspace. Use when an agent needs a single workflow that: (1) opens a page in headless Chromium, (2) performs basic UI actions such as waiting, filling, clicking, pressing, and screenshotting, and (3) stores the test result under a Notion project by exact project name, creating the project first if it does not already exist.
---

# Test and Record

Use this skill for the full workflow: browser testing plus Notion project logging.

## What this skill combines

This skill merges two responsibilities into one reusable operating pattern:

1. Browser testing
   - open pages with Playwright
   - wait for selectors
   - fill inputs
   - click buttons
   - press keys
   - hover, check, select, and navigate
   - capture screenshots
   - collect visible text and page signals
   - support multi-step login and post-login page switching flows

2. Notion recording
   - search project database by exact `项目名称`
   - if found, append a test record to the project page body
   - if not found, create the project page first
   - then append the test record

## Shared runtime

Playwright shared runtime:
- `/home/openclaw-wsl/.openclaw/tools/playwright-runtime`

Browser runner:
- `/home/openclaw-wsl/.openclaw/workspace/skills/browser-automation/scripts/playwright_runner.js`

## Notion target

Project database id:
- `33c84839-dbe4-8044-b676-d1bd188ff0d3`

Title field:
- `项目名称`

## Required operating rule

Always use this flow:

1. Run or interpret the browser test.
2. Prepare a concise structured test summary.
3. Search Notion by exact `项目名称`.
4. If project exists, append the test record to that page.
5. If project does not exist, create it, then append the same test record.

Do not treat test logging as optional when the user asks for testing plus record keeping.

## Primary entrypoint

Use the bundled executor when the user intent is directly “测试并记录”:

```bash
node /home/openclaw-wsl/.openclaw/workspace/skills/test-and-record/scripts/run-test-and-record.js \
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

Typical output fields:
- `projectName`
- `created`
- `pageId`
- `notionUrl`
- `screenshot`
- `title`
- `visibleText`
- `result`

## Browser step

Internally this executor uses the existing browser automation runner:

```bash
node /home/openclaw-wsl/.openclaw/workspace/skills/browser-automation/scripts/playwright_runner.js <URL> [SCREENSHOT_PATH] [ACTIONS_JSON] [OPTIONS_JSON]
```

## Recording step

Append test content into the matched or created project page body.

Recommended record shape:

- Heading: `测试记录 - <timestamp>`
- `项目名称：...`
- `测试 URL：...`
- `页面标题：...`
- `测试动作：...`
- `测试结果：...`
- `说明：...`
- `截图路径或链接：...`
- `可见文本摘要：...`
- `界面识别摘要：...`

Skip empty optional lines.

## Matching rule

Use exact project-name matching only in the first pass.

If multiple exact matches somehow appear, stop and ask instead of guessing.

## Minimum inputs

- 项目名称
- 测试 URL
- 测试结果 or browser runner output

Preferred full inputs:
- 项目名称
- 测试 URL
- 页面标题
- 测试动作
- 测试结果
- 说明
- 截图路径或链接
- 可见文本摘要
- 界面识别摘要
- 测试时间

## Good usage pattern

1. Run browser test first.
2. Confirm whether the page opened and interaction succeeded.
3. Use returned page signals to classify the page as login-like, captcha-like, or dashboard-like when possible.
4. For login pages, prefer explicit selectors or label/role-based actions over fragile broad selectors.
5. After login, inspect returned page signals to identify the new interface state before continuing.
6. If captcha-like signals appear, treat the run as blocked unless the user explicitly wants one safe attempt.
7. Record only the useful summary, not raw verbose logs.
8. Keep the project page readable over time.

## Notes

- Use the project page body as the running test log.
- Do not overwrite unrelated project fields unless the user asked.
- Prefer uploading screenshots to Notion with the file upload API when possible, then append an image block to the project page.
- If file upload fails, fall back to recording the local path or external URL.
- This skill is the preferred entry point when the user intent is clearly “测试并记录”.
- This skill should also be used when the user wants semi-structured UI work such as 自动登录, 识别界面, 切换菜单, or 登录后继续测试并记录.
- For 图形验证 or 滑块验证, default to detect-and-record mode first, then optionally do one safe attempt if the page structure is simple.
- Prefer this pattern for difficult login flows: headful first-run for manual login, save storage state, then reuse that storage state in later headless runs.

## Related files

- Browser skill: `/home/openclaw-wsl/.openclaw/workspace/skills/browser-automation/SKILL.md`
- Notion project testing skill: `/home/openclaw-wsl/.openclaw/workspace/skills/notion-project-testing/SKILL.md`
