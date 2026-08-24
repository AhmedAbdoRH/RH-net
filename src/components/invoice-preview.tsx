"use client";

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Invoice } from "@/types/invoice";
import { Button } from "./ui/button";
import { ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvoicePreviewProps {
  invoice: Invoice;
  onPrint: () => void;
}

export default function InvoicePreview({ invoice, onPrint }: InvoicePreviewProps) {
  const fromText = "للحلول الرقمية RHM";
  const { toast } = useToast();

  const total = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * (Number(item.rate) || 0)), 0);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Dark Professional Background - Hidden on Print */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-700 print:bg-white print:p-0 print:border-0 print:shadow-none">
        {/* Invoice Card */}
        <Card id="invoice-preview" className="bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border-0 overflow-hidden print:shadow-none print:rounded-none print:border print:border-gray-300">
          {/* Header with Logo */}
          <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Logo with Dark Background */}
              <div className="flex-shrink-0 bg-black rounded-xl p-3 shadow-lg border-2 border-gray-600">
                <img
                  src={invoice.logoUrl || "/rh/RH-sm.png"}
                  alt="RHM Logo"
                  width={90}
                  height={45}
                  className="object-contain"
                />
              </div>
              
              {/* Invoice Title */}
              <div className="text-center sm:text-right">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 font-headline">فاتورة</h1>
                <p className="text-gray-500 mt-1 text-sm">#{invoice.invoiceNumber}</p>
              </div>
            </div>
          </CardHeader>

          {/* Main Content */}
          <CardContent className="p-6 sm:p-8">
            {/* From/To Section */}
            <div className="grid grid-cols-2 gap-6 sm:gap-8 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-gray-600 text-sm uppercase tracking-wide">من:</h3>
                <p className="text-gray-800 font-medium">{fromText}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-gray-600 text-sm uppercase tracking-wide">إلى:</h3>
                <p className="text-gray-800 font-medium">{invoice.to}</p>
              </div>
            </div>

            {/* Date and Subscription */}
            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">تاريخ الاستحقاق:</span>
                <span className="font-semibold text-gray-800">{invoice.dueDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">نوع الاشتراك:</span>
                <span className="font-semibold text-gray-800">
                  {invoice.subscriptionType === 'monthly' ? 'شهري' : 'سنوي'}
                </span>
              </div>
            </div>

            {/* Services Table */}
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="w-[80%] text-right text-gray-600 font-semibold">الخدمة</TableHead>
                    <TableHead className="text-left text-gray-600 font-semibold">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-gray-100 last:border-0">
                      <TableCell className="font-medium text-gray-800 py-4 text-right">{item.description}</TableCell>
                      <TableCell className="text-left font-semibold text-gray-800 py-4">
                        {item.quantity * (Number(item.rate) || 0)} ج.م
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoice.lineItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-400 py-8">لا توجد بنود حالياً</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* Footer */}
          <CardFooter className="p-6 sm:p-8 bg-gray-50 border-t border-gray-100">
            {/* Total */}
            <div className="w-full mb-6">
              <div className="flex justify-between items-center border-t-2 border-gray-200 pt-4">
                <span className="text-lg font-semibold text-gray-700">الإجمالي</span>
                <span className="text-2xl font-bold text-gray-900">
                  {total.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ج.م
                </span>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="text-center text-gray-500 text-sm mb-4">
              ممتنين لتعاوننا معاً
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center items-center gap-3 no-print">
              <Button onClick={onPrint} className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2">
                <ClipboardCopy className="ml-2 h-4 w-4" />
                طباعة الفاتورة
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
