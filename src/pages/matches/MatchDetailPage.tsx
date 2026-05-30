import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMatch } from "@/hooks/useMatches";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatOvers, calculateRunRate } from "@/lib/utils";
import { Play, Eye, Trophy, Calendar, User } from "lucide-react";

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading } = useMatch(id || "");
  const { isAuthenticated } = useAuthStore();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }

  const isHost = match.hosted_by === "user-1"; // Mock check
  const canScore = isHost || match.scorer_1 === "user-1" || match.scorer_2 === "user-1";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Match Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <Badge variant={match.status === "LIVE" ? "live" : match.status === "COMPLETED" ? "completed" : "upcoming"}>
            {match.status}
          </Badge>
          <span className="text-sm text-muted-foreground">{match.overs} Overs</span>
        </div>

        <div className="text-center py-6 rounded-xl bg-gradient-to-br from-card to-primary/5 border">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold">{match.team_a?.name}</h2>
              {match.innings && match.innings[0]?.batting_team_id === match.team_a_id && (
                <p className="text-sm text-muted-foreground mt-1">
                  {match.innings[0].total_runs}/{match.innings[0].total_wickets}
                </p>
              )}
            </div>
            <div className="text-muted-foreground">
              <span className="text-sm">vs</span>
            </div>
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold">{match.team_b?.name}</h2>
              {match.innings && match.innings[0]?.batting_team_id === match.team_b_id && (
                <p className="text-sm text-muted-foreground mt-1">
                  {match.innings[0].total_runs}/{match.innings[0].total_wickets}
                </p>
              )}
            </div>
          </div>

          {match.status === "COMPLETED" && match.winner_team_id && (
            <div className="mt-4 flex items-center justify-center gap-2 text-cricket-gold">
              <Trophy className="h-5 w-5" />
              <span className="font-semibold">
                {match.winner_team_id === match.team_a_id ? match.team_a?.name : match.team_b?.name} won
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {match.status === "LIVE" && (
          <Button asChild className="gap-2">
            <Link to={`/matches/${match.id}/live`}>
              <Eye className="h-4 w-4" />
              Watch Live
            </Link>
          </Button>
        )}
        {canScore && match.status === "LIVE" && (
          <Button variant="cricket" asChild className="gap-2">
            <Link to={`/matches/${match.id}/score`}>
              <Play className="h-4 w-4" />
              Score Match
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild className="gap-2">
          <Link to={`/matches/${match.id}/scorecard`}>
            <Trophy className="h-4 w-4" />
            Scorecard
          </Link>
        </Button>
      </div>

      {/* Match Info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Match Info</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{match.start_time ? formatDate(match.start_time) : "Not started"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Toss</span>
              <span>
                {match.toss_winner_team_id
                  ? `${match.toss_winner_team_id === match.team_a_id ? match.team_a?.name : match.team_b?.name} won and chose to ${match.toss_decision}`
                  : "Not done"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Innings</span>
              <span>{match.current_innings_no} of 2</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scorecards */}
      {match.innings && match.innings.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Scorecards</h3>
          {match.innings.map((innings) => {
            const battingTeam = match.team_a?.id === innings.batting_team_id ? match.team_a : match.team_b;
            return (
              <Card key={innings.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{battingTeam?.name}</span>
                    <span className="text-lg font-bold">
                      {innings.total_runs}/{innings.total_wickets}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {formatOvers(innings.legal_balls)} overs | CRR: {calculateRunRate(innings.total_runs, innings.legal_balls)}
                  </div>

                  {/* Batting */}
                  {innings.batting_scorecards && innings.batting_scorecards.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Batting</h4>
                      <div className="space-y-1">
                        {innings.batting_scorecards.slice(0, 5).map((card) => (
                          <div key={card.id} className="flex items-center justify-between text-sm">
                            <span className={card.is_out ? "" : "font-semibold"}>
                              {card.user?.full_name} {card.is_out ? "" : "*"}
                            </span>
                            <span>
                              {card.runs} ({card.balls_faced}) {card.fours > 0 && `${card.fours}x4`} {card.sixes > 0 && `${card.sixes}x6`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bowling */}
                  {innings.bowling_scorecards && innings.bowling_scorecards.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bowling</h4>
                      <div className="space-y-1">
                        {innings.bowling_scorecards.slice(0, 3).map((card) => (
                          <div key={card.id} className="flex items-center justify-between text-sm">
                            <span>{card.user?.full_name}</span>
                            <span>
                              {card.wickets}/{card.runs_conceded} ({formatOvers(card.legal_balls)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
