import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Landmark,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { PopUpContainer, PopUpItem, luxuryEase } from '../common/MotionPrimitives';

export const EarningsView: React.FC = () => {
  const { financialSummary, orders, currentSeller, withdrawals, requestWithdrawal } = useApp();

  const [lastWithdrawalRef, setLastWithdrawalRef] = useState<{
    reference: string;
    amount: number;
    bankLabel: string;
  } | null>(null);

  const handleRequestPayout = () => {
    const record = requestWithdrawal();
    if (record) {
      setLastWithdrawalRef({
        reference: record.reference,
        amount: record.amount,
        bankLabel: record.bankLabel,
      });
      setTimeout(() => setLastWithdrawalRef(null), 5000);
    }
  };

  const sellerOrders = currentSeller?.id
    ? orders.filter((o) => o.sellerId === currentSeller.id || o.seller_id === currentSeller.id)
    : orders;

  const sellerWithdrawals = currentSeller?.id
    ? withdrawals.filter((w) => w.sellerId === currentSeller.id)
    : withdrawals;

  const bankName =
    currentSeller?.bankInstitution ||
    currentSeller?.bank_name ||
    currentSeller?.bankName ||
    'Verified Settlement Partner';

  const bankAccount =
    currentSeller?.bankAccountMasked ||
    (currentSeller?.accountNumber ? `••••${currentSeller.accountNumber.slice(-4)}` : '••••4819');

  const ifsc =
    currentSeller?.ifscCode ||
    currentSeller?.ifsc_code ||
    currentSeller?.routingOrSortCode ||
    'Verified IFSC';

  return (
    <PopUpContainer className="space-y-6 pb-6">
      {/* Header */}
      <PopUpItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#0A22B8] font-bold block mb-1">
            ESCROW &amp; SETTLEMENT LEDGER
          </span>
          <h1 className="text-[1.875rem] sm:text-[2.5rem] leading-[1.15] font-display font-semibold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <Coins className="w-6 h-6 text-[#0A22B8]" />
            <span>Payouts &amp; Earnings</span>
          </h1>
          <p className="text-[0.9375rem] text-[#64748B] mt-0.5 leading-relaxed">
            Track live escrow balances held under buyer protection alongside cleared QC-verified balances ready for bank disbursement.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRequestPayout}
          disabled={financialSummary.availableBalance <= 0}
          className="px-5 py-2.5 rounded-xl bg-[#0A22B8] hover:bg-[#081B9A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-colors whitespace-nowrap shadow-xs active:scale-98"
        >
          <ArrowUpRight className="w-4 h-4 text-white" />
          <span>
            {financialSummary.availableBalance > 0
              ? `Withdraw ₹${financialSummary.availableBalance.toLocaleString('en-IN')}`
              : 'No Available Balance'}
          </span>
        </button>
      </PopUpItem>

      <AnimatePresence>
        {lastWithdrawalRef && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-xl bg-[#EAF0FF] border border-[#BFDBFE] flex items-center gap-3 text-xs text-[#0F172A]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#0A22B8] shrink-0" />
            <span>
              Transfer <strong>{lastWithdrawalRef.reference}</strong> of{' '}
              <strong>₹{lastWithdrawalRef.amount.toLocaleString('en-IN')}</strong> initiated to{' '}
              <strong>{lastWithdrawalRef.bankLabel}</strong>. Funds typically settle within 24 hours.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-Card Split KPI Layout */}
      <PopUpItem className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Card 1: Locked in Escrow (Pending) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="p-6 sm:p-7 rounded-2xl bg-white text-[#0F172A] border border-[#E6ECF5] flex flex-col justify-between space-y-5 shadow-xs"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#64748B] font-bold block">
                Locked in Escrow (Net 95%)
              </span>
              <p className="text-[0.9375rem] text-[#64748B] max-w-sm leading-relaxed">
                Held securely while parcels are in transit or within the 14-day buyer protection window.
              </p>
            </div>
            <span className="w-10 h-10 rounded-xl bg-[#EAF0FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#0A22B8]" />
            </span>
          </div>

          <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-baseline justify-between gap-3">
            <div className="text-[2.25rem] font-bold font-sans text-[#0F172A] tabular-nums leading-none">
              ₹{financialSummary.escrowBalance.toLocaleString('en-IN')}
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF0FF] border border-[#BFDBFE] text-[0.75rem] font-bold text-[#0A22B8] uppercase tracking-[0.06em]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0A22B8]" />
              <span>14-Day Buyer Protection</span>
            </span>
          </div>
        </motion.div>

        {/* Card 2: Available Balance (Royal Cobalt Gradient Card) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#0D2CD4] to-[#071991] text-white shadow-md flex flex-col justify-between space-y-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-white/80 font-bold block">
                Available Balance (Cleared Net)
              </span>
              <p className="text-[0.9375rem] text-white/90 max-w-sm leading-relaxed">
                Cleared settlement funds from QC-verified deliveries ready for immediate withdrawal to your linked bank.
              </p>
            </div>
            <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-white" />
            </span>
          </div>

          <div className="pt-3 border-t border-white/20 flex flex-wrap items-baseline justify-between gap-3">
            <div className="text-[2.25rem] font-bold font-sans text-white tabular-nums leading-none">
              ₹{financialSummary.availableBalance.toLocaleString('en-IN')}
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-[0.75rem] font-bold text-white uppercase tracking-[0.06em]">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Cleared for Withdrawal</span>
            </span>
          </div>
        </motion.div>
      </PopUpItem>

      {/* Linked Settlement Bank Summary Strip */}
      <PopUpItem className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E6ECF5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex items-center gap-3.5">
          <span className="w-10 h-10 rounded-xl bg-[#EAF0FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-[#0A22B8]" />
          </span>
          <div>
            <div className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#0A22B8] font-bold">
              Verified Settlement Destination (From KYC Step 3)
            </div>
            <div className="text-[1.25rem] leading-[1.3] font-display font-medium text-[#0F172A] mt-0.5">
              {bankName} · {bankAccount}
            </div>
            <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
              IFSC: {ifsc} · QC Gross Revenue: ₹{financialSummary.totalRevenue.toLocaleString('en-IN')} · Disbursed: ₹{financialSummary.completedPayouts.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-[#EAF0FF] border border-[#BFDBFE] text-[#0A22B8] font-mono text-[11px] font-bold whitespace-nowrap self-start sm:self-center">
          5% TrueMotion QC Escrow Fee
        </span>
      </PopUpItem>

      {/* Bank Withdrawal Transfers History (when withdrawals exist) */}
      {sellerWithdrawals.length > 0 && (
        <PopUpItem className="rounded-2xl bg-white border border-[#E6ECF5] overflow-hidden shadow-xs">
          <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between">
            <div>
              <h3 className="text-[1.125rem] font-bold text-[#0F172A] tracking-tight">
                Bank Withdrawal Transfers
              </h3>
              <p className="text-xs text-[#64748B]">
                Initiated IMPS / NEFT bank settlements to your verified destination
              </p>
            </div>
            <span className="text-xs font-mono text-[#64748B] tabular-nums">
              {sellerWithdrawals.length} {sellerWithdrawals.length === 1 ? 'transfer' : 'transfers'}
            </span>
          </div>
          <div className="divide-y divide-[#F1F5F9] text-xs">
            {sellerWithdrawals.map((wd) => (
              <div
                key={wd.id}
                className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-[#F8FAFC]"
              >
                <div>
                  <div className="font-mono font-semibold text-[#0F172A]">{wd.reference}</div>
                  <div className="text-[11px] text-[#64748B]">
                    {wd.bankLabel} · {new Date(wd.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF0FF] text-[#0A22B8]">
                    {wd.status === 'settled' ? 'Settled' : 'Processing'}
                  </span>
                  <span className="font-mono font-bold text-[#0F172A] tabular-nums">
                    -₹{wd.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </PopUpItem>
      )}

      {/* Recent Payouts & Escrow Transactions Table */}
      <PopUpItem className="rounded-2xl bg-white border border-[#E6ECF5] overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[1.125rem] font-bold text-[#0F172A] tracking-tight">
              Order Escrow &amp; Settlement Ledger
            </h3>
            <p className="text-xs text-[#64748B]">
              Itemized 95% net settlement ledger in INR (₹) across live authenticated orders
            </p>
          </div>
          <span className="text-xs font-mono text-[#64748B] tabular-nums">
            {sellerOrders.length} entries recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0F172A]">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-mono uppercase text-[10px] border-b border-[#E6ECF5]">
              <tr>
                <th className="py-3.5 px-5">Settlement Ref</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Order &amp; Lot</th>
                <th className="py-3.5 px-5">Escrow Status</th>
                <th className="py-3.5 px-5 text-right">Net Payout (95%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {sellerOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#64748B]">
                    No transactions recorded for this atelier yet.
                  </td>
                </tr>
              ) : (
                sellerOrders.map((order, idx) => {
                  const total = Number(order.totalAmount || order.amount || 0);
                  const net = Math.round(total * 0.95);
                  const isDelivered = String(order.status).toLowerCase() === 'delivered';
                  const isRefunded = order.escrowStatus === 'refunded';
                  const isCleared = isDelivered && !isRefunded;

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono font-semibold text-[#0F172A] whitespace-nowrap">
                        PAY-{order.orderNumber.replace(/[^A-Za-z0-9]/g, '').slice(-7)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[#64748B] tabular-nums whitespace-nowrap">
                        {new Date(order.createdAt || order.orderDate || Date.now()).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-[#0F172A]">
                        <div className="font-semibold text-[#0F172A]">
                          {order.items?.[0]?.productName || order.productTitle || `Order #${order.orderNumber}`}
                        </div>
                        <div className="text-[11px] font-mono text-[#64748B]">
                          #{order.orderNumber} ·{' '}
                          {isRefunded
                            ? 'Escrow refunded to buyer'
                            : isCleared
                            ? 'QC verified & delivered'
                            : 'In transit / awaiting QC delivery'}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {isRefunded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <RotateCcw className="w-3 h-3" />
                            Refunded
                          </span>
                        ) : isCleared ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF0FF] text-[#0A22B8]">
                            Available / Cleared
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Locked in Escrow
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0F172A] tabular-nums whitespace-nowrap">
                        {isRefunded ? '₹0' : `+₹${net.toLocaleString('en-IN')}`}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </PopUpItem>
    </PopUpContainer>
  );
};