# Workflow

## Intent

Use this workflow when the user wants one coherent action: test a web page and keep a project-linked record in Notion.

## Steps

1. Collect the project name and target URL.
2. Run browser automation against the target page.
3. Capture output:
   - page title
   - screenshot path
   - visible text
   - action summary
   - pass/fail/block result
4. Search the project database by exact `项目名称`.
5. If not found, create a new project page.
6. Append a structured test record to that page.
7. Return a concise completion summary with:
   - project name
   - matched or created page id
   - screenshot path
   - main result

## Record format

- heading_2: `测试记录 - <timestamp>`
- paragraph: `项目名称：...`
- paragraph: `测试 URL：...`
- paragraph: `页面标题：...`
- paragraph: `测试动作：...`
- paragraph: `测试结果：...`
- paragraph: `说明：...`
- paragraph: `截图路径或链接：...`
- paragraph: `可见文本摘要：...`

Skip empty optional items.
