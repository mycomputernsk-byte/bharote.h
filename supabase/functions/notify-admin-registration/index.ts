import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "haniskholmes@gmail.com";

interface RegistrationNotification {
  voterName: string;
  voterId: string;
  email: string | null;
  phoneNumber: string;
  constituency: string;
  registeredAt: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.error("Missing RESEND_API_KEY");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { voterName, voterId, email, phoneNumber, constituency, registeredAt }: RegistrationNotification = await req.json();

    const formattedDate = new Date(registeredAt).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a365d 0%, #0f172a 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: #FF9933; font-size: 28px; margin: 0 0 8px 0;">
              <span style="color: #FF9933;">BHAR</span><span style="color: white;">O</span><span style="color: #228B22;">TE</span>
            </h1>
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">Admin Notification</p>
          </div>
          
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="background: #228B22; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px;">
                ✓
              </div>
              <h2 style="color: #1a365d; margin: 16px 0 8px 0;">New Voter Registered</h2>
              <p style="color: #64748b; margin: 0;">A new voter has completed registration</p>
            </div>
            
            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Full Name</td>
                  <td style="padding: 8px 0; color: #1a365d; font-weight: 600; text-align: right;">${voterName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Voter ID</td>
                  <td style="padding: 8px 0; color: #1a365d; font-weight: 600; text-align: right; font-family: monospace;">${voterId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
                  <td style="padding: 8px 0; color: #1a365d; font-weight: 600; text-align: right;">${email || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Phone</td>
                  <td style="padding: 8px 0; color: #1a365d; font-weight: 600; text-align: right;">${phoneNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Constituency</td>
                  <td style="padding: 8px 0; color: #1a365d; font-weight: 600; text-align: right;">${constituency}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Registered At</td>
                  <td style="padding: 8px 0; color: #1a365d; font-weight: 600; text-align: right;">${formattedDate}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                This voter is pending OTP verification before they can cast their vote.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 24px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              🔒 Secured by BHAROTE Blockchain Voting System
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Call Resend API directly
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BHAROTE Admin <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `🗳️ New Voter Registration: ${voterName}`,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend error:", result);
      return new Response(
        JSON.stringify({ error: result.message || "Failed to send notification" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin notification sent successfully:", result.id);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in notify-admin-registration:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
