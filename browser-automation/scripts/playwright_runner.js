#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  const candidates = [
    '/home/openclaw-wsl/.openclaw/tools/playwright-runtime',
    process.cwd(),
    __dirname,
    path.resolve(__dirname, '..', '..', '..'),
  ];
  for (const base of candidates) {
    try {
      return require(require.resolve('playwright', { paths: [base] }));
    } catch {}
  }
  throw new Error('Cannot resolve module "playwright". Install it in /home/openclaw-wsl/.openclaw/tools/playwright-runtime or run this script from a project that already has Playwright installed.');
}

const { chromium } = loadPlaywright();

function parseJsonArg(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON argument: ${raw}`);
  }
}

async function maybeWaitForFonts(page) {
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch {}
}

async function runActions(page, actions = []) {
  for (const [index, action] of actions.entries()) {
    if (!action || !action.type) throw new Error(`Action #${index + 1} missing type`);
    const timeout = action.timeout ?? 15000;

    switch (action.type) {
      case 'waitForSelector': {
        if (!action.selector) throw new Error(`Action #${index + 1} missing selector`);
        await page.waitForSelector(action.selector, {
          timeout,
          state: action.state || 'visible',
        });
        break;
      }
      case 'fill': {
        if (!action.selector) throw new Error(`Action #${index + 1} missing selector`);
        await page.locator(action.selector).fill(action.value ?? '', { timeout });
        break;
      }
      case 'click': {
        if (!action.selector) throw new Error(`Action #${index + 1} missing selector`);
        await page.locator(action.selector).click({ timeout });
        break;
      }
      case 'press': {
        if (!action.selector) throw new Error(`Action #${index + 1} missing selector`);
        if (!action.key) throw new Error(`Action #${index + 1} missing key`);
        await page.locator(action.selector).press(action.key, { timeout });
        break;
      }
      case 'waitForTimeout': {
        await page.waitForTimeout(action.ms ?? 1000);
        break;
      }
      case 'hover': {
        if (!action.selector) throw new Error(`Action #${index + 1} missing selector`);
        await page.locator(action.selector).hover({ timeout });
        break;
      }
      case 'check': {
        if (!action.selector) throw new Error(`Action #${index + 1} missing selector`);
        await page.locator(action.selector).check({ timeout });
        break;
      }
      case 'uncheck': {
        if (!action.selector) throw new Error(`Action #${index + 1} missing selector`);
        await page.locator(action.selector).uncheck({ timeout });
        break;
      }
      case 'select': {
        if (!action.selector) throw new Error(`Action #${index + 1} missing selector`);
        await page.locator(action.selector).selectOption(action.value ?? action.values ?? null, { timeout });
        break;
      }
      case 'goto': {
        if (!action.url) throw new Error(`Action #${index + 1} missing url`);
        await page.goto(action.url, {
          waitUntil: action.waitUntil || 'domcontentloaded',
          timeout,
        });
        break;
      }
      case 'locatorScreenshot': {
        if (!action.selector) throw new Error(`Action #${index + 1} missing selector`);
        if (!action.path) throw new Error(`Action #${index + 1} missing path`);
        fs.mkdirSync(path.dirname(action.path), { recursive: true });
        await page.locator(action.selector).screenshot({ path: action.path, timeout });
        break;
      }
      case 'clickText': {
        if (!action.text) throw new Error(`Action #${index + 1} missing text`);
        await page.getByText(action.text, { exact: action.exact ?? true }).click({ timeout });
        break;
      }
      case 'fillByLabel': {
        if (!action.label) throw new Error(`Action #${index + 1} missing label`);
        await page.getByLabel(action.label, { exact: action.exact ?? true }).fill(action.value ?? '', { timeout });
        break;
      }
      case 'clickByRole': {
        if (!action.role) throw new Error(`Action #${index + 1} missing role`);
        await page.getByRole(action.role, {
          name: action.name,
          exact: action.exact,
        }).click({ timeout });
        break;
      }
      case 'drag': {
        if (!action.from) throw new Error(`Action #${index + 1} missing from selector`);
        if (!action.to) throw new Error(`Action #${index + 1} missing to selector`);
        await page.locator(action.from).dragTo(page.locator(action.to), { timeout });
        break;
      }
      case 'evaluate': {
        const value = await page.evaluate(action.expression || '() => null');
        if (action.storeAs) {
          page.__openclawStore = page.__openclawStore || {};
          page.__openclawStore[action.storeAs] = value;
        }
        break;
      }
      case 'screenshot': {
        if (!action.path) throw new Error(`Action #${index + 1} missing path`);
        fs.mkdirSync(path.dirname(action.path), { recursive: true });
        await maybeWaitForFonts(page);
        await page.screenshot({ path: action.path, fullPage: action.fullPage ?? true });
        break;
      }
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
  }
}

