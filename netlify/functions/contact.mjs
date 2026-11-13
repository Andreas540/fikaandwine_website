// Contact form -> email, sent through Resend.
// Runs on Netlify, not in the visitor's browser, so the API key stays secret.
//
// Settings (Netlify: Site configuration -> Environment variables), never in this repository:
//   RESEND_API_KEY  the Resend API key
//   CONTACT_TO      the address that receives inquiries
//   CONTACT_FROM    the sender, e.g. "Fika & Wine <noreply@fikaandwine.com>"
//                   (its domain must be verified in Resend)

const LIMITS = { name: 120, email: 200, type: 80, guests: 10, details: 5000 };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "method" });

  let data;
  try {
    data = await req.json();
  } catch {
    return json(400, { ok: false, error: "format" });
  }

  // Spam trap: a field people never see. Bots fill it; pretend success, send nothing.
  if (data.website) return json(200, { ok: true });

  const field = (k) => String(data[k] ?? "").trim().slice(0, LIMITS[k]);
  const f = Object.fromEntries(Object.keys(LIMITS).map((k) => [k, field(k)]));
  if (!f.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
    return json(400, { ok: false, error: "fields" });
  }

  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
    return json(503, { ok: false, error: "not-configured" });
  }

  const text = [
    `Name: ${f.name}`,
    `Email: ${f.email}`,
    `Event: ${f.type}`,
    `Guests: ${f.guests}`,
    "",
    f.details,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: CONTACT_TO.split(",").map((s) => s.trim()),
      reply_to: f.email,
      subject: `Fika & Wine event inquiry — ${f.type || "General"}`,
      text,
    }),
  });

  if (!res.ok) {
    console.error("Resend error", res.status, await res.text());
    return json(502, { ok: false, error: "send" });
  }
  return json(200, { ok: true });
};

export const config = { path: "/api/contact" };
