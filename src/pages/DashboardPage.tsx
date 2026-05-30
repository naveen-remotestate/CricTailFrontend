import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMyMatches } from "@/hooks/useMatches";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStats } from "@/hooks/usePlayers";
import { LiveMatchCard } from "@/components/cricket/LiveMatchCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PlusCircle, 
  Trophy, 
  TrendingUp, 
  Target, 
  Zap, 
  Activity, 
  Shield, 
  Sword,
  Check,
  Medal,
  Hand,
  Hash,
  Award,
  CircleDot
} from "lucide-react";
import { formatPlayerName, formatOvers, cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: myMatches, isLoading: matchesLoading } = useMyMatches();
  const { data: stats, isLoading: statsLoading } = usePlayerStats();

  const liveMatches = myMatches?.filter((m: any) => !m.is_completed && m.start_time !== null) || [];
  const completedMatches = myMatches?.filter((m: any) => m.is_completed) || [];

  const isLoading = matchesLoading || statsLoading;

  // --- BATTING CALCULATIONS ---
  const battingSR = stats?.total_balls_faced > 0 
    ? ((stats.total_runs / stats.total_balls_faced) * 100).toFixed(1) 
    : "0.0";

  // --- BOWLING CALCULATIONS ---
  const bowlingEcon = stats?.total_balls_bowled > 0 
    ? ((stats.total_runs_conceded / stats.total_balls_bowled) * 6).toFixed(2) 
    : "0.00";

  // --- GENERAL ---
  const winPercentage = stats?.matches_played > 0
    ? ((stats.matches_won / stats.matches_played) * 100).toFixed(0)
    : "0";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-8 pb-24">
         <Skeleton className="h-20 w-3/4 rounded-2xl" />
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
         </div>
         <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-8 pb-24">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
           <div className="h-16 w-16 rounded-3xl bg-card border border-border flex items-center justify-center text-primary font-black text-2xl shadow-sm">
             {user?.full_name?.charAt(0).toUpperCase()}
           </div>
           <div>
             <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
               Dashboard
             </h1>
             <p className="text-sm font-medium text-muted-foreground mt-1">
               Welcome back, <span className="text-foreground font-bold">{formatPlayerName(user?.full_name)}</span>
             </p>
           </div>
        </div>
        <div className="flex gap-2">
           <Button size="sm" className="rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 h-10 px-6" asChild>
             <Link to="/matches/create"><PlusCircle className="h-4 w-4 mr-2" /> New Match</Link>
           </Button>
           <Button size="sm" variant="outline" className="rounded-full font-black uppercase tracking-widest text-[10px] h-10 px-6 bg-card" asChild>
             <Link to="/profile">Profile</Link>
           </Button>
        </div>
      </motion.div>

      {/* --- CAREER SUMMARY SECTION --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-2">
             <Trophy className="h-4 w-4 text-primary" />
             <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Career Overview</h2>
           </div>
           <div className="flex gap-2">
              <div className="bg-card px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-border shadow-sm">
                Points: <span className="text-primary">{stats?.total_points || 0}</span>
              </div>
              <div className="bg-card px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-border shadow-sm">
                Win Rate: <span className="text-green-600">{winPercentage}%</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
           {[
             { label: "Matches", value: stats?.matches_played || 0, icon: Hash, color: "text-muted-foreground" },
             { label: "Won", value: stats?.matches_won || 0, icon: Award, color: "text-green-600" },
             { label: "Innings (Bat)", value: stats?.innings_batted || 0, icon: Sword, color: "text-primary" },
             { label: "Innings (Bowl)", value: stats?.innings_bowled || 0, icon: Shield, color: "text-blue-600" },
           ].map((item, i) => (
             <Card key={i} className="rounded-3xl border border-border bg-card shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                   <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center bg-muted/50", item.color)}>
                      <item.icon className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-xl font-black tracking-tight">{item.value}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>
      </section>

      {/* --- BATTING HUB --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
           <Sword className="h-4 w-4 text-primary" />
           <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Batting Hub</h2>
        </div>
        
        <Card className="rounded-[2.5rem] border border-border bg-card shadow-sm overflow-hidden">
           <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 mb-6">
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Total Runs</p>
                    <p className="text-3xl font-black tracking-tight text-primary leading-none">{stats?.total_runs || 0}</p>
                 </div>
                 <div className="border-l border-border/50 pl-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Strike Rate</p>
                    <p className="text-xl font-black tracking-tight">{battingSR}</p>
                 </div>
                 <div className="border-l border-border/50 pl-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Highest</p>
                    <p className="text-xl font-black tracking-tight italic">{stats?.highest_run || 0}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-border/30">
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black">{stats?.total_balls_faced || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Balls Faced</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black">{stats?.hundreds || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Hundreds</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black">{stats?.fifties || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Fifties</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black">{(stats?.total_fours || 0) + (stats?.total_sixes || 0)}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Boundaries</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black text-red-500">{stats?.ducks || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Ducks</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black text-red-600">{stats?.golden_ducks || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Golden Ducks</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black">{stats?.total_outs || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Times Out</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black">{stats?.total_fours || 0}</p>
                      <p className="text-[8px] font-bold uppercase text-muted-foreground">Total 4s</p>
                    </div>
                    <CircleDot className="h-3 w-3 text-muted-foreground/20" />
                 </div>
              </div>
           </CardContent>
        </Card>
      </section>

      {/* --- BOWLING HUB --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
           <Shield className="h-4 w-4 text-blue-600" />
           <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Bowling Hub</h2>
        </div>
        
        <Card className="rounded-[2.5rem] border border-border bg-card shadow-sm overflow-hidden">
           <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 mb-6">
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Wickets</p>
                    <p className="text-3xl font-black tracking-tight text-blue-600 leading-none">{stats?.total_wickets_taken || 0}</p>
                 </div>
                 <div className="border-l border-border/50 pl-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Economy</p>
                    <p className="text-xl font-black tracking-tight">{bowlingEcon}</p>
                 </div>
                 <div className="border-l border-border/50 pl-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Overs</p>
                    <p className="text-xl font-black tracking-tight">{formatOvers(stats?.total_balls_bowled || 0)}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-border/30">
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black">{stats?.total_runs_conceded || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Runs Given</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black text-blue-600">{stats?.total_maidens || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Maidens</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black text-blue-600">{stats?.wides || 0} / {stats?.no_balls || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">WD / NB</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black text-blue-600">{stats?.HighestWicketTaken || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Best Fig</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3">
                    <p className="text-xs font-black">{stats?.total_balls_bowled || 0}</p>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">Balls Bowled</p>
                 </div>
                 <div className="bg-muted/30 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black">{stats?.total_sixes || 0}</p>
                      <p className="text-[8px] font-bold uppercase text-muted-foreground">Total 6s</p>
                    </div>
                    <Zap className="h-3 w-3 text-muted-foreground/20" />
                 </div>
              </div>
           </CardContent>
        </Card>
      </section>

      {/* --- FIELDING HUB --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
           <Hand className="h-4 w-4 text-orange-500" />
           <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Fielding HUB</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
           {[
             { label: "Catches", value: stats?.catches || 0, icon: Hand, color: "text-orange-500" },
             { label: "Run Outs", value: stats?.run_outs || 0, icon: Zap, color: "text-orange-600" },
             { label: "Stumpings", value: stats?.stumping || 0, icon: Medal, color: "text-orange-400" },
           ].map((item, i) => (
             <Card key={i} className="rounded-[2rem] border border-border bg-card shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                   <item.icon className={cn("h-4 w-4 opacity-40", item.color)} />
                   <p className="text-xl font-black leading-none">{item.value}</p>
                   <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                </CardContent>
             </Card>
           ))}
        </div>
      </section>

      <div className="h-[1px] bg-border/50" />

      {/* --- Matches Sections --- */}
      <div className="space-y-8">
        {liveMatches.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Live Matches</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveMatches.map((match: any) => (
                <LiveMatchCard key={match.match_id} match={match} />
              ))}
            </div>
          </section>
        )}

        {completedMatches.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Check className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Results</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedMatches.slice(0, 3).map((match: any) => (
                <LiveMatchCard key={match.match_id} match={match} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
