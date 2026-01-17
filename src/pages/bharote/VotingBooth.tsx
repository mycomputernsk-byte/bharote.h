import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BharoteNavbar from "@/components/bharote/BharoteNavbar";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { 
  Vote, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Database,
  Fingerprint,
  User,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Party {
  id: string;
  name: string;
  short_name: string;
  color: string;
  is_nota: boolean;
  description: string | null;
  leader_name: string | null;
  party_symbol: string | null;
}

const VotingBooth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [voter, setVoter] = useState<any>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fingerprintVerified, setFingerprintVerified] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hash: fingerprintHash, isLoading: fingerprintLoading } = useDeviceFingerprint();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch voter data
      const { data: voterData, error: voterError } = await supabase
        .from("voters")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (voterError || !voterData) {
        navigate("/register");
        return;
      }

      if (voterData.verification_status !== "verified") {
        toast({
          title: "Verification Required",
          description: "Please complete verification before voting.",
          variant: "destructive",
        });
        navigate("/verify");
        return;
      }

      if (voterData.has_voted) {
        navigate("/confirmation");
        return;
      }

      setVoter(voterData);

      // Fetch parties
      const { data: partiesData, error: partiesError } = await supabase
        .from("political_parties")
        .select("*")
        .order("display_order");

      if (!partiesError && partiesData) {
        setParties(partiesData);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [navigate, toast]);

  // Verify device fingerprint matches registration
  useEffect(() => {
    if (!fingerprintLoading && fingerprintHash && voter) {
      if (voter.device_fingerprint_hash === fingerprintHash) {
        setFingerprintVerified(true);
      } else {
        toast({
          title: "Device Mismatch",
          description: "You must vote from the same device you registered with.",
          variant: "destructive",
        });
        setFingerprintVerified(false);
      }
    }
  }, [fingerprintHash, fingerprintLoading, voter, toast]);

  // Generate SHA-256 hash for blockchain
  const generateVoteHash = async (
    voterId: string, 
    partyId: string, 
    timestamp: string, 
    previousHash: string | null,
    fingerprint: string
  ): Promise<string> => {
    const data = `${voterId}|${partyId}|${timestamp}|${previousHash || 'GENESIS'}|${fingerprint}`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleVote = async () => {
    if (!voter || !selectedParty || !fingerprintHash) return;
    
    // Final fingerprint check
    if (!fingerprintVerified) {
      toast({
        title: "Voting Blocked",
        description: "Device fingerprint does not match your registration. You must vote from the same device.",
        variant: "destructive",
      });
      return;
    }

    setIsVoting(true);

    try {
      const timestamp = new Date().toISOString();
      
      // Check if this fingerprint has already voted
      const { data: existingVote } = await supabase
        .from("voters")
        .select("id, has_voted")
        .eq("device_fingerprint_hash", fingerprintHash)
        .eq("has_voted", true)
        .single();

      if (existingVote) {
        throw new Error("This device has already been used to cast a vote.");
      }

      // Check if email has already voted
      if (voter.email) {
        const { data: emailVote } = await supabase
          .from("voters")
          .select("id, has_voted")
          .eq("email", voter.email)
          .eq("has_voted", true)
          .neq("id", voter.id)
          .single();

        if (emailVote) {
          throw new Error("This email address has already been used to cast a vote.");
        }
      }

      // Get previous vote hash for blockchain chain
      const { data: lastVote } = await supabase
        .from("votes")
        .select("vote_hash, block_number")
        .order("block_number", { ascending: false })
        .limit(1)
        .single();

      const previousHash = lastVote?.vote_hash || null;
      
      // Get next block number using database function
      const { data: blockNumber, error: blockError } = await supabase.rpc('get_next_block_number');
      
      if (blockError) throw blockError;

      // Generate cryptographic vote hash
      const voteHash = await generateVoteHash(
        voter.id, 
        selectedParty, 
        timestamp, 
        previousHash,
        fingerprintHash
      );

      // Insert vote into blockchain
      const { error: voteError } = await supabase
        .from("votes")
        .insert({
          voter_id: voter.id,
          party_id: selectedParty,
          vote_hash: voteHash,
          previous_hash: previousHash,
          block_number: blockNumber,
          timestamp: timestamp,
          status: "verified",
        });

      if (voteError) throw voteError;

      // Update voter status
      const { error: voterError } = await supabase
        .from("voters")
        .update({
          has_voted: true,
          voted_at: timestamp,
        })
        .eq("id", voter.id);

      if (voterError) throw voterError;

      toast({
        title: "Vote Cast Successfully!",
        description: "Your vote has been permanently recorded on the blockchain.",
      });

      // Store vote hash in session for confirmation page
      sessionStorage.setItem("voteHash", voteHash);
      sessionStorage.setItem("blockNumber", blockNumber.toString());

      navigate("/confirmation");
    } catch (error: any) {
      toast({
        title: "Voting Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
      setShowConfirmDialog(false);
    }
  };

  if (isLoading || fingerprintLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {fingerprintLoading ? "Verifying device fingerprint..." : "Loading voting booth..."}
          </p>
        </div>
      </div>
    );
  }

  const selectedPartyData = parties.find(p => p.id === selectedParty);
  const canVote = fingerprintVerified && selectedParty && !isVoting;

  return (
    <div className="min-h-screen bg-background">
      <BharoteNavbar />
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Step 3 of 3
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Cast Your Vote</h1>
            <p className="text-muted-foreground">
              Select your preferred candidate from the list below
            </p>
          </div>

          {/* Fingerprint Verification Status */}
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
            fingerprintVerified 
              ? "bg-accent/10 border border-accent/20" 
              : "bg-destructive/10 border border-destructive/20"
          }`}>
            <Fingerprint className={`w-6 h-6 ${fingerprintVerified ? "text-accent" : "text-destructive"}`} />
            <div>
              <div className="font-medium">
                {fingerprintVerified ? "Device Verified" : "Device Verification Failed"}
              </div>
              <div className="text-sm text-muted-foreground">
                {fingerprintVerified 
                  ? "Your device fingerprint matches your registration" 
                  : "You must vote from the same device you registered with"}
              </div>
            </div>
          </div>

          {/* Voter Info */}
          <div className="bg-card border border-border rounded-xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gradient-navy flex items-center justify-center text-white">
                <Vote className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold">{voter.full_name}</div>
                <div className="text-sm text-muted-foreground">{voter.constituency}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Voter ID</div>
              <div className="font-mono font-semibold">{voter.voter_id}</div>
            </div>
          </div>

          {/* Party Selection */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {parties.map((party) => (
              <motion.button
                key={party.id}
                onClick={() => setSelectedParty(party.id)}
                disabled={!fingerprintVerified}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  selectedParty === party.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/50"
                } ${!fingerprintVerified ? "opacity-50 cursor-not-allowed" : ""}`}
                whileHover={fingerprintVerified ? { scale: 1.01 } : {}}
                whileTap={fingerprintVerified ? { scale: 0.99 } : {}}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: party.color }}
                  >
                    {party.short_name.slice(0, 3)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{party.name}</div>
                    {party.leader_name && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {party.leader_name}
                      </div>
                    )}
                    {party.party_symbol && (
                      <div className="text-xs text-muted-foreground">
                        Symbol: {party.party_symbol}
                      </div>
                    )}
                  </div>
                  {selectedParty === party.id && (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  )}
                </div>
                {party.is_nota && (
                  <div className="mt-3 text-sm text-muted-foreground italic">
                    Vote for none of the above candidates
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Warning */}
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-destructive mb-1">Important Notice</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Once submitted, your vote <strong>cannot be changed or revoked</strong></li>
                <li>• Your vote is permanently recorded on the blockchain</li>
                <li>• Your device fingerprint and email are locked after voting</li>
                <li>• No re-voting is allowed from the same device or email</li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={() => setShowConfirmDialog(true)}
            className="w-full h-14 text-lg gradient-saffron hover:opacity-90"
            disabled={!canVote}
          >
            {isVoting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Recording Vote on Blockchain...
              </>
            ) : !fingerprintVerified ? (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Device Verification Required
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Submit Vote Securely
              </>
            )}
          </Button>

          {/* Blockchain Badge */}
          <div className="mt-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Database className="w-4 h-4" />
            Secured by SHA-256 blockchain technology
          </div>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>You are about to cast your vote for:</p>
              {selectedPartyData && (
                <div className="p-4 rounded-lg bg-muted flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedPartyData.color }}
                  >
                    {selectedPartyData.short_name.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-semibold">{selectedPartyData.name}</div>
                    {selectedPartyData.leader_name && (
                      <div className="text-sm text-muted-foreground">
                        Led by {selectedPartyData.leader_name}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  This action cannot be undone
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your vote will be permanently recorded on the blockchain and cannot be changed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleVote}
              disabled={isVoting}
              className="gradient-saffron"
            >
              {isVoting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                "Confirm Vote"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VotingBooth;
