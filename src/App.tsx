import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, 
  Shield, 
  Zap, 
  Search, 
  Database, 
  Cpu, 
  Globe, 
  Lock,
  ArrowRight,
  ChevronRight,
  Activity,
  User as UserIcon,
  Settings,
  LogOut,
  CreditCard,
  MapPin,
  Home,
  BarChart3,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { auth, db, signInWithGoogle, logout } from "./firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  location: string;
  address: string;
  membershipTier: "free" | "standard" | "pro" | "ultimate";
  usage: {
    queriesCount: number;
    missionsCount: number;
    lastReset: string;
  };
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
      
      if (firebaseUser) {
        // Check if profile exists, if not create it
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "Researcher",
            photoURL: firebaseUser.photoURL || "",
            location: "",
            address: "",
            membershipTier: "free",
            usage: {
              queriesCount: 0,
              missionsCount: 0,
              lastReset: new Date().toISOString(),
            }
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        } else {
          setProfile(userSnap.data() as UserProfile);
        }

        // Listen for real-time updates
        const unsubProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          }
        });
        return () => unsubProfile();
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  const UserMenu = () => {
    if (isAuthLoading) return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;
    
    if (!user) {
      return (
        <Button 
          onClick={signInWithGoogle}
          variant="outline" 
          className="border-emerald text-emerald hover:bg-emerald hover:text-black transition-all font-bold uppercase tracking-tighter"
        >
          Get Started
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="relative h-10 w-10 rounded-full cursor-pointer hover:ring-2 hover:ring-emerald/50 transition-all flex items-center justify-center border border-emerald/50 overflow-hidden group"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
            <AvatarFallback className="bg-emerald/20 text-emerald mono">{user.displayName?.charAt(0) || "R"}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-emerald/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Settings className="w-4 h-4 text-emerald" />
          </div>
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-[#0d0d0d] border-trvx-border text-foreground" align="end">
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="hover:bg-emerald/10 focus:bg-emerald/10 cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span className="mono text-xs uppercase">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-trvx-border" />
            <DropdownMenuItem onClick={logout} className="text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="mono text-xs uppercase">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const SettingsDialog = () => (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] max-h-[800px] bg-[#050505] border-trvx-border text-foreground p-0 overflow-hidden shadow-[0_0_50px_rgba(0,255,163,0.1)]">
        <div className="flex h-full">
          <div className="w-56 border-r border-trvx-border bg-[#0d0d0d] p-6 flex flex-col gap-2">
            <div className="mb-8">
              <h2 className="mono text-[10px] text-emerald uppercase tracking-[0.3em] mb-1">System Control</h2>
              <div className="h-px w-full bg-gradient-to-r from-emerald/50 to-transparent" />
            </div>
            
            <Button variant="ghost" className="justify-start mono text-[11px] uppercase tracking-widest hover:bg-emerald/10 text-emerald h-11">
              <UserIcon className="mr-3 h-4 w-4" /> Profile
            </Button>
            <Button variant="ghost" className="justify-start mono text-[11px] uppercase tracking-widest hover:bg-emerald/10 h-11">
              <ShieldCheck className="mr-3 h-4 w-4" /> Security
            </Button>
            <Button variant="ghost" className="justify-start mono text-[11px] uppercase tracking-widest hover:bg-emerald/10 h-11">
              <BarChart3 className="mr-3 h-4 w-4" /> Usage & Sync
            </Button>
            <Button variant="ghost" className="justify-start mono text-[11px] uppercase tracking-widest hover:bg-emerald/10 h-11">
              <CreditCard className="mr-3 h-4 w-4" /> Membership
            </Button>
            
            <div className="mt-auto pt-6 border-t border-trvx-border">
              <div className="flex items-center gap-3 px-2 py-3 bg-emerald/5 rounded-lg border border-emerald/10">
                <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                <span className="mono text-[9px] text-emerald uppercase tracking-widest">Desktop Linked</span>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-10">
            <Tabs defaultValue="profile" className="w-full">
              <TabsContent value="profile" className="mt-0 space-y-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-bold tracking-tighter uppercase mb-2">Operational Identity</h3>
                    <p className="text-muted-foreground text-xs mono uppercase tracking-widest">Global Researcher Profile // UID: {profile?.uid.slice(0, 8)}...</p>
                  </div>
                  <Badge variant="outline" className="border-emerald/50 text-emerald px-4 py-1 mono uppercase text-[10px]">
                    Tier: {profile?.membershipTier}
                  </Badge>
                </div>
                
                <div className="grid gap-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="grid gap-3">
                      <Label htmlFor="name" className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Display Name</Label>
                      <Input 
                        id="name" 
                        defaultValue={profile?.displayName} 
                        onBlur={(e) => handleUpdateProfile({ displayName: e.target.value })}
                        className="bg-black border-trvx-border focus:border-emerald h-12 transition-colors mono text-sm" 
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="email" className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Auth Email</Label>
                      <Input id="email" value={user?.email || ""} disabled className="bg-black/50 border-trvx-border h-12 mono text-sm opacity-50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="grid gap-3">
                      <Label htmlFor="location" className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Geographic Vector</Label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="location" 
                          placeholder="City, Country"
                          defaultValue={profile?.location}
                          onBlur={(e) => handleUpdateProfile({ location: e.target.value })}
                          className="pl-12 bg-black border-trvx-border focus:border-emerald h-12 transition-colors mono text-sm" 
                        />
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="address" className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Physical Address</Label>
                      <div className="relative">
                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="address" 
                          placeholder="Full Address"
                          defaultValue={profile?.address}
                          onBlur={(e) => handleUpdateProfile({ address: e.target.value })}
                          className="pl-12 bg-black border-trvx-border focus:border-emerald h-12 transition-colors mono text-sm" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-trvx-border" />

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-mission" />
                    <h4 className="mono text-sm font-bold uppercase tracking-widest text-mission">Cross-Platform Usage</h4>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 border border-trvx-border bg-black/40 rounded-xl text-center group hover:border-emerald/30 transition-colors">
                      <p className="text-[10px] text-muted-foreground mono uppercase tracking-widest mb-3">Total Queries</p>
                      <p className="text-4xl font-bold tracking-tighter text-emerald">{profile?.usage.queriesCount || 0}</p>
                    </div>
                    <div className="p-6 border border-trvx-border bg-black/40 rounded-xl text-center group hover:border-mission/30 transition-colors">
                      <p className="text-[10px] text-muted-foreground mono uppercase tracking-widest mb-3">Missions Active</p>
                      <p className="text-4xl font-bold tracking-tighter text-mission">{profile?.usage.missionsCount || 0}</p>
                    </div>
                    <div className="p-6 border border-trvx-border bg-black/40 rounded-xl text-center">
                      <p className="text-[10px] text-muted-foreground mono uppercase tracking-widest mb-3">Desktop Sync</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald" />
                        <p className="text-sm font-bold mono uppercase">Active</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-emerald/5 border border-emerald/10 rounded-lg flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground mono uppercase tracking-widest">
                      Last Synchronized with TRVX Desktop: {new Date().toLocaleTimeString()}
                    </p>
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] mono uppercase tracking-widest hover:text-emerald">
                      Force Sync
                    </Button>
                  </div>
                </div>

                <Separator className="bg-trvx-border" />

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald" />
                    <h4 className="mono text-sm font-bold uppercase tracking-widest text-emerald">Security Protocol</h4>
                  </div>
                  <div className="flex items-center justify-between p-6 border border-trvx-border bg-black/40 rounded-xl">
                    <div className="space-y-1">
                      <p className="text-sm font-bold mono uppercase tracking-tight">Two-Factor Authentication (2FA)</p>
                      <p className="text-xs text-muted-foreground mono uppercase tracking-tight">Secure your research data with multi-vector verification</p>
                    </div>
                    <Button variant="outline" className="border-emerald text-emerald hover:bg-emerald hover:text-black px-6 mono uppercase text-xs font-bold tracking-widest">
                      Configure
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-emerald/30 selection:text-emerald">
      <SettingsDialog />
      {/* Navigation */}
      <nav className="border-b border-trvx-border p-4 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img 
            src="https://images2.imgbox.com/39/78/70lG6lC2_o.png" 
            alt="TRVX Logo" 
            className="w-10 h-10 rounded-sm object-contain brightness-110"
            referrerPolicy="no-referrer"
          />
          <span className="font-bold tracking-tighter text-xl uppercase">
            The Researcher <span className="text-emerald">VX</span>
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm mono uppercase tracking-widest text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Console</a>
          <a href="#" className="hover:text-foreground transition-colors">Ledger</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </div>
        <UserMenu />
      </nav>

      {/* Hero Section */}
      <header className="relative py-24 px-6 max-w-6xl mx-auto text-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mono text-emerald text-xs mb-6 uppercase tracking-[0.3em] flex items-center justify-center gap-2"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald"></span>
          </span>
          System Status: Online // Core Active
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-none"
        >
          ADVANCED RESEARCH <br />
          <span className="text-muted-foreground italic font-light">INTELLIGENCE TOOL</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-muted-foreground max-w-2xl mx-auto mb-12 text-lg md:text-xl leading-relaxed"
        >
          Auditable, multi-source research with zero epistemic compromise. 
          Synthesize deep truth from every vector of knowledge in real-time.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col md:flex-row justify-center gap-6"
        >
          <Button 
            onClick={user ? () => {} : signInWithGoogle}
            size="lg" 
            className="bg-mission text-white px-10 py-7 text-lg font-bold uppercase tracking-widest hover:scale-105 transition-transform mission-glow border-none"
          >
            {user ? "Initialize Mission" : "Get Started"} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="border-trvx-border px-10 py-7 text-lg font-bold uppercase tracking-widest hover:bg-muted transition-colors">
            View Documentation
          </Button>
        </motion.div>

        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald/5 blur-[120px] rounded-full -z-10" />
      </header>

      {/* UI Preview Section */}
      <section className="px-6 mb-32">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-5xl mx-auto border border-trvx-border rounded-xl overflow-hidden emerald-glow bg-[#0d0d0d] shadow-2xl"
        >
          <div className="bg-[#1a1a1a] p-3 flex items-center justify-between border-b border-trvx-border">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
            </div>
            <div className="text-[10px] mono text-muted-foreground uppercase tracking-widest">
              trvx_console_v1.0.5.exe // mission_active
            </div>
            <div className="w-12" />
          </div>
          <div className="relative aspect-video bg-black flex items-center justify-center group">
            <img 
              src="https://images2.imgbox.com/62/5c/S5UInW3p_o.png" 
              alt="TRVX Mission Mode Interface" 
              className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </section>

      {/* Features / Modes */}
      <section className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 mb-40">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative group"
        >
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="pl-8">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="text-emerald w-6 h-6" />
              <h3 className="mono text-emerald uppercase text-sm font-bold tracking-[0.2em]">Standard Mode</h3>
            </div>
            <h4 className="text-3xl font-bold mb-4 tracking-tight">Instant Synthesis Engine</h4>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Rapid-fire query engine designed for quick synthesis and instant knowledge retrieval. 
              Perfect for surface-level verification and quick data points.
            </p>
            <div className="border border-trvx-border rounded-lg overflow-hidden bg-black/40 mb-4 aspect-[16/10]">
              <img 
                src="https://images2.imgbox.com/71/6a/zUo96l8O_o.png" 
                alt="Standard Mode Interface" 
                className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-90 transition-opacity"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative group"
        >
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-mission opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="pl-8">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-mission w-6 h-6" />
              <h3 className="mono text-mission uppercase text-sm font-bold tracking-[0.2em]">Mission Mode</h3>
            </div>
            <h4 className="text-3xl font-bold mb-4 tracking-tight">Full-Vector Analysis</h4>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Deep-dive investigation protocol. Automatically identifies contradictions, scrapes real-time evidence, 
              and provides an auditable truth-ledger.
            </p>
            <div className="border border-trvx-border rounded-lg overflow-hidden bg-black/40 mb-4 aspect-[16/10]">
              <img 
                src="https://images2.imgbox.com/3c/6e/6v0v8v8v_o.png" 
                alt="Mission Mode Results" 
                className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-90 transition-opacity"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Rigorous Fact-Checking Section */}
      <section className="max-w-6xl mx-auto px-6 mb-40">
        <div className="grid md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-2">
            <Badge className="bg-emerald/10 text-emerald border-emerald/20 mb-4 mono uppercase tracking-widest">Verification Protocol</Badge>
            <h2 className="text-4xl font-bold mb-6 tracking-tighter uppercase">Rigorous Fact-Checking</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              TRVX doesn't just summarize; it cross-references findings against multiple knowledge vectors to identify 
              contradictions and confirm findings with high confidence.
            </p>
            <ul className="space-y-4">
              {[
                "Multi-vector cross-referencing",
                "Contradiction detection algorithms",
                "Confidence scoring (95%+ accuracy)",
                "Auditable evidence chains"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm mono uppercase tracking-tight">
                  <div className="w-1.5 h-1.5 bg-emerald rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="border border-trvx-border rounded-xl overflow-hidden emerald-glow bg-[#0d0d0d] aspect-[16/10]"
            >
              <img 
                src="https://images2.imgbox.com/39/7e/6v0v8v8v_o.png" 
                alt="Rigorous Fact-Checking Interface" 
                className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="max-w-6xl mx-auto px-6 mb-40">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4 tracking-tighter uppercase">Core Capabilities</h2>
          <div className="w-20 h-1 bg-emerald mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: "Multi-Source Harvest", desc: "Simultaneous crawling of academic journals, news vectors, and real-time social signals." },
            { icon: Shield, title: "Epistemic Security", desc: "Advanced bias detection and contradiction mapping to ensure zero-compromise results." },
            { icon: Database, title: "Auditable Ledger", desc: "Every finding is logged with a permanent cryptographic hash for full research transparency." },
            { icon: Cpu, title: "Agent Swarms", desc: "Deploy multiple specialized AI agents to attack a research problem from different angles." },
            { icon: Globe, title: "Global Vectoring", desc: "Access data across language barriers with real-time semantic translation and context mapping." },
            { icon: Lock, title: "Encrypted Workspace", desc: "Your research remains your own. End-to-end encryption for all mission data and findings." },
          ].map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 border border-trvx-border bg-[#0d0d0d] hover:border-emerald/50 transition-colors group"
            >
              <feat.icon className="w-10 h-10 text-emerald mb-6 group-hover:scale-110 transition-transform" />
              <h5 className="text-xl font-bold mb-3 mono uppercase tracking-tight">{feat.title}</h5>
              <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 mb-40">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4 tracking-tighter uppercase">Subscription Tiers</h2>
          <p className="text-muted-foreground mono text-xs uppercase tracking-widest">Select your operational level</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tier 01 */}
          <Card className="bg-[#0d0d0d] border-trvx-border hover:border-emerald transition-all group relative overflow-hidden">
            <CardHeader className="p-8">
              <div className="mono text-[10px] text-muted-foreground mb-4 uppercase tracking-widest">Tier 01</div>
              <CardTitle className="text-3xl font-bold mb-2">FREE</CardTitle>
              <div className="text-emerald text-xs font-bold uppercase tracking-tighter underline decoration-emerald/30 underline-offset-4">Local Usage Only</div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <ul className="space-y-4 text-xs text-muted-foreground mono uppercase tracking-tight">
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald" /> Local LLM Support</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald" /> Basic Search</li>
                <li className="flex items-center gap-2 opacity-30"><ChevronRight className="w-3 h-3" /> Web Integration</li>
                <li className="flex items-center gap-2 opacity-30"><ChevronRight className="w-3 h-3" /> Mission Mode</li>
              </ul>
              <Button 
                onClick={() => handleUpdateProfile({ membershipTier: "free" })}
                className="w-full mt-8 bg-transparent border border-trvx-border hover:bg-emerald hover:text-black transition-all font-bold uppercase text-xs tracking-widest"
              >
                {profile?.membershipTier === "free" ? "Current Tier" : "Initialize"}
              </Button>
            </CardContent>
          </Card>

          {/* Tier 02 */}
          <Card className="bg-[#0d0d0d] border-trvx-border hover:border-emerald transition-all group relative overflow-hidden">
            <CardHeader className="p-8">
              <div className="mono text-[10px] text-emerald mb-4 uppercase tracking-widest">Tier 02</div>
              <CardTitle className="text-3xl font-bold mb-2">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></CardTitle>
              <div className="text-muted-foreground text-xs font-bold uppercase tracking-tighter">Standard Access</div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <ul className="space-y-4 text-xs text-muted-foreground mono uppercase tracking-tight">
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald" /> Web Search Int.</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald" /> Mission Mode (Basic)</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald" /> 50 Investigations</li>
                <li className="flex items-center gap-2 opacity-30"><ChevronRight className="w-3 h-3" /> Multi-Agent</li>
              </ul>
              <Button 
                onClick={() => handleUpdateProfile({ membershipTier: "standard" })}
                className="w-full mt-8 bg-transparent border border-trvx-border hover:bg-emerald hover:text-black transition-all font-bold uppercase text-xs tracking-widest"
              >
                {profile?.membershipTier === "standard" ? "Current Tier" : "Deploy"}
              </Button>
            </CardContent>
          </Card>

          {/* Tier 03 */}
          <Card className="bg-[#0d0d0d] border-2 border-mission relative shadow-[0_0_30px_rgba(61,139,255,0.15)] scale-105 z-10">
            <div className="absolute top-0 right-0 bg-mission text-white text-[10px] px-3 py-1 font-bold tracking-widest uppercase">Popular</div>
            <CardHeader className="p-8">
              <div className="mono text-[10px] text-mission mb-4 uppercase tracking-widest">Tier 03</div>
              <CardTitle className="text-3xl font-bold mb-2">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></CardTitle>
              <div className="text-muted-foreground text-xs font-bold uppercase tracking-tighter">Analyst Grade</div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <ul className="space-y-4 text-xs text-muted-foreground mono uppercase tracking-tight">
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-mission" /> All Vectors Enabled</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-mission" /> Influence Node Files</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-mission" /> Unlimited Missions</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-mission" /> Priority Compute</li>
              </ul>
              <Button 
                onClick={() => handleUpdateProfile({ membershipTier: "pro" })}
                className="w-full mt-8 bg-mission hover:bg-white hover:text-black transition-all font-bold uppercase text-xs tracking-widest border-none"
              >
                {profile?.membershipTier === "pro" ? "Current Tier" : "Initialize Pro"}
              </Button>
            </CardContent>
          </Card>

          {/* Tier 04 */}
          <Card className="bg-[#0d0d0d] border-trvx-border hover:border-emerald transition-all group relative overflow-hidden">
            <CardHeader className="p-8">
              <div className="mono text-[10px] text-muted-foreground mb-4 uppercase tracking-widest">Tier 04</div>
              <CardTitle className="text-3xl font-bold mb-2">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></CardTitle>
              <div className="text-muted-foreground text-xs font-bold uppercase tracking-tighter">Enterprise</div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <ul className="space-y-4 text-xs text-muted-foreground mono uppercase tracking-tight">
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald" /> Multi-Agent Swarms</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald" /> API Access</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald" /> Custom Models</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-emerald" /> Dedicated Support</li>
              </ul>
              <Button 
                onClick={() => handleUpdateProfile({ membershipTier: "ultimate" })}
                className="w-full mt-8 bg-transparent border border-trvx-border hover:bg-emerald hover:text-black transition-all font-bold uppercase text-xs tracking-widest"
              >
                {profile?.membershipTier === "ultimate" ? "Current Tier" : "Contact Ops"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 mb-40 text-center">
        <div className="p-16 border border-emerald/20 bg-emerald/[0.02] rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald to-transparent opacity-50" />
          <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tighter uppercase">Ready to uncover the truth?</h2>
          <p className="text-muted-foreground mb-12 text-lg max-w-xl mx-auto">
            Join the network of advanced analysts using TRVX to navigate the modern information landscape.
          </p>
          <Button 
            onClick={user ? () => setIsSettingsOpen(true) : signInWithGoogle}
            size="lg" 
            className="bg-emerald text-black px-12 py-8 text-xl font-bold uppercase tracking-widest hover:scale-105 transition-transform emerald-glow border-none"
          >
            {user ? "View Your Profile" : "Get Started Now"}
          </Button>
        </div>
      </section>

      {/* Footer / Status Bar */}
      <footer className="border-t border-trvx-border bg-black p-4 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] mono text-muted-foreground uppercase tracking-[0.2em]">
          <div className="flex gap-8 mb-4 md:mb-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald"></span>
              </span>
              CIPHER CORE: ACTIVE
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-mission rounded-full"></span>
              NETWORK: ENCRYPTED
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 bg-zinc-700 rounded-full"></span>
              LATENCY: 24MS
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <span className="hidden lg:inline text-zinc-800">|</span>
            <span>RESEARCHER OS V1.0.5-STABLE</span>
            <span className="hidden lg:inline text-zinc-800">|</span>
            <span>UTC: {new Date().toISOString().split('T')[1].split('.')[0]}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
