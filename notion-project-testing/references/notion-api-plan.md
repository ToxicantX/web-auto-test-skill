# Notion API Plan

Target database id:
- `33c84839-dbe4-8044-b676-d1bd188ff0d3`

Title field:
- `项目名称`

## Query rule

Query the database with an exact title match on `项目名称`.

## Create rule

If query returns zero rows, create a new page in the database with only the required title filled first:

- `项目名称` = incoming project name

Do not invent values for other metadata fields unless the user provided them.

## Append rule

Append children blocks to the matched or newly created page.

Suggested blocks:

1. heading_2: `测试记录 - <timestamp>`
2. paragraph: `测试 URL：...`
3. paragraph: `测试动作：...`
4. paragraph: `测试结果：...`
5. paragraph: `说明：...`
6. paragraph: `截图路径或链接：...`
7. paragraph: `可见文本摘要：...`

Skip empty optional lines instead of writing placeholders.

## Return payload

Return at least:
- matched or created page id
- project name
- whether the page was created
- appended timestamp
