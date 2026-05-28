import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  type: "offerte" | "terugbel";
  data: Record<string, unknown>;
}

const BRAND = {
  name: "De Europa Koerier",
  tagline: "Spoedkoerier door heel Europa",
  primary: "#082369",
  accent: "#f59e0b",
  phone: "085 7602 999",
  phoneHref: "tel:+31857602999",
  email: "info@deeuropakoerier.nl",
  website: "https://deeuropakoerier.nl",
  adres: "Pianostraat 17, 5642 RC Eindhoven",
  kvk: "63044951",
  btw: "NL8550.69.764.B.02",
};

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LABELS: Record<string, string> = {
  contact_naam: "Naam",
  contact_email: "E-mail",
  contact_telefoon: "Telefoon",
  ophaal_adres: "Ophaaladres",
  ophaal_postcode: "Ophaal postcode",
  ophaal_plaats: "Ophaalplaats",
  aflever_adres: "Afleveradres",
  aflever_postcode: "Aflever postcode",
  aflever_plaats: "Afleverplaats",
  datum: "Gewenste datum",
  omschrijving: "Zending",
  afstand_km: "Afstand (km)",
  urgentie: "Urgentie",
  opmerkingen: "Opmerkingen",
  naam: "Naam",
  telefoon: "Telefoon",
  tijdslot: "Gewenst tijdslot",
  opmerking: "Opmerking",
};

const SECTIONS = {
  offerte: [
    { title: "Contactgegevens", keys: ["contact_naam", "contact_email", "contact_telefoon"] },
    { title: "Ophalen", keys: ["ophaal_adres", "ophaal_postcode", "ophaal_plaats"] },
    { title: "Afleveren", keys: ["aflever_adres", "aflever_postcode", "aflever_plaats"] },
    { title: "Zending & planning", keys: ["datum", "omschrijving", "afstand_km", "urgentie", "opmerkingen"] },
  ],
  terugbel: [
    { title: "Contactgegevens", keys: ["naam", "telefoon"] },
    { title: "Voorkeur", keys: ["tijdslot", "opmerking"] },
  ],
};

