
"use client";

import * as React from 'react';
import { ArenaLeaderboard } from './arena-leaderboard';

export function LeaderboardFooter() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <footer className="mt-12 border-t border-border/60 bg-card/30 backdrop-blur-md pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6">
          <ArenaLeaderboard />
        </div>
      </div>
    </footer>
  );
}
