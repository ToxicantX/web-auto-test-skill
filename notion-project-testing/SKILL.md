---
name: notion-project-testing
description: Write browser test records into a Notion project database by project name. Use when an agent needs to store testing output under a project workspace in Notion, following the rule: find the project by exact project name, append a test record to that project page if found, or create the project first and then append the test record if not found.
---

# Notion Project Testing

Use this skill when test results should be stored in Notion under a project-oriented workspace.

## Fixed target database

Current project database:
- `33c84839-dbe4-8044-b676-d1bd188ff0d3`

Database title field:
- `项目名称`

This is the authoritative lookup key for project matching.

## Required rule

Always follow this order:

1. Search the project database by exact `项目名称`.
2. If found, append the test record to that project's page body.
3. If not found, create a new project page in the same database using `项目名称`, then append the test record to that new page.

Do not guess with fuzzy matching in the first implementation. Exact match only unless the user explicitly asks otherwise.

## What to append

Append a structured test record to the project page body, not into random database fields.

Recommended block structure:

- Heading: `测试记录 - <timestamp>`
- Bulleted or paragraph lines for:
  - 项目名称
  - 测试 URL
  - 测试动作
  - 测试结果
  - 说明
  - 截图路径或截图链接（如果有）
  - 可见文本摘要（如果有）

## Why append in page body

The database stores project metadata. Test records are repeatable operational logs and should accumulate in the project page content area.

## Minimal workflow

1. Normalize the incoming project name only by trimming obvious surrounding whitespace.
2. Query the database for exact `项目名称`.
3. If zero results, create a new page with `项目名称` set.
4. Append a new test record block set to the page.
5. Return the matched or created page id and a short success summary.

## Inputs to collect

Minimum useful input set:
- 项目名称
- 测试 URL
- 测试结果

Preferred full input set:
- 项目名称
- 测试 URL
- 测试动作
- 测试结果
- 说明
- 截图路径或链接
- 可见文本摘要
- 测试时间

## Suggested timestamp format

Use a clear local timestamp, for example:
- `2026-04-08 14:52 Asia/Shanghai`

## Example record shape

```text
测试记录 - 2026-04-08 14:52 Asia/Shanghai
项目名称：青基会后台
测试 URL：https://example.com/login
测试动作：打开页面，填写账号密码，点击登录
测试结果：成功 / 失败 / 阻塞
说明：页面可正常打开，验证码阻塞提交
截图路径或链接：/path/to/file.png
可见文本摘要：登录 / 点击完成滑动验证 / 返回旧版本
```

## Notes for browser-testing agents

This skill pairs well with browser automation output. Typical flow:

1. Use browser automation to collect screenshot path, title, and visible text.
2. Convert that output into a short test record.
3. Write it into the matched or newly created project page.

## Safety and quality

- Do not overwrite existing project metadata unless the user asks.
- Do not silently append to the wrong project. If exact match is ambiguous, stop and ask.
- Prefer short, structured test logs over long raw dumps.
