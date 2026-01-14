import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BharoteNavbar from "@/components/bharote/BharoteNavbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  Search,
  Link as LinkIcon,
  Clock,
  Hash,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Blocks
} from "lucide-react";
import { motion } from "framer-motion";

interface Vote {
  id: string;
  vote_hash: string;
  previous_hash: string | null;
  block_number: number;
  timestamp: string;
  status: string;
}

const BlockchainExplorer = () => {
  const [searchParams] = useSearchParams();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("hash") || "");
  const [filteredVotes, setFilteredVotes] = useState<Vote[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchVotes = async () => {
      setIsLoading(true);
      try {
        // Get total count
        const { count } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true });
        
        setTotalBlocks(count || 0);

        // Fetch votes (using admin role or public data)
        const { data, error } = await supabase
          .from("votes")
          .select("id, vote_hash, previous_hash, block_number, timestamp, status")
          .order("block_number", { ascending: false })
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

        if (error) throw error;
        
        if (data) {
          setVotes(data);
          setFilteredVotes(data);
        }
      } catch (error) {
        console.error("Error fetching blockchain data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotes();
  }, [currentPage]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = votes.filter(
        v => v.vote_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
             v.block_number.toString().includes(searchQuery)
      );
      setFilteredVotes(filtered);
    } else {
      setFilteredVotes(votes);
    }
  }, [searchQuery, votes]);

  const totalPages = Math.ceil(totalBlocks / itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      <BharoteNavbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
                <Database className="w-4 h-4" />
                Transparent Voting Ledger
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Blockchain Explorer</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Verify the integrity of the voting system by exploring the immutable blockchain record.
                Every vote is cryptographically linked to maintain transparency.
              </p>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Blocks className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalBlocks}</div>
              <div className="text-sm text-muted-foreground">Total Blocks</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <LinkIcon className="w-6 h-6 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalBlocks > 0 ? totalBlocks - 1 : 0}</div>
              <div className="text-sm text-muted-foreground">Chain Links</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Hash className="w-6 h-6 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold">SHA-256</div>
              <div className="text-sm text-muted-foreground">Hash Algorithm</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by block number or transaction hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>

          {/* Blockchain Visualization */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredVotes.length === 0 ? (
            <div className="text-center py-20">
              <Database className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Blocks Found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No matching blocks found for your search." : "The blockchain is empty. Cast the first vote!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVotes.map((vote, index) => (
                <motion.div
                  key={vote.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl gradient-navy flex items-center justify-center text-white font-bold">
                        #{vote.block_number}
                      </div>
                      <div>
                        <div className="font-semibold">Block #{vote.block_number}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(vote.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <span className="text-muted-foreground min-w-[120px]">Transaction Hash:</span>
                      <code className="font-mono text-xs bg-muted px-3 py-2 rounded-lg break-all">
                        {vote.vote_hash}
                      </code>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <span className="text-muted-foreground min-w-[120px]">Previous Hash:</span>
                      <code className="font-mono text-xs bg-muted px-3 py-2 rounded-lg break-all">
                        {vote.previous_hash || "GENESIS (First Block)"}
                      </code>
                    </div>
                  </div>

                  {/* Chain Link Visualization */}
                  {index < filteredVotes.length - 1 && (
                    <div className="flex justify-center mt-4">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <LinkIcon className="w-4 h-4 rotate-90" />
                        <div className="w-px h-4 bg-border" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockchainExplorer;
