
"use client";

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trophy } from 'lucide-react';
import { ArenaLeaderboard } from './arena-leaderboard';
import { PerformanceLeaderboard } from './performance-leaderboard';
import { SweBenchLeaderboard } from './swe-bench-leaderboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaderboardSheet({ open, onOpenChange }: LeaderboardSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col overflow-y-auto">
        <SheetHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <SheetTitle>متصدرين SWE-bench Verified</SheetTitle>
          </div>
          <SheetDescription>
            مقارنة أداء النماذج البرمجية بناءً على اختبارات Arena AI وتقييم Artificial Analysis.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 p-4 pb-20">
          <Tabs defaultValue="arena" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-auto gap-2">
              <TabsTrigger value="arena">Arena AI</TabsTrigger>
              <TabsTrigger value="performance">Artificial Analysis</TabsTrigger>
              <TabsTrigger value="swe-verified">SWE-Verified</TabsTrigger>
              <TabsTrigger value="swe-pro">SWE-Pro</TabsTrigger>
            </TabsList>
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
      </SheetContent>
    </Sheet>
  );
}

