// Site configuration — the ONLY file you need to edit for business details.
//
// ⚠️ REQUIRED BEFORE TWILIO SUBMISSION ⚠️
// The name, phone, and email below must match your toll-free registration
// and the business name used in your sample messages, exactly. The values
// shipped here are still placeholders carried over from the original page.
window.SITE_CONFIG = {
  business: {
    name: 'Talkstudio Land',        // <-- set your real registered business name
    phone: '(000) 000-0000',        // <-- set your real contact number
    email: 'tom@talkstudio.space',  // <-- set your real contact email
  },

  // Where the opt-in POST goes. This is the public API only — nothing
  // operational lives in this repo.
  apiUrl: 'https://mfa-api.fly.dev',
};
