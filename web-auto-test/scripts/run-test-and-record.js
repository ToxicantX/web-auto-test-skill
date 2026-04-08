#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const https = require('https');
const crypto = require('crypto');

const DB_ID = '33c84839-dbe4-8044-b676-d1bd188ff0d3';
const TITLE_FIELD = '项目名称';
const RUNNER = '/home/openclaw-wsl/.openclaw/workspace/skills/browser-automation/scripts/playwright_runner.js';

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON: ${raw}`);
  }
}

function notionRequest(method, apiPath, token, body, extraHeaders = {}, rawBuffer = null) {
  return new Promise((resolve, reject) => {
    const payload = rawBuffer || (body ? Buffer.from(JSON.stringify(body)) : null);
    const req = https.request(
      {
        hostname: 'api.notion.com',
        path: `/v1${apiPath}`,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(!rawBuffer ? { 'Content-Type': 'application/json' } : {}),
          ...extraHeaders,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = data ? JSON.parse(data) : {};
          } catch {
            parsed = { raw: data };
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Notion ${method} ${apiPath} failed: ${res.statusCode} ${JSON.stringify(parsed)}`));
          }
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function findProjectByName(token, projectName) {
  const body = {
    filter: {
      property: TITLE_FIELD,
      title: { equals: projectName },
    },
    page_size: 10,
  };
  const result = await notionRequest('POST', `/databases/${DB_ID}/query`, token, body);
  return result.results || [];
}

async function createProject(token, projectName) {
  return notionRequest('POST', '/pages', token, {
    parent: { database_id: DB_ID },
    properties: {
      [TITLE_FIELD]: {
        title: [{ text: { content: projectName } }],
      },
    },
  });
}

function richText(content) {
  return [{ type: 'text', text: { content: String(content) } }];
}

function buildBlocks(record) {
  const lines = [
    ['项目名称', record.projectName],
    ['测试 URL', record.url],
    ['页面标题', record.title],
    ['测试动作', record.actionSummary],
    ['测试结果', record.result],
    ['说明', record.note],
    ['截图路径或链接', record.screenshot],
    ['可见文本摘要', Array.isArray(record.visibleText) ? record.visibleText.join(' / ') : record.visibleText],
    ['界面识别摘要', record.interfaceSummary],
  ].filter(([, value]) => value && String(value).trim());

  const blocks = [
    {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: richText(`测试记录 - ${record.timestamp}`) },
    },
  ];

  for (const [label, value] of lines) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: richText(`${label}：${value}`) },
    });
  }
  if (record.notionFileUploadId) {
    blocks.push({
      object: 'block',
      type: 'image',
      image: {
        type: 'file_upload',
        file_upload: { id: record.notionFileUploadId },
      },
    });
  }

  return blocks;
}

async function appendBlocks(token, pageId, blocks) {
  return notionRequest('PATCH', `/blocks/${pageId}/children`, token, { children: blocks });
}

async function createFileUpload(token, filename, contentType) {
  return notionRequest('POST', '/file_uploads', token, {
    filename,
    content_type: contentType,
    mode: 'single_part',
  });
}

