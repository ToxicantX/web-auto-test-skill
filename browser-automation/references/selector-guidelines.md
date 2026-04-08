# Selector Guidelines

Prefer stable selectors in this order:

1. `data-testid`, `data-test`, `data-qa`
2. `name`
3. `placeholder`
4. `type` with a narrower parent scope
5. unique class chains

Avoid broad selectors such as:
- `input`
- `button`
- `.el-input__inner`

Because they often match multiple elements and trigger Playwright strict mode errors.

## Good examples

```css
input[name="username"]
input[placeholder="请输入用户名"]
button[type="submit"]
form.login-form button.el-button--primary
```

## Narrow with parent scopes

```css
.login-box input[placeholder="请输入用户名"]
.login-box input[type="password"]
```

## Debugging pattern

When a click or fill fails:

1. Confirm the selector is unique.
2. Add `waitForSelector` first.
3. Add a short `waitForTimeout` after dynamic UI changes.
4. Capture a screenshot before and after the failing step.
5. Read `visibleText` from runner output to confirm the page state.
