import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

const MOCK_TEAMS = [
  { id: "1", name: "Tech Strikers", players: 11, matches: 5, wins: 3 },
  { id: "2", name: "Code Warriors", players: 11, matches: 5, wins: 2 },
  { id: "3", name: "Design Dynamos", players: 9, matches: 3, wins: 1 },
  { id: "4", name: "Dev Dragons", players: 10, matches: 4, wins: 2 },
];

export default function TeamsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_TEAMS.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-xs text-muted-foreground">{team.players} players</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{team.matches} matches</span>
                  <span className="text-green-500 font-medium">{team.wins} wins</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
