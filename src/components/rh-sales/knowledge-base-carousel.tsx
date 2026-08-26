'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/features/rh-sales/firebase';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query } from 'firebase/firestore';
import type { KnowledgeBaseArticle } from '@/features/rh-sales/types';
import { KnowledgeBaseCard } from '@/components/rh-sales/knowledge-base-card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { deleteKnowledgeBaseArticle, updateKnowledgeBaseArticle, moveKnowledgeBaseArticle } from '@/features/rh-sales/data';
import { cn } from '@/lib/utils';

const cardColors = [
  'bg-card-green',
  'bg-card-orange',
  'bg-card-pink',
  'bg-card-blue',
  'bg-card-purple'
];

export function KnowledgeBaseCarousel() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);

  const articlesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'knowledge_base_articles'));
  }, [firestore, user]);

  const { data: articles, isLoading } = useCollection<KnowledgeBaseArticle>(articlesQuery);
  
  const handleEditClick = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (articleId: string) => {
    setArticleToDelete(articleId);
  };
  
  const handleConfirmDelete = () => {
    if (firestore && articleToDelete && sortedArticles) {
      deleteKnowledgeBaseArticle(firestore, articleToDelete, sortedArticles);
      toast({
        title: "تم حذف المعلومة",
        description: "تم حذف المعلومة بنجاح.",
      });
      setArticleToDelete(null);
    }
  };
  
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !selectedArticle) return;

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    
    if (!title || !content) {
        toast({ title: "خطأ", description: "العنوان والمحتوى مطلوبان.", variant: "destructive" });
        return;
    }
    
    updateKnowledgeBaseArticle(firestore, selectedArticle.id, { 
      title, 
      content,
      category: selectedArticle.category,
      tags: selectedArticle.tags,
    });
    toast({ title: "تم تحديث المعلومة", description: `تم تحديث "${title}".` });
    
    setEditDialogOpen(false);
    setSelectedArticle(null);
  };

  const handleMove = (articleId: string, direction: 'left' | 'right') => {
    if (firestore && sortedArticles) {
       moveKnowledgeBaseArticle(firestore, sortedArticles, articleId, direction);
    }
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="flex space-x-4 rtl:space-x-reverse">
        <Skeleton className="h-48 w-1/3" />
        <Skeleton className="h-48 w-1/3" />
        <Skeleton className="h-48 w-1/3" />
      </div>
    );
  }
  
  const sortedArticles = articles 
    ? [...articles].sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity))
    : [];

  return (
    <>
        <Carousel opts={{ align: 'start', direction: 'rtl' }} className="w-full">
        <CarouselContent>
            {sortedArticles?.map((article, idx) => (
            <CarouselItem key={article.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                <KnowledgeBaseCard 
                    article={article} 
                    onEdit={handleEditClick} 
                    onDelete={handleDeleteClick}
                    onMove={handleMove}
                    isFirst={idx === 0}
                    isLast={idx === sortedArticles.length - 1}
                    className={cn(cardColors[idx % cardColors.length])}
                />
                </div>
            </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
        </Carousel>
        
        <AlertDialog open={!!articleToDelete} onOpenChange={(open) => !open && setArticleToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف المعلومة بشكل دائم.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
            <form onSubmit={handleFormSubmit}>
                <DialogHeader>
                <DialogTitle>تعديل المعلومة</DialogTitle>
                <DialogDescription>
                    قم بتحديث تفاصيل المعلومة أدناه.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">العنوان</Label>
                    <Input id="title" name="title" defaultValue={selectedArticle?.title} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="content" className="text-right pt-2">المحتوى</Label>
                    <Textarea id="content" name="content" defaultValue={selectedArticle?.content} className="col-span-3" required/>
                </div>
                </div>
                <DialogFooter>
                <Button type="submit">حفظ التغييرات</Button>
                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
    </>
  );
}
