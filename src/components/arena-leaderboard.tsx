"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardRow {
  rank: string;
  rankSpread: string;
  organization: string;
  model: string;
  license: string;
  score: string;
  confidence: string;
}

interface LeaderboardData {
  source: string;
  updatedAt: string;
  total: number;
  leaderboard: LeaderboardRow[];
}

export function ArenaLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/arena');
        if (!res.ok) throw new Error('Failed to fetch data');
        const jsonData = await res.json();
        setData(jsonData);
        // Trigger animation after a short delay
        setTimeout(() => setAnimated(true), 100);
      } catch (err) {
        console.error(err);
        setError('تعذر تحميل البيانات. يرجى التأكد من تشغيل السكرابر.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل لوحة الصدارة...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>{error || 'لا توجد بيانات متاحة حالياً'}</p>
      </div>
    );
  }

  // Parse scores to numbers for calculation
  const parsedData = data.leaderboard.map(row => ({
    ...row,
    numericScore: parseInt(row.score, 10) || 0
  })).sort((a, b) => b.numericScore - a.numericScore);

  const maxScore = Math.max(...parsedData.map(d => d.numericScore));

  return (
    <Card className="w-full bg-slate-950 text-slate-100 border-slate-800 shadow-2xl overflow-hidden relative">
      <CardHeader className="flex flex-row items-center justify-between py-6 border-b border-slate-800/60 relative z-10 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400/70 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700/30">
          <RefreshCw className="h-3 w-3 animate-spin-slow" />
          <span>SYNC: {new Date(data.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative z-10">
        <div className="flex flex-col w-full">
          {parsedData.map((row, index) => {
            const percentage = (row.numericScore / maxScore) * 100;
            const isTop3 = index < 3;
            
            return (
              <div key={index} className="flex items-center w-full group relative hover:bg-white/[0.02] transition-colors duration-300">
                <div className="w-full h-10 relative flex items-center">
                  
                  {/* Background Track */}
                  <div className="absolute inset-0 border-b border-slate-800/30" />
                  
                  {/* The Bar */}
                  <div 
                    className={cn(
                      "h-full absolute top-0 left-0 flex items-center px-4 overflow-hidden whitespace-nowrap transition-all duration-1000 ease-out",
                      "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800",
                      "border-r border-y border-slate-700/30",
                      "shadow-none group-hover:shadow-[0_0_15px_rgba(148,163,184,0.1)]",
                      "group-hover:from-slate-900 group-hover:via-slate-800 group-hover:to-slate-700 group-hover:border-slate-600",
                    )}
                    style={{ width: animated ? `${percentage}%` : '0%' }}
                  >
                    <div className="flex justify-start items-center w-full relative z-10 px-2">
                        <span className="text-sm font-bold flex gap-3 items-center tracking-wide text-slate-300 drop-shadow-sm font-mono group-hover:text-white transition-colors">
                          <span className={cn("w-6 text-center text-slate-500 text-xs", isTop3 && "text-amber-500/80 font-black")}>#{index + 1}</span>
                          <span className="uppercase tracking-wider flex items-center gap-2">
                            {row.model}
                            <span className="text-slate-400 text-xs font-medium">({row.score})</span>
                          </span> 
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-4 text-[10px] text-center text-slate-600 font-mono tracking-widest uppercase border-t border-slate-800 bg-slate-950/80">
           DATA SOURCE: <a href={data.source} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-300 transition-colors">ARENA.AI CODE LEADERBOARD // LIVE FEED</a>
        </div>
      </CardContent>
    </Card>
  );
}

