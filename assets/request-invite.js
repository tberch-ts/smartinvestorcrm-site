// "Request an invite" — the form behind the one card on the pricing section.
//
// WHERE IT POSTS, AND WHY IT IS NOT THE APP'S API. The request is a sales
// decision, not an account: somebody reads it and decides. So it lands in the
// marketing CRM, which is where every other "a person asked for something"
// row already lives, and the approval there is what mints the invite and
// emails the quote. The app's API never hears about it until the invite is
// minted. See marketingCRM apps/api/src/routes/inviteRequests.ts.
//
// THE ENDPOINT IS GUARDED BY ORIGIN, not by a key in this file. A key shipped
// in a public page is an identifier rather than a credential, and this form
// does not need one — there is one product and one allowlisted origin. A page
// cannot forge Origin, which is what stops somebody else's site posting into
// the queue.
(function () {
  var cfg = window.SITE_CONFIG || {};

  // The marketing CRM, not cfg.apiUrl — that is the app's API (mfa-api), and
  // pointing this at it would 404 in a way that reads to the visitor as "the
  // form is broken" and to us as nothing at all.
  var CRM_URL = (cfg.crmApiUrl || 'https://marketing-api.fly.dev').replace(/\/+$/, '');

  var form = document.getElementById('form');
  var errorBox = document.getElementById('error');
  var submitBtn = document.getElementById('submit');
  var doneBox = document.getElementById('done');

  function fill(attr, value) {
    if (!value) return;
    var nodes = document.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = value;
  }
  if (cfg.business) fill('data-business-name', cfg.business.name);

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  /** Attribution, so the marketing can still be measured on these. */
  function utm() {
    var q = new URLSearchParams(window.location.search);
    return {
      utmSource: q.get('utm_source') || undefined,
      utmMedium: q.get('utm_medium') || undefined,
      utmCampaign: q.get('utm_campaign') || undefined,
      referrer: document.referrer || undefined,
      landingPath: window.location.pathname + window.location.search,
    };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.hidden = true;

    var name = val('name');
    var email = val('email');

    // Checked here so the visitor is told immediately rather than after a
    // round trip. The server checks the same things again — this is a
    // courtesy, not the validation.
    if (!name) return showError('Please tell us your name.');
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
      return showError('Please enter an email we can send the quote to.');
    }

    var payload = Object.assign(
      {
        name: name,
        email: email,
        company: val('company'),
        phone: val('phone'),
        markets: val('markets'),
        dealVolume: val('dealVolume'),
        message: val('message'),
        // The honeypot travels with everything else: the server decides what
        // a filled trap means, and answers success either way so a scraper
        // never learns which of its submissions were discarded.
        wb_ref2: val('wb_ref2'),
      },
      utm()
    );

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch(CRM_URL + '/api/public/invite-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) {
          return res
            .json()
            .catch(function () {
              return null;
            })
            .then(function (body) {
              // 429 is the one worth naming: "try again" is actionable and
              // "something went wrong" sends them to the contact page.
              throw new Error(
                res.status === 429
                  ? 'That was a lot of requests at once — give it a minute and try again.'
                  : (body && (body.message || body.error)) || 'We could not send that. Please try again.'
              );
            });
        }
        return res.json();
      })
      .then(function () {
        if (window.gtag) window.gtag('event', 'generate_lead', { method: 'request_invite' });
        var doneEmail = document.getElementById('done-email');
        if (doneEmail) doneEmail.textContent = email;
        form.hidden = true;
        doneBox.hidden = false;
        doneBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function (err) {
        showError(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request an invite';
      });
  });
})();
