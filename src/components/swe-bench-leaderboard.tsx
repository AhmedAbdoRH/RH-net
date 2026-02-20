"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Trophy, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SweBenchRow {
  rank: number;
  model: string;
  score: number;
  provider: string;
}

interface SweBenchData {
  source: string;
  updatedAt: string;
  verified: SweBenchRow[];
  pro: SweBenchRow[];
}

interface SweBenchLeaderboardProps {
  type: 'verified' | 'pro';
}

export function SweBenchLeaderboard({ type }: SweBenchLeaderboardProps) {
  const [data, setData] = useState<SweBenchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);

  async function fetchData(showRefreshing = false) {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const res = await fetch('/api/swe-bench', { 
        method: showRefreshing ? 'POST' : 'GET' 
      });
      if (!res.ok) throw new Error('Failed to fetch data');
      const jsonData = await res.json();
      setData(jsonData);
      // Trigger animation after a short delay
      setTimeout(() => setAnimated(true), 100);
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل البيانات.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
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

  const rows = type === 'verified' ? data.verified : data.pro;
  const maxScore = Math.max(...rows.map(d => d.score));
  const title = type === 'verified' ? 'SWE-Bench Verified' : 'SWE-Bench Pro';
  const icon = type === 'verified' ? Trophy : Code2;
  const colorClass = type === 'verified' ? 'text-green-500' : 'text-orange-500';
  const barColorClass = type === 'verified' ? 'bg-green-500/20 group-hover:bg-green-500/30' : 'bg-orange-500/20 group-hover:bg-orange-500/30';
  const barFillClass = type === 'verified' ? 'bg-green-500' : 'bg-orange-500';

  return (
    <Card className="w-full bg-black/20 backdrop-blur-md text-neutral-200 border-neutral-800/50 shadow-2xl overflow-hidden relative">
      <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-neutral-800/30 relative z-10 bg-black/10 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {React.createElement(icon, { className: cn("h-5 w-5", colorClass) })}
          <CardTitle className="text-base font-medium">{title} (Feb 2026)</CardTitle>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 bg-neutral-900/50 px-3 py-1 rounded-full border border-neutral-800">
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            <span>SYNC: {new Date(data.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white bg-neutral-900/50 hover:bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-800 hover:border-neutral-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            <span>{refreshing ? 'جاري التحديث...' : 'تحديث'}</span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative z-0">
        <div className="grid grid-cols-12 gap-4 p-3 px-4 border-b border-neutral-800/50 text-xs font-medium text-neutral-500 uppercase tracking-wider bg-black/20">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4 md:col-span-3">النموذج</div>
          <div className="col-span-5 md:col-span-6 text-left">النتيجة (Score)</div>
          <div className="col-span-2 text-right">المزود</div>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          {rows.map((row, index) => (
            <div 
              key={`${row.model}-${index}`}
              className="group relative grid grid-cols-12 gap-4 p-3 px-4 items-center border-b border-neutral-800/30 hover:bg-white/5 transition-colors duration-200"
              style={{
                animation: animated ? `slideIn 0.5s ease-out forwards ${index * 0.05}s` : 'none',
                opacity: animated ? 0 : 1,
              }}
            >
              <div className="col-span-1 text-center font-mono text-neutral-500 group-hover:text-neutral-300">
                {row.rank}
              </div>
              
              <div className="col-span-4 md:col-span-3 font-medium text-neutral-200 group-hover:text-white truncate" title={row.model}>
                {row.model}
              </div>
              
              <div className="col-span-5 md:col-span-6 relative h-8 flex items-center">
                <div className="w-full h-2 bg-neutral-800/50 rounded-full overflow-hidden relative">
                   <div 
                     className={cn("h-full rounded-full relative transition-all duration-1000 ease-out", barFillClass)}
                     style={{ 
                       width: animated ? `${(row.score / maxScore) * 100}%` : '0%',
                       boxShadow: '0 0 10px rgba(var(--primary), 0.3)'
                     }}
                   />
                </div>
                <span className="absolute right-0 top-[-6px] text-[10px] text-neutral-500 font-mono">
                  {row.score}%
                </span>
                <span className="ml-3 text-sm font-bold font-mono text-neutral-300 group-hover:text-white">
                  {row.score}%
                </span>
              </div>
              
              <div className="col-span-2 text-right text-xs text-neutral-400 group-hover:text-neutral-300 truncate">
                {row.provider}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 text-center text-xs text-neutral-600 border-t border-neutral-800/30 bg-black/20">
          المصدر: <a href="https://www.marc0.dev/en/leaderboard" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">marc0.dev Leaderboard</a>
        </div>
      </CardContent>
      
      <style jsx global>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Card>
  );
}
