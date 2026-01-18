import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailOTPRequest {
  email: string;
  otp: string;
  voterName?: string;
  voterId?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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
    const { email, otp, voterName, voterId } = await req.json() as EmailOTPRequest;

    console.log("Sending OTP email to:", email);

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #FF9933 0%, #138808 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🗳️ BHAROTE</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Secure Digital Voting System</p>
          </div>
          
          <div style="padding: 32px 24px;">
            <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px;">Verification Code</h2>
            
            ${voterName ? `<p style="color: #52525b; margin: 0 0 16px 0; font-size: 16px;">Hello <strong>${voterName}</strong>,</p>` : ''}
            
            <p style="color: #52525b; margin: 0 0 24px 0; font-size: 16px;">Use the following code to verify your identity:</p>
            
            <div style="background-color: #f4f4f5; border: 2px dashed #FF9933; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
              <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #18181b; letter-spacing: 8px;">${otp}</span>
            </div>
            
            <p style="color: #71717a; margin: 0 0 8px 0; font-size: 14px;">⏱️ This code is valid for <strong>5 minutes</strong></p>
            <p style="color: #71717a; margin: 0 0 24px 0; font-size: 14px;">🔒 Do not share this code with anyone</p>
            
            ${voterId ? `
            <div style="background-color: #f0fdf4; border-left: 4px solid #138808; padding: 12px 16px; border-radius: 0 8px 8px 0;">
              <p style="color: #166534; margin: 0; font-size: 14px;">Voter ID: <strong>${voterId}</strong></p>
            </div>
            ` : ''}
          </div>
          
          <div style="background-color: #fafafa; padding: 20px 24px; border-top: 1px solid #e4e4e7;">
            <p style="color: #a1a1aa; margin: 0; font-size: 12px; text-align: center;">
              If you didn't request this code, please ignore this email.<br>
              © 2026 BHAROTE - Secure Blockchain Voting
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
        from: "BHAROTE Voting <onboarding@resend.dev>",
        to: [email],
        subject: "Your BHAROTE Voting Verification Code",
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend error:", result);
      return new Response(
        JSON.stringify({ error: result.message || "Failed to send email" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", result.id);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
