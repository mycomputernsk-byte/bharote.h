import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VoteConfirmationRequest {
  email: string;
  voterName: string;
  voterId: string;
  phoneNumber: string;
  partyName: string;
  partySymbol: string;
  partyLeader: string;
  voteHash: string;
  blockNumber: number;
  timestamp: string;
  constituency: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  
  if (!resendApiKey) {
    console.error("Missing RESEND_API_KEY");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const data = await req.json() as VoteConfirmationRequest;
    const { 
      email, voterName, voterId, phoneNumber, partyName, partySymbol, 
      partyLeader, voteHash, blockNumber, timestamp, constituency 
    } = data;

    console.log("Sending vote confirmation to:", email);

    // Generate AI personalized message if API key is available
    let personalizedMessage = `Thank you for exercising your democratic right! Your vote for ${partyName} has been securely recorded on block #${blockNumber} of our immutable blockchain ledger. This transaction is permanent and cannot be altered.`;
    
    if (lovableApiKey) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: "You are a warm, encouraging civic engagement assistant for BHAROTE, India's blockchain voting system. Write a personalized, heartfelt confirmation message (2-3 sentences) for a voter who just cast their vote. Be patriotic, inspiring, and emphasize the importance of democracy. Don't mention specific party names in your message - keep it neutral. Include the blockchain verification details naturally."
              },
              {
                role: "user",
                content: `Generate a personalized vote confirmation message for ${voterName} from ${constituency}. Their vote was recorded on blockchain block #${blockNumber} with hash ${voteHash.substring(0, 16)}... at ${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Make it inspiring and congratulate them on participating in democracy.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          const aiMessage = aiResult.choices?.[0]?.message?.content;
          if (aiMessage) {
            personalizedMessage = aiMessage;
          }
        }
      } catch (aiError) {
        console.error("AI generation failed, using default message:", aiError);
      }
    }

    const formattedDate = new Date(timestamp).toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%); padding: 40px 24px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 8px;">🗳️</div>
            <h1 style="color: #18181b; margin: 0; font-size: 28px; font-weight: bold;">Vote Confirmed!</h1>
            <p style="color: #52525b; margin: 8px 0 0 0; font-size: 14px;">Your voice has been recorded in the blockchain</p>
          </div>
          
          <!-- AI Personalized Message -->
          <div style="padding: 24px; background-color: #fef3c7; border-bottom: 1px solid #fcd34d;">
            <p style="color: #92400e; margin: 0; font-size: 15px; line-height: 1.6; font-style: italic;">
              "${personalizedMessage}"
            </p>
          </div>
          
          <!-- Vote Details -->
          <div style="padding: 32px 24px;">
            <h2 style="color: #18181b; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">📋 Vote Receipt</h2>
            
            <!-- Voter Info -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Voter Name</td>
                  <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600; text-align: right;">${voterName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Voter ID</td>
                  <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-family: monospace; text-align: right;">${voterId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Phone</td>
                  <td style="padding: 8px 0; color: #18181b; font-size: 14px; text-align: right;">${phoneNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Constituency</td>
                  <td style="padding: 8px 0; color: #18181b; font-size: 14px; text-align: right;">${constituency}</td>
                </tr>
              </table>
            </div>
            
            <!-- Party Voted For -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <p style="color: #166534; margin: 0 0 12px 0; font-size: 13px; font-weight: 600;">VOTED FOR</p>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 32px;">${partySymbol || '🏛️'}</div>
                <div>
                  <p style="color: #18181b; margin: 0; font-size: 18px; font-weight: bold;">${partyName}</p>
                  ${partyLeader ? `<p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Led by ${partyLeader}</p>` : ''}
                </div>
              </div>
            </div>
            
            <!-- Blockchain Details -->
            <div style="background-color: #1e1b4b; border-radius: 12px; padding: 20px; color: #e0e7ff;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <span style="font-size: 20px;">⛓️</span>
                <p style="margin: 0; font-size: 14px; font-weight: 600;">Blockchain Verification</p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #a5b4fc; font-size: 12px;">Block Number</td>
                  <td style="padding: 6px 0; color: #ffffff; font-size: 13px; font-family: monospace; text-align: right;">#${blockNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #a5b4fc; font-size: 12px;">Vote Hash</td>
                  <td style="padding: 6px 0; color: #ffffff; font-size: 11px; font-family: monospace; text-align: right; word-break: break-all;">${voteHash}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #a5b4fc; font-size: 12px;">Timestamp</td>
                  <td style="padding: 6px 0; color: #ffffff; font-size: 13px; text-align: right;">${formattedDate}</td>
                </tr>
              </table>
              
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #4338ca;">
                <p style="color: #c7d2fe; margin: 0; font-size: 11px; text-align: center;">
                  🔒 This vote is permanently recorded and cannot be altered
                </p>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #fafafa; padding: 24px; border-top: 1px solid #e4e4e7; text-align: center;">
            <p style="color: #71717a; margin: 0 0 8px 0; font-size: 13px;">
              Thank you for participating in democracy! 🇮🇳
            </p>
            <p style="color: #a1a1aa; margin: 0; font-size: 11px;">
              © 2026 BHAROTE - India's Secure Blockchain Voting System
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Call Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BHAROTE Voting <onboarding@resend.dev>",
        to: [email],
        subject: `🗳️ Vote Confirmed - Block #${blockNumber} | BHAROTE`,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend error:", result);
      return new Response(
        JSON.stringify({ error: result.message || "Failed to send confirmation email" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Vote confirmation email sent successfully:", result.id);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id, personalizedMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending vote confirmation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
