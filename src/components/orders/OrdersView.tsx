import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Camera,
  CheckCircle2,
  X,
  FileText,
  Truck,
  MapPin,
  ShieldCheck,
  Printer,
  Download,
  Clock,
  Lock,
  Video,
  Play,
  RotateCcw,
  PackageCheck,
  AlertTriangle,
  ArrowRight,
  Check,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { OrderDetailModal } from './OrderDetailModal';
import { LivePackingVideoRecorderModal } from './LivePackingVideoRecorderModal';
import { handleImageError, FALLBACK_PRODUCT_IMAGE, getProductImage, normalizeOrder } from '../../utils/supabaseNormalizer';
import { ReturnVerificationModal } from './ReturnVerificationModal';
import { PopUpContainer, PopUpItem, luxuryEase } from '../common/MotionPrimitives';

const BLIND_HUB_NAME = 'Direct Express to Buyer (Masked Waybill)';
const BLIND_HUB_ADDRESS = 'Direct Buyer Delivery · Privacy-Masked Address';

const getOrderStatusBadge = (status: Order['status']) => {
  const norm = String(status).toUpperCase();
  switch (norm) {
    case 'PACKING':
    case 'READY_TO_SHIP':
      return {
        label: 'Ready to Ship',
        classes: 'bg-[#EFE5D3] text-[#B5613D] border border-[#D3C8B7]'
      };
    case 'READY_FOR_PICKUP':
      return {
        label: 'Ready for Pickup (Proof Sealed)',
        classes: 'bg-emerald-900/15 text-emerald-800 border border-emerald-600/30 font-semibold'
      };
    case 'SHIPPING':
    case 'IN_DIRECT_TRANSIT':
      return {
        label: 'In Direct Transit',
        classes: 'bg-[#A9B89C]/40 text-[#384D35] border border-[#96A685]'
      };
    case 'DELIVERED':
    case 'AUTHENTICATED & DELIVERED':
      return {
        label: 'Authenticated & Delivered',
        classes: 'bg-[#A9B89C]/45 text-[#384D35] border border-[#96A685]'
      };
    case 'RETURN_IN_TRANSIT':
      return {
        label: 'Return In Transit — Awaiting Seller Check',
        classes: 'bg-amber-500/20 text-amber-900 border border-amber-600/40 font-semibold'
      };
    case 'RETURNED_RESTOCKED':
      return {
        label: 'Returned & Restocked',
        classes: 'bg-emerald-900/15 text-emerald-800 border border-emerald-600/30 font-semibold'
      };
    case 'RETURN_DISPUTED':
      return {
        label: 'Return Disputed (Blocked)',
        classes: 'bg-rose-900/15 text-rose-800 border border-rose-600/30 font-semibold'
      };
    case 'DISPUTED':
      return {
        label: 'Disputed',
        classes: 'bg-[#B5613D]/15 text-[#B5613D] border border-[#B5613D]'
      };
    case 'RETURNED':
      return {
        label: 'Returned to Atelier',
        classes: 'bg-[#E3D8C4] text-[#4A2E1B] border border-[#D3C8B7]'
      };
    default:
      return {
        label: status,
        classes: 'bg-[#EFE5D3] text-[#352013] border border-[#D3C8B7]'
      };
  }
};

