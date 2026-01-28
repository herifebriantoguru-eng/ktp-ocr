
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  onActiveChange: (active: boolean) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onActiveChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (isStarted && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error("Autoplay failed:", err);
      });
    }
  }, [isStarted, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false
      });
      
      setStream(mediaStream);
      setIsStarted(true);
      onActiveChange(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Gagal mengakses kamera. Pastikan izin diberikan.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStarted(false);
      onActiveChange(false);
    }
  }, [stream, onActiveChange]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if ('vibrate' in navigator) navigator.vibrate(50);
        
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {!isStarted ? (
        <button
          onClick={startCamera}
          className="w-full max-w-xs flex items-center justify-center gap-3 px-8 py-5 bg-red-600 text-white rounded-[2rem] hover:bg-red-700 active:scale-95 transition shadow-2xl shadow-red-200 font-black text-lg uppercase tracking-wider"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          AMBIL DARI KAMERA
        </button>
      ) : (
        <div className="relative w-full max-w-md bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto aspect-[3/4] object-cover"
          />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
             <div className="w-full aspect-[1.58/1] border-2 border-dashed border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>
             <p className="text-white text-[10px] font-black uppercase tracking-[0.2em] mt-6 bg-red-600/80 px-4 py-2 rounded-full backdrop-blur-sm">
               Posisikan KTP di Dalam Kotak
             </p>
          </div>
          
          <div className="absolute bottom-8 inset-x-0 flex justify-center items-center gap-10">
            <button
              onClick={stopCamera}
              className="p-4 bg-white/20 text-white rounded-full backdrop-blur-md hover:bg-white/30 transition border border-white/30"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <button
              onClick={capture}
              className="w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center active:scale-75 transition-transform p-1 border-4 border-gray-100"
            >
              <div className="w-full h-full rounded-full border-[3px] border-red-600 flex items-center justify-center">
                <div className="w-6 h-6 bg-red-600 rounded-full animate-pulse"></div>
              </div>
            </button>

            <div className="w-14"></div> 
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
