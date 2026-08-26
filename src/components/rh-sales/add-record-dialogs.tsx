'use client';

import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/features/rh-sales/firebase';
import { addCustomer, addKnowledgeBaseArticle, addSkill } from '@/features/rh-sales/data';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      {pending ? 'جاري الحفظ...' : label}
    </Button>
  );
}

export function AddCustomerDialog({ open, onOpenChange }: DialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firestore) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get('name') || '').trim();
    const phoneValues = [String(values.get('phones') || ''), String(values.get('phone') || '')]
      .join('\n')
      .split(/[\n,،]+/)
      .map((phone) => phone.trim())
      .filter(Boolean);
    if (!name) {
      toast({ title: 'الاسم مطلوب', description: 'اكتب اسم العميل أولًا.', variant: 'destructive' });
      return;
    }

    setPending(true);
    try {
      await addCustomer(firestore, {
        name,
        email: String(values.get('email') || '').trim(),
        company: String(values.get('company') || '').trim(),
        phone: phoneValues[0] || '',
        phones: phoneValues,
        website: String(values.get('website') || '').trim(),
        generalInfo: String(values.get('generalInfo') || '').trim(),
        needs: String(values.get('needs') || '').trim(),
        customerConcerns: String(values.get('customerConcerns') || '').trim(),
        bestTimeToContact: String(values.get('bestTimeToContact') || '').trim(),
      });
      toast({ title: 'تمت إضافة العميل', description: `تمت إضافة ${name} إلى قائمة العملاء.` });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('[RH-sales] add customer failed:', error);
      toast({ title: 'تعذر إضافة العميل', description: 'حدث خطأ أثناء الحفظ.', variant: 'destructive' });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة عميل جديد</DialogTitle>
          <DialogDescription>أضف بيانات العميل وملاحظات المتابعة الخاصة به.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sales-customer-name">الاسم</Label>
            <Input id="sales-customer-name" name="name" placeholder="اسم العميل" required />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sales-customer-company">الشركة أو المجال</Label>
              <Input id="sales-customer-company" name="company" placeholder="الشركة أو المجال" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sales-customer-phone">رقم الهاتف</Label>
              <Input id="sales-customer-phone" name="phone" placeholder="رقم الهاتف" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-customer-email">البريد الإلكتروني</Label>
            <Input id="sales-customer-email" name="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-customer-website">الموقع الإلكتروني</Label>
            <Input id="sales-customer-website" name="website" type="url" placeholder="https://example.com" dir="ltr" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-customer-phones">أرقام الهاتف</Label>
            <Textarea id="sales-customer-phones" name="phones" placeholder="رقم في كل سطر أو افصل بينهم بفاصلة" dir="ltr" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-customer-info">معلومات عامة</Label>
            <Textarea id="sales-customer-info" name="generalInfo" placeholder="كل معلومة في سطر مستقل" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-customer-needs">الاحتياجات</Label>
            <Textarea id="sales-customer-needs" name="needs" placeholder="احتياجات العميل" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-customer-concerns">المخاوف أو الاعتراضات</Label>
            <Textarea id="sales-customer-concerns" name="customerConcerns" placeholder="اعتراضات العميل ومخاوفه" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-customer-contact-time">أفضل وقت للتواصل</Label>
            <Input id="sales-customer-contact-time" name="bestTimeToContact" placeholder="مثال: مساءً" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <SubmitButton pending={pending} label="إضافة العميل" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddSkillDialog({ open, onOpenChange }: DialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firestore) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    const title = String(values.get('title') || '').trim();
    const description = String(values.get('description') || '').trim();
    if (!title || !description) {
      toast({ title: 'البيانات ناقصة', description: 'اكتب اسم المهارة ووصفها.', variant: 'destructive' });
      return;
    }

    setPending(true);
    try {
      await addSkill(firestore, { title, description });
      toast({ title: 'تمت إضافة المهارة', description: `تمت إضافة مهارة ${title}.` });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('[RH-sales] add skill failed:', error);
      toast({ title: 'تعذر إضافة المهارة', description: 'حدث خطأ أثناء الحفظ.', variant: 'destructive' });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة مهارة جديدة</DialogTitle>
          <DialogDescription>أضف مهارة أو نصيحة تظهر في شريط المهارات.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sales-skill-title">اسم المهارة</Label>
            <Input id="sales-skill-title" name="title" placeholder="مثال: الاستماع النشط" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-skill-description">الوصف</Label>
            <Textarea id="sales-skill-description" name="description" placeholder="وصف مختصر للمهارة" required />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <SubmitButton pending={pending} label="إضافة المهارة" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddKnowledgeBaseDialog({ open, onOpenChange }: DialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firestore) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    const title = String(values.get('title') || '').trim();
    const content = String(values.get('content') || '').trim();
    const category = String(values.get('category') || '').trim() || 'عام';
    const tags = String(values.get('tags') || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!title || !content) {
      toast({ title: 'البيانات ناقصة', description: 'اكتب عنوان الرد ومحتواه.', variant: 'destructive' });
      return;
    }

    setPending(true);
    try {
      await addKnowledgeBaseArticle(firestore, { title, content, category, tags });
      toast({ title: 'تمت إضافة الرد', description: `تمت إضافة ${title} إلى قاعدة الردود.` });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('[RH-sales] add knowledge article failed:', error);
      toast({ title: 'تعذر إضافة الرد', description: 'حدث خطأ أثناء الحفظ.', variant: 'destructive' });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة رد أو معلومة</DialogTitle>
          <DialogDescription>احفظ ردًا جاهزًا أو معلومة يمكن الرجوع إليها أثناء البيع.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sales-article-title">العنوان</Label>
            <Input id="sales-article-title" name="title" placeholder="عنوان الرد أو المعلومة" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-article-category">التصنيف</Label>
            <Input id="sales-article-category" name="category" placeholder="عام" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-article-content">المحتوى</Label>
            <Textarea id="sales-article-content" name="content" className="min-h-32" placeholder="اكتب الرد أو المعلومة بالتفصيل" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-article-tags">الوسوم</Label>
            <Input id="sales-article-tags" name="tags" placeholder="اعتراضات، سعر، متابعة" />
            <p className="text-xs text-muted-foreground">افصل بين الوسوم بفاصلة.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <SubmitButton pending={pending} label="إضافة الرد" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
