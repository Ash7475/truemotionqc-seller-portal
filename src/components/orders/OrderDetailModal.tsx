import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Camera,
  FileVideo,
  Video,
  Truck,
  MapPin,
  Package,
  Coins,
  AlertTriangle,
  Check,
  Mail,
  User,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  getCategoryQcAngles,
  getProductAngleImage,
  getCategoryFallbackImage
} from '../../utils/qcAngles';
import { handleImageError } from '../../utils/productImages';
import { normalizeOrder } from '../../utils/supabaseNormalizer';
import { modalDialogVariants, luxuryEase } from '../common/MotionPrimitives';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onOpenPackingModal?: (order: Order) => void;
  onOpenLiveRecorder?: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onOpenPackingModal,
  onOpenLiveRecorder
}) => {
  const { products, advanceOrderStage, simulateReturn, refreshOrders, currentSeller } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const [activeAngleIndex, setActiveAngleIndex] = useState<number>(0);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
  const [pipelineLoading, setPipelineLoading] = useState<boolean>(false);
  const [pipelineFeedback, setPipelineFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setCurrentOrder(order);
    setPipelineFeedback(null);
  }, [order?.id, order?.status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setActiveAngleIndex(0);
    setActiveItemIndex(0);
  }, [order?.id]);

  if (!order) return null;
  const activeOrder = normalizeOrder(currentOrder || order);

  const handleAdvanceStage = async () => {
    if (!activeOrder) return;
    setPipelineLoading(true);
    setPipelineFeedback(null);
    try {
      const res = await advanceOrderStage(activeOrder.id);
      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setPipelineFeedback({
          type: 'success',
          message: `Order #${res.order.orderNumber || activeOrder.id} successfully advanced to stage: ${res.order.status}`
        });
        if (refreshOrders) await refreshOrders();
      } else {
        setPipelineFeedback({
          type: 'error',
          message: res.error || 'Failed to advance pipeline stage.'
        });
      }
    } catch (err: any) {
      setPipelineFeedback({
        type: 'error',
        message: err?.message || 'Error occurred while advancing stage.'
      });
    } finally {
      setPipelineLoading(false);
    }
  };

  const handleApproveAndDispatch = async () => {
    if (!activeOrder) return;
    setPipelineLoading(true);
    setPipelineFeedback(null);
    try {
      const currentNorm = String(activeOrder.status).toUpperCase();
      const targetStatus = (currentNorm === 'IN_DIRECT_TRANSIT' || currentNorm === 'SHIPPING') ? 'DELIVERED' : 'IN_DIRECT_TRANSIT';
      const res = await advanceOrderStage(activeOrder.id, targetStatus);
      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setPipelineFeedback({
          type: 'success',
          message: `Digital-QC approved. Order #${res.order.orderNumber || activeOrder.id} dispatched directly: ${targetStatus}`
        });
        if (refreshOrders) await refreshOrders();
      } else {
        setPipelineFeedback({
          type: 'error',
          message: res.error || 'Failed to approve and dispatch order.'
        });
      }
    } catch (err: any) {
      setPipelineFeedback({
        type: 'error',
        message: err?.message || 'Error occurred during dispatch.'
      });
    } finally {
      setPipelineLoading(false);
    }
  };

  const handleTriggerReturn = async () => {
    if (!activeOrder) return;
    setPipelineLoading(true);
    setPipelineFeedback(null);
    try {
      const firstItem = activeOrder.items?.[0];
      const payload = {
        id: activeOrder.id,
        sku: activeOrder.sku || firstItem?.sku || 'SKU-9426009',
        productTitle: activeOrder.productTitle || firstItem?.productName || 'Luxury Mechanical Watch',
        quantity: activeOrder.quantity || firstItem?.quantity || 1,
        amount: activeOrder.amount || activeOrder.totalAmount || 42500,
        sellerId: activeOrder.sellerId || currentSeller?.id || '',
        buyerName: activeOrder.buyerName || activeOrder.customerName || 'Verified Collector',
        returnReason: 'Buyer requested return — size/fit check'
      };
      const res = await simulateReturn(activeOrder.id, payload);
      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setPipelineFeedback({
          type: 'success',
          message: `Order #${res.order.orderNumber || activeOrder.id} moved into Returns & Restock (RETURN_IN_TRANSIT).`
        });
        if (refreshOrders) await refreshOrders();
      } else {
        setPipelineFeedback({
          type: 'error',
          message: res.error || 'Failed to trigger buyer return.'
        });
      }
    } catch (err: any) {
      setPipelineFeedback({
        type: 'error',
        message: err?.message || 'Error occurred while triggering return.'
      });
    } finally {
      setPipelineLoading(false);
    }
  };

  const activeItem = activeOrder.items[activeItemIndex] || activeOrder.items[0];
  const matchedProduct = products.find(
    (p) =>
      (activeItem && (p.id === activeItem.productId || p.sku === activeItem.sku || p.name === activeItem.productName))
  );

  const fallbackImage =
    activeItem?.image ||
    matchedProduct?.images[0] ||
    getCategoryFallbackImage(matchedProduct?.category);

  const categoryAngles = getCategoryQcAngles(matchedProduct?.category);
  const angleOptions = categoryAngles.map((slot, idx) => ({
    key: slot.id,
    label: `${idx + 1}. ${slot.label}`,
    tag: `0${idx + 1} · ${slot.label.toUpperCase()}`,
    image: matchedProduct
      ? getProductAngleImage(matchedProduct, slot.id, idx)
      : fallbackImage
  }));

  const currentAngle = angleOptions[activeAngleIndex] || angleOptions[0];

  const grossOrderValue = activeOrder.subtotal || activeItem?.price * (activeItem?.quantity || 1) || activeOrder.totalAmount;
  const escrowFee = grossOrderValue * 0.05;
  const netSellerSettlement = grossOrderValue - escrowFee;

  const getStatusLabel = (status: Order['status']) => {
    const norm = String(status).toUpperCase();
    switch (norm) {
      case 'DELIVERED':
        return {
          text: 'AUTHENTICATED & DELIVERED',
          classes: 'bg-[#A9B89C]/35 text-[#384D35] border-[#96A685]'
        };
      case 'SHIPPING':
      case 'IN_DIRECT_TRANSIT':
        return {
          text: 'IN DIRECT TRANSIT',
          classes: 'bg-[#A9B89C]/35 text-[#384D35] border-[#96A685]'
        };
      case 'PACKING':
      case 'READY_TO_SHIP':
        return {
          text: 'READY TO SHIP',
          classes: 'bg-[#EFE5D3] text-[#B5613D] border-[#D3C8B7]'
        };
      case 'READY_FOR_PICKUP':
        return {
          text: 'READY FOR PICKUP',
          classes: 'bg-emerald-900/15 text-emerald-800 border-emerald-300'
        };
      case 'RETURN_IN_TRANSIT':
        return {
          text: 'RETURN IN TRANSIT',
          classes: 'bg-amber-100 text-amber-900 border-amber-300'
        };
      case 'RETURNED_RESTOCKED':
        return {
          text: 'RETURNED & RESTOCKED',
          classes: 'bg-emerald-100 text-emerald-900 border-emerald-300'
        };
      case 'RETURN_DISPUTED':
        return {
          text: 'RETURN DISPUTED',
          classes: 'bg-rose-100 text-rose-900 border-rose-300'
        };
      case 'DISPUTED':
        return {
          text: 'DISPUTED',
          classes: 'bg-rose-50 text-rose-800 border-rose-200'
        };
      case 'RETURNED':
        return {
          text: 'RETURNED',
          classes: 'bg-[#E3D8C4] text-[#4A2E1B] border-[#D3C8B7]'
        };
      default:
        return {
          text: String(status).toUpperCase(),
          classes: 'bg-[#EFE5D3] text-[#352013] border-[#D3C8B7]'
        };
    }
  };

  const statusBadge = getStatusLabel(activeOrder.status);

  const hasPackingProof = Boolean(activeOrder.packingEvidence || activeOrder.packingVideoUrl);
  const isDispatched =
    activeOrder.status === 'shipping' ||
    activeOrder.status === 'IN_DIRECT_TRANSIT' ||
    activeOrder.status === 'delivered' ||
    activeOrder.status === 'disputed' ||
    Boolean(activeOrder.trackingNumber);
  const isDeliveredAndReleased =
    activeOrder.status === 'delivered' && activeOrder.escrowStatus === 'released';

  const lifecycleSteps = [
    { num: '01', label: 'Order Placed', completed: true },
    { num: '02', label: 'Buyer Escrow Funded', completed: true },
    { num: '03', label: 'Packing Proof Certified', completed: hasPackingProof },
    { num: '04', label: 'Courier Dispatched', completed: isDispatched },
    { num: '05', label: 'Delivered & Escrow Released', completed: isDeliveredAndReleased }
  ];

  const packingVideoUrl = activeOrder.packingVideoUrl || matchedProduct?.packingVideo?.videoUrl;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-[#352013]/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: luxuryEase }}
          onClick={onClose}
          className="fixed inset-0 cursor-pointer"
        />

        <motion.div
          variants={modalDialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F3ECE0] border border-[#D3C8B7] rounded-[1.75rem] shadow-2xl text-[#352013] my-auto"
        >
          {/* 1. Top Order & Escrow Header */}
          <div className="sticky top-0 z-20 bg-[#FBF9F5] border-b border-[#D3C8B7] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <span className="font-mono text-sm font-bold text-[#352013] tracking-tight">
                {activeOrder.orderNumber}
              </span>
              <span className="text-[#D3C8B7]" aria-hidden="true">&middot;</span>
              <span className="font-mono text-xs text-[#6B5344] tabular-nums">
                {new Date(activeOrder.orderDate).toLocaleDateString()}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border whitespace-nowrap ${statusBadge.classes}`}
              >
                {statusBadge.text}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border whitespace-nowrap ${
                  activeOrder.escrowStatus === 'released'
                    ? 'bg-[#A9B89C]/35 text-[#384D35] border-[#96A685]'
                    : activeOrder.escrowStatus === 'refunded'
                    ? 'bg-[#E3D8C4] text-[#4A2E1B] border-[#D3C8B7]'
                    : 'bg-[#EFE5D3] text-[#B5613D] border-[#D3C8B7]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {activeOrder.escrowStatus === 'released'
                    ? 'Escrow: Released to Seller'
                    : activeOrder.escrowStatus === 'refunded'
                    ? 'Escrow: Refunded'
                    : 'Held in Escrow'}
                </span>
              </span>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close Order Details"
                className="p-1.5 rounded-full text-[#6B5344] hover:text-[#352013] hover:bg-[#EFE5D3] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* ZERO-HUB DIGITAL-QC & DIRECT EXPRESS DISPATCH ACTION TOOLBAR */}
            <div className="rounded-2xl bg-[#EFE5D3] border-2 border-[#D3C8B7] p-4 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#162E25] text-[#FFFBF2] text-[10px] font-mono font-bold uppercase tracking-[0.14em]">
                      <SlidersHorizontal className="w-3 h-3 text-emerald-300" />
                      <span>ZERO-HUB DIGITAL-QC PIPELINE</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#6B5344]">
                      Stage: <strong className="text-[#352013] uppercase">{activeOrder.status}</strong>
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#352013]">
                    Digital-QC &amp; Direct Express Dispatch
                  </h3>
                  <p className="text-xs text-[#6B5344]">
                    6-Angle Macro &amp; Live Packing Proof Verified · Direct 2–4 Day Courier Routing
                  </p>
                </div>

                {/* 3 Wired Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={pipelineLoading}
                    onClick={handleAdvanceStage}
                    className="px-3.5 py-2 rounded-full bg-[#162E25] hover:bg-[#1E3F33] text-[#FFFBF2] text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    title="Advance order: READY_TO_SHIP -> IN_DIRECT_TRANSIT -> DELIVERED"
                  >
                    {pipelineLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    <span>Advance Pipeline Stage &rarr;</span>
                  </button>

                  <button
                    type="button"
                    disabled={pipelineLoading}
                    onClick={handleApproveAndDispatch}
                    className="px-3.5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-[#FFFBF2] text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    title="Approve Digital-QC and dispatch directly to buyer"
                  >
                    {pipelineLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>Approve Digital-QC &amp; Dispatch</span>
                  </button>

                  <button
                    type="button"
                    disabled={pipelineLoading}
                    onClick={handleTriggerReturn}
                    className="px-3.5 py-2 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    title="Move order into Returns & Restock (RETURN_IN_TRANSIT) for inspection"
                  >
                    {pipelineLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    )}
                    <span>Trigger Buyer Return</span>
                  </button>
                </div>
              </div>

              {/* Feedback toast/banner if error or success */}
              {pipelineFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                    pipelineFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                      : 'bg-rose-50 text-rose-950 border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {pipelineFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-mono">{pipelineFeedback.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPipelineFeedback(null)}
                    className="text-[11px] font-semibold underline ml-3 cursor-pointer opacity-70 hover:opacity-100"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {activeOrder.items.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B5344]">
                  Order Items ({activeOrder.items.length}):
                </span>
                {activeOrder.items.map((item, idx) => (
                  <button
                    key={`${item.productId}-${idx}`}
                    type="button"
                    onClick={() => {
                      setActiveItemIndex(idx);
                      setActiveAngleIndex(0);
                    }}
                    className={`px-3.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      activeItemIndex === idx
                        ? 'bg-[#384D35] text-[#FFFBF2] border-[#384D35]'
                        : 'bg-[#FBF9F5] text-[#6B5344] border-[#D3C8B7] hover:border-[#B5613D]'
                    }`}
                  >
                    {item.productName} ({item.quantity})
                  </button>
                ))}
              </div>
            )}

            {/* 2. Product Specifications & 6-Angle Lot Gallery */}
            <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#E3D8C4] pb-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#6B5344]">
                    <span className="font-semibold text-[#B5613D]">{activeItem?.sku}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{matchedProduct?.category || 'Luxury Lot'}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="tabular-nums">Qty: {activeItem?.quantity || 1}</span>
                  </div>
                  <h2 className="text-[1.75rem] leading-[1.2] font-display font-medium text-[#352013]">
                    {activeItem?.productName || matchedProduct?.name || 'Curated Atelier Piece'}
                  </h2>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-emerald-800 border border-emerald-200 shadow-sm backdrop-blur-md whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>QC Verified</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Interactive 6-Angle Photo Viewer */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#6B5344]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#B5613D]">
                      <Camera className="w-3.5 h-3.5 text-[#B5613D]" />
                      <span>6-Angle Authentication Lot Gallery</span>
                    </span>
                    <span>{currentAngle.tag}</span>
                  </div>

                  <div className="aspect-[16/10] w-full rounded-xl bg-[#EFE5D3] border border-[#D3C8B7] overflow-hidden relative group">
                    <img
                      src={currentAngle.image}
                      alt={`${activeItem?.productName || 'Product'} - ${currentAngle.label}`}
                      onError={handleImageError}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#352013]/45 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-emerald-800 border border-emerald-200 shadow-sm backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>QC Verified</span>
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FBF9F5]/95 text-[#352013] border border-[#D3C8B7]">
                      0{activeAngleIndex + 1} / 06
                    </div>
                  </div>

                  {/* Clickable 6-Angle Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {angleOptions.map((angle, idx) => (
                      <button
                        key={angle.key}
                        type="button"
                        title={angle.label}
                        onClick={() => setActiveAngleIndex(idx)}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-mono text-left transition-all cursor-pointer border whitespace-nowrap truncate ${
                          activeAngleIndex === idx
                            ? 'bg-[#384D35] text-[#FFFBF2] border-[#384D35] font-semibold shadow-2xs'
                            : 'bg-[#F3ECE0]/60 hover:bg-[#EFE5D3] text-[#4A2E1B] border-[#D3C8B7]'
                        }`}
                      >
                        {angle.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Provenance & Specs Summary */}
                <div className="lg:col-span-5 space-y-3.5">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#6B5344] font-semibold block mb-1.5">
                      Provenance &amp; Condition Summary
                    </span>
                    <p className="text-xs text-[#4A2E1B] leading-relaxed bg-[#F3ECE0]/60 border border-[#E3D8C4] rounded-xl p-3">
                      {matchedProduct?.description ||
                        'Authenticated luxury consignment lot cleared through TrueMotion QC optical & physical inspection prior to vault escrow release.'}
                    </p>
                  </div>

                  <div className="bg-[#F3ECE0]/60 border border-[#E3D8C4] rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-[#E3D8C4] pb-1.5">
                      <span className="text-[10px] font-mono uppercase text-[#7A6252]">Serial / Reference</span>
                      <span className="font-mono font-semibold text-[#352013]">
                        {activeItem?.sku}
                      </span>
                    </div>

                    {matchedProduct?.specs?.condition && (
                      <div className="flex items-center justify-between gap-2 border-b border-[#E3D8C4] pb-1.5">
                        <span className="text-[10px] font-mono uppercase text-[#7A6252]">Condition Grade</span>
                        <span className="font-medium text-[#352013] text-right">
                          {matchedProduct.specs.condition}
                        </span>
                      </div>
                    )}

                    {matchedProduct?.specs &&
                      Object.entries(matchedProduct.specs)
                        .filter(([k, val]) => val && k !== 'condition' && k !== 'generalNotes')
                        .slice(0, 4)
                        .map(([key, val]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-2 border-b border-[#E3D8C4] pb-1.5 last:border-b-0 last:pb-0"
                          >
                            <span className="text-[10px] font-mono uppercase text-[#7A6252] capitalize">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </span>
                            <span className="font-medium text-[#352013] text-right truncate max-w-[180px]">
                              {String(val)}
                            </span>
                          </div>
                        ))}
                  </div>

                  {matchedProduct?.reviewerNotes && (
                    <div className="p-3 rounded-xl bg-[#A9B89C]/25 border border-[#96A685] text-[11px] text-[#352013] space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#384D35] font-bold block">
                        TMQC Inspection Note
                      </span>
                      <p className="leading-relaxed">{matchedProduct.reviewerNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Tamper-Evident Packing Proof & Courier Telemetry */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#B5613D] font-bold">
                    TAMPER-EVIDENT PACKING PROOF
                  </span>
                  {activeOrder.packingEvidence ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#384D35]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#384D35]" />
                      <span>Certified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#B5613D]">
                      <Clock className="w-3.5 h-3.5 text-[#B5613D]" />
                      <span>Pending Capture</span>
                    </span>
                  )}
                </div>

                {/* Metrics Strip */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#F3ECE0]/70 border border-[#E3D8C4] text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A6252] block">
                      Calibrated Weight
                    </span>
                    <span className="font-mono font-semibold text-[#352013] tabular-nums">
                      {activeOrder.packingEvidence?.packageWeightKg
                        ? `${activeOrder.packingEvidence.packageWeightKg}kg`
                        : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A6252] block">
                      Seal / Proof Ref
                    </span>
                    <span className="font-mono font-semibold text-[#352013] truncate block">
                      {activeOrder.packingEvidence?.referenceId || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A6252] block">
                      Verification Status
                    </span>
                    <span
                      className={`font-mono font-semibold block ${
                        activeOrder.packingEvidence ? 'text-[#384D35]' : 'text-[#B5613D]'
                      }`}
                    >
                      {activeOrder.packingEvidence ? 'Certified' : 'Required'}
                    </span>
                  </div>
                </div>

                {/* Packing Video / Evidence Preview */}
                {packingVideoUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden bg-black border border-[#D3C8B7]">
                      <video
                        controls
                        src={packingVideoUrl}
                        className="w-full max-h-56 rounded-xl bg-black object-contain mx-auto"
                      />
                      {activeOrder.packingVideoUrl && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-[#C4A46B] text-[10px] font-mono border border-[#C4A46B]/40">
                          BURNT-IN WATERMARK PROOF
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#6B5344]">
                      <span className="flex items-center gap-1.5 text-[#352013] font-medium">
                        <FileVideo className="w-3.5 h-3.5 text-[#384D35]" />
                        {activeOrder.packingVideoUrl
                          ? 'In-App Live Stream Video Proof'
                          : matchedProduct?.packingVideo?.fileName}
                      </span>
                      <span>
                        {activeOrder.packingVerifiedAt
                          ? `Archived ${new Date(activeOrder.packingVerifiedAt).toLocaleDateString()}`
                          : matchedProduct?.packingVideo?.uploadedAt
                          ? `Recorded ${new Date(matchedProduct.packingVideo.uploadedAt).toLocaleDateString()}`
                          : new Date(activeOrder.orderDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ) : activeOrder.packingEvidence ? (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#A9B89C]/25 border border-[#96A685] flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                    <img
                      src={activeOrder.packingEvidence.photos[0] || fallbackImage}
                      alt="Recorded packing seal snapshot"
                      onError={handleImageError}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-[#96A685] shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#352013]">
                          Certified Seal Snapshot &amp; Dispatch Log
                        </span>
                        <span className="text-[10px] font-mono text-[#384D35] tabular-nums">
                          {new Date(activeOrder.packingEvidence.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4A2E1B] leading-relaxed">
                        {activeOrder.packingEvidence.notes}
                      </p>
                      {activeOrder.packingEvidence.hasVideoProof && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#384D35] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-[#384D35]" />
                          Uncut video stream archived in immutable dispute vault
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-4 rounded-xl bg-[#EFE5D3] border border-[#D3C8B7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 text-xs text-[#352013]">
                      <AlertTriangle className="w-4 h-4 text-[#B5613D] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Tamper-Evident Packing Proof Required</div>
                        <p className="text-[11px] text-[#6B5344]">
                          Record scale calibration weight, tamper seal number, and packing footage before courier handoff.
                        </p>
                      </div>
                    </div>
                    {(onOpenLiveRecorder || onOpenPackingModal) && activeOrder.status === 'packing' && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenLiveRecorder) {
                            onOpenLiveRecorder(activeOrder);
                          } else if (onOpenPackingModal) {
                            onOpenPackingModal(activeOrder);
                          }
                        }}
                        className="px-4 py-2 rounded-full bg-[#3A101C] hover:bg-[#4F1627] text-[#FAF5EE] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5 text-[#C4A46B]" />
                        <span>Record Live Packing Proof</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right (lg:col-span-5): Blind Destination & Courier Logistics */}
              <div className="lg:col-span-5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#6B5344] font-semibold block">
                    BLIND ROUTING &amp; DISPATCH
                  </span>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <User className="w-4 h-4 text-[#B5613D] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#7A6252] block">
                          Buyer Identity (Blind Escrow)
                        </span>
                        <div className="font-semibold text-[#352013]">
                          Confidential Buyer · Lot Escrow #{activeOrder.orderNumber.slice(-4)}
                        </div>
                        <div className="text-[11px] text-[#6B5344] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-[#8C7362]" />
                          <span className="truncate">Shielded by TrueMotion Privacy-Masked Waybill</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-[#E3D8C4]">
                      <MapPin className="w-4 h-4 text-[#B5613D] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#7A6252] block">
                          Authorized Shipping Destination
                        </span>
                        <div className="font-semibold text-[#352013]">
                          Direct Buyer Delivery · Privacy-Masked Address
                        </div>
                        <div className="text-[#4A2E1B] leading-relaxed">
                          Direct Express to Buyer (2–4 Days) · Zero-Hub Delivery
                        </div>
                        <div className="text-[10px] font-mono text-[#384D35] mt-1">
                          Direct parcel routing under full Escrow protection · Pre-shipment digital QC approved
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F3ECE0]/70 border border-[#E3D8C4] space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase text-[#7A6252] flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-[#384D35]" />
                      <span>Courier Service</span>
                    </span>
                    <span className="font-medium text-[#352013] text-right">
                      {activeOrder.carrier || 'TrueMotion Direct Express Courier'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E3D8C4]">
                    <span className="text-[10px] font-mono uppercase text-[#7A6252]">
                      Tracking Reference
                    </span>
                    <span className="font-mono font-semibold text-[#384D35] tabular-nums">
                      {activeOrder.trackingNumber || 'Awaiting Dispatch'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Escrow & Financial Breakdown */}
            <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#6B5344] font-semibold flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#B5613D]" />
                  <span>Escrow &amp; Financial Breakdown</span>
                </span>
                <span className="text-[11px] font-mono text-[#7A6252] tabular-nums">
                  Insured Courier Fee: ₹{activeOrder.shippingFee.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                <div className="p-3 rounded-xl bg-[#F3ECE0]/70 border border-[#E3D8C4] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#7A6252] block">
                    Gross Order Value
                  </span>
                  <div className="font-mono text-lg font-bold text-[#352013] tabular-nums">
                    ₹{grossOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F3ECE0]/70 border border-[#E3D8C4] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#7A6252] block">
                    TMQC &amp; Escrow Fee (5%)
                  </span>
                  <div className="font-mono text-lg font-bold text-[#6B5344] tabular-nums">
                    -₹{escrowFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#A9B89C]/30 border border-[#96A685] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#384D35] font-bold block">
                    Net Seller Settlement
                  </span>
                  <div className="font-mono text-lg font-bold text-[#384D35] tabular-nums">
                    ₹{netSellerSettlement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F3ECE0]/70 border border-[#E3D8C4] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#7A6252] block">
                    Payout Status
                  </span>
                  <div
                    className={`font-mono text-xs font-semibold pt-1 flex items-center gap-1.5 ${
                      activeOrder.escrowStatus === 'released'
                        ? 'text-[#384D35]'
                        : activeOrder.escrowStatus === 'refunded'
                        ? 'text-[#6B5344]'
                        : 'text-[#B5613D]'
                    }`}
                  >
                    {activeOrder.escrowStatus === 'released' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#384D35] shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-[#B5613D] shrink-0" />
                    )}
                    <span>
                      {activeOrder.escrowStatus === 'released'
                        ? 'Released to Balance'
                        : activeOrder.escrowStatus === 'refunded'
                        ? 'Refunded to Buyer'
                        : 'Locked Until Delivery'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Order Lifecycle Timeline */}
            <div className="bg-[#EFE5D3]/70 border border-[#D3C8B7] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-[#4A2E1B] font-semibold">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#B5613D]" />
                  <span>Order Fulfillment Lifecycle</span>
                </span>
                <span className="text-[#384D35] tabular-nums font-bold">
                  {lifecycleSteps.filter((s) => s.completed).length} / 5 Milestones Completed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {lifecycleSteps.map((step) => (
                  <div
                    key={step.num}
                    className={`p-2.5 rounded-xl border text-xs transition-colors ${
                      step.completed
                        ? 'bg-[#FBF9F5] border-[#96A685] text-[#352013]'
                        : 'bg-[#FBF9F5]/50 border-[#D3C8B7] text-[#7A6252]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          step.completed ? 'text-[#384D35]' : 'text-[#8C7362]'
                        }`}
                      >
                        {step.num}
                      </span>
                      {step.completed ? (
                        <span className="w-4 h-4 rounded-full bg-[#A9B89C]/45 text-[#384D35] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-[#D3C8B7] bg-[#F3ECE0]" />
                      )}
                    </div>
                    <div className="font-medium text-[11px] leading-snug">{step.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
