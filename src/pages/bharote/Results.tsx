import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import BharoteNavbar from "@/components/bharote/BharoteNavbar";
import { 
  BarChart3, 
  RefreshCw,
  Users,
  TrendingUp,
  Loader2,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface VoteCount {
  party_id: string;
  party_name: string;
  short_name: string;
  color: string;
  is_nota: boolean;
  vote_count: number;
}

const Results = () => {
  const [results, setResults] = useState<VoteCount[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_vote_counts');
      
      if (error) throw error;
      
      if (data) {
        setResults(data);
        setTotalVotes(data.reduce((sum: number, r: VoteCount) => sum + Number(r.vote_count), 0));
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();

    // Set up realtime subscription
    const channel = supabase
      .channel('votes_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        () => fetchResults()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPercentage = (count: number) => {
    if (totalVotes === 0) return 0;
    return ((count / totalVotes) * 100).toFixed(1);
  };

  const sortedResults = [...results].sort((a, b) => Number(b.vote_count) - Number(a.vote_count));
  const leader = sortedResults[0];

  return (
    <div className="min-h-screen bg-background">
      <BharoteNavbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                Live Election Results
              </h1>
              <p className="text-muted-foreground">
                Real-time vote counts from the blockchain
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchResults}
              disabled={isLoading}
              className="mt-4 md:mt-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <motion.div 
              className="bg-card border border-border rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Users className="w-6 h-6 text-primary mb-2" />
              <div className="text-2xl font-bold">{totalVotes.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Votes</div>
            </motion.div>
            
            <motion.div 
              className="bg-card border border-border rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TrendingUp className="w-6 h-6 text-accent mb-2" />
              <div className="text-2xl font-bold">{results.length}</div>
              <div className="text-sm text-muted-foreground">Parties</div>
            </motion.div>
            
            <motion.div 
              className="bg-card border border-border rounded-xl p-4 col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Award className="w-6 h-6 text-yellow-500 mb-2" />
              <div className="text-2xl font-bold">
                {leader ? leader.short_name : "—"}
              </div>
              <div className="text-sm text-muted-foreground">Current Leader</div>
            </motion.div>
          </div>

          {/* Results List */}
          {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {sortedResults.map((party, index) => (
                <motion.div
                  key={party.party_id}
                  className="bg-card border border-border rounded-xl p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: party.color }}
                        >
                          {party.short_name.slice(0, 3)}
                        </div>
                        {index === 0 && totalVotes > 0 && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                            <Award className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{party.party_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {party.short_name}
                          {party.is_nota && " • None of the Above"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{Number(party.vote_count).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{getPercentage(Number(party.vote_count))}%</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: party.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${getPercentage(Number(party.vote_count))}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Last Updated */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
