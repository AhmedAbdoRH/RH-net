"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, BarChart3, TrendingUp, DollarSign, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceRow {
  rank: number;
  model: string;
  score: number;
  price: string;
  context: string;
  provider: string;
}

interface PerformanceData {
  source: string;
  updatedAt: string;
  models: PerformanceRow[];
}

export function PerformanceLeaderboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
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
      const res = await fetch('/api/performance', {
        method: showRefreshing ? 'POST' : 'GET'
      });
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

  if (error || !data || !Array.isArray(data.models)) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>{error || 'لا توجد بيانات متاحة حالياً'}</p>
      </div>
    );
  }

  const maxScore = Math.max(...data.models.map(d => d.score));

  return (
    <Card className="w-full bg-black/20 backdrop-blur-md text-neutral-200 border-neutral-800/50 shadow-2xl overflow-hidden relative">
      <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-neutral-800/30 relative z-10 bg-black/10 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-base font-medium">الأداء العام (Artificial Analysis)</CardTitle>
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

      <CardContent className="p-0 relative z-10">
        <div className="flex flex-col w-full">
          {data.models.map((row, index) => {
            const percentage = (row.score / maxScore) * 100;
            const isTop3 = index < 3;

            return (
              <div key={index} className="flex items-center w-full group relative hover:bg-white/[0.02] transition-colors duration-300 border-b border-neutral-800/30 last:border-0">
                <div className="w-full h-10 relative flex items-center">

                  {/* Background Track */}
                  <div className="absolute inset-0 bg-neutral-950/30" />

                  {/* The Bar */}
                  <div
                    className={cn(
                      "h-full absolute top-0 left-0 flex items-center px-4 overflow-hidden whitespace-nowrap transition-all duration-1000 ease-out",
                      "bg-gradient-to-r from-purple-950/20 via-purple-900/10 to-transparent",
                      "border-r border-purple-500/10",
                    )}
                    style={{ width: animated ? `${percentage}%` : '0%' }}
                  />

                  {/* Content */}
                  <div className="flex justify-between items-center w-full relative z-10 px-4 py-2">
                    <div className="flex items-center gap-4">
                      <span className={cn("w-6 text-center text-neutral-600 text-sm font-mono", isTop3 && "text-purple-400 font-bold")}>#{row.rank}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-wide text-neutral-300 group-hover:text-purple-300 transition-colors">
                          {row.model}
                        </span>
                        <div className="flex items-center gap-3 text-[10px] text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Database className="h-3 w-3" /> {row.context}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {row.price}
                          </span>
                          <span>{row.provider}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-mono font-bold text-purple-500 group-hover:text-purple-400 transition-colors">
                        {row.score}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2 text-[10px] text-center text-neutral-700 font-mono tracking-widest uppercase border-t border-neutral-900 bg-black">
          DATA SOURCE: <a href={data.source} target="_blank" rel="noreferrer" className="text-neutral-600 hover:text-neutral-400 transition-colors">ARTIFICIAL ANALYSIS // QUALITY INDEX</a>
        </div>
      </CardContent>
    </Card>
  );
}
