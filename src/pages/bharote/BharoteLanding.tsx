import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Vote, 
  Lock, 
  Eye, 
  CheckCircle2, 
  ArrowRight,
  Fingerprint,
  Database,
  Users,
  BarChart3
} from "lucide-react";
import BharoteNavbar from "@/components/bharote/BharoteNavbar";
import { motion } from "framer-motion";

const BharoteLanding = () => {
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Blockchain Secured",
      description: "Every vote is cryptographically hashed and stored on an immutable blockchain ledger"
    },
    {
      icon: <Fingerprint className="w-8 h-8" />,
      title: "Biometric Verification",
      description: "Multi-factor authentication with OTP and biometric confirmation"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Tamper-Proof",
      description: "Once cast, votes cannot be modified, deleted, or duplicated"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Transparent Audit",
      description: "Real-time blockchain explorer for complete voting transparency"
    }
  ];

  const stats = [
    { value: "100%", label: "Secure" },
    { value: "0", label: "Fraud Cases" },
    { value: "24/7", label: "Availability" },
    { value: "∞", label: "Transparency" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <BharoteNavbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-white to-accent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,153,0,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,139,34,0.08),transparent_50%)]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-6">
                <Database className="w-4 h-4" />
                Powered by Blockchain Technology
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
                <span className="text-primary">BHAR</span>
                <span className="text-secondary">O</span>
                <span className="text-accent">TE</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-4">
                Bharat's Decentralized Voting Revolution
              </p>
              
              <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10">
                A secure, transparent, and tamper-proof electronic voting system 
                built on blockchain technology for the world's largest democracy.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-lg px-8 py-6 gradient-saffron hover:opacity-90 transition-opacity">
                  <Link to="/auth">
                    <Vote className="w-5 h-5 mr-2" />
                    Start Voting
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-secondary text-secondary hover:bg-secondary hover:text-white">
                  <Link to="/results">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    View Live Results
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary">{stat.value}</div>
                <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-primary">BHAROTE</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge technology to ensure every vote counts and every voice is heard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="p-6 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple, secure, and accessible voting in just 4 steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {[
              { step: 1, title: "Register", desc: "Create your voter account with your credentials", icon: <Users className="w-6 h-6" /> },
              { step: 2, title: "Verify", desc: "Confirm your identity via OTP and biometrics", icon: <Fingerprint className="w-6 h-6" /> },
              { step: 3, title: "Vote", desc: "Cast your vote for your preferred candidate", icon: <Vote className="w-6 h-6" /> },
              { step: 4, title: "Confirm", desc: "Receive blockchain confirmation of your vote", icon: <CheckCircle2 className="w-6 h-6" /> },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-6 mb-8 last:mb-0"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-full gradient-navy flex items-center justify-center text-white font-bold text-xl">
                  {item.step}
                </div>
                <div className="flex-1 p-6 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-primary">{item.icon}</span>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-navy">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your Vote. Your Voice. Secured Forever.
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Join millions of citizens in shaping the future of our democracy 
            through secure, transparent digital voting.
          </p>
          <Button asChild size="lg" className="text-lg px-10 py-6 bg-white text-secondary hover:bg-white/90">
            <Link to="/auth">
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Vote className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">
                <span className="text-primary">BHAR</span>
                <span className="text-secondary">O</span>
                <span className="text-accent">TE</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-muted-foreground text-sm">
              <Link to="/blockchain" className="hover:text-primary transition-colors">Blockchain Explorer</Link>
              <Link to="/results" className="hover:text-primary transition-colors">Live Results</Link>
              <span>© 2026 BHAROTE. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BharoteLanding;
