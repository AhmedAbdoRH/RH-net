
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
            مقارنة أداء النماذج البرمجية بناءً على اختبارات Arena AI.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 p-4">
           <ArenaLeaderboard />
        </div>
      </SheetContent>
    </Sheet>
  );
}

