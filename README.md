# web-auto-test

一个独立的 AgentSkill，用于：

- 使用 Playwright 做网页自动化测试
- 支持 headless / headful
- 支持登录态 `storageState` 复用
- 识别登录页 / 验证码阻塞 / 后台界面
- 自动截图
- 将测试结果记录到 Notion 项目页
- 找不到项目时自动创建项目
- 将截图上传到 Notion 并插入页面

## 当前能力

### 浏览器能力
- 打开页面
- 等待元素
- 填写输入框
- 点击 / Hover / Select / Check / Drag
- 文本 / Role / Label 定位
- 页面截图 / 元素截图
- 页面信号识别（inputs / buttons / links / headings）
- 登录页 / 验证码页 / 后台界面识别

### 登录态能力
- 前台模式人工登录
- 保存 Playwright `storageState`
- 后台模式复用登录态跳过登录页

### Notion 能力
- 按 `项目名称` 精确查找项目
- 找不到则自动创建项目
- 在项目页内追加测试记录
- 上传截图到 Notion 并插入图片块

## 目录结构

```text
web-auto-test/
  SKILL.md
  scripts/
    playwright_runner.js
    run-test-and-record.js
  references/
    selector-guidelines.md
    workflow.md
    notion-api-plan.md
```

## 使用方式

主入口：

```bash
node /home/openclaw-wsl/.openclaw/workspace/skills/web-auto-test/scripts/run-test-and-record.js \
  --project "项目名" \
  --url "https://example.com" \
  --actions '[]' \
  --options '{"postGotoWaitMs":1500,"ignoreHTTPSErrors":true}' \
  --action-summary "打开页面并做基础检查" \
  --note "补充说明"
```

### 常用参数
- `--project` 项目名称（Notion 中的 `项目名称`）
- `--url` 测试链接
- `--actions` Playwright 动作 JSON 数组
- `--options` 浏览器选项 JSON
- `--action-summary` 测试动作摘要
- `--note` 备注
- `--screenshot` 自定义截图路径
- `--result` 手工指定结果
- `--headful` 前台模式
- `--slow-mo <ms>` 前台慢动作
- `--storage-state <path>` 复用登录态
- `--save-storage-state <path>` 保存登录态

## 推荐登录策略

如果登录页有验证码或滑块，推荐：

1. 先用 `--headful` 打开页面
2. 人工登录 / 人工过验证
3. 用 `--save-storage-state` 保存登录态
4. 后续用 `--storage-state` 在 headless 模式直接复用登录态

## 当前边界

### 已支持
- 基础网页测试
- 页面状态识别
- 验证码阻塞识别
- 截图与 Notion 记录
- 登录态复用

### 暂未承诺稳定支持
- 自动破解复杂滑块 / 图形验证码
- 强风控系统稳定绕过
- 所有后台系统的通用智能导航

当前策略是：
- 先识别
- 再做一次安全尝试
- 不行就记录为 `验证码阻塞`
- 必要时人工介入

## 仓库说明

这个仓库承载的是一个独立 skill：
- 名称：`web-auto-test`

后续继续围绕这个单 skill 迭代，而不是再拆回多个平级 skill。