async function collectVisibleText(page) {
  return page.evaluate(() => {
    const bodyText = document.body?.innerText || '';
    return bodyText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 40);
  });
}

async function collectPageSignals(page) {
  return page.evaluate(() => {
    const q = (sel) => Array.from(document.querySelectorAll(sel));
    const take = (arr, n = 20) => arr.slice(0, n);
    const bodyText = (document.body?.innerText || '').trim();
    const lowerText = bodyText.toLowerCase();
    const placeholders = q('input, textarea').map((el) => el.getAttribute('placeholder') || '').filter(Boolean);
    const buttonTexts = q('button, [role="button"]').map((el) => (el.innerText || el.textContent || '').trim()).filter(Boolean);
    const headingTexts = q('h1,h2,h3').map((el) => (el.innerText || el.textContent || '').trim()).filter(Boolean);

    const hasPassword = q('input[type="password"]').length > 0;
    const loginHints = ['登录', 'signin', 'sign in', '用户名', '账号', '密码', 'remember me'];
    const captchaHints = ['验证码', '滑动验证', '拖动', '拼图', '点选', '行为验证', 'security check', 'verify', 'captcha'];
    const dashboardHints = ['首页', '控制台', 'dashboard', '管理', '系统设置', '用户管理', '数据看板'];

    const joined = [bodyText, ...placeholders, ...buttonTexts, ...headingTexts].join('\n').toLowerCase();
    const findAny = (arr) => arr.some((x) => joined.includes(x.toLowerCase()));

    const hasCaptchaFrame = q('iframe').some((el) => {
      const src = (el.getAttribute('src') || '').toLowerCase();
      return src.includes('captcha') || src.includes('geetest') || src.includes('verify');
    });

    const inputs = take(q('input, textarea, select').map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || null,
      name: el.getAttribute('name') || null,
      placeholder: el.getAttribute('placeholder') || null,
      id: el.id || null,
    })));

    const buttons = take(q('button, [role="button"]').map((el) => ({
      text: (el.innerText || el.textContent || '').trim().slice(0, 80),
      id: el.id || null,
      className: (el.className || '').toString().slice(0, 120),
    })));

    const links = take(q('a').map((el) => ({
      text: (el.innerText || el.textContent || '').trim().slice(0, 80),
      href: el.getAttribute('href') || null,
    })));

    const headings = take(headingTexts);

    const isLoginLike = hasPassword && findAny(loginHints);
    const isCaptchaLike = hasCaptchaFrame || findAny(captchaHints);
    const isDashboardLike = findAny(dashboardHints) && !isLoginLike;

    return {
      url: location.href,
      inputs,
      buttons,
      links,
      headings,
      detection: {
        isLoginLike,
        isCaptchaLike,
        isDashboardLike,
        hasPassword,
        hasCaptchaFrame,
      },
      textHints: {
        placeholders: take(placeholders, 10),
        buttonTexts: take(buttonTexts, 10),
      },
      bodyPreview: bodyText.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 20),
    };
  });
}

async function main() {
  const url = process.argv[2] || 'https://example.com';
  const outputPath = process.argv[3] || path.resolve(process.cwd(), 'artifacts', 'playwright-smoke.png');
  const actions = parseJsonArg(process.argv[4], []);
  const options = parseJsonArg(process.argv[5], {});

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const browser = await chromium.launch({
    headless: options.headless ?? true,
    slowMo: options.slowMo ?? 0,
  });
  const contextOptions = {
    viewport: options.viewport || { width: 1440, height: 900 },
    ignoreHTTPSErrors: options.ignoreHTTPSErrors ?? true,
  };
  if (options.storageStatePath) {
    contextOptions.storageState = options.storageStatePath;
  }
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  await page.goto(url, {
    waitUntil: options.waitUntil || 'domcontentloaded',
    timeout: options.gotoTimeout || 30000,
  });

  if (options.postGotoWaitMs) await page.waitForTimeout(options.postGotoWaitMs);

  await maybeWaitForFonts(page);
  await runActions(page, actions);

  const title = await page.title();
  const visibleText = await collectVisibleText(page);
  const signals = await collectPageSignals(page);

  await maybeWaitForFonts(page);
  await page.screenshot({ path: outputPath, fullPage: true });

  if (options.saveStorageStatePath) {
    fs.mkdirSync(path.dirname(options.saveStorageStatePath), { recursive: true });
    await context.storageState({ path: options.saveStorageStatePath });
  }

  await context.close();
  await browser.close();

  console.log(JSON.stringify({ ok: true, url, title, screenshot: outputPath, visibleText, signals, savedStorageStatePath: options.saveStorageStatePath || null }, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
  process.exit(1);
});
