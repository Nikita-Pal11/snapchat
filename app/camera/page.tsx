'use client';

import { Camera, MessageCircle, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

export default function Page() {
  const [capturedSnap, setCapturedSnap] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  function captureSnap() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    setCapturedSnap(canvas.toDataURL('image/jpeg', 0.9));

    streamRef.current?.getTracks().forEach(t => t.stop());
  }

  async function startCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  useEffect(() => {
    startCamera();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  return (
    <>
      {/* CAMERA VIEW */}
      {!capturedSnap && (
        <div className="fixed inset-0 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* TOP BAR */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center" onClick={()=>{router.push("/")}}>
            <X className="text-white/80" />
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md" />
          </div>

          {/* BOTTOM BAR */}
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-10">
            <MessageCircle className="text-white/70" size={28} onClick={()=>{router.push("/")}}/>

            {/* SHUTTER */}
            <button
              onClick={captureSnap}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>

            <Users className="text-white/70" size={28} onClick={()=>{router.push("/SearchPage")}}/>
          </div>

          <canvas ref={canvasRef} hidden />
        </div>
      )}

      {/* PREVIEW SCREEN */}
      {capturedSnap && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <img src={capturedSnap} className="flex-1 object-cover" />

          <div className="p-4 flex justify-between items-center">
            <button
              onClick={() => {
                setCapturedSnap(null);
                startCamera();
              }}
              className="text-white/80 text-sm"
            >
              Retake
            </button>

            <button
              onClick={() => {
                sessionStorage.setItem('snap_preview', capturedSnap);
                router.push('/selectfriends');
              }}
              className="bg-[#FFFC00] text-black px-6 py-2 rounded-full font-semibold shadow-lg"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
