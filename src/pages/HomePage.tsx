import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMatches } from "@/hooks/useMatches";
import { LiveMatchCard } from "@/components/cricket/LiveMatchCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Zap, Users, ArrowRight, PlusCircle, Play } from "lucide-react";

export default function HomePage() {
  const { data: matches, isLoading } = useMatches();
  const { isAuthenticated } = useAuthStore();

  const liveMatches = matches?.filter((m) => m.status === "LIVE") || [];
  const upcomingMatches = matches?.filter((m) => m.status === "UPCOMING") || [];
  const completedMatches = matches?.filter((m) => m.status === "COMPLETED") || [];

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
              Cric<span className="text-primary">Tail</span>
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
        {/* Horizontal Featured Section */}
        {liveMatches.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Live Now
              </h2>
              {liveMatches.length > 1 && (
                <span className="text-xs text-muted-foreground">{liveMatches.length} matches</span>
              )}
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x">
              {liveMatches.map((match) => (
                <div key={match.id} className="min-w-[85vw] sm:min-w-[400px] snap-center">
                  <LiveMatchCard match={match} featured />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tabbed Match Explorer */}
        <section className="space-y-4">
          <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Explore</h2>
              <TabsList className="bg-muted/50 rounded-full p-1">
                <TabsTrigger value="upcoming" className="rounded-full px-4 text-xs">Upcoming</TabsTrigger>
                <TabsTrigger value="finished" className="rounded-full px-4 text-xs">Finished</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upcoming" className="mt-0">
              {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
              ) : upcomingMatches.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingMatches.map((match) => (
                    <LiveMatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-3xl border-2 border-dashed bg-muted/20">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">No upcoming matches</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="finished" className="mt-0">
              {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
              ) : completedMatches.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {completedMatches.map((match) => (
                    <LiveMatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-3xl border-2 border-dashed bg-muted/20">
                  <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">No completed matches yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Quick Insights Cards */}
        <section className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20"
          >
            <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{matches?.length || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Active Players</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-4 rounded-3xl bg-primary/10 border border-primary/20"
          >
            <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center mb-3">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-black text-primary">{liveMatches.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Live Events</p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

// Add these to types or local constants if needed
const Calendar = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
