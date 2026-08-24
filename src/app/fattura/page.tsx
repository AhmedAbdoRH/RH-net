"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import InvoiceForm from "@/components/invoice-form";
import InvoicePreview from "@/components/invoice-preview";
import SavedInvoices from "@/components/saved-invoices";
import { type Invoice, type LineItem } from "@/types/invoice";
import { collection, addDoc, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

const OFFICE_LOGO_URL = "https://www.google.com/s2/favicons?domain=rhm-digital.com&sz=64";

export default function FatturaPage() {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice>({
    logoUrl: OFFICE_LOGO_URL,
    invoiceNumber: "INV-001",
    to: "",
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    subscriptionType: "monthly",
    lineItems: [{ id: 1, description: "", quantity: 1, rate: "" as any }],
  });
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const unsubscribe = onSnapshot(collection(db, "invoices"), (snapshot) => {
      const invoices: Invoice[] = [];
      snapshot.forEach((invoiceDoc) => {
        invoices.push({ id: invoiceDoc.id, ...invoiceDoc.data() } as Invoice);
      });
      setSavedInvoices(invoices);
    });

    return () => unsubscribe();
  }, []);

  const getInvoiceName = () => {
    const serviceDescription = invoice.lineItems[0]?.description || "فاتورة";
    return `${serviceDescription} (${invoice.invoiceNumber})`;
  };

  const handleSaveInvoice = async () => {
    const { id, ...invoiceData } = invoice;
    if (id) {
      await setDoc(doc(db, "invoices", id), invoiceData);
    } else {
      const docRef = await addDoc(collection(db, "invoices"), invoiceData);
      setInvoice((previous) => ({ ...previous, id: docRef.id }));
    }
  };

  const handleSaveAndPrint = async () => {
    const originalTitle = document.title;
    const invoiceName = getInvoiceName();

    document.title = invoiceName;
    await handleSaveInvoice();
    window.print();
    document.title = originalTitle;
  };

  const handleUpdate = (newInvoice: Partial<Invoice>) => {
    setInvoice((previous) => ({ ...previous, ...newInvoice }));
  };

  const handleLineItemUpdate = (index: number, updatedItem: LineItem) => {
    const newLineItems = [...invoice.lineItems];
    newLineItems[index] = updatedItem;
    handleUpdate({ lineItems: newLineItems });
  };

  const addLineItem = () => {
    handleUpdate({
      lineItems: [
        ...invoice.lineItems,
        { id: Date.now(), description: "", quantity: 1, rate: "" as any },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    handleUpdate({
      lineItems: invoice.lineItems.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="no-print">
        <SiteHeader />
      </div>
      <main className="container mx-auto px-4 py-4 lg:px-8 lg:py-6">
        <div className="mb-4 flex items-center justify-between gap-3 no-print">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة للمواقع وتطبيقات الويب
            </Link>
          </Button>
          <h1 className="text-lg font-bold">تطبيق تاجر أونلاين</h1>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 print:grid-cols-1">
          <div className="no-print flex flex-col gap-6 lg:sticky lg:top-4">
            <InvoiceForm
              invoice={invoice}
              onUpdate={handleUpdate}
              onLineItemUpdate={handleLineItemUpdate}
              onAddLineItem={addLineItem}
              onRemoveLineItem={removeLineItem}
            />
            <SavedInvoices
              invoices={savedInvoices}
              onLoad={(invoiceToLoad) => setInvoice({ ...invoiceToLoad, logoUrl: OFFICE_LOGO_URL })}
              onDelete={async (invoiceId) => {
                await deleteDoc(doc(db, "invoices", invoiceId));
              }}
            />
          </div>
          <div className="printable-area print:col-span-1 print:w-full">
            <InvoicePreview invoice={invoice} onPrint={handleSaveAndPrint} />
          </div>
        </div>
      </main>
    </div>
  );
}
