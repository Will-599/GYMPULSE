import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle } from 'lucide-react';

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    // Prevent multiple initializations in React 18 strict mode
    if (scannerRef.current) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    let stopped = false;

    function success(decodedText: string) {
      if (!stopped) {
        stopped = true;
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(err => console.error("Failed to stop scanner", err));
        }
        onScanSuccess(decodedText);
      }
    }

    function error(err: string) {
      if (onScanError) {
        onScanError(err);
      }
    }

    // Try to auto-start the camera
    html5QrCode.start(
      { facingMode: "environment" },
      { fps, qrbox: { width: qrbox, height: qrbox } },
      success,
      error
    ).then(() => {
      setIsStarting(false);
    }).catch(err => {
      console.error("Error starting camera:", err);
      setIsStarting(false);
      setPermissionError("Não foi possível acessar a câmera do dispositivo. Verifique as permissões do seu navegador.");
    });

    // Cleanup on unmount
    return () => {
      stopped = true;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          }).catch(error => {
            console.error("Failed to stop html5Qrcode.", error);
            scannerRef.current = null;
          });
        } else {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      }
    };
  }, [onScanSuccess, onScanError, fps, qrbox]);

  return (
    <div className="relative w-full bg-brand-black rounded-xl overflow-hidden border border-brand-border min-h-[300px] flex items-center justify-center">
      {isStarting && !permissionError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-dark/80 z-10 w-full h-full">
          <Camera className="w-10 h-10 text-brand-green mb-4 animate-pulse" />
          <p className="text-brand-text text-sm font-medium">Iniciando câmera...</p>
        </div>
      )}
      
      {permissionError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-dark/90 z-20 w-full h-full p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-brand-text font-medium mb-2">Acesso Negado</p>
          <p className="text-brand-muted text-sm">{permissionError}</p>
        </div>
      )}

      <div id="qr-reader" className="w-full h-full" />
    </div>
  );
}
