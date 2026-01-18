import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BharoteNavbar from "@/components/bharote/BharoteNavbar";
import { 
  Users, 
  Vote, 
  CheckCircle2,
  Clock,
  Shield,
  TrendingUp,
  BarChart3,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Database
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface VoteCount {
  party_id: string;
  party_name: string;
  short_name: string;
  color: string;
  is_nota: boolean;
  vote_count: number;
}

interface Voter {
  id: string;
  full_name: string;
  voter_id: string;
  phone_number: string;
  email: string | null;
  constituency: string;
  verification_status: string;
  has_voted: boolean;
  created_at: string;
  voted_at: string | null;
}

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalVoters: 0,
    verifiedVoters: 0,
    votedCount: 0,
    pendingVerification: 0,
  });
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [recentVoters, setRecentVoters] = useState<Voter[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);

      // Fetch voters stats
      const { data: votersData, count: totalCount } = await supabase
        .from("voters")
        .select("*", { count: "exact" });

      if (votersData) {
        const verified = votersData.filter(v => v.verification_status === "verified").length;
        const voted = votersData.filter(v => v.has_voted).length;
        const pending = votersData.filter(v => v.verification_status !== "verified").length;

        setStats({
          totalVoters: totalCount || 0,
          verifiedVoters: verified,
          votedCount: voted,
          pendingVerification: pending,
        });

        // Get recent voters (last 10)
        const sorted = [...votersData].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 10);
        setRecentVoters(sorted);
      }

      // Fetch vote counts using RPC
      const { data: voteData, error: voteError } = await supabase.rpc('get_vote_counts');
      
      if (!voteError && voteData) {
        setVoteCounts(voteData);
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();

    // Set up realtime subscription for votes
    const votesChannel = supabase
      .channel('admin-votes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const votersChannel = supabase
      .channel('admin-voters')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voters' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(votersChannel);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Dashboard data updated",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const totalVotes = voteCounts.reduce((sum, v) => sum + Number(v.vote_count), 0);
  const turnoutPercentage = stats.verifiedVoters > 0 
    ? Math.round((stats.votedCount / stats.verifiedVoters) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <BharoteNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Real-time election monitoring</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVoters}</div>
                <p className="text-xs text-muted-foreground">
                  Registered voters
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Verified</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{stats.verifiedVoters}</div>
                <p className="text-xs text-muted-foreground">
                  OTP verified voters
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
                <Vote className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.votedCount}</div>
                <p className="text-xs text-muted-foreground">
                  On blockchain
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{stats.pendingVerification}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting verification
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Turnout Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Voter Turnout
            </CardTitle>
            <CardDescription>
              {stats.votedCount} of {stats.verifiedVoters} verified voters have cast their vote
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-semibold">{turnoutPercentage}%</span>
              </div>
              <Progress value={turnoutPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Vote Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Live Vote Count
              </CardTitle>
              <CardDescription>
                Real-time vote distribution by party
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {voteCounts.map((party) => {
                  const percentage = totalVotes > 0 
                    ? Math.round((Number(party.vote_count) / totalVotes) * 100) 
                    : 0;
                  return (
                    <div key={party.party_id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: party.color }}
                          />
                          <span className="font-medium">{party.party_name}</span>
                          {party.is_nota && (
                            <span className="text-xs text-muted-foreground">(NOTA)</span>
                          )}
                        </div>
                        <span className="font-semibold">{party.vote_count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div 
                          className="h-full rounded-full"
                          style={{ backgroundColor: party.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  );
                })}
                
                {voteCounts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Vote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No votes cast yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Registrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Recent Registrations
              </CardTitle>
              <CardDescription>
                Latest voter registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Voted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentVoters.map((voter) => (
                      <TableRow key={voter.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{voter.full_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{voter.voter_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            voter.verification_status === 'verified' 
                              ? 'bg-accent/10 text-accent' 
                              : voter.verification_status === 'otp_sent'
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {voter.verification_status === 'verified' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : voter.verification_status === 'otp_sent' ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {voter.verification_status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {voter.has_voted ? (
                            <span className="text-accent flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blockchain Badge */}
        <div className="mt-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Database className="w-4 h-4" />
          All votes secured by SHA-256 blockchain • Real-time updates enabled
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
