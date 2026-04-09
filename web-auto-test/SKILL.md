---
name: web-auto-test
description: Web 测试任务统一入口。用于：页面分类、测试点提取、测试用例生成、在用户确认后执行浏览器测试、输出测试报告，并将结果写入飞书 sheet/doc/wiki 或按项目归档到共享文件夹。适用于用户提到网页测试、页面识别、测试点、测试用例、自动化执行、测试报告、飞书写入、共享文件夹归档等场景。
---

# Web Auto Test

将此 skill 作为 Web 测试任务统一入口，而不是仅做自动化执行。

## 适用任务

优先承接以下任务：

1. 页面分类与页面识别
2. 测试点提取
3. 测试用例生成
4. 用户确认后执行浏览器自动化测试
5. 输出测试报告
6. 写入飞书 sheet / doc / wiki
7. 按项目归档到共享文件夹
8. 写入失败时生成本地 CSV 并上传

## 总体流程

按以下顺序处理：

1. 识别任务类型
2. 页面分类或需求理解
3. 生成测试点 / 测试用例 / 测试资产
4. 若需要自动化执行，则先发用户确认
5. 用户确认后再执行浏览器测试
6. 输出测试报告
7. 写入飞书或按项目归档
8. 若写入失败，切换兜底方案

## 原则

- 未经用户确认，不直接执行自动化测试。
- 先做页面识别，再生成更贴近页面结构的测试用例。
- 若不是自动化执行场景，允许直接输出测试点、测试用例、执行表、报告模板。
- 若页面存在登录/验证码阻塞，优先如实标记，不伪造通过结果。
- 测试报告要包含：页面分类、执行范围、结果、问题说明、截图。
- 只有外部写入 API 返回成功后，才能对用户说“已写入”或“已归档”。

## 任务分流

### A. 纯内容型任务

适用于：
- 根据截图/需求生成测试点
- 生成测试用例
- 生成测试执行表、缺陷跟踪表、测试报告模板
- 只要求写入飞书，不要求自动化执行

处理方式：
- 不强制浏览器执行
- 直接理解页面/需求
- 输出结构化测试资产
- 再按飞书目标类型写入

### B. 页面自动化型任务

适用于：
- 要跑页面
- 要执行浏览器测试
- 要截图和产出执行报告

处理方式：
- 先分类和识别页面
- 先给用户看待执行范围
- 用户确认后执行
- 产出测试报告和截图

### C. 飞书落地型任务

适用于：
- 写入 wiki / sheet / doc / 共享文件夹
- 按项目归档测试资产

处理方式：
- 先识别目标类型
- 优先写 sheet
- 若写入失败，生成本地 CSV 并上传

## Shared runtime

Playwright shared runtime:
- `/home/openclaw-wsl/.openclaw/tools/playwright-runtime`

## Shared scripts and references

- Executor: `scripts/run-test-and-record.js`
- Browser runner: `scripts/playwright_runner.js`
- Selector notes: `references/selector-guidelines.md`
- Workflow notes: `references/workflow.md`
- Notion notes: `references/notion-api-plan.md`

如果在飞书 workspace 中使用，还应结合本地飞书写回规则与脚本。

## 页面分类

若任务是网页测试，先运行 `scripts/playwright_runner.js` 打开目标页面，拿到：

- `classification.pageType`
- `classification.subType`
- `features`
- `structures`
- `detection`

如果识别到：

- `login-page`：说明是登录页
- `admin-dashboard`：说明偏后台管理页
- `frontend-h5`：说明偏前台/H5 页

## 测试资产生成

根据用户意图生成以下内容之一或多项：

- 测试点
- 测试用例
- 测试执行表
- 缺陷跟踪表
- 测试报告模板

### 推荐测试用例表头

优先使用以下字段：

- 用例ID
- 模块
- 页面
- 功能点
- 用例标题
- 前置条件
- 测试步骤
- 预期结果
- 优先级

### 常用专项模板

支持按以下分类扩展测试：

- 文本框
- 搜索框
- 下拉框
- 单选框
- 复选框
- 日期控件
- 上传/导入/导出
- 新增/编辑/删除
- 表格/分页
- UI
- 兼容性
- 易用性
- 容错性
- 安全性
- 性能

## 用户确认后执行

必须先向用户展示：

- 页面分类结果
- 建议执行的测试用例
- 待执行 URL
- 是否需要登录态/是否可能遇到验证码
- 执行范围和潜在阻塞点

只有用户明确确认“执行/开始/跑一下”等意思后，才运行执行脚本。

## 执行与报告

执行脚本会：

- 打开页面
- 执行传入动作
- 截图
- 汇总页面识别结果
- 生成 markdown 报告

如果处于飞书测试 workspace，还可进一步：
- 写入飞书 docx / sheet / wiki
- 或按项目归档到共享文件夹

## 飞书写入策略

在飞书场景中，建议按以下优先级处理：

1. 已有 sheet 直接写
2. wiki 解析到底层 sheet 后写
3. doc/docx 写入
4. 共享文件夹内按项目归档
5. 若 doc 写入失败，则本地生成 CSV 并上传

### 失败兜底

遇到以下情况时，使用兜底方案：

- 文档创建成功但正文写不进去
- 共享文件夹内新建文档或新建表格失败
- 目标对象写入 API 不稳定

兜底方式：
- 在本地生成 CSV 或其他结构化文件
- 上传到共享项目文件夹
- 明确告诉用户上传文件名和位置

### 回复规则

回复用户时优先说明：

- 目标类型（sheet / doc / wiki / 文件）
- 写入位置或项目目录
- 写入范围 / 行列数 / 文件名
- 若失败，明确卡在哪一步

## 项目归档规则

如果用户要求“按项目归档”：

1. 先识别共享主文件夹
2. 再定位项目子文件夹
3. 命名优先使用：
   - 项目名-测试用例
   - 项目名-测试执行表
   - 项目名-缺陷跟踪
   - 项目名-测试报告
4. 若无法直接写入文档或表格，则生成本地 CSV 并上传

## Main entrypoint

```bash
node scripts/run-test-and-record.js \
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

## Output requirements

对用户回复时，优先采用测试工程师格式：

- 页面分类
- 测试点 / 测试用例
- 待确认项
- 执行结果
- 测试报告 / 缺陷
- 写入结果 / 归档结果

不要跳过“用户确认”环节。
不要在未成功写入时声称“已写入”。
