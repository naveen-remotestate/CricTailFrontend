import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import { LiveMatchCard } from "@/components/cricket/LiveMatchCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  PlusCircle, 
  Play, 
  ChevronRight, 
  FileText, 
  Share2, 
  ShieldCheck, 
  Zap, 
  X, 
  Copy 
} from "lucide-react";
import { toast } from "sonner";
import { formatOvers, formatTeamName } from "@/lib/utils";

export default function HomePage() {
  const { data: matches, isLoading } = useMatches();
  const { isAuthenticated } = useAuthStore();
  const [showAllLive, setShowAllLive] = useState(false);
  const [showAllFinished, setShowAllFinished] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const liveMatches = matches?.filter((m: any) => !m.winner_team_id) || [];
  const finishedMatches = matches?.filter((m: any) => m.winner_team_id) || [];

  const handleCopyLink = (matchId: string) => {
    const url = `${window.location.origin}/matches/${matchId}/live`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Live link copied to clipboard!");
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Immersive Hero Section */}
      <section className="relative pt-8 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20"
            >
              <Trophy className="h-3 w-3" />
              Ultimate Scoring App
            </motion.div>
            
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-black tracking-tight sm:text-6xl"
            >
              Cric<span className="text-primary">Tale</span>
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="max-w-md text-muted-foreground"
            >
              The professional scoring tool for your local matches. Easy, fast, and beautiful.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-3 pt-2"
            >
              {isAuthenticated ? (
                <Button size="lg" className="rounded-full px-8 gap-2 shadow-lg shadow-primary/20" asChild>
                  <Link to="/matches/create">
                    <PlusCircle className="h-5 w-5" />
                    Start New Match
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20" asChild>
                    <Link to="/register">Get Started</Link>
                  </Button>
                  <Button size="lg" variant="ghost" className="rounded-full px-8" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 space-y-8">
        {/* Tabbed Match Explorer */}
        <section className="space-y-4">
          <Tabs defaultValue="live" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold uppercase tracking-tighter">Matches</h2>
              <div className="flex items-center gap-4">
                 <TabsList className="bg-muted/50 rounded-full p-1 border">
                    <TabsTrigger value="live" className="rounded-full px-6 font-bold uppercase data-[state=active]:bg-background data-[state=active]:shadow-sm">Live</TabsTrigger>
                    <TabsTrigger value="finished" className="rounded-full px-6 font-bold uppercase data-[state=active]:bg-background data-[state=active]:shadow-sm">Finished</TabsTrigger>
                 </TabsList>
              </div>
            </div>

            <TabsContent value="live" className="mt-0 outline-none">
              {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i: number) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
              ) : liveMatches.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(showAllLive ? liveMatches : liveMatches.slice(0, 3)).map((match: any) => (
                      <LiveMatchCard key={match.match_id} match={match} />
                    ))}
                  </div>
                  {liveMatches.length > 3 && !showAllLive && (
                     <div className="flex justify-center">
                        <Button 
                          variant="outline" 
                          className="rounded-full px-8 font-black uppercase tracking-tighter text-xs gap-2 group hover:border-primary/50 transition-all"
                          onClick={() => setShowAllLive(true)}
                        >
                           Show All Live Matches
                           <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                     </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 rounded-[2.5rem] border-2 border-dashed bg-muted/20">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold">No Live Matches</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-6">Start a new match to see it here!</p>
                  <Button variant="outline" className="rounded-full font-bold px-6" asChild>
                    <Link to="/matches/create" className="gap-2">
                      <PlusCircle className="h-4 w-4" /> CREATE MATCH
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="finished" className="mt-0 outline-none">
              {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i: number) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
              ) : finishedMatches.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(showAllFinished ? finishedMatches : finishedMatches.slice(0, 3)).map((match: any) => (
                      <LiveMatchCard key={match.match_id} match={match} />
                    ))}
                  </div>
                  {finishedMatches.length > 3 && !showAllFinished && (
                     <div className="flex justify-center">
                        <Button 
                          variant="outline" 
                          className="rounded-full px-8 font-black uppercase tracking-tighter text-xs gap-2 group hover:border-primary/50 transition-all"
                          onClick={() => setShowAllFinished(true)}
                        >
                           Show All Results
                           <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                     </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 rounded-3xl border-2 border-dashed bg-muted/20">
                  <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No match results found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Quick Features Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary fill-current" />
            <h2 className="text-lg font-bold uppercase tracking-tighter">Features</h2>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/my-matches">
              <motion.div
                whileHover={{ x: 5 }}
                className="group p-4 rounded-[2rem] bg-card border border-border shadow-sm flex items-center gap-4 transition-all hover:border-primary/30"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-tight">My Matches</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">View and manage matches you've hosted.</p>
                </div>
              </motion.div>
            </Link>

            <Link to="/profile">
              <motion.div
                whileHover={{ x: 5 }}
                className="group p-4 rounded-[2rem] bg-card border border-border shadow-sm flex items-center gap-4 transition-all hover:border-blue-500/30"
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-tight">Career Hub</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">Real-time stats and match history.</p>
                </div>
              </motion.div>
            </Link>

            <div onClick={() => setShowShareModal(true)} className="cursor-pointer">
              <motion.div
                whileHover={{ x: 5 }}
                className="group p-4 rounded-[2rem] bg-card border border-border shadow-sm flex items-center gap-4 transition-all hover:border-green-500/30"
              >
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Share2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-tight">Live Casting</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">Share live scores with your friends.</p>
                </div>
              </motion.div>
            </div>

            <Link to="/matches/create">
              <motion.div
                whileHover={{ x: 5 }}
                className="group p-4 rounded-[2rem] bg-card border border-border shadow-sm flex items-center gap-4 transition-all hover:border-purple-500/30"
              >
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-tight">Match Engine</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">Professional scoring for any match.</p>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      </div>

      {/* Live Casting Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowShareModal(false)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-[2.5rem] border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Live Casting</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Select a match to share</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowShareModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {liveMatches.length === 0 ? (
                  <div className="text-center py-20">
                     <Play className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Live Matches found</p>
                  </div>
                ) : (
                  liveMatches.map((match: any) => (
                    <div 
                      key={match.match_id}
                      className="group p-4 rounded-3xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                           <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Now</span>
                        </div>
                        <p className="text-sm font-black uppercase truncate tracking-tight">
                          <span className="text-red-500">{formatTeamName(match.team_a_name)}</span> <span className="opacity-20">VS</span> <span className="text-blue-500">{formatTeamName(match.team_b_name)}</span>
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                          Innings {match.current_innings_no} | {formatOvers(match.legal_balls)} Overs
                        </p>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="cricket"
                        className="rounded-full h-10 px-6 font-black uppercase tracking-tighter text-[10px] gap-2 shadow-lg shadow-primary/20"
                        onClick={() => handleCopyLink(match.match_id)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                      </Button>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 bg-muted/10 text-center border-t">
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">CricTale Real-time Broadcast</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
