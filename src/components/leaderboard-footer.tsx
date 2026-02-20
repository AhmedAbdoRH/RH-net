
"use client";

import * as React from 'react';
import { ArenaLeaderboard } from './arena-leaderboard';
import { PerformanceLeaderboard } from './performance-leaderboard';
import { SweBenchLeaderboard } from './swe-bench-leaderboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LeaderboardFooter() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <footer className="mt-12 border-t border-border/60 bg-card/30 backdrop-blur-md pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="arena" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-full max-w-[800px] grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="arena">Arena AI</TabsTrigger>
              <TabsTrigger value="performance">Artificial Analysis</TabsTrigger>
              <TabsTrigger value="swe-verified">SWE-Verified</TabsTrigger>
              <TabsTrigger value="swe-pro">SWE-Pro</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="arena">
            <ArenaLeaderboard />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceLeaderboard />
          </TabsContent>
          <TabsContent value="swe-verified">
            <SweBenchLeaderboard type="verified" />
          </TabsContent>
          <TabsContent value="swe-pro">
            <SweBenchLeaderboard type="pro" />
          </TabsContent>
        </Tabs>
      </div>
    </footer>
  );
}
