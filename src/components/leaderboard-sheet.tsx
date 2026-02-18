"use client";

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trophy, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface LeaderboardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaderboardSheet({ open, onOpenChange }: LeaderboardSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <SheetTitle>لوحة متصدرين البرمجة (Arena)</SheetTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://arena.ai/ar/leaderboard/code" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 ml-2" />
                فتح في نافذة جديدة
              </a>
            </Button>
          </div>
          <SheetDescription>
            عرض مباشر لنتائج تقييم النماذج البرمجية من Arena AI.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 w-full h-full overflow-hidden bg-white">
          <iframe 
            src="https://arena.ai/ar/leaderboard/code" 
            className="w-full h-full border-none"
            title="Arena AI Code Leaderboard"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
