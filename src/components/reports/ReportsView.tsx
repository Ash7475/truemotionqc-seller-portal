import React, { useState, useMemo } from 'react';
import { FileText, Download, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ProductCategory } from '../../types';
import { PopUpContainer, PopUpItem, luxuryEase } from '../common/MotionPrimitives';

function escapeCsvCell(val: string | number | undefined | null): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const ReportsView: React.FC = () => {
  const { products, orders, financialSummary, currentSeller } = useApp();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const notifyDownload = (filename: string) => {
    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleExportSettlementCsv = () => {
    const filename = 'TrueMotionQC_Settlement_Ledger_2026.csv';
    const headers = [
      'Order ID',
      'Order Date',
      'Product',
      'Customer',
      'Status',
      'Escrow Status',
      'Gross Amount (INR)',
      'Escrow Fee 5% (INR)',
      'Net Settlement 95% (INR)',
    ];
    const rows = orders.map((o) => {
      const fee = Math.round(o.totalAmount * 0.05);
      const net = o.totalAmount - fee;
      return [
        o.orderNumber,
        new Date(o.orderDate).toISOString().slice(0, 10),
        o.items[0]?.productName || 'Luxury Lot',
        o.customerName,
        o.status,
        o.escrowStatus,
        o.totalAmount,
        fee,
        net,
      ]
        .map(escapeCsvCell)
        .join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    triggerFileDownload(filename, csv, 'text/csv;charset=utf-8;');
    notifyDownload(filename);
  };

  const handleExportInventoryCsv = () => {
    const filename = 'TrueMotion_QC_Vault_Inventory_Reconciliation.csv';
    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Price (INR)',
      'Stock Units',
      'Low Stock Threshold',
      'Listing Status',
      'TMQC Verification Status',
    ];
    const rows = products.map((p) =>
      [
        p.sku,
        p.name,
        p.category,
        p.price,
        p.stock,
        p.lowStockThreshold,
        p.status,
        p.verificationStatus,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    triggerFileDownload(filename, csv, 'text/csv;charset=utf-8;');
    notifyDownload(filename);
  };

  const handleExportTaxDossier = () => {
    const filename = 'TrueMotion_QC_Annual_Tax_Statement_2026.html';
    const deliveredOrders = orders.filter(
      (o) => String(o.status).toLowerCase() === 'delivered'
    );
    const totalGross = financialSummary.totalRevenue;
    const totalFees = Math.round(totalGross * 0.05);
    const totalNet = totalGross - totalFees;

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>TrueMotion QC Annual Tax & Settlement Statement — ${currentSeller?.sellerName || 'Seller Atelier'}</title>
<style>
  body { font-family: Georgia, serif; color: #2B1218; background: #FAF7F2; padding: 36px; max-width: 820px; margin: 0 auto; }
  h1 { color: #3A101C; margin-bottom: 4px; }
  .meta { color: #6E5C57; font-size: 13px; margin-bottom: 24px; font-family: sans-serif; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
  .card { background: #fff; border: 1px solid #E7DEC9; border-radius: 10px; padding: 14px; font-family: sans-serif; }
  .label { font-size: 11px; text-transform: uppercase; color: #8E6F36; font-weight: 700; }
  .val { font-size: 22px; font-weight: 700; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #E7DEC9; font-family: sans-serif; font-size: 12px; }
  th, td { padding: 10px 12px; border-bottom: 1px solid #EFE7DB; text-align: left; }
  th { background: #F5EFE6; color: #4E383B; text-transform: uppercase; font-size: 10px; }
</style>
</head>
<body>
  <h1>TrueMotion QC Seller Atelier — Tax &amp; Settlement Statement</h1>
  <div class="meta">
    Atelier: <strong>${currentSeller?.sellerName || 'Atelier'}</strong> &bull;
    Tax ID / GSTIN: <strong>${currentSeller?.taxId || 'Registered'}</strong> &bull;
    Generated: ${new Date().toLocaleDateString()}
  </div>
  <div class="grid">
    <div class="card"><div class="label">QC-Verified Gross Revenue</div><div class="val">₹${totalGross.toLocaleString()}</div></div>
    <div class="card"><div class="label">5% TrueMotion QC Escrow Fee</div><div class="val">₹${totalFees.toLocaleString()}</div></div>
    <div class="card"><div class="label">Net Settled Payout (95%)</div><div class="val">₹${totalNet.toLocaleString()}</div></div>
  </div>
  <table>
    <thead><tr><th>Order ID</th><th>Date</th><th>Piece</th><th>Gross (₹)</th><th>Net 95% (₹)</th></tr></thead>
    <tbody>
      ${
        deliveredOrders.length === 0
          ? '<tr><td colspan="5">No QC-verified delivered orders recorded yet.</td></tr>'
          : deliveredOrders
              .map(
                (o) =>
                  `<tr><td>${o.orderNumber}</td><td>${new Date(o.orderDate).toLocaleDateString()}</td><td>${o.items[0]?.productName || 'Lot'}</td><td>₹${o.totalAmount.toLocaleString()}</td><td>₹${Math.round(o.totalAmount * 0.95).toLocaleString()}</td></tr>`
              )
              .join('')
      }
    </tbody>
  </table>
</body>
</html>`;
    triggerFileDownload(filename, html, 'text/html;charset=utf-8;');
    notifyDownload(filename);
  };

  const categoryBreakdown = useMemo(() => {
    const categories: ProductCategory[] = [
      'Watches',
      'Apparel',
      'Accessories',
      'Electronics',
      'Other',
    ];
    const total = products.length;
    return categories
      .map((cat) => {
        const count = products.filter((p) => p.category === cat).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return { cat, count, share: `${pct}%` };
      })
      .filter((item) => item.count > 0 || item.cat !== 'Other');
  }, [products]);

  return (
    <PopUpContainer className="space-y-6 pb-6">
      {/* Header */}
      <PopUpItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#8E6F36] font-bold block mb-1">
            STATEMENTS &amp; RECONCILIATION
          </span>
          <h1 className="text-[1.875rem] sm:text-[2.5rem] leading-[1.15] font-display font-semibold tracking-tight text-[#2B1218] flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#3A101C]" />
            <span>Financial &amp; Inventory Audit Reports</span>
          </h1>
          <p className="text-[0.9375rem] text-[#6E5C57] mt-0.5 leading-relaxed">
            Export live tax statements, 5% escrow clearances, and SKU reconciliation sheets directly to your device.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportTaxDossier}
          className="px-5 py-2.5 rounded-lg bg-[#3A101C] hover:bg-[#4F1627] text-[#FAF5EE] font-medium text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0 transition-colors"
        >
          <Download className="w-4 h-4 text-[#C4A46B]" />
          <span>Export Annual Tax Statement</span>
        </button>
      </PopUpItem>

      <PopUpItem>

      <AnimatePresence>
        {downloadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-xl bg-[#F6EBD4] border border-[#DEC493] flex items-center gap-3 text-xs text-[#2B1218]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#3A101C] shrink-0" />
            <span>
              Generated and downloaded <strong>{downloadSuccess}</strong> for{' '}
              {currentSeller?.sellerName || 'your atelier'}.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reports Available Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Report 1 */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-xl bg-white border border-[#E7DEC9] shadow-[0_1px_3px_rgba(58,16,28,0.03)] flex items-start justify-between gap-4"
        >
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#6E2634] bg-[#EFE0E2] px-2.5 py-0.5 rounded-full font-semibold">
                FINANCIAL / TAX
              </span>
              <span className="text-[#8E8179]">Cycle 2026</span>
            </div>
            <h3 className="text-base font-serif font-semibold text-[#2B1218]">
              Consolidated Settlement &amp; Fee Statement
            </h3>
            <p className="text-[#6E5C57] leading-relaxed">
              Itemized CSV ledger detailing all {orders.length} seller transactions, 5% TrueMotion QC escrow fee withholdings, and 95% net disbursements.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportSettlementCsv}
            className="p-2.5 rounded-lg bg-[#F5EFE6] hover:bg-[#3A101C] text-[#2B1218] hover:text-[#FAF5EE] transition-colors cursor-pointer shrink-0 border border-[#E5DACB]"
            title="Download Settlement CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Report 2 */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-xl bg-white border border-[#E7DEC9] shadow-[0_1px_3px_rgba(58,16,28,0.03)] flex items-start justify-between gap-4"
        >
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#8A6526] bg-[#F6EBD4] px-2.5 py-0.5 rounded-full font-semibold">
                QC AUDIT / VAULT
              </span>
              <span className="text-[#8E8179]">Live Snapshot</span>
            </div>
            <h3 className="text-base font-serif font-semibold text-[#2B1218]">
              Vault Inventory &amp; Appraisal Reconciliation
            </h3>
            <p className="text-[#6E5C57] leading-relaxed">
              Full CSV export of all {products.length} catalog SKU lots, unit reserves, listing statuses, and live TMQC verification states.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportInventoryCsv}
            className="p-2.5 rounded-lg bg-[#F5EFE6] hover:bg-[#3A101C] text-[#2B1218] hover:text-[#FAF5EE] transition-colors cursor-pointer shrink-0 border border-[#E5DACB]"
            title="Download Inventory CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Live Category Performance Breakdown */}
      <div className="p-6 rounded-xl bg-white border border-[#E7DEC9] shadow-[0_1px_3px_rgba(58,16,28,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-serif font-semibold text-[#2B1218]">
            Category Distribution &amp; Volume
          </h3>
          <span className="text-xs font-mono text-[#7A6B66] tabular-nums">
            {products.length} total catalog lots
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {categoryBreakdown.map((item, idx) => (
            <motion.div
              key={item.cat}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E7DEC9] space-y-1"
            >
              <span className="text-[#6E5C57] font-medium">{item.cat}</span>
              <div className="text-xl font-bold font-mono text-[#2B1218] tabular-nums">
                {item.count} {item.count === 1 ? 'item' : 'items'}
              </div>
              <div className="text-[11px] font-mono text-[#8E6F36] font-semibold">
                {item.share} catalog share
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      </PopUpItem>
    </PopUpContainer>
  );
};