export const OrdersView: React.FC = () => {
  const {
    orders,
    currentSeller,
    dispatchBlindOrder,
    submitPackingEvidence,
    activeSubTab,
    simulateReturn,
    advanceOrderStage,
    processReturn,
    refreshOrders
  } = useApp();

  // Local orders state synchronized with AppContext and updated immediately on simulate / process return
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);

  React.useEffect(() => {
    setLocalOrders(orders.map(normalizeOrder));
  }, [orders]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(activeSubTab || 'all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderForEvidence, setSelectedOrderForEvidence] = useState<Order | null>(null);
  const [liveRecorderOrder, setLiveRecorderOrder] = useState<Order | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [returnToast, setReturnToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Return Verification Modal State
  const [verificationModalOrder, setVerificationModalOrder] = useState<Order | null>(null);
  const [isProcessingModal, setIsProcessingModal] = useState<boolean>(false);

  // Auto-dismiss return feedback toast after 5 seconds
  React.useEffect(() => {
    if (returnToast) {
      const timer = setTimeout(() => setReturnToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [returnToast]);

  // Blind Waybill Generator Modal State
  const [blindLabelOrder, setBlindLabelOrder] = useState<Order | null>(null);
  const [labelWaybillId, setLabelWaybillId] = useState('');
  const [labelTrackingId, setLabelTrackingId] = useState('');
  const [labelCarrier, setLabelCarrier] = useState('TrueMotion Direct Express Courier');
  const [labelDownloadedToast, setLabelDownloadedToast] = useState(false);

  // Live Package Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Packing Evidence Modal State
  const [packageWeight, setPackageWeight] = useState<number>(1.45);
  const [packingNotes, setPackingNotes] = useState('');
  const [hasVideoProof, setHasVideoProof] = useState(true);

  React.useEffect(() => {
    if (activeSubTab) setStatusFilter(activeSubTab);
  }, [activeSubTab]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedOrder(null);
        setSelectedOrderForEvidence(null);
        setBlindLabelOrder(null);
        setTrackingOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredOrders = localOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((i) => i.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.productTitle || '').toLowerCase().includes(searchTerm.toLowerCase());

    const statusUpper = String(order.status).toUpperCase();
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'packing'
        ? (statusUpper === 'PACKING' || statusUpper === 'READY_TO_SHIP' || statusUpper === 'READY_FOR_PICKUP')
        : statusFilter === 'shipping'
        ? (statusUpper === 'SHIPPING' || statusUpper === 'IN_DIRECT_TRANSIT')
        : statusFilter === 'delivered'
        ? (statusUpper === 'DELIVERED' || statusUpper === 'AUTHENTICATED & DELIVERED')
        : statusFilter === 'disputed'
        ? (statusUpper === 'DISPUTED' || statusUpper === 'RETURN_DISPUTED')
        : statusFilter === 'returns' || statusFilter === 'returned'
        ? (statusUpper === 'RETURN_IN_TRANSIT' || statusUpper === 'RETURNED_RESTOCKED' || statusUpper === 'RETURN_DISPUTED' || statusUpper === 'RETURNED')
        : true;

    return matchesSearch && matchesStatus;
  });

  const handleConfirmRestockFromModal = async (orderId: string, sku: string, quantity: number) => {
    setIsProcessingModal(true);
    setActionError(null);
    try {
      const res = await processReturn(orderId, 'RESTOCK', sku, quantity);
      if (res.success && res.order) {
        setLocalOrders(prev =>
          prev.map(o => (o.id === orderId || o.orderNumber === orderId) ? { ...o, ...res.order } : o)
        );
        setReturnToast({
          type: 'success',
          message: `Order #${res.order.orderNumber || orderId} verified intact. Stock restored (+${quantity} Qty) to active inventory.`
        });
        setVerificationModalOrder(null);
        if (refreshOrders) await refreshOrders();
      } else {
        const errMsg = res.error || 'Failed to restock return: Unknown server response';
        setActionError(`[Restock Error] ${errMsg}`);
        setReturnToast({ type: 'error', message: errMsg });
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error occurred while processing return restock.';
      setActionError(`[Restock Error] ${errMsg}`);
      setReturnToast({ type: 'error', message: errMsg });
    } finally {
      setIsProcessingModal(false);
    }
  };

  const handleFlagDisputeFromModal = async (orderId: string, sku: string, quantity: number) => {
    setIsProcessingModal(true);
    setActionError(null);
    try {
      const res = await processReturn(orderId, 'DISPUTE', sku, quantity);
      if (res.success && res.order) {
        setLocalOrders(prev =>
          prev.map(o => (o.id === orderId || o.orderNumber === orderId) ? { ...o, ...res.order } : o)
        );
        setReturnToast({
          type: 'success',
          message: `Order #${res.order.orderNumber || orderId} flagged as counterfeit/tampered to Admin. Stock remains blocked.`
        });
        setVerificationModalOrder(null);
        if (refreshOrders) await refreshOrders();
      } else {
        const errMsg = res.error || 'Failed to dispute return: Unknown server response';
        setActionError(`[Dispute Error] ${errMsg}`);
        setReturnToast({ type: 'error', message: errMsg });
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error occurred while flagging dispute.';
      setActionError(`[Dispute Error] ${errMsg}`);
      setReturnToast({ type: 'error', message: errMsg });
    } finally {
      setIsProcessingModal(false);
    }
  };

  const handleOpenBlindLabel = (order: Order) => {
    const suffix = order.orderNumber.slice(-4);
    const randomCode = Math.floor(100000 + Math.random() * 899999);
    setLabelWaybillId(order.blindWaybillId || `WB-TM-2026-${suffix}`);
    setLabelTrackingId(order.trackingNumber || `TM-EXP-${suffix}${randomCode}`);
    setLabelCarrier(order.carrier || 'TrueMotion Direct Express Courier');
    setLabelDownloadedToast(false);
    setBlindLabelOrder(order);
  };

  const handleDownloadBlindPdf = () => {
    if (!blindLabelOrder) return;
    const htmlContent = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Blind Waybill ${labelWaybillId}</title>
  <style>
    body { font-family: Georgia, serif; background: #F3ECE0; color: #352013; padding: 32px; }
    .waybill { max-width: 680px; margin: 0 auto; background: #FBF9F5; border: 2px solid #352013; border-radius: 20px; padding: 28px; }
    .header { display: flex; justify-content: space-between; border-bottom: 1px dashed #70523C; padding-bottom: 16px; margin-bottom: 16px; }
    .mono { font-family: monospace; }
    .box { background: #EFE5D3; border: 1px solid #D3C8B7; border-radius: 12px; padding: 14px; margin-bottom: 14px; }
    .redacted { background: #352013; color: #FBF9F5; padding: 8px 12px; border-radius: 8px; font-family: monospace; font-size: 12px; }
  </style>
</head>
<body>
  <div class="waybill">
    <div class="header">
      <div>
        <div class="mono" style="font-size:11px;color:#B5613D;font-weight:bold;">TRUEMOTION QC DIRECT EXPRESS LOGISTICS</div>
        <h1 style="margin:4px 0 0;font-size:22px;">Direct Express Shipping Waybill</h1>
      </div>
      <div class="mono" style="text-align:right;font-size:12px;">
        <div><strong>${labelWaybillId}</strong></div>
        <div>Order: ${blindLabelOrder.orderNumber}</div>
      </div>
    </div>
    <div class="box">
      <div class="mono" style="font-size:10px;color:#70523C;">SHIP FROM (ATELIER ORIGIN)</div>
      <div><strong>${currentSeller?.sellerName || 'Verified Seller Atelier'}</strong></div>
      <div style="font-size:13px;">${currentSeller?.businessAddress || 'Registered Seller Atelier'}</div>
    </div>
    <div class="box">
      <div class="mono" style="font-size:10px;color:#384D35;font-weight:bold;">AUTHORIZED DIRECT DESTINATION (PRIVACY-MASKED)</div>
      <div style="font-size:16px;font-weight:bold;margin-top:4px;">${BLIND_HUB_NAME}</div>
      <div style="font-size:13px;">${BLIND_HUB_ADDRESS}</div>
    </div>
    <div class="redacted">
      BUYER ADDRESS STRICTLY CONFIDENTIAL — PRIVACY-MASKED DIRECT EXPRESS ESCROW
    </div>
    <div class="mono" style="margin-top:16px;font-size:12px;">
      Carrier: ${labelCarrier} | Tracking: ${labelTrackingId}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${labelWaybillId}-TrueMotion-QC-Direct-Express-Label.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setLabelDownloadedToast(true);
  };

  const handleConfirmBlindDispatch = () => {
    if (!blindLabelOrder) return;
    dispatchBlindOrder(blindLabelOrder.id, labelWaybillId, labelTrackingId, labelCarrier);
    setBlindLabelOrder(null);
  };

  const handleEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForEvidence) return;

    submitPackingEvidence(selectedOrderForEvidence.id, {
      packageWeightKg: packageWeight,
      notes: packingNotes || 'Security tamper seal verified intact before direct express courier dispatch.',
      photos: ['/images/artisan_ceramic_vase_1794924085171.jpg'],
      hasVideoProof
    });

    setSelectedOrderForEvidence(null);
    setPackingNotes('');
  };

  return (
    <PopUpContainer className="space-y-6 pb-6">
      {/* Header */}
      <PopUpItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#B5613D] font-bold block mb-1">
            DIRECT EXPRESS &amp; DIGITAL QC LOGISTICS
          </span>
          <h1 className="text-[1.875rem] sm:text-[2.5rem] leading-[1.15] font-display font-semibold tracking-tight text-[#352013] flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-[#B5613D]" />
            <span>Order Fulfillment &amp; Direct Dispatch</span>
          </h1>
          <p className="text-[0.9375rem] text-[#6B5344] mt-0.5 leading-relaxed">
            Zero-Hub Digital QC: Verified with 6-angle macro photos and live packing proof before direct 2–4 day express delivery.
          </p>
        </div>
      </PopUpItem>

      {/* Visible Action Error Banner (No Silent Failures) */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 flex items-start justify-between gap-3 shadow-md"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif font-bold text-sm text-rose-900">
                  Return Operation Failed
                </h4>
                <p className="text-xs font-mono text-rose-800 mt-1 select-all break-all">
                  {actionError}
                </p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Backend target: http://localhost:5000/api. Check server console for exact details.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="px-3 py-1 bg-rose-200 hover:bg-rose-300 text-rose-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Feedback Toast Banner */}
      <AnimatePresence>
        {returnToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl flex items-center justify-between text-xs font-medium border shadow-xs ${
              returnToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                : 'bg-rose-50 text-rose-950 border-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {returnToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-sans">{returnToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setReturnToast(null)}
              className="text-[11px] font-semibold underline ml-3 cursor-pointer opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs Bar */}
      <PopUpItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-[#0A22B8] text-white font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            All Orders ({localOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('packing')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === 'packing' ? 'bg-[#0A22B8] text-white font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Ready to Ship ({localOrders.filter((o) => {
              const s = String(o.status).toUpperCase();
              return s === 'PACKING' || s === 'READY_TO_SHIP' || s === 'READY_FOR_PICKUP';
            }).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('shipping')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === 'shipping' ? 'bg-[#0A22B8] text-white font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            In Direct Transit ({localOrders.filter((o) => {
              const s = String(o.status).toUpperCase();
              return s === 'SHIPPING' || s === 'IN_DIRECT_TRANSIT';
            }).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('delivered')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === 'delivered' ? 'bg-[#0A22B8] text-white font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Delivered ({localOrders.filter((o) => {
              const s = String(o.status).toUpperCase();
              return s === 'DELIVERED' || s === 'AUTHENTICATED & DELIVERED';
            }).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('returns')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === 'returns' ? 'bg-[#0A22B8] text-white font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Returns &amp; Restock ({localOrders.filter((o) => {
              const s = String(o.status).toUpperCase();
              return s === 'RETURN_IN_TRANSIT' || s === 'RETURNED_RESTOCKED' || s === 'RETURN_DISPUTED' || s === 'RETURNED';
            }).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('disputed')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === 'disputed' ? 'bg-[#0A22B8] text-white font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Disputed ({localOrders.filter((o) => {
              const s = String(o.status).toUpperCase();
              return s === 'DISPUTED' || s === 'RETURN_DISPUTED';
            }).length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#7A6252]" />
          <input
            type="text"
            placeholder="Search order # or lot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FBF9F5] border border-[#D3C8B7] rounded-full text-xs text-[#352013] placeholder-[#8C7362] focus:outline-none focus:border-[#B5613D]"
          />
        </div>
      </PopUpItem>

      {/* Orders List */}
      <PopUpItem>
      {filteredOrders.length === 0 ? (
        <div className="p-12 rounded-[2rem] bg-[#FBF9F5] border border-dashed border-[#D3C8B7] text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-[#96A685] mx-auto" />
          <h3 className="text-lg font-serif font-bold text-[#352013]">No orders found</h3>
          <p className="text-xs text-[#6B5344] max-w-sm mx-auto">
            There are currently no orders under the selected filter for your atelier.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, idx) => {
            const hasEvidence = !!order.packingEvidence;
            const statusBadge = getOrderStatusBadge(order.status);
            const statusUpper = String(order.status).toUpperCase();
            const isDeliveredOrder =
              statusUpper === 'DELIVERED' ||
              statusUpper === 'AUTHENTICATED & DELIVERED' ||
              order.status === 'delivered';
            const isReturnInTransit =
              statusUpper === 'RETURN_IN_TRANSIT' ||
              order.status === 'RETURN_IN_TRANSIT';

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setSelectedOrder(order)}
                className="p-5 sm:p-6 rounded-[2rem] bg-[#FBF9F5] border border-[#D3C8B7] hover:border-[#B5613D]/70 transition-colors space-y-4 cursor-pointer group"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3D8C4]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-sm text-[#352013]">{order.orderNumber}</span>
                    <span className="text-xs text-[#6B5344]">· {new Date(order.orderDate).toLocaleDateString()}</span>
                    <span className={`px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold ${statusBadge.classes}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6B5344] font-mono">Escrow:</span>
                    {isReturnInTransit ? (
                      <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full text-amber-900 bg-amber-500/20 border border-amber-600/40">
                        Hold — Return Verification
                      </span>
                    ) : statusUpper === 'RETURNED_RESTOCKED' ? (
                      <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full text-[#384D35] bg-[#A9B89C]/35 border border-[#96A685]">
                        Refunded &amp; Settled
                      </span>
                    ) : statusUpper === 'RETURN_DISPUTED' ? (
                      <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full text-rose-900 bg-rose-500/20 border border-rose-600/40">
                        Dispute Hold — Escrow Frozen
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                          order.escrowStatus === 'held'
                            ? 'text-[#B5613D] bg-[#EFE5D3] border border-[#D3C8B7]'
                            : 'text-[#384D35] bg-[#A9B89C]/35 border border-[#96A685]'
                        }`}
                      >
                        {order.escrowStatus === 'held' ? 'Locked in Escrow' : 'Released to Seller'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items & Blind Destination Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Column 1: Items */}
                  <div className="md:col-span-2 space-y-2.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <img
                          src={item.image || FALLBACK_PRODUCT_IMAGE}
                          alt={item.productName}
                          onError={handleImageError}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover border border-[#D3C8B7]"
                        />
                        <div>
                          <div className="font-semibold text-[#352013] group-hover:text-[#B5613D] transition-colors">
                            {item.productName}
                          </div>
                          <div className="text-[11px] font-mono text-[#6B5344] tabular-nums">
                            SKU: {item.sku} · Qty: {item.quantity} · ₹{item.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Column 2: Direct Express Routing Summary */}
                  <div className="p-3.5 rounded-2xl bg-[#F3ECE0]/70 border border-[#E3D8C4] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-[#7A6252] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#384D35]" />
                        <span>Destination Routing</span>
                      </span>
                    </div>
                    <div className="font-semibold text-[#352013]">Direct Express to Buyer (Masked Waybill)</div>
                    <div className="text-[#6B5344] text-[11px]">
                      Direct Buyer Delivery · Privacy-Masked Address (2–4 Days)
                    </div>
                    {order.trackingNumber && (
                      <div className="pt-1.5 text-[11px] text-[#384D35] font-mono font-semibold">
                        Waybill: {order.trackingNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Return Verification & Restock Action Box */}
                {isReturnInTransit && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-600/30 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold block">
                          RETURN SHIPMENT RECEIVED AT ATELIER INSPECTION DOCK
                        </span>
                        <h4 className="text-sm font-serif font-bold text-[#352013] flex items-center gap-2">
                          <PackageCheck className="w-4 h-4 text-amber-700" />
                          <span>Verify Return &amp; Restock</span>
                        </h4>
                        {order.returnReason && (
                          <p className="text-xs text-[#6B5344] mt-0.5">
                            <span className="font-semibold text-[#352013]">Buyer Return Reason:</span> "{order.returnReason}"
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold self-start sm:self-auto">
                        Return Qty: {order.quantity || 1} unit(s)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setVerificationModalOrder(order)}
                        className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Open Return Verification Dock</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingOrderId === order.id}
                        onClick={async () => {
                          if (window.confirm(`Flag Order #${order.orderNumber} as counterfeit / tampered to Admin? Stock will remain permanently blocked.`)) {
                            setProcessingOrderId(order.id);
                            setActionError(null);
                            try {
                              const firstItem = order.items?.[0];
                              const sku = order.sku || firstItem?.sku || 'SKU-9426009';
                              const quantity = order.quantity || firstItem?.quantity || 1;
                              const res = await processReturn(order.id, 'DISPUTE', sku, quantity);
                              if (res.success && res.order) {
                                setLocalOrders(prev =>
                                  prev.map(o => (o.id === order.id || o.orderNumber === order.orderNumber) ? { ...o, ...res.order } : o)
                                );
                                setReturnToast({
                                  type: 'success',
                                  message: `Order #${order.orderNumber} flagged as counterfeit/tampered. Item blocked from sale.`
                                });
                                if (refreshOrders) await refreshOrders();
                              } else {
                                const errMsg = res.error || 'Failed to dispute return';
                                setActionError(`[Dispute Return Failed] ${errMsg}`);
                                setReturnToast({ type: 'error', message: errMsg });
                              }
                            } catch (err: any) {
                              const errMsg = err?.message || 'Network request failed';
                              setActionError(`[Dispute Return Error] ${errMsg}`);
                              setReturnToast({ type: 'error', message: errMsg });
                            } finally {
                              setProcessingOrderId(null);
                            }
                          }
                        }}
                        className="px-4 py-2 rounded-full bg-rose-700 hover:bg-rose-800 text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-200" />
                        <span>Flag Fake / Damaged Return</span>
                      </button>
                    </div>
                  </div>
                )}

                {(order.status === 'RETURNED_RESTOCKED' || statusUpper === 'RETURNED_RESTOCKED') && (
                  <div className="p-3 rounded-2xl bg-emerald-900/10 border border-emerald-600/30 text-xs text-emerald-900 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Return verified authentic &amp; intact. Stock automatically restored (+{order.quantity || 1} Qty) to active vault inventory.</span>
                    </div>
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      RESTOCKED
                    </span>
                  </div>
                )}

                {(order.status === 'RETURN_DISPUTED' || statusUpper === 'RETURN_DISPUTED') && (
                  <div className="p-3 rounded-2xl bg-rose-900/10 border border-rose-600/30 text-xs text-rose-900 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>Tampered / counterfeit return flagged to Admin. Item remains blocked from sale (zero restock).</span>
                    </div>
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                      FLAGGED TO ADMIN
                    </span>
                  </div>
                )}

                {/* Actions Row */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E3D8C4]">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {order.packingVideoUrl ? (
                      <span className="text-[#384D35] inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold bg-[#A9B89C]/25 px-3 py-1 rounded-full border border-[#96A685]/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#384D35]" />
                        <span>Live Proof Certified (READY FOR PICKUP)</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="ml-1 text-[#B5613D] underline cursor-pointer hover:text-[#9E5231] font-sans inline-flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Play</span>
                        </button>
                      </span>
                    ) : hasEvidence ? (
                      <span className="text-[#384D35] inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#384D35]" />
                        Packing proof certified ({order.packingEvidence?.packageWeightKg}kg · Ref: {order.packingEvidence?.referenceId})
                      </span>
                    ) : null}

                    {/* Prominent Record Live Packing Proof Button */}
                    {order.status === 'packing' && !order.packingVideoUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLiveRecorderOrder(order);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#0A22B8] hover:bg-[#081B9A] text-white text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        title="Record live in-app video with burnt-in watermark"
                      >
                        <Video className="w-3.5 h-3.5 text-[#93C5FD]" />
                        <span>Record Live Packing Proof</span>
                      </button>
                    )}

                    {!order.packingVideoUrl && !hasEvidence && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderForEvidence(order);
                        }}
                        className="text-[#6B5344] hover:text-[#352013] inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold cursor-pointer underline decoration-dotted"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#B5613D]" />
                        <span>Add Scale Weight Note</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-semibold text-[#B5613D] group-hover:underline whitespace-nowrap">
                      Inspect order dossier &rarr;
                    </span>

                    {/* Quick Pipeline Stage Controls for Ready-to-Ship Lots */}
                    {(statusUpper === 'READY_TO_SHIP' || statusUpper === 'PACKING' || statusUpper === 'READY_FOR_PICKUP') && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={processingOrderId === order.id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setProcessingOrderId(order.id);
                            setActionError(null);
                            try {
                              const res = await advanceOrderStage(order.id);
                              if (res.success && res.order) {
                                setLocalOrders(prev =>
                                  prev.map(o => (o.id === order.id || o.orderNumber === order.orderNumber) ? { ...o, ...res.order } : o)
                                );
                                setReturnToast({
                                  type: 'success',
                                  message: `Order #${order.orderNumber} advanced to ${res.order.status}.`
                                });
                                if (refreshOrders) await refreshOrders();
                              } else {
                                setActionError(res.error || 'Failed to advance order stage');
                              }
                            } catch (err: any) {
                              setActionError(err?.message || 'Error advancing stage');
                            } finally {
                              setProcessingOrderId(null);
                            }
                          }}
                          className="px-3 py-1.5 rounded-full bg-[#162E25] hover:bg-[#1E3F33] text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                          title="Advance order to next pipeline stage"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Advance Stage &rarr;</span>
                        </button>

                        <button
                          type="button"
                          disabled={processingOrderId === order.id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setProcessingOrderId(order.id);
                            setActionError(null);
                            try {
                              const res = await advanceOrderStage(order.id, 'IN_DIRECT_TRANSIT');
                              if (res.success && res.order) {
                                setLocalOrders(prev =>
                                  prev.map(o => (o.id === order.id || o.orderNumber === order.orderNumber) ? { ...o, ...res.order } : o)
                                );
                                setReturnToast({
                                  type: 'success',
                                  message: `Order #${order.orderNumber} approved & dispatched directly to buyer.`
                                });
                                if (refreshOrders) await refreshOrders();
                              } else {
                                setActionError(res.error || 'Failed to dispatch order');
                              }
                            } catch (err: any) {
                              setActionError(err?.message || 'Error during dispatch');
                            } finally {
                              setProcessingOrderId(null);
                            }
                          }}
                          className="px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                          title="Approve Digital-QC & Dispatch to Buyer"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Approve &amp; Dispatch</span>
                        </button>
                      </div>
                    )}

                    {(statusUpper === 'IN_DIRECT_TRANSIT' || statusUpper === 'SHIPPING') && (
                      <button
                        type="button"
                        disabled={processingOrderId === order.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setProcessingOrderId(order.id);
                          setActionError(null);
                          try {
                            const res = await advanceOrderStage(order.id, 'DELIVERED');
                            if (res.success && res.order) {
                              setLocalOrders(prev =>
                                prev.map(o => (o.id === order.id || o.orderNumber === order.orderNumber) ? { ...o, ...res.order } : o)
                              );
                              setReturnToast({
                                type: 'success',
                                message: `Order #${order.orderNumber} delivered & escrow released.`
                              });
                              if (refreshOrders) await refreshOrders();
                            } else {
                              setActionError(res.error || 'Failed to mark delivered');
                            }
                          } catch (err: any) {
                            setActionError(err?.message || 'Error marking delivered');
                          } finally {
                            setProcessingOrderId(null);
                          }
                        }}
                        className="px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                        title="Mark Delivered & Release Escrow"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>Advance Stage (Delivered)</span>
                      </button>
                    )}

                    {/* Simulate Buyer Return button on delivered orders (hidden once in return transit) */}
                    {isDeliveredOrder && !isReturnInTransit && (
                      <button
                        type="button"
                        disabled={processingOrderId === order.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setProcessingOrderId(order.id);
                          setActionError(null);
                          try {
                            const firstItem = order.items?.[0];
                            const payload = {
                              id: order.id,
                              sku: order.sku || firstItem?.sku || 'SKU-9426009',
                              productTitle: order.productTitle || order.productName || order.title || firstItem?.productName || 'Luxury Mechanical Watch',
                              quantity: order.quantity || firstItem?.quantity || 1,
                              amount: order.amount || order.price || order.totalAmount || 42500,
                              sellerId: order.sellerId || currentSeller?.id || '',
                              buyerName: order.buyerName || order.customerName || 'Verified Collector',
                              returnReason: 'Buyer requested return — size/fit check'
                            };

                            const res = await simulateReturn(order.id, payload);
                            if (res.success && res.order) {
                              setLocalOrders(prev =>
                                prev.map(o => (o.id === order.id || o.orderNumber === order.orderNumber) ? { ...o, ...res.order } : o)
                              );
                              setReturnToast({
                                type: 'success',
                                message: `Order #${order.orderNumber} successfully moved to Return In Transit. Verification dock ready.`
                              });
                              if (refreshOrders) {
                                await refreshOrders();
                              }
                            } else {
                              const errMsg = res.error || 'Failed to simulate return: Unknown server response';
                              setActionError(`[Simulate Return Failed] ${errMsg}`);
                              setReturnToast({
                                type: 'error',
                                message: errMsg
                              });
                            }
                          } catch (err: any) {
                            const errMsg = err?.message || 'Network request failed';
                            setActionError(`[Simulate Return Error] ${errMsg}`);
                            setReturnToast({
                              type: 'error',
                              message: errMsg
                            });
                          } finally {
                            setProcessingOrderId(null);
                          }
                        }}
                        className="px-4 py-2 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap shrink-0 disabled:opacity-50"
                        title="Simulate buyer initiating return request"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 text-amber-700 ${processingOrderId === order.id ? 'animate-spin' : ''}`} />
                        <span>{processingOrderId === order.id ? 'Simulating Return...' : 'Simulate Buyer Return'}</span>
                      </button>
                    )}

                    {/* Prominent green Verify Return & Restock button + red Flag Fake / Damaged Return button on RETURN_IN_TRANSIT orders */}
                    {isReturnInTransit && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVerificationModalOrder(order);
                          }}
                          className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Verify Return &amp; Restock</span>
                        </button>

                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Flag Order #${order.orderNumber} as counterfeit / tampered to Admin? Stock will remain permanently blocked.`)) {
                              setProcessingOrderId(order.id);
                              setActionError(null);
                              try {
                                const firstItem = order.items?.[0];
                                const sku = order.sku || firstItem?.sku || 'SKU-9426009';
                                const quantity = order.quantity || firstItem?.quantity || 1;
                                const res = await processReturn(order.id, 'DISPUTE', sku, quantity);
                                if (res.success && res.order) {
                                  setLocalOrders(prev =>
                                    prev.map(o => (o.id === order.id || o.orderNumber === order.orderNumber) ? { ...o, ...res.order } : o)
                                  );
                                  setReturnToast({
                                    type: 'success',
                                    message: `Order #${order.orderNumber} flagged as counterfeit/tampered. Item blocked from sale.`
                                  });
                                  if (refreshOrders) await refreshOrders();
                                } else {
                                  const errMsg = res.error || 'Failed to dispute return';
                                  setActionError(`[Dispute Return Failed] ${errMsg}`);
                                  setReturnToast({ type: 'error', message: errMsg });
                                }
                              } catch (err: any) {
                                const errMsg = err?.message || 'Network request failed';
                                setActionError(`[Dispute Return Error] ${errMsg}`);
                                setReturnToast({ type: 'error', message: errMsg });
                              } finally {
                                setProcessingOrderId(null);
                              }
                            }
                          }}
                          className="px-4 py-2 rounded-full bg-rose-700 hover:bg-rose-800 text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap shrink-0 disabled:opacity-50"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-200" />
                          <span>Flag Fake / Damaged Return</span>
                        </button>
                      </>
                    )}

                    {(order.status === 'packing' || order.status === 'READY_TO_SHIP' || order.status === 'READY_FOR_PICKUP') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBlindLabel(order);
                        }}
                        className="px-5 py-2 rounded-full bg-[#B5613D] hover:bg-[#9E5231] text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Generate Shipping Label</span>
                      </button>
                    )}

                    {(order.status === 'shipping' || order.status === 'IN_DIRECT_TRANSIT') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrackingOrder(order);
                        }}
                        className="px-5 py-2 rounded-full bg-[#384D35] hover:bg-[#2D3C25] text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Package</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Blind Shipping Waybill PDF Modal */}
      <AnimatePresence>
        {blindLabelOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setBlindLabelOrder(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#352013]/60 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#FBF9F5] border border-[#D3C8B7] rounded-[2rem] p-6 sm:p-7 space-y-5 relative text-[#352013] my-auto"
            >
              <button
                type="button"
                onClick={() => setBlindLabelOrder(null)}
                aria-label="Close shipping label preview"
                className="absolute top-5 right-5 p-1.5 rounded-full text-[#6B5344] hover:text-[#352013] hover:bg-[#EFE5D3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B5613D] font-bold block mb-1">
                  DIRECT EXPRESS WAYBILL PDF PREVIEW
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#352013]">
                  Direct Express Shipping Label · {blindLabelOrder.orderNumber}
                </h2>
                <p className="text-xs text-[#6B5344] mt-1">
                  Buyer residential details are privacy-masked under TrueMotion Escrow. Parcel ships directly from Seller to Buyer in 2–4 days after digital QC approval.
                </p>
              </div>

              {/* Simulated PDF Label Sheet */}
              <div className="rounded-2xl bg-[#F3ECE0] border-2 border-[#352013] p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-dashed border-[#70523C]">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#B5613D] font-bold">
                      TRUEMOTION QC DIRECT EXPRESS LOGISTICS
                    </div>
                    <div className="text-lg font-serif font-bold text-[#352013]">
                      Direct Express Shipping Waybill
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-bold text-[#352013]">{labelWaybillId}</div>
                    <div className="text-[11px] text-[#6B5344]">Tracking: {labelTrackingId}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#D3C8B7] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#7A6252] block">
                      Ship From (Seller Atelier)
                    </span>
                    <div className="font-semibold text-[#352013]">
                      {currentSeller?.sellerName || 'Verified Seller Atelier'}
                    </div>
                    <div className="text-[11px] text-[#6B5344]">
                      {currentSeller?.businessAddress || 'Registered Seller Atelier'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#A9B89C]/25 border border-[#96A685] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#384D35] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Ship To (Privacy-Masked Direct Waybill)</span>
                    </span>
                    <div className="font-bold text-[#352013]">{BLIND_HUB_NAME}</div>
                    <div className="text-[11px] text-[#384D35]">{BLIND_HUB_ADDRESS}</div>
                  </div>
                </div>

                {/* Buyer Privacy Shield Notice */}
                <div className="p-3 rounded-xl bg-[#352013] text-[#F3ECE0] flex items-center justify-between gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#A9B89C] shrink-0" />
                    <span>BUYER ADDRESS PRIVACY-MASKED — DIRECT ESCROW PROTOCOL ACTIVE</span>
                  </span>
                  <span className="text-[#A9B89C] shrink-0">DIRECT 2–4 DAY SLA</span>
                </div>

                {/* Simulated Barcode Strip */}
                <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#D3C8B7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase text-[#7A6252]">
                      Courier &amp; Parcel Lot
                    </div>
                    <div className="text-xs font-semibold text-[#352013]">{labelCarrier}</div>
                    <div className="text-[11px] font-mono text-[#6B5344]">
                      Lot: {blindLabelOrder.items[0]?.sku} · Qty {blindLabelOrder.items.reduce((s, i) => s + i.quantity, 0)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-end gap-[2px] h-10 px-2 py-1 bg-[#FBF9F5]" aria-hidden="true">
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2].map((w, i) => (
                        <span
                          key={i}
                          className="bg-[#352013] inline-block h-full"
                          style={{ width: `${w * 1.5}px` }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[10px] text-[#352013] tracking-widest mt-1">
                      {labelTrackingId}
                    </span>
                  </div>
                </div>
              </div>

              {labelDownloadedToast && (
                <div className="p-3 rounded-2xl bg-[#A9B89C]/35 border border-[#96A685] text-xs text-[#384D35] flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Direct express waybill document downloaded. Attach it securely to the outer parcel before courier handoff.</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadBlindPdf}
                    className="px-4 py-2 rounded-full bg-[#EFE5D3] hover:bg-[#E3D8C4] border border-[#D3C8B7] text-[#352013] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#B5613D]" />
                    <span>Download Express PDF Label</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-full bg-[#FBF9F5] hover:bg-[#EFE5D3] border border-[#D3C8B7] text-[#352013] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#6B5344]" />
                    <span>Print</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBlindDispatch}
                  className="px-5 py-2.5 rounded-full bg-[#B5613D] hover:bg-[#9E5231] text-[#FFFBF2] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Confirm Direct Dispatch</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Package Tracking Vertical Timeline Modal */}
      <AnimatePresence>
        {trackingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setTrackingOrder(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#352013]/60 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-[#FBF9F5] border border-[#D3C8B7] rounded-[2rem] p-6 sm:p-7 space-y-5 relative text-[#352013] my-auto"
            >
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                aria-label="Close live package tracking"
                className="absolute top-5 right-5 p-1.5 rounded-full text-[#6B5344] hover:text-[#352013] hover:bg-[#EFE5D3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#384D35] font-bold block">
                  DIRECT EXPRESS LOGISTICS TELEMETRY
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#352013]">
                  Package Tracking · {trackingOrder.orderNumber}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B5344] font-mono pt-1">
                  <span>{trackingOrder.carrier || 'TrueMotion Direct Express Courier'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#352013]">{trackingOrder.trackingNumber || 'TM-EXP-ACTIVE'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#EFE5D3]/70 border border-[#D3C8B7] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#B5613D] shrink-0" />
                  <div>
                    <div className="font-semibold text-[#352013]">Direct Buyer Delivery · Privacy-Masked Address</div>
                    <div className="text-[11px] text-[#6B5344]">Direct Express Courier · Verified Zero-Hub Leg</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#A9B89C]/40 text-[#384D35] border border-[#96A685] whitespace-nowrap">
                  Direct Express (2–4 Days)
                </span>
              </div>

              {/* 4-Step Vertical Tracking Timeline */}
              <div className="pl-2 py-2 space-y-0">
                {[
                  {
                    title: 'Digital QC & Live Packing Verified',
                    desc: '6-angle macro dossier, serialized tamper-evident QR seal, and uncut live packing video verified digitally before pickup.',
                    meta: 'Pre-Shipment Approved',
                    state: 'completed' as const
                  },
                  {
                    title: 'Dispatched Directly from Seller',
                    desc: 'Sealed parcel collected by insured express courier with pickup weight match and privacy-masked direct waybill.',
                    meta: 'Picked Up · Weight Locked',
                    state: trackingOrder.dispatchedAt || trackingOrder.status === 'shipping' || trackingOrder.status === 'IN_DIRECT_TRANSIT' || trackingOrder.status === 'delivered' ? ('completed' as const) : ('active' as const)
                  },
                  {
                    title: 'Direct Express Transit to Buyer',
                    desc: "Moving directly to buyer's city with zero middle-hub delay; buyer tracks live packing proof in real time.",
                    meta: 'En Route · 2–4 Day SLA',
                    state: trackingOrder.status === 'delivered' ? ('completed' as const) : (trackingOrder.status === 'shipping' || trackingOrder.status === 'IN_DIRECT_TRANSIT') ? ('active' as const) : ('pending' as const)
                  },
                  {
                    title: 'Delivered & Escrow Release',
                    desc: 'Buyer confirms intact QR tamper seal at doorstep; TruemotionQC Escrow unlocks payout to seller bank.',
                    meta: 'Tamper Seal Check',
                    state: trackingOrder.status === 'delivered' ? ('completed' as const) : ('pending' as const)
                  }
                ].map((step, index, arr) => {
                  const isLast = index === arr.length - 1;
                  return (
                    <div key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                      {!isLast && (
                        <span
                          aria-hidden="true"
                          className={`absolute left-[13px] top-7 bottom-0 w-0.5 ${
                            step.state === 'completed' ? 'bg-[#96A685]' : 'bg-[#D3C8B7]'
                          }`}
                        />
                      )}

                      <div className="relative z-10 shrink-0 mt-0.5">
                        {step.state === 'completed' ? (
                          <span className="w-7 h-7 rounded-full bg-[#384D35] text-[#FFFBF2] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : step.state === 'active' ? (
                          <span className="w-7 h-7 rounded-full bg-[#A9B89C]/45 border-2 border-[#384D35] flex items-center justify-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                          </span>
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-[#F3ECE0] border border-[#D3C8B7] text-[#8C7362] flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3
                            className={`text-sm font-serif font-bold ${
                              step.state === 'pending' ? 'text-[#7A6252]' : 'text-[#352013]'
                            }`}
                          >
                            {index + 1}. {step.title}
                          </h3>
                          <span
                            className={`text-[10px] font-mono ${
                              step.state === 'active'
                                ? 'text-[#384D35] font-bold'
                                : step.state === 'completed'
                                ? 'text-[#6B5344]'
                                : 'text-[#8C7362]'
                            }`}
                          >
                            {step.meta}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B5344] leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2 border-t border-[#E3D8C4]">
                <button
                  type="button"
                  onClick={() => setTrackingOrder(null)}
                  className="px-5 py-2 rounded-full bg-[#384D35] hover:bg-[#2D3C25] text-[#FFFBF2] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close Tracking
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional Packing Evidence Modal */}
      <AnimatePresence>
        {selectedOrderForEvidence && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedOrderForEvidence(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#352013]/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#FBF9F5] border border-[#D3C8B7] rounded-[2rem] p-6 space-y-4 relative text-xs text-[#352013]"
            >
              <button
                type="button"
                onClick={() => setSelectedOrderForEvidence(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-[#6B5344] hover:text-[#352013] hover:bg-[#EFE5D3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-serif font-bold text-[#352013]">
                Tamper-Proof Packing Evidence · {selectedOrderForEvidence.orderNumber}
              </h3>
              <p className="text-xs text-[#6B5344]">
                Submit parcel scale calibration and tamper-tape serials before direct 2–4 day express dispatch under full Escrow protection.
              </p>

              <form onSubmit={handleEvidenceSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#4A2E1B] font-semibold mb-1">Measured Scale Weight (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#F3ECE0]/60 border border-[#D3C8B7] rounded-2xl text-[#352013] font-mono focus:outline-none focus:border-[#B5613D]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#4A2E1B] font-semibold mb-1">Tamper Seal Notes</label>
                  <textarea
                    rows={2}
                    value={packingNotes}
                    onChange={(e) => setPackingNotes(e.target.value)}
                    placeholder="Holographic seal #TM-8941 applied across box seam."
                    className="w-full px-3.5 py-2 bg-[#F3ECE0]/60 border border-[#D3C8B7] rounded-2xl text-[#352013] focus:outline-none focus:border-[#B5613D]"
                  />
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#EFE5D3]/70 border border-[#D3C8B7]">
                  <input
                    type="checkbox"
                    id="videoProof"
                    checked={hasVideoProof}
                    onChange={(e) => setHasVideoProof(e.target.checked)}
                    className="rounded accent-[#384D35]"
                  />
                  <label htmlFor="videoProof" className="text-[#4A2E1B] cursor-pointer">
                    Continuous uncut packing video attached to immutable dispute vault
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForEvidence(null)}
                    className="px-4 py-2 text-[#6B5344] hover:text-[#352013] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#384D35] hover:bg-[#2D3C25] text-[#FFFBF2] font-semibold cursor-pointer transition-colors"
                  >
                    Save Packing Proof
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order, Packing Evidence & Product Lot Inspector Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOpenPackingModal={(ord) => setSelectedOrderForEvidence(ord)}
        onOpenLiveRecorder={(ord) => setLiveRecorderOrder(ord)}
      />

      {/* Live In-App Packing Video Recorder Modal (Camera Only / Watermark Burnt In) */}
      {liveRecorderOrder && (
        <LivePackingVideoRecorderModal
          order={liveRecorderOrder}
          onClose={() => setLiveRecorderOrder(null)}
          onSuccess={(updatedOrder) => {
            setLiveRecorderOrder(null);
          }}
        />
      )}

      {/* Return Verification & Auto-Restock Modal */}
      <ReturnVerificationModal
        order={verificationModalOrder}
        isOpen={!!verificationModalOrder}
        onClose={() => setVerificationModalOrder(null)}
        onConfirmRestock={handleConfirmRestockFromModal}
        onFlagDispute={handleFlagDisputeFromModal}
        isProcessing={isProcessingModal}
      />
      </PopUpItem>
    </PopUpContainer>
  );
};
