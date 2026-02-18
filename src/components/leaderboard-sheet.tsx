
"use client";

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trophy, Code2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

const data = [
  { name: 'GPT-5.3 Codex', score: 92.5, color: '#3b82f6' },
  { name: 'Claude Opus 4.6', score: 90.8, color: '#f97316' },
  { name: 'Gemini 3 Pro High', score: 89.6, color: '#8b5cf6' },
  { name: 'GPT-5.2 Codex', score: 88.9, color: '#60a5fa' },
  { name: 'Claude Sonnet 4.6', score: 87.4, color: '#fb923c' },
  { name: 'Windsurf SWE-1.5', score: 85.2, color: '#10b981' },
  { name: 'Kimi k2.5', score: 83.1, color: '#ec4899' },
  { name: 'MiniMax-M2.5', score: 80.2, color: '#f43f5e' },
  { name: 'Gemini 3 Flash', score: 78.0, color: '#a78bfa' },
  { name: 'GLM-5', score: 72.0, color: '#6366f1' },
  { name: 'Qwen 3.5 Plus', score: 69.4, color: '#14b8a6' },
].sort((a, b) => b.score - a.score);

interface LeaderboardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaderboardSheet({ open, onOpenChange }: LeaderboardSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-6 flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <SheetTitle>متصدرين SWE-bench Verified</SheetTitle>
          </div>
          <SheetDescription>
            مقارنة أداء النماذج البرمجية بناءً على اختبارات Arena AI.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 mt-6 h-full">
           <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 5, right: 60, left: 0, bottom: 5 }}
                >
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} animationDuration={1500}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                    <LabelList 
                        dataKey="name" 
                        position="insideLeft" 
                        style={{ fill: 'white', fontWeight: 'bold', fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                    />
                    <LabelList 
                        dataKey="score" 
                        position="right" 
                        formatter={(value: number) => `${value}%`}
                        style={{ fill: 'hsl(var(--foreground))', fontWeight: 'bold', fontSize: '12px' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
