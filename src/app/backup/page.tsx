"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, AlertCircle, CheckCircle2, Loader2, Database } from "lucide-react";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDocsFromServer } from "firebase/firestore";
import { db } from "@/firebase/index";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const COLLECTIONS = [
  "domains",
  "todos",
  "faults",
  "general",
  "generalPapers",
  "users",
  "leaderboard",
  "products",
  "catalogUsers",
];

interface BackupData {
  version: string;
  timestamp: string;
  collections: Record<string, any[]>;
}

export default function BackupPage() {
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [status, setStatus] = React.useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Export all collections to JSON file
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setStatus({ type: "info", message: "جاري تصدير البيانات..." });

      const backupData: BackupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        collections: {},
      };

      // Export each collection
      for (const collectionName of COLLECTIONS) {
        try {
          const colRef = collection(db, collectionName);
          const snapshot = await getDocs(colRef);
          
          backupData.collections[collectionName] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          console.log(`Exported ${collectionName}: ${snapshot.size} documents`);
        } catch (error) {
          console.warn(`Collection ${collectionName} not found or empty`);
          backupData.collections[collectionName] = [];
        }
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `firestore_backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({
        type: "success",
        message: `تم تصدير البيانات بنجاح! (${Object.keys(backupData.collections).length} مجموعة)`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      setStatus({
        type: "error",
        message: "فشل في تصدير البيانات. تأكد من الاتصال بقاعدة البيانات.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Import data from JSON file
  const handleImport = async () => {
    if (!importFile) {
      setStatus({ type: "error", message: "اختر ملف النسخة الاحتياطية أولاً" });
      return;
    }

    try {
      setIsImporting(true);
      setStatus({ type: "info", message: "جاري استيراد البيانات..." });

      const text = await importFile.text();
      const backupData: BackupData = JSON.parse(text);

      // Validate backup file
      if (!backupData.collections || typeof backupData.collections !== "object") {
        throw new Error("ملف غير صالح: لا يحتوي على بيانات المجموعات");
      }

      let totalImported = 0;
      let totalCollections = 0;

      // Import each collection
      for (const [collectionName, documents] of Object.entries(backupData.collections)) {
        if (!Array.isArray(documents) || documents.length === 0) {
          console.log(`Skipping ${collectionName}: empty or invalid`);
          continue;
        }

        totalCollections++;
        const colRef = collection(db, collectionName);

        // Clear existing collection first
        const existingSnapshot = await getDocs(colRef);
        const deletePromises = existingSnapshot.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);

        // Import new documents
        for (const docData of documents) {
          const { id, ...data } = docData;
          if (!id) continue;

          const docRef = doc(db, collectionName, id);
          await setDoc(docRef, data);
          totalImported++;
        }

        console.log(`Imported ${collectionName}: ${documents.length} documents`);
      }

      setStatus({
        type: "success",
        message: `تم استيراد البيانات بنجاح! ${totalImported} مستند في ${totalCollections} مجموعة`,
      });

      // Clear file input
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Import failed:", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "فشل في استيراد البيانات",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".json")) {
        setStatus({ type: "error", message: "يجب أن يكون الملف بصيغة JSON" });
        return;
      }
      setImportFile(file);
      setStatus({ type: null, message: "" });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">النسخ الاحتياطي والاستعادة</h1>
        <p className="text-muted-foreground">
          تصدير واستيراد جميع بيانات العملاء من قاعدة بيانات Firebase
        </p>
      </div>

      {/* Status Alert */}
      {status.type && (
        <Alert
          className={`mb-6 ${
            status.type === "success"
              ? "border-green-500/50 bg-green-500/10"
              : status.type === "error"
              ? "border-red-500/50 bg-red-500/10"
              : "border-blue-500/50 bg-blue-500/10"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : status.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          )}
          <AlertTitle>
            {status.type === "success"
              ? "تم بنجاح"
              : status.type === "error"
              ? "خطأ"
              : "قيد التنفيذ"}
          </AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <Card className="card-base border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-500" />
              تصدير النسخة الاحتياطية
            </CardTitle>
            <CardDescription>
              تحميل جميع بيانات العملاء (المشاريع، RHM، Firefly) كملف JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>المجموعات التي سيتم تصديرها:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {COLLECTIONS.map((col) => (
                    <li key={col} className="font-mono text-xs">{col}</li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري التصدير...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    تصدير النسخة الاحتياطية
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card className="card-base border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-500" />
              استعادة النسخة الاحتياطية
            </CardTitle>
            <CardDescription>
              رفع ملف النسخة الاحتياطية واستعادة جميع البيانات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription>
                    ⚠️ سيتم حذف جميع البيانات الحالية واستبدالها بالبيانات من الملف
                  </AlertDescription>
                </Alert>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-500/10 file:text-blue-500
                  hover:file:bg-blue-500/20
                  cursor-pointer"
              />

              {importFile && (
                <div className="text-sm p-3 bg-muted rounded-md">
                  <p className="font-medium">الملف المحدد:</p>
                  <p className="font-mono text-xs mt-1">{importFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(importFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={isImporting || !importFile}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الاستيراد...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    استعادة البيانات
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Info */}
      <Card className="card-base mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            معلومات قاعدة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">المشروع</p>
              <p className="font-mono font-medium">domainview</p>
            </div>
            <div>
              <p className="text-muted-foreground">آخر تحديث</p>
              <p className="font-medium">{new Date().toLocaleDateString("ar-EG")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">عدد المجموعات</p>
              <p className="font-medium">{COLLECTIONS.length} مجموعة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
