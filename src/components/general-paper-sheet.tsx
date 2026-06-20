"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Save, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { getGeneralPaper, saveGeneralPaper, Note } from '@/services/generalPaperService';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from './ui/textarea';

interface GeneralPaperSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeneralPaperSheet({ open, onOpenChange }: GeneralPaperSheetProps) {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newContent, setNewContent] = React.useState('');
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editContent, setEditContent] = React.useState('');
  const [expandedNoteId, setExpandedNoteId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchPaper = React.useCallback(async () => {
    try {
      setLoading(true);
      const paperNotes = await getGeneralPaper();
      setNotes(paperNotes);
    } catch (error) {
      console.error("Error fetching general paper:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الورقة العامة.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (open) {
      fetchPaper();
    }
  }, [open, fetchPaper]);

  const doSave = async (updatedNotes: Note[]) => {
    setSaving(true);
    try {
      await saveGeneralPaper(updatedNotes);
      setNotes(updatedNotes);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الملاحظات بنجاح.",
      });
    } catch (error) {
      console.error("Error saving general paper:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الملاحظات.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = () => {
    const titleTrimmed = newTitle.trim();
    const contentTrimmed = newContent.trim();
    if (!contentTrimmed && !titleTrimmed) return;
    const finalTitle = titleTrimmed || contentTrimmed.split('\n')[0].slice(0, 80);
    const newNote: Note = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: finalTitle,
      content: contentTrimmed,
      updatedAt: new Date().toISOString(),
    };
    const updatedNotes = [...notes, newNote];
    doSave(updatedNotes);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
    setExpandedNoteId(newNote.id);
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    doSave(updatedNotes);
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleUpdateNote = (noteId: string) => {
    const titleTrimmed = editTitle.trim();
    const contentTrimmed = editContent.trim();
    if (!contentTrimmed && !titleTrimmed) return;
    const finalTitle = titleTrimmed || contentTrimmed.split('\n')[0].slice(0, 80);
    const updatedNotes = notes.map(n =>
      n.id === noteId
        ? { ...n, title: finalTitle, content: contentTrimmed, updatedAt: new Date().toISOString() }
        : n
    );
    doSave(updatedNotes);
    cancelEditing();
  };

  const toggleExpand = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>الورقة العامة</SheetTitle>
          <SheetDescription>
            مكان لتدوين الملاحظات والأفكار العامة.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 py-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {notes.length === 0 && !isAdding && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  لا توجد ملاحظات بعد. أضف ملاحظتك الأولى.
                </p>
              )}

              {notes.map(note => (
                <div
                  key={note.id}
                  className="border border-border rounded-lg bg-card"
                >
                  {editingNoteId === note.id ? (
                    <div className="p-3 space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
placeholder="عنوان الملاحظة (اختياري - يؤخذ من أول سطر)"
                        className="text-sm"
                        autoFocus
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="المحتوى..."
                        className="text-sm resize-none bg-muted/50"
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={cancelEditing}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" onClick={() => handleUpdateNote(note.id)} disabled={saving}>
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        className="p-3 flex items-start justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleExpand(note.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold truncate">{note.title}</h4>
                          {note.updatedAt && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(note.updatedAt).toLocaleString('ar-EG')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEditing(note)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            {expandedNoteId === note.id ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {expandedNoteId === note.id && note.content && (
                        <div className="px-3 pb-3 border-t border-border/30 pt-2">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isAdding ? (
                <div className="border border-primary/30 rounded-lg bg-primary/5 p-3 space-y-2">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="عنوان الملاحظة"
                    className="text-sm"
                    autoFocus
                  />
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="المحتوى..."
                    className="text-sm resize-none bg-muted/50"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setNewTitle(''); setNewContent(''); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" onClick={handleAddNote} disabled={saving || (!newTitle.trim() && !newContent.trim())}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة ملاحظة جديدة
                </Button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
