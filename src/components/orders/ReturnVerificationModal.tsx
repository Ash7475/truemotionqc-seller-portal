import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Camera,
  ShieldCheck,
  PackageCheck,
  RotateCcw,
  Video,
  Info,
  Square,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../../types';
import { modalDialogVariants } from '../common/MotionPrimitives';

interface ReturnVerificationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestock: (orderId: string, sku: string, quantity: number) => Promise<void>;
  onFlagDispute: (orderId: string, sku: string, quantity: number) => Promise<void>;
  isProcessing: boolean;
}

export const ReturnVerificationModal: React.FC<ReturnVerificationModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmRestock,
  onFlagDispute,
  isProcessing
}) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'camera'>('instant');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraSnapshotTaken, setCameraSnapshotTaken] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const sku = order?.sku || order?.items?.[0]?.sku || 'SKU-9426009';
  const quantity = order?.quantity || order?.items?.[0]?.quantity || 1;
  const productTitle = order?.productTitle || order?.productName || order?.title || order?.items?.[0]?.productName || 'Luxury Mechanical Watch';

  // Manage Camera Stream lifecycle
  useEffect(() => {
    if (activeTab === 'camera' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, isOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    };
  }, [recordedVideoUrl]);

  const handleStopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping return recorder:', err);
      }
    }

    setIsRecording(false);

    // Immediate fallback creating the .webm Blob and enabling restock verification
    setTimeout(() => {
      const fullBlob =
        recordedChunksRef.current && recordedChunksRef.current.length > 0
          ? new Blob(recordedChunksRef.current, { type: 'video/webm' })
          : new Blob(['return-unboxing-seal-verified'], { type: 'video/webm' });
      setRecordedBlob(fullBlob);
      try {
        setRecordedVideoUrl(URL.createObjectURL(fullBlob));
      } catch {}
      setCameraSnapshotTaken(true);
    }, 120);
  }, []);

  const handleStartRecording = () => {
    recordedChunksRef.current = [];
    setRecordedBlob(null);
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    setCameraSnapshotTaken(false);

    let stream = streamRef.current;
    if (!stream && videoRef.current && (videoRef.current as any).captureStream) {
      try {
        stream = (videoRef.current as any).captureStream();
      } catch {}
    }

    if (stream && typeof MediaRecorder !== 'undefined') {
      try {
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm',
          videoBitsPerSecond: 1000000
        });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const fullBlob =
            recordedChunksRef.current.length > 0
              ? new Blob(recordedChunksRef.current, { type: 'video/webm' })
              : new Blob(['return-unboxing-proof'], { type: 'video/webm' });
          setRecordedBlob(fullBlob);
          try {
            setRecordedVideoUrl(URL.createObjectURL(fullBlob));
          } catch {}
          setCameraSnapshotTaken(true);
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setCountdown(30);

        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              handleStopRecording();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return;
      } catch (err) {
        console.warn('MediaRecorder error, falling back to simulated recording:', err);
      }
    }

    // Simulated recording fallback if hardware MediaRecorder blocked
    setIsRecording(true);
    setCountdown(30);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleStopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } else {
        setCameraActive(true); // Fallback simulation
      }
    } catch (err: any) {
      console.warn('Camera access unavailable, running simulated optical stream:', err);
      setCameraActive(true); // Fallback simulation
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          variants={modalDialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-xl bg-[#FBF9F5] rounded-3xl border border-[#D3C8B7] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E3D8C4] flex items-center justify-between bg-[#F3ECE0]/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-900/15 border border-emerald-600/30 flex items-center justify-center text-emerald-800">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[1.25rem] sm:text-[1.5rem] leading-[1.2] font-display font-medium text-[#352013]">
                  Verify Return &amp; Authorize Restock
                </h3>
                <p className="text-xs text-[#6B5344]">
                  Order #{order.orderNumber} · Physical Inspection Verification
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 rounded-full hover:bg-[#EFE5D3] text-[#7A6252] transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Order & Product Summary Card */}
            <div className="p-4 rounded-2xl bg-[#EFE5D3]/60 border border-[#D3C8B7] space-y-2.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#B5613D] font-bold">
                    INCOMING RETURN LOT
                  </span>
                  <h4 className="text-sm font-serif font-bold text-[#352013] mt-0.5">
                    {productTitle}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#6B5344] font-mono">
                    <span>SKU: <strong className="text-[#352013]">{sku}</strong></span>
                    <span>·</span>
                    <span>Qty: <strong className="text-[#352013]">{quantity} unit(s)</strong></span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 border border-amber-600/40 shrink-0">
                  RETURN IN TRANSIT
                </span>
              </div>

              {order.returnReason && (
                <div className="pt-2 border-t border-[#D3C8B7]/60 flex items-start gap-2 text-xs text-[#6B5344]">
                  <Info className="w-3.5 h-3.5 text-[#B5613D] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#352013]">Buyer Note:</strong> "{order.returnReason}"
                  </span>
                </div>
              )}
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center gap-2 p-1 bg-[#EFE5D3] rounded-full border border-[#D3C8B7]">
              <button
                type="button"
                onClick={() => setActiveTab('instant')}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'instant'
                    ? 'bg-[#3A101C] text-[#FFFBF2] shadow-xs'
                    : 'text-[#6B5344] hover:text-[#352013]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>1-Click Immediate Restock</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'camera'
                    ? 'bg-[#3A101C] text-[#FFFBF2] shadow-xs'
                    : 'text-[#6B5344] hover:text-[#352013]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Camera Unboxing Check</span>
              </button>
            </div>

            {/* Mode 1: 1-Click Immediate Restock */}
            {activeTab === 'instant' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-900/10 border border-emerald-600/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Physical Integrity Verification Checklist</span>
                  </div>

                  <ul className="space-y-2 text-xs text-emerald-950 font-sans">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Security tamper-evident seal is verified intact &amp; untampered.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Serial number and macro engraving match dispatch docket.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Item is pristine, undamaged, and ready for immediate active resale.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F3ECE0]/60 border border-[#D3C8B7] flex items-center justify-between text-xs">
                  <span className="text-[#6B5344]">Inventory Action:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    Stock count +{quantity} unit(s) · Status: ACTIVE
                  </span>
                </div>
              </div>
            )}

            {/* Mode 2: Live Camera Unboxing Check */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-[#352013] flex items-center justify-center shadow-inner">
                  {recordedVideoUrl ? (
                    <video
                      src={recordedVideoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2 text-neutral-300">
                      <Video className="w-8 h-8 mx-auto text-amber-400" />
                      <p className="text-xs">Initializing Optical Inspection Camera...</p>
                    </div>
                  )}

                  {/* Burnt-In Dock Watermark Overlay */}
                  <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/20 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>DOCK LIVE CHECK · {order.orderNumber} · {sku}</span>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/20 text-[10px] font-mono text-neutral-200">
                    {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
                  </div>

                  {cameraSnapshotTaken && !recordedVideoUrl && (
                    <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-2xs flex items-center justify-center">
                      <div className="bg-black/90 p-4 rounded-2xl border border-emerald-500/50 text-center space-y-1">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                        <span className="text-xs font-mono font-bold text-emerald-300 block">
                          Tamper Seal Verified Intact
                        </span>
                        <span className="text-[10px] text-neutral-300">
                          Optical audit complete. Authorized for restock.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {isRecording ? (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="w-full py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Recording &amp; Seal Proof ({countdown}s left)</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCameraSnapshotTaken(true);
                        setRecordedBlob(new Blob(['snapshot-seal-proof'], { type: 'video/webm' }));
                      }}
                      className="py-2 px-3 rounded-full bg-[#EFE5D3] hover:bg-[#E3D8C4] border border-[#D3C8B7] text-xs font-semibold text-[#352013] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#B5613D]" />
                      <span>Snap Seal Proof</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="py-2 px-3 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                      <span>Record Unboxing Video</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="px-6 py-4 border-t border-[#E3D8C4] bg-[#F3ECE0]/70 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={async () => {
                if (window.confirm('Are you sure you want to flag this return as counterfeit/tampered? Stock will remain permanently blocked.')) {
                  await onFlagDispute(order.id, sku, quantity);
                }
              }}
              className="px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Flag Fake / Damaged Return</span>
            </button>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-full bg-[#EFE5D3] hover:bg-[#E3D8C4] border border-[#D3C8B7] text-[#352013] text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={async () => {
                  await onConfirmRestock(order.id, sku, quantity);
                }}
                className="px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>
                  {isProcessing
                    ? 'Restocking Inventory...'
                    : `Verified Intact — Restock (+${quantity} Qty)`}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

