import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">Page not found</p>
        <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Button className="mt-6 gap-2" asChild>
          <Link to="/">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
