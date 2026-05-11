"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Copy, Edit2, Check, X, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { getContentIdeas, addContentIdea, updateContentIdea, deleteContentIdea } from '@/services/contentIdeasService';
import type { ContentIdea } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ContentIdeasWalletProps {
  title: string;
  owner: string; // 'ahmed-abu-ezz' or 'ahmed-abdo'
  icon?: string;
}

export function ContentIdeasWallet({ title, owner, icon = "💡" }: ContentIdeasWalletProps) {
  const [ideas, setIdeas] = React.useState<ContentIdea[]>([]);
  const [newIdea, setNewIdea] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const refreshIdeas = React.useCallback(async () => {
    try {
      const data = await getContentIdeas(owner);
      setIdeas(data);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    }
  }, [owner]);

  React.useEffect(() => {
    refreshIdeas();
  }, [refreshIdeas]);

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newIdea.trim();
    if (!text) return;

    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    setLoading(true);
    setNewIdea('');

    try {
      if (lines.length === 1) {
        const newIdeaObj = await addContentIdea(lines[0], owner);
        setIdeas(prev => [newIdeaObj, ...prev]);
      } else {
        await Promise.all(lines.map(line => addContentIdea(line, owner)));
        await refreshIdeas();
      }
      toast({ title: "نجاح", description: `تمت إضافة ${lines.length} فكرة.` });
    } catch (error: any) {
      console.error("Error adding idea:", error?.code, error?.message);
      toast({ title: "خطأ", description: error?.message || "فشل في إضافة الفكرة. تأكد من صلاحيات Firestore.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteContentIdea(id);
      setIdeas(prev => prev.filter(i => i.id !== id));
      toast({ title: "نجاح", description: "تم حذف الفكرة." });
    } catch (error) {
      console.error("Error deleting idea:", error);
      toast({ title: "خطأ", description: "فشل في حذف الفكرة.", variant: "destructive" });
    }
  };

  const handleStartEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    try {
      await updateContentIdea(id, { text: editingText.trim() });
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, text: editingText.trim() } : i));
      setEditingId(null);
      setEditingText('');
      toast({ title: "نجاح", description: "تم تحديث الفكرة." });
    } catch (error) {
      console.error("Error updating idea:", error);
      toast({ title: "خطأ", description: "فشل في تحديث الفكرة.", variant: "destructive" });
    }
  };

  const handleCopyIdea = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "نجاح", description: "تم نسخ الفكرة." });
  };

  return (
    <div className="border rounded-lg bg-card/50 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-sm">{title}</span>
          <span className="text-xs text-muted-foreground">({ideas.length})</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="p-3 pt-0 space-y-3">
          <form onSubmit={handleAddIdea} className="flex gap-2">
            <Textarea
              placeholder="أضف أفكار جديدة (كل سطر فكرة جديدة)..."
              value={newIdea}
              onChange={e => setNewIdea(e.target.value)}
              className="bg-background min-h-[40px] resize-none text-sm"
              rows={1}
            />
            <Button type="submit" size="sm" variant="outline" className="h-auto min-h-[40px] font-bold whitespace-nowrap" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </form>

          {ideas.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">لا توجد أفكار حتى الآن.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {ideas.map((idea) => (
                <li key={idea.id} className="flex items-start gap-2 p-2 rounded-md bg-background/50 group">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  {editingId === idea.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Textarea
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        className="min-h-[40px] resize-none text-sm"
                        rows={1}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit(idea.id!);
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingText('');
                          }
                        }}
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => handleSaveEdit(idea.id!)}>
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => { setEditingId(null); setEditingText(''); }}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm whitespace-pre-wrap">{idea.text}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyIdea(idea.text)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEdit(idea.id!, idea.text)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteIdea(idea.id!)}>
                          <Trash2 className="h-3 w-3 text-destructive/80" />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}