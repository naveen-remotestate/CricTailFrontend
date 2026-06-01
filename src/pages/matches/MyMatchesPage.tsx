import { motion } from "framer-motion";
import { useMatches } from "@/hooks/useMatches";
import { useAuthStore } from "@/store/authStore";
import { LiveMatchCard } from "@/components/cricket/LiveMatchCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Trophy, History, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

export default function MyMatchesPage() {
  const { user } = useAuthStore();
  const { data: matches, isLoading } = useMatches();

  // Filter matches hosted by the logged-in user
  const myMatches = matches?.filter((match: any) => match.hosted_by === user?.user_id) || [];
  
  const liveMatches = myMatches.filter((m: any) => !m.winner_team_id);
  const finishedMatches = myMatches.filter((m: any) => m.winner_team_id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic italic leading-none">My Matches</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Matches hosted by you
          </p>
        </div>
        <Button size="sm" className="rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 h-10 px-6" asChild>
          <Link to="/matches/create">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Match
          </Link>
        </Button>
      </div>

      {myMatches.length === 0 ? (
        <div className="text-center py-20 rounded-[2.5rem] border-2 border-dashed bg-muted/20">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
            <Trophy className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold">No Matches Found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">You haven't hosted any matches yet.</p>
          <Button variant="outline" className="rounded-full font-bold px-6" asChild>
            <Link to="/matches/create" className="gap-2">
              <PlusCircle className="h-4 w-4" /> CREATE MATCH
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {liveMatches.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ongoing Matches</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {liveMatches.map((match: any) => (
                  <LiveMatchCard key={match.match_id} match={match} />
                ))}
              </div>
            </section>
          )}

          {finishedMatches.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Match History</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {finishedMatches.map((match: any) => (
                  <LiveMatchCard key={match.match_id} match={match} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