async function sendFileToUploadUrl(uploadUrl, filePath, token) {
  const fileBuffer = fs.readFileSync(filePath);
  const boundary = `----openclaw-${crypto.randomBytes(12).toString('hex')}`;
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
  const bodyStart = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`,
    'utf8',
  );
  const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const payload = Buffer.concat([bodyStart, fileBuffer, bodyEnd]);

  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    const req = https.request(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2026-03-11',
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': payload.length,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, body: data });
          } else {
            reject(new Error(`File upload failed: ${res.statusCode} ${data}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function maybeUploadImageToNotion(token, filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
  const created = await createFileUpload(token, path.basename(filePath), contentType);
  const uploadUrl = created.upload_url || created?.file_upload?.upload_url;
  const fileUploadId = created.id || created?.file_upload?.id;
  if (!uploadUrl || !fileUploadId) {
    throw new Error(`Unexpected file upload create response: ${JSON.stringify(created)}`);
  }
  await sendFileToUploadUrl(uploadUrl, filePath, token);
  return fileUploadId;
}

function runBrowserTest({ url, screenshot, actions, options }) {
  const args = [RUNNER, url, screenshot, JSON.stringify(actions || []), JSON.stringify(options || {})];
  const res = spawnSync('node', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (res.status !== 0) {
    throw new Error(`Browser runner failed: ${res.stderr || res.stdout}`);
  }
  return JSON.parse(res.stdout);
}

function localTimestamp() {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type) => fmt.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} Asia/Shanghai`;
}

async function main() {
  const args = parseArgs(process.argv);
  const token = process.env.NOTION_API_KEY;
  if (!token) throw new Error('NOTION_API_KEY is required');

  const projectName = (args.project || '').trim();
  const url = args.url;
  if (!projectName) throw new Error('--project is required');
  if (!url) throw new Error('--url is required');

  const actions = safeJsonParse(args.actions, []);
  const options = safeJsonParse(args.options, { postGotoWaitMs: 1500, ignoreHTTPSErrors: true });
  const note = args.note || '';
  const actionSummary = args['action-summary'] || '';
  const resultOverride = args.result || '';
  const headless = args.headful ? false : true;
  const slowMo = args['slow-mo'] ? Number(args['slow-mo']) : 0;
  const storageStatePath = args['storage-state'] || '';
  const saveStorageStatePath = args['save-storage-state'] || '';

  const screenshot = args.screenshot || path.resolve('/home/openclaw-wsl/.openclaw/workspace/artifacts', `${projectName.replace(/[^a-zA-Z0-9-_\u4e00-\u9fa5]+/g, '_')}-${Date.now()}.png`);
  fs.mkdirSync(path.dirname(screenshot), { recursive: true });

  const mergedOptions = {
    ...options,
    headless,
    slowMo,
    ...(storageStatePath ? { storageStatePath } : {}),
    ...(saveStorageStatePath ? { saveStorageStatePath } : {}),
  };

  const browser = runBrowserTest({ url, screenshot, actions, options: mergedOptions });

  const matches = await findProjectByName(token, projectName);
  if (matches.length > 1) {
    throw new Error(`Multiple exact project matches for ${projectName}, refusing to guess`);
  }

  let page = matches[0];
  let created = false;
  if (!page) {
    page = await createProject(token, projectName);
    created = true;
  }

  let notionFileUploadId = null;
  let uploadWarning = null;
  try {
    notionFileUploadId = await maybeUploadImageToNotion(token, browser.screenshot || screenshot);
  } catch (err) {
    uploadWarning = err.message;
  }

  const detection = browser?.signals?.detection || {};
  const stateTags = [
    detection.isLoginLike ? '疑似登录页' : '',
    detection.isCaptchaLike ? '疑似验证码阻塞' : '',
    detection.isDashboardLike ? '疑似后台界面' : '',
  ].filter(Boolean);

  const interfaceSummary = [
    stateTags.length ? `状态: ${stateTags.join(' / ')}` : '',
    browser?.signals?.headings?.length ? `标题区: ${browser.signals.headings.slice(0, 3).join(' / ')}` : '',
    browser?.signals?.buttons?.length ? `按钮: ${browser.signals.buttons.slice(0, 5).map((b) => b.text).filter(Boolean).join(' / ')}` : '',
    browser?.signals?.inputs?.length ? `输入框: ${browser.signals.inputs.slice(0, 5).map((i) => i.placeholder || i.name || i.id || i.type).filter(Boolean).join(' / ')}` : '',
  ].filter(Boolean).join(' ; ');

  const inferredResult = resultOverride || (detection.isCaptchaLike ? '验证码阻塞' : (browser.ok ? '成功' : '失败'));

  const record = {
    projectName,
    url,
    title: browser.title || '',
    actionSummary,
    result: inferredResult,
    note,
    screenshot: browser.screenshot || screenshot,
    visibleText: browser.visibleText || [],
    interfaceSummary,
    timestamp: localTimestamp(),
    notionFileUploadId,
  };

  await appendBlocks(token, page.id, buildBlocks(record));

  console.log(JSON.stringify({
    ok: true,
    projectName,
    created,
    pageId: page.id,
    notionUrl: page.url,
    screenshot: record.screenshot,
    title: record.title,
    visibleText: record.visibleText,
    signals: browser.signals || null,
    interfaceSummary,
    detection,
    result: record.result,
    notionFileUploadId,
    uploadWarning,
    savedStorageStatePath: browser.savedStorageStatePath || saveStorageStatePath || null,
    headless,
  }, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
  process.exit(1);
});
