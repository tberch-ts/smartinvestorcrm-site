// One event per thing a visitor actually did.
//
// gtag.js on its own reports every hand-off to app.smartinvestorcrm.com as
// the same enhanced-measurement `click`, so the Events report cannot tell a
// nav "Sign in" from "Start Pro" at the foot of the pricing table — the whole
// funnel out of this site arrives as a single number. This file names them.
//
// Two halves:
//   1. Every CTA carries data-cta="<id>". A delegated listener turns the
//      click into sign_up_start / sign_in_start / cta_click and attaches the
//      id, the section it sits in, and the plan the link asks for.
//   2. window.siteAnalytics.track(), which survey.js and opt-in.js use for
//      the events that aren't clicks (funnel steps, a submitted lead).
//
// Nothing here is allowed to be the reason a click doesn't work: gtag is
// absent behind an ad blocker and on a file:// preview, and every call is
// guarded for it.
(function () {
  // GA4 sends events to every configured stream, so no measurement id here —
  // the gtag('config') in each page's <head> owns that.
  function track(name, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, params || {});
  }

  // The event *name* comes from where the click goes, so the Events report
  // separates the two hand-offs into the app without anyone having to
  // register a custom dimension first. The finer breakdown — which of the
  // six sign-up buttons, on which plan — rides along as parameters.
  function eventFor(href) {
    if (!href) return 'cta_click';
    if (href.indexOf('/sign-up') !== -1) return 'sign_up_start';
    if (href.indexOf('/sign-in') !== -1) return 'sign_in_start';
    return 'cta_click';
  }

  // Where on the page the CTA sits. Sections carry ids already (#fit,
  // #pricing, #tools); the nav and the footer don't, and they're the two
  // places where the same "Sign in" link appears twice.
  function sectionOf(el) {
    var section = el.closest('[data-section]');
    if (section) return section.getAttribute('data-section');
    section = el.closest('section[id]');
    if (section) return section.id;
    if (el.closest('nav')) return 'nav';
    if (el.closest('footer')) return 'footer';
    return 'page';
  }

  function planOf(el, href) {
    if (el.getAttribute('data-plan')) return el.getAttribute('data-plan');
    var match = href && href.match(/[?&]plan=([^&#]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || typeof target.closest !== 'function') return;
    var el = target.closest('[data-cta]');
    if (!el) return;

    var href = el.getAttribute('href') || '';
    track(eventFor(href), {
      cta_id: el.getAttribute('data-cta'),
      cta_section: sectionOf(el),
      // Only outbound hand-offs get a url; the in-page CTAs are anchors and
      // "#fit" says nothing a cta_id doesn't already say.
      link_url: href.indexOf('http') === 0 ? href : undefined,
      plan: planOf(el, href),
    });
  });

  window.siteAnalytics = { track: track };
})();
