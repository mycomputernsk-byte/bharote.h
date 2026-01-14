import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import BharoteLanding from "./pages/bharote/BharoteLanding";
import VoterRegistration from "./pages/bharote/VoterRegistration";
import VoterVerification from "./pages/bharote/VoterVerification";
import VotingBooth from "./pages/bharote/VotingBooth";
import VoteConfirmation from "./pages/bharote/VoteConfirmation";
import Results from "./pages/bharote/Results";
import BlockchainExplorer from "./pages/bharote/BlockchainExplorer";
import VoterDashboard from "./pages/bharote/VoterDashboard";
import BharoteAuth from "./pages/bharote/BharoteAuth";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <Routes>
      <Route path="/" element={<BharoteLanding />} />
      <Route path="/auth" element={<BharoteAuth />} />
      <Route path="/register" element={<VoterRegistration />} />
      <Route path="/verify" element={<VoterVerification />} />
      <Route path="/vote" element={<VotingBooth />} />
      <Route path="/confirmation" element={<VoteConfirmation />} />
      <Route path="/results" element={<Results />} />
      <Route path="/blockchain" element={<BlockchainExplorer />} />
      <Route path="/dashboard" element={<VoterDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TooltipProvider>
);

export default App;
