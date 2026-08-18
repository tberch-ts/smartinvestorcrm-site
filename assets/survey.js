// "Find your fit" — the seven-step survey that both qualifies the lead and
// derives the workspace they'll get. Panels 0-5 are the questions, 6 collects
// the contact details, 7 is the result.
//
// Answers are held client-side until submit, then POSTed to /api/leads with
// the derived track and plan (see apps/api/src/routes/leads.ts).
(function () {
  var root = document.querySelector('[data-survey]');
  if (!root) return;

  var PANELS = 8;
  var LAST_QUESTION = 5; // index of the final radio panel
  var RESULT = 7;

  // Shown under each question until it's answered.
  var HINTS = [
    'Pick one to continue.',
    'Everybody starts somewhere.',
    'This sets how much we automate for you.',
    'You can change this any time.',
    'This decides whether we open the capital tools.',
    'Rewards are paid per funded account.',
  ];

  // Which answer key each question panel writes, in panel order.
  var KEYS = ['role', 'exp', 'time', 'call', 'capital', 'referral'];

  var step = 0;
  var answers = {};
  var submitting = false;

  // Analytics. The survey is the whole funnel on this page, and until now it
  // reported nothing between the page_view and the lead — a drop-off at
  // question four looked identical to never scrolling to it. `furthest`
  // keeps survey_step honest: it fires once per step actually reached, so
  // Back doesn't inflate the step someone already counted for.
  var started = false;
  var furthest = 0;

  // Named sendEvent, not track: `track` is the sliding panel rail a few
  // lines down.
  function sendEvent(name, params) {
    if (window.siteAnalytics) window.siteAnalytics.track(name, params);
  }

  function stepName(index) {
    if (index <= LAST_QUESTION) return KEYS[index];
    return index === RESULT ? 'result' : 'contact';
  }

  var track = root.querySelector('[data-track]');
  var panels = track.querySelectorAll('.panel');
  var stepN = root.querySelector('[data-step-n]');
  var stepFill = root.querySelector('[data-step-fill]');
  var backBtn = root.querySelector('[data-back]');
  var foot = root.querySelector('[data-foot]');
  var note = root.querySelector('[data-note]');
  var nextBtn = root.querySelector('[data-next]');
  var submitBtn = root.querySelector('[data-submit]');
  var errorBox = root.querySelector('[data-submit-error]');
  var restartBtn = root.querySelector('[data-restart]');

  // The button's markup carries an inline SVG arrow; swapping textContent for
  // the busy state would drop it, so keep the original to restore.
  var submitMarkup = null;

  function field(name) {
    return root.querySelector('[data-field="' + name + '"]');
  }

  /* ── Derivation ───────────────────────────────────────────────────────
     The payoff panel, and the shape of the account we go on to create. */
  function derive() {
    var a = answers;
    var track_ =
      a.role === 'Seller' ? 'Land disposition'
      : a.capital === 'No capital yet' ? 'Land & tax-lien assignments'
      : a.role === 'Broker' ? 'Brokerage sourcing'
      : 'Multifamily acquisitions';

    var capital =
      a.capital === "Other people's money" ? 'Syndication — capital raise + LP funnel unlocked'
      : a.capital === 'A mix' ? 'Hybrid — own equity plus an LP tranche'
      : a.capital === 'No capital yet' ? 'Assignment first — no capital required'
      : 'Balance-sheet buyer';

    var plan =
      a.exp === '10+' || a.time === 'Full time' ? 'Pro — $79/mo'
      : a.referral === 'Yes, a whole network' ? 'Pro — $79/mo (referral rewards active)'
      : 'Free — upgrade when deal two lands';

    var call =
      a.call === 'Yes' ? 'Scheduled — we email times'
      : a.call === 'Maybe' ? 'On hold until deal one'
      : 'Not for now';

    var title =
      a.exp === 'Never' ? "You're on the first-deal track."
      : a.exp === '10+' ? "You don't need the course. You need the queue."
      : 'Your desk is configured.';

    var body =
      a.exp === 'Never'
        ? 'We open with one market, one buy box and the assignment route — the lowest-capital way to get a first close on the board. The course unlocks phase by phase as you complete each one.'
        : a.exp === '10+'
          ? 'Scoring, hotspots and the deal board come up first; the learning modules stay collapsed. You get the nightly scored queue and the LOI generator, and we stay out of the way.'
          : 'Your sidebar is trimmed to the tools your answers point at, your first market is preloaded and scored, and the rest stays hidden until you need it.';

    var market = (field('market').value || '').trim() || 'Denver';

    return { track: track_, capital: capital, plan: plan, call: call, title: title, body: body, market: market };
  }

  function fillResult() {
    var d = derive();
    root.querySelector('[data-res-title]').textContent = d.title;
    root.querySelector('[data-res-body]').textContent = d.body;
    root.querySelector('[data-res-track]').textContent = d.track;
    root.querySelector('[data-res-market]').textContent = d.market;
    root.querySelector('[data-res-capital]').textContent = d.capital;
    root.querySelector('[data-res-call]').textContent = d.call;
    root.querySelector('[data-res-plan]').textContent = d.plan;
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  function render() {
    track.style.transform = 'translateX(-' + step * (100 / PANELS) + '%)';
    stepN.textContent = String(Math.min(step + 1, 7));
    stepFill.style.width = Math.round((Math.min(step, 7) / 7) * 100) + '%';
    backBtn.hidden = !(step > 0 && step < RESULT);
    foot.hidden = step > LAST_QUESTION;

    if (step <= LAST_QUESTION) {
      var picked = answers[KEYS[step]];
      note.textContent = picked ? 'Answered: ' + picked : HINTS[step];
    }

    // Off-screen panels stay in the DOM for the slide, so take them out of
    // the tab order — otherwise Tab walks into invisible fields.
    for (var i = 0; i < panels.length; i++) {
      var current = i === step;
      panels[i].setAttribute('aria-hidden', current ? 'false' : 'true');
      var focusable = panels[i].querySelectorAll(
        'input:not([data-no-tab] *), button:not([data-no-tab] *), a:not([data-no-tab] *), textarea, select'
      );
      for (var j = 0; j < focusable.length; j++) {
        focusable[j].tabIndex = current ? 0 : -1;
      }
    }
  }

  function goTo(next) {
    step = Math.max(0, Math.min(RESULT, next));
    render();

    // goTo only ever runs off a click, so the first one is the start.
    if (!started) {
      started = true;
      sendEvent('survey_start', {});
    }
    if (step > furthest) {
      furthest = step;
      sendEvent('survey_step', { step_number: step + 1, step_name: stepName(step) });
    }
  }

  /* ── Wiring ───────────────────────────────────────────────────────── */
  root.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || !input.dataset || !input.dataset.key) return;
    answers[input.dataset.key] = input.value;
    render();
    // Picking an option carries you forward on its own; the delay lets the
    // selected state land before the panel slides away.
    setTimeout(function () {
      if (step <= LAST_QUESTION) goTo(step + 1);
    }, 240);
  });

  nextBtn.addEventListener('click', function () {
    goTo(step + 1);
  });
  backBtn.addEventListener('click', function () {
    goTo(step - 1);
  });

  restartBtn.addEventListener('click', function () {
    answers = {};
    var radios = root.querySelectorAll('input[type="radio"]');
    for (var i = 0; i < radios.length; i++) radios[i].checked = false;
    if (errorBox) errorBox.hidden = true;
    // A second run through is a second funnel, not a continuation of the
    // first — let every step count again.
    furthest = 0;
    sendEvent('survey_restart', {});
    goTo(0);
  });

  submitBtn.addEventListener('click', function () {
    if (submitting) return;
    var name = (field('name').value || '').trim();
    var email = (field('email').value || '').trim();
    var market = (field('market').value || '').trim();
    var company = (field('company').value || '').trim();

    if (errorBox) errorBox.hidden = true;
    if (!name) return showError('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return showError('Please enter a valid work email.');

    var d = derive();
    sendEvent('survey_submit', { lead_track: d.track, lead_plan: d.plan, lead_market: d.market });
    submitting = true;
    submitBtn.disabled = true;
    if (submitMarkup === null) submitMarkup = submitBtn.innerHTML;
    submitBtn.textContent = 'Building…';

    var apiUrl = (window.SITE_CONFIG && window.SITE_CONFIG.apiUrl) || '';

    fetch(apiUrl + '/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        market: market || undefined,
        role: answers.role,
        exp: answers.exp,
        time: answers.time,
        call: answers.call,
        capital: answers.capital,
        referral: answers.referral,
        derivedTrack: d.track,
        derivedCapitalPath: d.capital,
        derivedPlan: d.plan,
        company: company || undefined,
      }),
    })
      .then(function (res) {
        if (res.ok) return null;
        return res
          .json()
          .catch(function () {
            return null;
          })
          .then(function (body) {
            throw new Error((body && body.error) || 'Something went wrong (' + res.status + '). Please try again.');
          });
      })
      .then(function () {
        // GA4's recommended lead event, so it can be marked a key event in
        // the property without any custom setup. This is the moment the
        // marketing site has actually done its job.
        sendEvent('generate_lead', {
          lead_source: 'fit_survey',
          lead_track: d.track,
          lead_plan: d.plan,
          lead_market: d.market,
        });
        fillResult();
        goTo(RESULT);
      })
      .catch(function (err) {
        sendEvent('form_error', { form_id: 'fit_survey' });
        showError(err.message);
      })
      .finally(function () {
        submitting = false;
        submitBtn.disabled = false;
        if (submitMarkup !== null) submitBtn.innerHTML = submitMarkup;
      });
  });

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  render();
})();
