document.getElementById('year').textContent = new Date().getFullYear();

// Contact form: sent to /api/contact (Netlify function -> Resend).
// Where that function is not available (old GitHub Pages copy, not configured yet),
// it falls back to the earlier preview behaviour: the inquiry is shown for copying.
document.getElementById('inquiry').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = this;
  const note = document.getElementById('form-note');
  const button = form.querySelector('button[type="submit"]');
  const d = new FormData(form);
  const data = Object.fromEntries(d.entries());

  button.disabled = true;
  note.textContent = 'Sending…';
  let status = 0;
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    status = res.status;
  } catch (err) {
    status = 0;
  }
  button.disabled = false;

  if (status === 200) {
    form.reset();
    note.textContent = 'Thank you! Your inquiry has been sent. We will get back to you soon.';
    return;
  }
  if (status === 400) {
    note.textContent = 'Please check your name and email address and try again.';
    return;
  }
  if (status === 502) {
    note.textContent = 'Sorry, your inquiry could not be sent right now. Please try again later.';
    return;
  }

  // Not available here (404, 405, 503 or no connection): preview fallback.
  const subject = 'Fika & Wine event inquiry — ' + d.get('type');
  const body = `Name: ${d.get('name')}\nEmail: ${d.get('email')}\nEvent: ${d.get('type')}\nGuests: ${d.get('guests')}\n\n${d.get('details')}`;
  note.textContent = 'Preview mode: business email not yet configured. Your message is ready to copy below.';
  let out = form.querySelector('textarea[aria-label="Copy inquiry"]');
  if (!out) {
    out = document.createElement('textarea');
    out.readOnly = true;
    out.setAttribute('aria-label', 'Copy inquiry');
    form.appendChild(out);
  }
  out.value = 'Subject: ' + subject + '\n' + body;
  out.select();
});

(function () {
  const menu = document.querySelector('.mobile-menu');
  if (!menu) return;
  const closeMenu = () => { menu.removeAttribute('open'); };
  menu.querySelectorAll('.mobile-menu-links a').forEach(link => {
    link.addEventListener('click', closeMenu);
    link.addEventListener('touchend', () => { setTimeout(closeMenu, 0); }, { passive: true });
  });
  document.addEventListener('click', event => { if (!menu.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('hashchange', closeMenu);
  window.addEventListener('pageshow', closeMenu);
})();
