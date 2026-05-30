import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useMatch } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatOvers, calculateRunRate } from "@/lib/utils";
import { Trophy } from "lucide-react";

export default function ScorecardPage() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading } = useMatch(id || "");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold mb-2">Full Scorecard</h1>
        <p className="text-muted-foreground">
          {match.team_a?.name} vs {match.team_b?.name}
        </p>
      </motion.div>

      {match.innings?.map((innings, idx) => {
        const battingTeam = match.team_a?.id === innings.batting_team_id ? match.team_a : match.team_b;
        return (
          <motion.div
            key={innings.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold">{battingTeam?.name}</h2>
                    <p className="text-xs text-muted-foreground">Innings {innings.innings_no}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{innings.total_runs}/{innings.total_wickets}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatOvers(innings.legal_balls)} overs
                    </p>
                  </div>
                </div>

                {/* Batting Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2">Batter</th>
                        <th className="pb-2 text-right">R</th>
                        <th className="pb-2 text-right">B</th>
                        <th className="pb-2 text-right">4s</th>
                        <th className="pb-2 text-right">6s</th>
                        <th className="pb-2 text-right">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {innings.batting_scorecards?.map((card) => (
                        <tr key={card.id} className="border-b border-border/50">
                          <td className="py-2">
                            <span className={card.is_out ? "" : "font-semibold"}>
                              {card.user?.full_name}
                            </span>
                            {card.is_out && card.dismissal_type && (
                              <span className="block text-xs text-muted-foreground">
                                {card.dismissal_type}
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-right font-medium">{card.runs}</td>
                          <td className="py-2 text-right text-muted-foreground">{card.balls_faced}</td>
                          <td className="py-2 text-right text-muted-foreground">{card.fours}</td>
                          <td className="py-2 text-right text-muted-foreground">{card.sixes}</td>
                          <td className="py-2 text-right text-muted-foreground">
                            {card.balls_faced > 0 ? ((card.runs / card.balls_faced) * 100).toFixed(1) : "0.0"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bowling Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2">Bowler</th>
                        <th className="pb-2 text-right">O</th>
                        <th className="pb-2 text-right">M</th>
                        <th className="pb-2 text-right">R</th>
                        <th className="pb-2 text-right">W</th>
                        <th className="pb-2 text-right">Econ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {innings.bowling_scorecards?.map((card) => (
                        <tr key={card.id} className="border-b border-border/50">
                          <td className="py-2">{card.user?.full_name}</td>
                          <td className="py-2 text-right">{formatOvers(card.legal_balls)}</td>
                          <td className="py-2 text-right">{card.maidens}</td>
                          <td className="py-2 text-right">{card.runs_conceded}</td>
                          <td className="py-2 text-right font-medium">{card.wickets}</td>
                          <td className="py-2 text-right text-muted-foreground">
                            {calculateRunRate(card.runs_conceded, card.legal_balls)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Extras */}
                <div className="mt-3 text-xs text-muted-foreground">
                  Extras: {innings.extras} (W {innings.wides}, NB {innings.no_balls}, B {innings.byes}, LB {innings.leg_byes})
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {match.winner_team_id && (
        <div className="flex items-center justify-center gap-2 text-cricket-gold py-4">
          <Trophy className="h-6 w-6" />
          <span className="text-lg font-semibold">
            {match.winner_team_id === match.team_a_id ? match.team_a?.name : match.team_b?.name} won the match
          </span>
        </div>
      )}
    </div>
  );
}
