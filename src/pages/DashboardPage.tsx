import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMyMatches } from "@/hooks/useMatches";
import { useAuthStore } from "@/store/authStore";
import { LiveMatchCard } from "@/components/cricket/LiveMatchCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Trophy, Calendar, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: myMatches, isLoading } = useMyMatches();

  const liveMatches = myMatches?.filter((m) => m.status === "LIVE") || [];
  const upcomingMatches = myMatches?.filter((m) => m.status === "UPCOMING") || [];
  const completedMatches = myMatches?.filter((m) => m.status === "COMPLETED") || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your matches.</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myMatches?.length || 0}</p>
              <p className="text-xs text-muted-foreground">My Matches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
              <TrendingUp className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{liveMatches.length}</p>
              <p className="text-xs text-muted-foreground">Live Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingMatches.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <Trophy className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedMatches.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/matches/create" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Match
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/teams">Manage Teams</Link>
        </Button>
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">My Live Matches</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveMatches.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Upcoming Matches</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Completed */}
      {completedMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Recent Results</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completedMatches.slice(0, 3).map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && myMatches?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Trophy className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No matches yet</h3>
          <p className="text-muted-foreground mt-1">Create your first match to get started</p>
          <Button className="mt-4" asChild>
            <Link to="/matches/create">Create Match</Link>
          </Button>
        </motion.div>
      )}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}
    </div>
  );
}
