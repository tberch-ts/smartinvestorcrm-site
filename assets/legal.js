// Fills the business placeholders on the legal pages from SITE_CONFIG, so
// the name/phone/email can never drift between /privacy, /terms and the
// opt-in page. Deliberately separate from opt-in.js, which expects the
// form elements that only exist on /sell-your-land.
(function () {
  var b = (window.SITE_CONFIG || {}).business || {};
  function fill(attr, value) {
    if (!value) return;
    var nodes = document.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = value;
  }
  fill('data-business-name', b.name);
  fill('data-business-phone', b.phone);
  fill('data-business-email', b.email);
})();
