import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BharoteNavbar from "@/components/bharote/BharoteNavbar";
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

const VoterRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [existingVoter, setExistingVoter] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    dateOfBirth: "",
    address: "",
    constituency: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Check if voter already registered
      const { data: voter } = await supabase
        .from("voters")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (voter) {
        setExistingVoter(voter);
      }
    };
    checkAuth();
  }, [navigate]);

  const generateVoterId = () => {
    return 'BHV' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const voterId = generateVoterId();

      const { error } = await supabase.from("voters").insert({
        user_id: user.id,
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        constituency: formData.constituency,
        voter_id: voterId,
        verification_status: "unverified",
      });

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: `Your Voter ID is ${voterId}. Please proceed to verification.`,
      });

      navigate("/verify");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (existingVoter) {
    return (
      <div className="min-h-screen bg-background">
        <BharoteNavbar />
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Already Registered</h1>
            <p className="text-muted-foreground mb-6">
              You have already registered as a voter.
            </p>
            <div className="p-4 rounded-lg bg-card border border-border mb-6">
              <div className="text-sm text-muted-foreground">Voter ID</div>
              <div className="text-xl font-mono font-bold">{existingVoter.voter_id}</div>
            </div>
            <div className="flex gap-4 justify-center">
              {existingVoter.verification_status !== "verified" ? (
                <Button onClick={() => navigate("/verify")} className="gradient-saffron">
                  Complete Verification
                </Button>
              ) : existingVoter.has_voted ? (
                <Button onClick={() => navigate("/confirmation")} variant="outline">
                  View Vote Receipt
                </Button>
              ) : (
                <Button onClick={() => navigate("/vote")} className="gradient-saffron">
                  Cast Your Vote
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
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
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Step 1 of 3
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Voter Registration</h1>
            <p className="text-muted-foreground">
              Complete your registration to receive your unique Voter ID
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name (as per official ID)
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="constituency" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Constituency
                </Label>
                <Input
                  id="constituency"
                  type="text"
                  placeholder="Enter your constituency"
                  value={formData.constituency}
                  onChange={(e) => setFormData(prev => ({ ...prev, constituency: e.target.value }))}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Full Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Your information will be verified against government records. 
                  Please ensure all details are accurate and match your official documents.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg gradient-saffron hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VoterRegistration;