function renderSection(title: string, rows: [string, unknown][]): string {
  if (!rows.length) return "";
  const trs = rows
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #eef2f7;color:#6b7280;font-size:13px;width:40%;vertical-align:top">${escapeHtml(LABELS[k] ?? k)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #eef2f7;color:#111827;font-size:14px;font-weight:500">${escapeHtml(v)}</td>
        </tr>`,
    )
    .join("");
  return `
    <tr><td style="padding:18px 0 6px 0">
      <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.primary};font-weight:700">${escapeHtml(title)}</div>
    </td></tr>
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eef2f7;border-radius:8px;overflow:hidden;background:#ffffff">
        ${trs}
      </table>
    </td></tr>`;
}

function renderSections(type: "offerte" | "terugbel", data: Record<string, unknown>): string {
  const out: string[] = [];
  for (const section of SECTIONS[type]) {
    const rows = section.keys
      .map((k) => [k, data[k]] as [string, unknown])
      .filter(([, v]) => v !== null && v !== undefined && v !== "");
    out.push(renderSection(section.title, rows));
  }
  return out.join("");
}

function layout(opts: { title: string; preheader: string; intro: string; body: string; cta?: { label: string; href: string } }): string {
  const cta = opts.cta
    ? `<tr><td style="padding:24px 0 8px 0">
         <a href="${opts.cta.href}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:8px">${escapeHtml(opts.cta.label)}</a>
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 12px">
  <tr><td align="center">
    <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04)">
      <!-- Header -->
      <tr><td style="background:${BRAND.primary};padding:24px 28px">
        <table role="presentation" width="100%"><tr>
          <td style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-.01em">
            ${BRAND.name}
            <div style="font-size:12px;font-weight:400;opacity:.8;margin-top:2px">${BRAND.tagline}</div>
          </td>
          <td align="right" style="color:#ffffff;font-size:13px;opacity:.9">
            <a href="${BRAND.phoneHref}" style="color:#ffffff;text-decoration:none;font-weight:600">${BRAND.phone}</a>
          </td>
        </tr></table>
      </td></tr>

      <!-- Accent bar -->
      <tr><td style="height:4px;background:linear-gradient(90deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);line-height:4px;font-size:0">&nbsp;</td></tr>

      <!-- Content -->
      <tr><td style="padding:32px 28px 8px 28px">
        <h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.3;color:#111827;font-weight:700">${escapeHtml(opts.title)}</h1>
        <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6">${opts.intro}</p>
      </td></tr>

      <tr><td style="padding:8px 28px 28px 28px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${opts.body}
          ${cta}
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f9fafb;border-top:1px solid #eef2f7;padding:20px 28px">
        <table role="presentation" width="100%">
          <tr>
            <td style="color:#6b7280;font-size:12px;line-height:1.6">
              <strong style="color:#111827">${BRAND.name}</strong><br/>
              ${BRAND.adres}<br/>
              <a href="${BRAND.phoneHref}" style="color:${BRAND.primary};text-decoration:none">${BRAND.phone}</a> ·
              <a href="mailto:${BRAND.email}" style="color:${BRAND.primary};text-decoration:none">${BRAND.email}</a><br/>
              <a href="${BRAND.website}" style="color:${BRAND.primary};text-decoration:none">${BRAND.website.replace(/^https?:\/\//, "")}</a>
            </td>
            <td align="right" style="color:#9ca3af;font-size:11px;line-height:1.6;vertical-align:bottom">
              KvK ${BRAND.kvk}<br/>
              BTW ${BRAND.btw}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
    <div style="color:#9ca3af;font-size:11px;margin-top:14px">© ${new Date().getFullYear()} ${BRAND.name}. Alle rechten voorbehouden.</div>
  </td></tr>
</table>
</body>
</html>`;
}

function plainText(title: string, intro: string, data: Record<string, unknown>): string {
  const lines = [title, "", intro, ""];
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined || v === "") continue;
    lines.push(`${LABELS[k] ?? k}: ${v}`);
  }
  lines.push("", `${BRAND.name} · ${BRAND.phone} · ${BRAND.email}`);
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { type, data } = (await req.json()) as Payload;
    if (!type || !data) throw new Error("type en data zijn verplicht");

    const host = Deno.env.get("SMTP_HOST")!;
    const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
    const username = Deno.env.get("SMTP_USERNAME")!;
    const password = Deno.env.get("SMTP_PASSWORD")!;
    const from = Deno.env.get("SMTP_FROM_EMAIL")!;
    const to = Deno.env.get("SMTP_TO_EMAIL") ?? from;
    const fromHeader = `${BRAND.name} <${from}>`;

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: port === 465,
        auth: { username, password },
      },
    });

    const isOfferte = type === "offerte";

    // --- Intern bericht ---
    const subjectIntern = isOfferte
      ? `Nieuwe offerte-aanvraag — ${escapeHtml(data.ophaal_plaats)} → ${escapeHtml(data.aflever_plaats)}`
      : `Nieuw terugbelverzoek — ${escapeHtml(data.naam)}`;

    const introIntern = isOfferte
      ? `Er is zojuist een nieuwe offerte-aanvraag binnengekomen via de website. Hieronder vindt u alle details.`
      : `Er is zojuist een nieuw terugbelverzoek binnengekomen via de website. Neem zo snel mogelijk contact op.`;

    const sectionsHtml = renderSections(type, data);

    const internHtml = layout({
      title: isOfferte ? "Nieuwe offerte-aanvraag" : "Nieuw terugbelverzoek",
      preheader: subjectIntern,
      intro: introIntern,
      body: sectionsHtml,
      cta: data.contact_email
        ? { label: "Antwoord direct naar klant", href: `mailto:${data.contact_email}` }
        : data.telefoon
        ? { label: "Bel klant terug", href: `tel:${String(data.telefoon).replace(/\s+/g, "")}` }
        : undefined,
    });

    await client.send({
      from: fromHeader,
      to,
      replyTo: (data.contact_email as string) || (data.email as string) || undefined,
      subject: subjectIntern,
      html: internHtml,
      content: plainText(subjectIntern, introIntern, data),
    });

    // --- Bevestiging naar klant ---
    const klantEmail = (data.contact_email as string) || "";
    if (klantEmail) {
      const klantNaam = escapeHtml(data.contact_naam ?? data.naam ?? "klant");
      const klantSubject = isOfferte
        ? "Bevestiging van uw offerte-aanvraag"
        : "Bevestiging van uw terugbelverzoek";

      const klantIntro = isOfferte
        ? `Beste ${klantNaam},<br/><br/>Bedankt voor uw offerte-aanvraag bij <strong>${BRAND.name}</strong>. We hebben uw gegevens in goede orde ontvangen en sturen u <strong>binnen 1 uur</strong> (tijdens kantooruren) een persoonlijke offerte op maat.`
        : `Beste ${klantNaam},<br/><br/>Bedankt voor uw terugbelverzoek bij <strong>${BRAND.name}</strong>. Een van onze medewerkers belt u zo spoedig mogelijk terug binnen het door u gekozen tijdslot.`;

      const klantHtml = layout({
        title: isOfferte ? "Uw offerte-aanvraag is ontvangen" : "Uw terugbelverzoek is ontvangen",
        preheader: isOfferte
          ? "We sturen u binnen 1 uur een offerte op maat."
          : "We bellen u zo spoedig mogelijk terug.",
        intro: klantIntro,
        body: `
          <tr><td style="padding:18px 0 6px 0">
            <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.primary};font-weight:700">Samenvatting van uw aanvraag</div>
          </td></tr>
          ${renderSections(type, data)}
          <tr><td style="padding:22px 0 0 0;color:#4b5563;font-size:14px;line-height:1.6">
            Heeft u in de tussentijd een vraag? Bel ons gerust op
            <a href="${BRAND.phoneHref}" style="color:${BRAND.primary};font-weight:600;text-decoration:none">${BRAND.phone}</a>
            of antwoord direct op deze e-mail.
          </td></tr>
          <tr><td style="padding:18px 0 0 0;color:#111827;font-size:14px">
            Met vriendelijke groet,<br/>
            <strong>Team ${BRAND.name}</strong>
          </td></tr>`,
        cta: { label: "Bel direct " + BRAND.phone, href: BRAND.phoneHref },
      });

      await client.send({
        from: fromHeader,
        to: klantEmail,
        replyTo: from,
        subject: klantSubject,
        html: klantHtml,
        content: plainText(klantSubject, "Bedankt voor uw aanvraag.", data),
      });
    }

    await client.close();

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-smtp-email error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
