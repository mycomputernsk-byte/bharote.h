import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BharoteNavbar from "@/components/bharote/BharoteNavbar";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Mail,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";

interface State {
  state: string;
}

interface Constituency {
  id: string;
  name: string;
  state: string;
  constituency_number: number;
  constituency_type: string;
  district: string;
}

const VoterRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [existingVoter, setExistingVoter] = useState<any>(null);
  const [states, setStates] = useState<State[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [ageError, setAgeError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    address: "",
    constituency: "",
    constituencyId: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hash: fingerprintHash, isLoading: fingerprintLoading } = useDeviceFingerprint();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      // Pre-fill email from session
      setFormData(prev => ({ ...prev, email: session.user.email || "" }));

      // Check if voter already registered
      const { data: voter } = await supabase
        .from("voters")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (voter) {
        setExistingVoter(voter);
      }

      // Check if this device fingerprint is already registered
      if (fingerprintHash) {
        const { data: existingFingerprint } = await supabase
          .from("voters")
          .select("id, voter_id")
          .eq("device_fingerprint_hash", fingerprintHash)
          .single();

        if (existingFingerprint && !voter) {
          toast({
            title: "Device Already Registered",
            description: "This device has already been used for voter registration. One vote per device is allowed.",
            variant: "destructive",
          });
        }
      }
    };
    checkAuth();
  }, [navigate, fingerprintHash, toast]);

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      const { data, error } = await supabase.rpc('get_all_states');
      if (!error && data) {
        setStates(data);
      }
    };
    fetchStates();
  }, []);

  // Fetch constituencies when state changes
  useEffect(() => {
    const fetchConstituencies = async () => {
      if (!selectedState) {
        setConstituencies([]);
        return;
      }
      const { data, error } = await supabase.rpc('get_constituencies_by_state', { p_state: selectedState });
      if (!error && data) {
        setConstituencies(data);
      }
    };
    fetchConstituencies();
  }, [selectedState]);

  // Age validation
  const validateAge = (dateOfBirth: string): boolean => {
    if (!dateOfBirth) return false;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 18;
  };

  const handleDateOfBirthChange = (value: string) => {
    setFormData(prev => ({ ...prev, dateOfBirth: value }));
    if (value && !validateAge(value)) {
      setAgeError("You must be 18 years or older to register as a voter.");
    } else {
      setAgeError(null);
    }
  };

  const handleConstituencySelect = (constituencyId: string) => {
    const selected = constituencies.find(c => c.id === constituencyId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        constituencyId: selected.id,
        constituency: `${selected.name}, ${selected.district || selected.state}`
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate age
    if (!validateAge(formData.dateOfBirth)) {
      toast({
        title: "Age Requirement Not Met",
        description: "You must be 18 years or older to register as a voter.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate fingerprint
    if (fingerprintHash) {
      const { data: existingFingerprint } = await supabase
        .from("voters")
        .select("id")
        .eq("device_fingerprint_hash", fingerprintHash)
        .single();

      if (existingFingerprint) {
        toast({
          title: "Registration Blocked",
          description: "This device has already been used for voter registration. One registration per device is allowed.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check for duplicate email
    const { data: existingEmail } = await supabase
      .from("voters")
      .select("id")
      .eq("email", formData.email)
      .single();

    if (existingEmail) {
      toast({
        title: "Email Already Registered",
        description: "This email address is already associated with a voter registration.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate voter ID using database function
      const { data: voterIdData, error: voterIdError } = await supabase.rpc('generate_voter_id');
      
      if (voterIdError) throw voterIdError;
      
      const voterId = voterIdData;

      const { error } = await supabase.from("voters").insert({
        user_id: user.id,
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        email: formData.email,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        constituency: formData.constituency,
        constituency_id: formData.constituencyId || null,
        voter_id: voterId,
        verification_status: "unverified",
        device_fingerprint_hash: fingerprintHash,
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

          {/* Fingerprint Status */}
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
            fingerprintLoading 
              ? "bg-muted/50" 
              : fingerprintHash 
                ? "bg-accent/10 border border-accent/20" 
                : "bg-destructive/10 border border-destructive/20"
          }`}>
            <Fingerprint className={`w-6 h-6 ${
              fingerprintLoading ? "text-muted-foreground animate-pulse" : 
              fingerprintHash ? "text-accent" : "text-destructive"
            }`} />
            <div>
              <div className="font-medium">
                {fingerprintLoading 
                  ? "Capturing Device Fingerprint..." 
                  : fingerprintHash 
                    ? "Device Verified" 
                    : "Fingerprint Error"}
              </div>
              <div className="text-sm text-muted-foreground">
                {fingerprintLoading 
                  ? "Please wait while we secure your registration" 
                  : fingerprintHash 
                    ? "Your device has been uniquely identified for fraud prevention" 
                    : "Unable to capture device fingerprint"}
              </div>
            </div>
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

              <div className="grid md:grid-cols-2 gap-4">
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
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth (Must be 18+)
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleDateOfBirthChange(e.target.value)}
                  className={`h-12 ${ageError ? 'border-destructive' : ''}`}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  required
                />
                {ageError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {ageError}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    State
                  </Label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {states.map((s) => (
                        <SelectItem key={s.state} value={s.state}>
                          {s.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Constituency
                  </Label>
                  <Select 
                    value={formData.constituencyId} 
                    onValueChange={handleConstituencySelect}
                    disabled={!selectedState}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={selectedState ? "Select constituency" : "Select state first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {constituencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.constituency_number}. {c.name} ({c.constituency_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Security Notice</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your device fingerprint is recorded to prevent multiple registrations</li>
                    <li>Each email and phone can only be used once</li>
                    <li>You must be 18 years or older to register</li>
                    <li>False information may result in legal action</li>
                  </ul>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg gradient-saffron hover:opacity-90"
                disabled={isLoading || fingerprintLoading || !!ageError}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : fingerprintLoading ? (
                  <>
                    <Fingerprint className="w-5 h-5 mr-2 animate-pulse" />
                    Securing Device...
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
