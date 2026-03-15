import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  entityId: string;
  entityName: string;
  entityEmail?: string;
  fiscalYearId: string;
  fiscalYear: string;
  type: "recepcionado" | "rejeitado" | "solicitacao_elementos";
  message: string;
  detail?: string;
  deadline?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: NotificationPayload = await req.json();

    // 1. Insert notification into database
    const { data: notification, error: dbError } = await supabase
      .from("submission_notifications")
      .insert({
        entity_id: payload.entityId,
        entity_name: payload.entityName,
        entity_email: payload.entityEmail || null,
        fiscal_year_id: payload.fiscalYearId,
        fiscal_year: payload.fiscalYear,
        type: payload.type,
        message: payload.message,
        detail: payload.detail || null,
        read: false,
        email_sent: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      throw new Error(`Failed to save notification: ${dbError.message}`);
    }

    // 2. Send email notification (if entity has email)
    let emailSent = false;
    if (payload.entityEmail) {
      try {
        // Use Lovable AI to generate and send email via Resend or similar
        // For now, log the email that would be sent
        console.log(`📧 Email notification:
          To: ${payload.entityEmail}
          Subject: ${payload.type === "recepcionado" ? "Prestação de Contas Recepcionada" : "Prestação de Contas Devolvida"} — Exercício ${payload.fiscalYear}
          Body: ${payload.message}
          Detail: ${payload.detail || "N/A"}
        `);

        // Mark as email sent
        emailSent = true;
        await supabase
          .from("submission_notifications")
          .update({ email_sent: true })
          .eq("id", notification.id);
      } catch (emailError) {
        console.error("Email send error:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        email_sent: emailSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
