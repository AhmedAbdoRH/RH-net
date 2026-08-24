"use client";

import type { Invoice, LineItem } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface InvoiceFormProps {
  invoice: Invoice;
  onUpdate: (newInvoice: Partial<Invoice>) => void;
  onLineItemUpdate: (index: number, updatedItem: LineItem) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (index: number) => void;
}

const serviceOptions = [
  "تصميم شعار",
  "إنشاء موقع تعريفي",
  "إدارة حسابات التواصل الاجتماعي",
  "حملة إعلانية",
  "استشارة تسويقية"
];

const clientOptions = [
  "شركة أ",
  "مؤسسة ب",
  "مشروع ج"
];

const invoiceNumberOptions = [
  "INV-002",
  "INV-003",
  "INV-004",
];


export default function InvoiceForm({
  invoice,
  onUpdate,
  onLineItemUpdate,
  onAddLineItem,
  onRemoveLineItem,
}: InvoiceFormProps) {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdate({ [e.target.name]: e.target.value });
  };

  const handleSubscriptionChange = (value: 'monthly' | 'yearly') => {
    onUpdate({ subscriptionType: value });
  };
  
  const handleLineItemChange = (
    index: number,
    field: keyof Omit<LineItem, 'quantity'>,
    value: string | number
  ) => {
    const item = invoice.lineItems[index];
    const updatedItem: LineItem = { ...item, [field]: value, quantity: 1 };
    onLineItemUpdate(index, updatedItem);
  };

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>بنود الفاتورة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.lineItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 md:col-span-8">
                <Label htmlFor={`description-${index}`} className="sr-only">الوصف</Label>
                <div className="flex gap-2">
                  <Input
                    id={`description-${index}`}
                    placeholder="وصف الخدمة"
                    value={item.description}
                    onChange={(e) =>
                      handleLineItemChange(index, "description", e.target.value)
                    }
                    list={`service-options-${index}`}
                  />
                  <datalist id={`service-options-${index}`}>
                    {serviceOptions.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
              </div>
              <div className="col-span-10 md:col-span-3">
                 <Label htmlFor={`rate-${index}`} className="sr-only">السعر</Label>
                <Input
                  id={`rate-${index}`}
                  type="number"
                  placeholder="السعر"
                  value={item.rate}
                  onChange={(e) =>
                    handleLineItemChange(index, "rate", e.target.value)
                  }
                />
              </div>
              <div className="col-span-2 md:col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveLineItem(index)}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
           <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onAddLineItem}>
                <PlusCircle className="ml-2 h-4 w-4" />
                أضف بندًا
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الفاتورة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">رقم الفاتورة</Label>
                <Input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  value={invoice.invoiceNumber}
                  onChange={handleInputChange}
                  list="invoice-number-options"
                />
                <datalist id="invoice-number-options">
                    {invoiceNumberOptions.map(opt => <option key={opt} value={opt} />)}
                </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={invoice.dueDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
           <div className="space-y-2">
            <Label>نوع الاشتراك</Label>
            <RadioGroup
              value={invoice.subscriptionType}
              onValueChange={handleSubscriptionChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">شهري</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="yearly" id="yearly" />
                <Label htmlFor="yearly">سنوي</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">إلى</Label>
            <Textarea
              id="to"
              name="to"
              value={invoice.to}
              onChange={handleInputChange}
              rows={1}
              placeholder="اسم العميل أو الشركة"
            />
             <datalist id="client-options">
                {clientOptions.map(opt => <option key={opt} value={opt} />)}
            </datalist>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
