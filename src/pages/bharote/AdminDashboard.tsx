import { useState, useEffect, useRef } from "react";
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
  Database,
  RotateCcw,
  ShieldAlert,
  Download,
  Bell,
  UserPlus,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface Notification {
  id: string;
  type: 'voter' | 'vote';
  message: string;
  timestamp: Date;
  voterName?: string;
}

const ADMIN_EMAIL = "haniskholmes@gmail.com";

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [stats, setStats] = useState({
    totalVoters: 0,
    verifiedVoters: 0,
    votedCount: 0,
    pendingVerification: 0,
  });
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [recentVoters, setRecentVoters] = useState<Voter[]>([]);
  const [allVoters, setAllVoters] = useState<Voter[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize notification sound
  useEffect(() => {
    notificationAudioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleig0NpGv3chqHQo4l9DeqVkdEjeg1t2cUBcQMZ/X35VJFRMxoNfflEkWFjKi2N+XSxYWNKPY35dLFhY0o9jfl0sWFjSj2N+XSxYW');
  }, []);

  // Add notification
  const addNotification = (type: 'voter' | 'vote', message: string, voterName?: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      voterName,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 10));
    
    // Play sound
    if (notificationAudioRef.current) {
      notificationAudioRef.current.play().catch(() => {});
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Check admin authorization first
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Authentication Required",
            description: "Please login to access admin dashboard.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        // Check if user email matches admin email
        if (session.user.email !== ADMIN_EMAIL) {
          toast({
            title: "Access Denied",
            description: "Only admin can access this dashboard.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        // Check if email is verified
        if (!session.user.email_confirmed_at) {
          toast({
            title: "Email Verification Required",
            description: "Please verify your email first.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/auth");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthorization();
  }, [navigate, toast]);

  const fetchData = async () => {
    if (!isAdmin) return;
    
    try {
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

        // Store all voters for export
        setAllVoters(votersData);

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

  // Export voters to CSV
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = [
        'Voter ID',
        'Full Name',
        'Email',
        'Phone Number',
        'Constituency',
        'Verification Status',
        'Has Voted',
        'Voted At',
        'Created At'
      ];

      const csvData = allVoters.map(voter => [
        voter.voter_id,
        voter.full_name,
        voter.email || '',
        voter.phone_number,
        voter.constituency,
        voter.verification_status,
        voter.has_voted ? 'Yes' : 'No',
        voter.voted_at ? new Date(voter.voted_at).toLocaleString() : '',
        new Date(voter.created_at).toLocaleString()
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `voters_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Export Successful",
        description: `Exported ${allVoters.length} voter records to CSV.`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Reset voting only (keeps registrations)
  const handleResetVoting = async () => {
    setIsResetting(true);
    try {
      // Delete all votes
      const { error: votesError } = await supabase
        .from("votes")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (votesError) throw votesError;

      // Reset has_voted and voted_at for all voters
      const { error: votersError } = await supabase
        .from("voters")
        .update({ has_voted: false, voted_at: null })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

      if (votersError) throw votersError;

      toast({
        title: "Voting Reset",
        description: "All votes have been cleared. Voter registrations remain intact.",
      });

      await fetchData();
    } catch (error: any) {
      console.error("Reset error:", error);
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
      setShowResetDialog(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();

      // Set up realtime subscription for votes with notifications
      const votesChannel = supabase
        .channel('admin-votes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'votes' },
          async (payload) => {
            // Fetch voter name for notification
            const { data: voterData } = await supabase
              .from('voters')
              .select('full_name')
              .eq('id', payload.new.voter_id)
              .single();
            
            addNotification(
              'vote',
              `New vote cast!`,
              voterData?.full_name
            );
            fetchData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'votes' },
          () => {
            fetchData();
          }
        )
        .subscribe();

      // Set up realtime subscription for voters with notifications
      const votersChannel = supabase
        .channel('admin-voters')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'voters' },
          (payload) => {
            addNotification(
              'voter',
              `New voter registered!`,
              payload.new.full_name
            );
            fetchData();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'voters' },
          (payload) => {
            if (payload.new.verification_status === 'verified' && payload.old.verification_status !== 'verified') {
              addNotification(
                'voter',
                `Voter verified!`,
                payload.new.full_name
              );
            }
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(votesChannel);
        supabase.removeChannel(votersChannel);
      };
    }
  }, [isAdmin]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Dashboard data updated",
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <BharoteNavbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              Only authorized administrators can access this dashboard.
            </p>
            <Button onClick={() => navigate("/")}>
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

  const totalVotes = voteCounts.reduce((sum, v) => sum + Number(v.vote_count), 0);
  const turnoutPercentage = stats.verifiedVoters > 0 
    ? Math.round((stats.votedCount / stats.verifiedVoters) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <BharoteNavbar />
      
      {/* Notification Toast Area */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`p-4 rounded-lg shadow-lg border backdrop-blur-sm ${
                notification.type === 'vote' 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-accent/10 border-accent/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  notification.type === 'vote' ? 'bg-primary/20' : 'bg-accent/20'
                }`}>
                  {notification.type === 'vote' ? (
                    <Vote className="w-4 h-4 text-primary" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-accent" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.message}</p>
                  {notification.voterName && (
                    <p className="text-xs text-muted-foreground">{notification.voterName}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Real-time election monitoring • {ADMIN_EMAIL}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={isExporting || allVoters.length === 0}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="destructive"
              onClick={() => setShowResetDialog(true)}
              disabled={isResetting}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Voting
            </Button>
          </div>
        </div>

        {/* Notifications Badge */}
        {notifications.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{notifications.length} recent notification{notifications.length > 1 ? 's' : ''}</span>
            <button 
              onClick={() => setNotifications([])}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}

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

      {/* Reset Voting Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Reset All Votes
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Delete all votes from the blockchain</li>
                <li>Reset all voters' voting status</li>
                <li>Allow voters to cast their votes again</li>
              </ul>
              <p className="font-semibold text-destructive">
                Voter registrations will NOT be affected.
              </p>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium">
                  This action cannot be undone!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetVoting}
              disabled={isResetting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Voting
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
