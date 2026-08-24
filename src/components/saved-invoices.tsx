"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ClipboardPaste } from "lucide-react";
import { type Invoice } from "@/types/invoice";
import { ScrollArea } from "./ui/scroll-area";

interface SavedInvoicesProps {
  invoices: Invoice[];
  onLoad: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
}

export default function SavedInvoices({
  invoices,
  onLoad,
  onDelete,
}: SavedInvoicesProps) {
  if (invoices.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>الفواتير المحفوظة</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50"
              >
                <div className="text-sm">
                  <p className="font-semibold">{inv.invoiceNumber}</p>
                  <p className="text-muted-foreground">{inv.to}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onLoad(inv)}
                    aria-label="Load invoice"
                  >
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => inv.id && onDelete(inv.id)}
                    aria-label="Delete invoice"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
