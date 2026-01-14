import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import BharoteNavbar from "@/components/bharote/BharoteNavbar";
import { 
  CheckCircle2, 
  Database, 
  Copy,
  ExternalLink,
  BarChart3,
  Home,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const VoteConfirmation = () => {
  const [voteHash, setVoteHash] = useState<string>("");
  const [blockNumber, setBlockNumber] = useState<string>("");
  const [voter, setVoter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch voter data
      const { data: voterData } = await supabase
        .from("voters")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (!voterData || !voterData.has_voted) {
        navigate("/vote");
        return;
      }

      setVoter(voterData);

      // Try to get from session storage first
      const storedHash = sessionStorage.getItem("voteHash");
      const storedBlock = sessionStorage.getItem("blockNumber");

      if (storedHash && storedBlock) {
        setVoteHash(storedHash);
        setBlockNumber(storedBlock);
      } else {
        // Fetch from database (without revealing vote choice)
        const { data: voteData } = await supabase
          .from("votes")
          .select("vote_hash, block_number")
          .eq("voter_id", voterData.id)
          .single();

        if (voteData) {
          setVoteHash(voteData.vote_hash);
          setBlockNumber(voteData.block_number.toString());
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [navigate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BharoteNavbar />
      
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto text-center"
        >
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle2 className="w-14 h-14 text-accent" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Vote Successfully Recorded!
          </h1>
          <p className="text-muted-foreground mb-10">
            Your vote has been securely recorded on the blockchain and cannot be altered.
          </p>

          {/* Vote Receipt */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left">
            <div className="flex items-center gap-2 mb-6">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Blockchain Vote Receipt</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Voter ID</div>
                <div className="font-mono font-semibold">{voter?.voter_id}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Block Number</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-xl">#{blockNumber}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Transaction Hash</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded-lg overflow-hidden text-ellipsis">
                    {voteHash}
                  </code>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(voteHash, "Transaction hash")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Timestamp</div>
                <div className="font-semibold">
                  {voter?.voted_at ? new Date(voter.voted_at).toLocaleString() : "N/A"}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <Link 
                to={`/blockchain?hash=${voteHash}`}
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                View on Blockchain Explorer
              </Link>
            </div>
          </div>

          {/* Info Card */}
          <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 mb-8">
            <p className="text-sm text-muted-foreground">
              Your vote is <strong>anonymous</strong> and <strong>encrypted</strong>. 
              Only you can access this receipt using your Voter ID. 
              No one can trace your vote choice.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1 h-12 gradient-navy hover:opacity-90">
              <Link to="/results">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Live Results
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 h-12">
              <Link to="/">
                <Home className="w-5 h-5 mr-2" />
                Return Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VoteConfirmation;
