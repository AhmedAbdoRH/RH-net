"use client";

import type { KnowledgeBaseArticle } from '@/features/rh-sales/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Pencil, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type KnowledgeBaseCardProps = {
  article: KnowledgeBaseArticle;
  onEdit: (article: KnowledgeBaseArticle) => void;
  onDelete: (articleId: string) => void;
  onMove: (articleId: string, direction: 'left' | 'right') => void;
  isFirst: boolean;
  isLast: boolean;
  className?: string;
};

export function KnowledgeBaseCard({ article, onEdit, onDelete, onMove, isFirst, isLast, className }: KnowledgeBaseCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(article.content);
    setCopied(true);
    toast({ title: "تم النسخ!", description: "تم نسخ محتوى المقال إلى الحافظة." });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(article);
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(article.id);
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{article.title}</CardTitle>
        <div className="flex items-center bg-card/50 backdrop-blur-sm rounded-full">
             <Button variant="ghost" size="icon" onClick={() => onMove(article.id, 'right')} disabled={isFirst}>
                <ArrowRight className="h-4 w-4" />
                <span className="sr-only">تحريك لليمين</span>
              </Button>
               <Button variant="ghost" size="icon" onClick={() => onMove(article.id, 'left')} disabled={isLast}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">تحريك لليسار</span>
              </Button>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">نسخ المحتوى</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleEditClick}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">تعديل</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDeleteClick}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">حذف</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between pt-4">
        <p className="text-sm text-muted-foreground flex-grow">
          {article.content}
        </p>
      </CardContent>
    </Card>
  );
}
