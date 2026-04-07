import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  fps?: number;
  qrbox?: number;
}

export default function QrScanner({ 
  onScanSuccess, 
  onScanError, 
  fps = 10, 
  qrbox = 250 
}: QrScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Create scanner instance
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps, qrbox, rememberLastUsedCamera: true },
      /* verbose= */ false
    );

    function success(decodedText: string) {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      onScanSuccess(decodedText);
    }

    function error(err: string) {
      if (onScanError) {
        onScanError(err);
      }
    }

    scannerRef.current.render(success, error);

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [onScanSuccess, onScanError, fps, qrbox]);

  return (
    <div id="qr-reader" className="w-full bg-brand-dark rounded-xl overflow-hidden border border-brand-border" />
  );
}
