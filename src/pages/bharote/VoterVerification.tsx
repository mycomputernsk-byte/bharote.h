import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import BharoteNavbar from "@/components/bharote/BharoteNavbar";
import { 
  Fingerprint, 
  Phone, 
  Loader2,
  CheckCircle2,
  Shield,
  Send,
  RefreshCw,
  Mail,
  Smartphone
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VoterVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [voter, setVoter] = useState<any>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [verificationMethod, setVerificationMethod] = useState<"sms" | "email">("sms");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchVoter = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: voterData, error } = await supabase
        .from("voters")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error || !voterData) {
        toast({
          title: "Registration Required",
          description: "Please complete your voter registration first.",
          variant: "destructive",
        });
        navigate("/register");
        return;
      }

      if (voterData.verification_status === "verified") {
        navigate("/vote");
        return;
      }

      setVoter(voterData);
    };

    fetchVoter();
  }, [navigate, toast]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendSmsOtp = async () => {
    if (!voter) return;
    setIsSendingOtp(true);

    try {
      // Call the Twilio SMS edge function
      const { data, error } = await supabase.functions.invoke('send-sms-otp', {
        body: {
          phoneNumber: voter.phone_number,
          voterId: voter.id
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Update verification status
      await supabase
        .from("voters")
        .update({ verification_status: "otp_sent" })
        .eq("id", voter.id);

      toast({
        title: "OTP Sent!",
        description: `A 6-digit code has been sent to ${voter.phone_number}`,
      });

      setOtpSent(true);
      setCountdown(60);
    } catch (error: any) {
      console.error('SMS OTP Error:', error);
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again or use email verification",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!voter || !voter.email) {
      toast({
        title: "Email Required",
        description: "No email address found. Please update your registration.",
        variant: "destructive",
      });
      return;
    }
    setIsSendingOtp(true);

    try {
      // Generate a 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in database first
      const { error: dbError } = await supabase
        .from("voters")
        .update({
          email_otp_code: generatedOtp,
          email_otp_expires_at: expiresAt.toISOString(),
          verification_status: "otp_sent",
        })
        .eq("id", voter.id);

      if (dbError) throw dbError;

      // Call the Resend email edge function
      const { data, error } = await supabase.functions.invoke('send-email-otp', {
        body: {
          email: voter.email,
          otp: generatedOtp,
          voterName: voter.full_name,
          voterId: voter.voter_id
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast({
        title: "OTP Sent!",
        description: `A 6-digit code has been sent to ${voter.email}`,
      });

      setOtpSent(true);
      setCountdown(60);
    } catch (error: any) {
      console.error('Email OTP Error:', error);
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSendOtp = () => {
    if (verificationMethod === "sms") {
      handleSendSmsOtp();
    } else {
      handleSendEmailOtp();
    }
  };

  const handleVerifyOtp = async () => {
    if (!voter || !otp) return;
    setIsLoading(true);

    try {
      // Fetch latest voter data with OTP
      const { data: voterData, error: fetchError } = await supabase
        .from("voters")
        .select("otp_code, otp_expires_at, email_otp_code, email_otp_expires_at")
        .eq("id", voter.id)
        .single();

      if (fetchError) throw fetchError;

      // Check which OTP to verify
      let otpCode: string | null = null;
      let otpExpiry: string | null = null;

      if (verificationMethod === "sms") {
        otpCode = voterData.otp_code;
        otpExpiry = voterData.otp_expires_at;
      } else {
        otpCode = voterData.email_otp_code;
        otpExpiry = voterData.email_otp_expires_at;
      }

      // Verify OTP
      if (otpCode !== otp) {
        throw new Error("Invalid OTP. Please check and try again.");
      }

      if (otpExpiry && new Date(otpExpiry) < new Date()) {
        throw new Error("OTP has expired. Please request a new one.");
      }

      // Update verification status
      const updateData: any = {
        verification_status: "verified",
        otp_code: null,
        otp_expires_at: null,
        email_otp_code: null,
        email_otp_expires_at: null,
      };

      if (verificationMethod === "email") {
        updateData.email_verified = true;
      }

      const { error } = await supabase
        .from("voters")
        .update(updateData)
        .eq("id", voter.id);

      if (error) throw error;

      toast({
        title: "Verification Complete!",
        description: "You are now eligible to cast your vote.",
      });

      navigate("/vote");
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!voter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BharoteNavbar />
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Step 2 of 3
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Identity Verification</h1>
            <p className="text-muted-foreground">
              Verify your identity via OTP to enable voting
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            {/* Voter Info Card */}
            <div className="p-4 rounded-xl bg-secondary/10 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold">{voter.full_name}</div>
                  <div className="text-sm text-muted-foreground font-mono">{voter.voter_id}</div>
                </div>
              </div>
            </div>

            {!otpSent ? (
              <div className="space-y-6">
                <Tabs value={verificationMethod} onValueChange={(v) => setVerificationMethod(v as "sms" | "email")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sms" className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      SMS
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sms" className="mt-6">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Phone Verification</h3>
                      <p className="text-muted-foreground">
                        We'll send a one-time password to <strong>{voter.phone_number}</strong>
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="email" className="mt-6">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Email Verification</h3>
                      <p className="text-muted-foreground">
                        We'll send a one-time password to <strong>{voter.email || "No email set"}</strong>
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button 
                  onClick={handleSendOtp}
                  className="w-full h-12 text-lg gradient-saffron hover:opacity-90"
                  disabled={isSendingOtp || (verificationMethod === "email" && !voter.email)}
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send OTP via {verificationMethod === "sms" ? "SMS" : "Email"}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Fingerprint className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Enter OTP</h3>
                  <p className="text-muted-foreground">
                    Enter the 6-digit code sent to your {verificationMethod === "sms" ? "phone" : "email"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-14 text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={handleVerifyOtp}
                  className="w-full h-12 text-lg gradient-saffron hover:opacity-90"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Verify & Continue
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    onClick={handleSendOtp}
                    disabled={countdown > 0 || isSendingOtp}
                    className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VoterVerification;
