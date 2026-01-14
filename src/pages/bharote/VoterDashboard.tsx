import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import BharoteNavbar from "@/components/bharote/BharoteNavbar";
import { 
  User, 
  Vote, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  BarChart3,
  Database,
  Loader2,
  ExternalLink,
  Fingerprint
} from "lucide-react";
import { motion } from "framer-motion";

const VoterDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [voter, setVoter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: voterData } = await supabase
        .from("voters")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      setVoter(voterData);
      setIsLoading(false);
    };

    fetchData();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusInfo = () => {
    if (!voter) {
      return {
        status: "Not Registered",
        color: "destructive",
        icon: <AlertCircle className="w-5 h-5" />,
        message: "Complete your voter registration to participate in elections.",
        action: { label: "Register Now", href: "/register" }
      };
    }
    if (voter.verification_status !== "verified") {
      return {
        status: "Pending Verification",
        color: "warning",
        icon: <Clock className="w-5 h-5" />,
        message: "Your voter registration needs verification.",
        action: { label: "Complete Verification", href: "/verify" }
      };
    }
    if (!voter.has_voted) {
      return {
        status: "Ready to Vote",
        color: "accent",
        icon: <Vote className="w-5 h-5" />,
        message: "You are verified and eligible to cast your vote.",
        action: { label: "Cast Your Vote", href: "/vote" }
      };
    }
    return {
      status: "Vote Cast",
      color: "accent",
      icon: <CheckCircle2 className="w-5 h-5" />,
      message: "Your vote has been successfully recorded on the blockchain.",
      action: { label: "View Receipt", href: "/confirmation" }
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-background">
      <BharoteNavbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome, {voter?.full_name || user?.email?.split("@")[0]}
            </h1>
            <p className="text-muted-foreground">
              Manage your voter profile and participate in secure digital voting
            </p>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-2xl mb-8 ${
              statusInfo.color === "accent" 
                ? "bg-accent/10 border border-accent/20" 
                : statusInfo.color === "warning"
                ? "bg-yellow-500/10 border border-yellow-500/20"
                : "bg-destructive/10 border border-destructive/20"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                statusInfo.color === "accent" 
                  ? "bg-accent text-white" 
                  : statusInfo.color === "warning"
                  ? "bg-yellow-500 text-white"
                  : "bg-destructive text-white"
              }`}>
                {statusInfo.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">{statusInfo.status}</div>
                <p className="text-muted-foreground mt-1">{statusInfo.message}</p>
              </div>
              <Button asChild className={
                statusInfo.color === "accent" 
                  ? "bg-accent hover:bg-accent/90" 
                  : "gradient-saffron"
              }>
                <Link to={statusInfo.action.href}>
                  {statusInfo.action.label}
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Voter Info Card */}
          {voter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-6 mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Voter Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">Voter ID</div>
                  <div className="font-mono font-semibold text-lg">{voter.voter_id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Full Name</div>
                  <div className="font-semibold">{voter.full_name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Constituency</div>
                  <div className="font-semibold">{voter.constituency}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Verification Status</div>
                  <div className="flex items-center gap-2">
                    {voter.verification_status === "verified" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="font-semibold text-accent">Verified</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-yellow-500">Pending</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone Number</div>
                  <div className="font-semibold">{voter.phone_number}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Registered On</div>
                  <div className="font-semibold">
                    {new Date(voter.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {voter.has_voted && voter.voted_at && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Vote Cast On</div>
                      <div className="font-semibold">
                        {new Date(voter.voted_at).toLocaleString()}
                      </div>
                    </div>
                    <Link 
                      to="/confirmation" 
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      View Receipt
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link 
                to="/results"
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group"
              >
                <BarChart3 className="w-8 h-8 text-primary mb-4" />
                <div className="font-semibold mb-1">View Results</div>
                <p className="text-sm text-muted-foreground">
                  See live election results
                </p>
              </Link>

              <Link 
                to="/blockchain"
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group"
              >
                <Database className="w-8 h-8 text-secondary mb-4" />
                <div className="font-semibold mb-1">Blockchain Explorer</div>
                <p className="text-sm text-muted-foreground">
                  Explore the voting ledger
                </p>
              </Link>

              {voter?.verification_status !== "verified" && (
                <Link 
                  to="/verify"
                  className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group"
                >
                  <Fingerprint className="w-8 h-8 text-accent mb-4" />
                  <div className="font-semibold mb-1">Verify Identity</div>
                  <p className="text-sm text-muted-foreground">
                    Complete OTP verification
                  </p>
                </Link>
              )}

              {voter?.verification_status === "verified" && !voter?.has_voted && (
                <Link 
                  to="/vote"
                  className="p-6 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors group"
                >
                  <Vote className="w-8 h-8 text-primary mb-4" />
                  <div className="font-semibold mb-1">Cast Vote</div>
                  <p className="text-sm text-muted-foreground">
                    Vote for your candidate
                  </p>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VoterDashboard;
