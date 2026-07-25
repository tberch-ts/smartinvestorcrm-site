# smartinvestorcrm-site

The **public** website for SmartInvestorCRM — `https://smartinvestorcrm.com`.

This repository is public because GitHub Pages requires it. That is the whole
reason it exists as a separate repo: everything operational lives in a private
repo, and only what genuinely has to be world-readable lives here.

## What's in here

| Path | Purpose |
|---|---|
| `index.html` | Marketing landing page |
| `sell-your-land/index.html` | **Public SMS opt-in / consent page** — the "proof of consent" URL for Twilio toll-free verification, and the messaging terms & privacy page |
| `assets/style.css` | All styling (no framework, no build step) |
| `assets/config.js` | Business name, contact details, API URL — **the only file you normally edit** |
| `assets/opt-in.js` | Opt-in form logic |
| `404.html` | Not-found page |
| `CNAME` | Custom domain for GitHub Pages |

There is **no build step**. Edit the HTML/CSS/JS, commit, push — Pages serves
the files as-is.

## What must NOT go in here

This repo is world-readable, and its contents are indexed and archived by third
parties. Never add:

- Anything from the private application repo — source, config, or docs
- Acquisition criteria, buy-box parameters, deal strategy, or market playbooks
- API endpoint inventories, admin routes, or internal tooling
- Credentials of any kind, including "restricted" or referrer-locked ones

If a change here needs data from the app, it goes through the public API
(`/api/opt-in`), not through committed files.

## ⚠️ Before submitting to Twilio

`assets/config.js` still contains **placeholder** business details:

```js
name:  'Talkstudio Land',       // <-- not verified as your real business name
phone: '(000) 000-0000',        // <-- placeholder
email: 'tom@talkstudio.space',
```

The business name, phone, and email must match your toll-free registration and
the business name used in your sample messages **exactly**, or verification is
rejected. Update `config.js` and redeploy before submitting the URL.

The page satisfies the carrier consent requirements: explicit checkbox (not
pre-checked), full consent language shown next to it, "consent is not a
condition of purchase", message frequency, rates disclosure, STOP/HELP
instructions, and a no-sharing privacy statement.

## Local preview

Any static file server works. For example:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`. Note that the opt-in form POSTs to the live
API — don't submit test data unless you intend to create a real consent record.

## Deployment

GitHub Pages, served from the default branch root. Push to deploy.

The app itself (sign-in and everything behind it) is a **separate, private
repository** deployed to `https://app.smartinvestorcrm.com`. Links from this
site point there.
