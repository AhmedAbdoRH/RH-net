
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">نتائج SWE-bench Verified (Arena AI)</h2>
              <p className="text-sm text-muted-foreground">مقارنة أداء أفضل النماذج البرمجية للذكاء الاصطناعي</p>
            </div>
          </div>
          
          <Card className="border-border/40 bg-card/50 shadow-xl overflow-hidden">
             <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-primary" />
                    ترتيب النماذج حسب الكفاءة في البرمجة
                </CardTitle>
             </CardHeader>
            <CardContent className="p-0 sm:p-6 h-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 5, right: 70, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    hide 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="bg-popover border border-border p-2 rounded shadow-md text-xs">
                                    <p className="font-bold">{payload[0].payload.name}</p>
                                    <p className="text-primary">{payload[0].value}%</p>
                                </div>
                            );
                        }
                        return null;
                    }}
                  />
                  <Bar 
                    dataKey="score" 
                    radius={[0, 4, 4, 0]} 
                    animationDuration={2500}
                    animationBegin={200}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                    <LabelList 
                        dataKey="name" 
                        position="insideLeft" 
                        offset={10}
                        style={{ fill: 'white', fontWeight: 'bold', fontSize: '13px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                    />
                    <LabelList 
                        dataKey="score" 
                        position="right" 
                        formatter={(value: number) => `${value}%`}
                        style={{ fill: 'hsl(var(--foreground))', fontWeight: 'bold', fontSize: '15px' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </footer>
  );
}
