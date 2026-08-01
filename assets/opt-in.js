// Opt-in form for /sell-your-land. Vanilla JS port of the former
// SellYourLand.tsx — same payload, same endpoint, same consent language.
(function () {
  var cfg = window.SITE_CONFIG;
  var BUSINESS = cfg.business;

  var CONSENT_TEXT =
    'I agree to receive text messages from ' + BUSINESS.name + ' about selling my land at the phone number ' +
    'I provided, including messages sent using automated technology. Consent is not a condition of any ' +
    'purchase. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help.';

  // Fill every business placeholder from config so the details can never
  // drift between the header, the consent text, and the privacy section.
  function fill(attr, value) {
    var nodes = document.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = value;
  }
  fill('data-business-name', BUSINESS.name);
  fill('data-business-phone', BUSINESS.phone);
  fill('data-business-email', BUSINESS.email);
  document.getElementById('consent-text').textContent = CONSENT_TEXT;

  var form = document.getElementById('form');
  var errorBox = document.getElementById('error');
  var submitBtn = document.getElementById('submit');
  var doneBox = document.getElementById('done');

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.hidden = true;

    var name = document.getElementById('name').value.trim();
    var phone = document.getElementById('phone').value.trim();
    var email = document.getElementById('email').value.trim();
    var propertyLocation = document.getElementById('propertyLocation').value.trim();
    var company = document.getElementById('company').value.trim();
    var consent = document.getElementById('consent').checked;

    // SMS consent is deliberately NOT required to submit. Carriers reject an
    // opt-in workflow where agreeing to texts is a condition of using the
    // form (Twilio error 30505: "Opt-in must be optional, not required").
    // The lead is accepted either way; only a checked box creates an SMS
    // consent record.
    if (!name) return showError('Please enter your name.');
    if (!phone) return showError('Please enter your phone number.');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch(cfg.apiUrl + '/api/opt-in', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: name,
        phone: phone,
        email: email || undefined,
        propertyLocation: propertyLocation || undefined,
        consent: consent,
        consentText: consent ? CONSENT_TEXT : undefined,
        company: company || undefined,
      }),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return null; }).then(function (body) {
            throw new Error((body && body.error) || 'Something went wrong (' + res.status + '). Please try again.');
          });
        }
        form.hidden = true;
        doneBox.hidden = false;
        // Only promise texts to someone who actually opted in.
        document.getElementById('done-sms').hidden = !consent;
      })
      .catch(function (err) {
        showError(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get my cash offer';
      });
  });
})();
