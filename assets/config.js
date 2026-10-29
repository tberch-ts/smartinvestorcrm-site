// Site configuration — the ONLY file you need to edit for business details.
//
// These values must match your toll-free registration and the business name
// used in your sample messages, EXACTLY. Carriers reject verification on a
// mismatch, and the name here also flows into the SMS consent text that gets
// stored with every opt-in record — so changing it changes what people agreed
// to. Keep it in sync with the registration.
window.SITE_CONFIG = {
  business: {
    name: 'Talk Studio LLC',
    phone: '(650) 517-3366',
    email: 'support@talkstudio.space',
  },

  // Where the opt-in POST goes. This is the public API only — nothing
  // operational lives in this repo.
  apiUrl: 'https://mfa-api.fly.dev',

  // Where "Request an invite" posts. A DIFFERENT service on purpose: an
  // invite request is a sales decision somebody reads and acts on, so it
  // lands in the marketing CRM beside every other one, and the approval
  // there is what mints the invite in the app. Pointing this at `apiUrl`
  // above 404s in a way that reads to a visitor as a broken form.
  crmApiUrl: 'https://marketing-api.fly.dev',
};
