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

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRows(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;white-space:nowrap">${escapeHtml(
          k,
        )}</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
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

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: port === 465,
        auth: { username, password },
      },
    });

    const isOfferte = type === "offerte";
    const subjectIntern = isOfferte
      ? `Nieuwe offerte-aanvraag: ${escapeHtml(data.ophaal_plaats)} → ${escapeHtml(data.aflever_plaats)}`
      : `Nieuw terugbelverzoek van ${escapeHtml(data.naam)}`;

    const tableHtml = `<table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;color:#111">${renderRows(
      data,
    )}</table>`;

    const internHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#ffffff">
        <h2 style="color:#082369;margin:0 0 16px">${subjectIntern}</h2>
        <p style="color:#374151;margin:0 0 16px">Er is een nieuwe aanvraag binnengekomen via de website.</p>
        ${tableHtml}
        <p style="color:#6b7280;font-size:12px;margin-top:24px">De Europa Koerier — automatische notificatie</p>
      </div>`;

    // 1) Notificatie intern
    await client.send({
      from,
      to,
      replyTo: (data.contact_email as string) || (data.email as string) || undefined,
      subject: subjectIntern,
      html: internHtml,
      content: subjectIntern,
    });

    // 2) Bevestiging naar klant (als e-mail bekend is)
    const klantEmail = (data.contact_email as string) || "";
    if (klantEmail) {
      const klantSubject = isOfferte
        ? "Bevestiging offerte-aanvraag — De Europa Koerier"
        : "Bevestiging terugbelverzoek — De Europa Koerier";
      const klantHtml = `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#ffffff">
          <h2 style="color:#082369;margin:0 0 16px">Bedankt voor uw aanvraag</h2>
          <p style="color:#374151">Beste ${escapeHtml(data.contact_naam ?? data.naam ?? "klant")},</p>
          <p style="color:#374151">We hebben uw ${isOfferte ? "offerte-aanvraag" : "terugbelverzoek"} ontvangen en nemen binnen 1 uur (tijdens kantooruren) contact met u op.</p>
          <h3 style="color:#082369;font-size:15px;margin:20px 0 8px">Uw gegevens</h3>
          ${tableHtml}
          <p style="color:#374151;margin-top:20px">Met vriendelijke groet,<br/>De Europa Koerier<br/>085 7602 999 · info@deeuropakoerier.nl</p>
        </div>`;
      await client.send({
        from,
        to: klantEmail,
        replyTo: from,
        subject: klantSubject,
        html: klantHtml,
        content: klantSubject,
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
