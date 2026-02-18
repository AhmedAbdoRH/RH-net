"use client";

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

export function LeaderboardFooter() {
  return (
    <footer className="mt-12 border-t border-border/60 bg-card/30 backdrop-blur-md pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">لوحة متصدرين البرمجة (Arena AI)</h2>
                <p className="text-sm text-muted-foreground">متابعة مباشرة لأفضل نماذج الذكاء الاصطناعي البرمجية</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <a href="https://arena.ai/ar/leaderboard/code" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 ml-2" />
                فتح الموقع الرسمي
              </a>
            </Button>
          </div>
          
          <Card className="overflow-hidden border-border/40 bg-white shadow-2xl rounded-xl">
            <CardContent className="p-0 h-[700px]">
              <iframe 
                src="https://arena.ai/ar/leaderboard/code" 
                className="w-full h-full border-none"
                title="Arena AI Code Leaderboard"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </CardContent>
          </Card>
          
          <div className="flex sm:hidden justify-center mt-2">
            <Button variant="link" size="sm" asChild>
              <a href="https://arena.ai/ar/leaderboard/code" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 ml-2" />
                عرض في نافذة مستقلة
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
