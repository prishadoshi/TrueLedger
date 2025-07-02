"use client"

import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

export function RecieptScanner({ onScanComplete }) {

    const fileInputRef = useRef(null);
    const [scanReceiptLoading, setScanReceiptLoading] = useState(false);

    const scanReceiptFn = async (base64, mimeType) => {
        const res = await fetch("/api/scan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ base64, mimeType }),
        });

        if (!res.ok) throw new Error("Scan failed");
        return res.json();
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result;
                const base64 = result.split(',')[1]; // remove data:image/...;base64,
                resolve(base64);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleReceiptScan = async (file) => {
        try {
            setScanReceiptLoading(true);

            if (!file.type.startsWith("image/")) {
                toast.error("Only image files are allowed");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size should be less than 5MB");
                return;
            }

            const base64 = await fileToBase64(file);
            const result = await scanReceiptFn(base64, file.type);
            onScanComplete?.(result);
            toast.success("Receipt scanned successfully!");
        } catch (err) {
            console.error("Scan error:", err);
            toast.error("Failed to scan receipt");
        } finally {
            setScanReceiptLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <input
                type='file'
                ref={fileInputRef}
                className='hidden'
                accept='image/*'
                capture="environment"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = ""; // ensures same file can be selected again
                    if (file) handleReceiptScan(file);
                }}
            />
            <Button
                type="button"
                variant="outline"
                className="w-full h-10 bg-gradient-to-br
                    from-orange-500 via-pink-500 to-purple-500 animate-gradient 
                    hover:opacity-90 transition-opacity text-white hover:text-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanReceiptLoading}
            >
                {scanReceiptLoading ? (
                    <>
                        <Loader2 className='mr-2 animate-spin' />
                        <span>Scanning Receipt...</span>
                    </>
                ) : (
                    <>
                        <Camera className='mr-2' />
                        <span>Scan Receipt with AI</span>
                    </>
                )}
            </Button>
        </div>
    );
}
