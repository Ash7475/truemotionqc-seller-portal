import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Search, AlertTriangle, Save, CheckCircle2, Layers, Coins } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ProductDetailModal } from '../products/ProductDetailModal';
import { getProductImage, handleImageError } from '../../utils/productImages';
import { PopUpContainer, PopUpItem, luxuryEase } from '../common/MotionPrimitives';

export const InventoryView: React.FC = () => {
  const { products, updateProductStock, activeSubTab } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(activeSubTab === 'history');
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setLowStockOnly(activeSubTab === 'history');
  }, [activeSubTab]);

  const activeProducts = products.filter(
    (p) => {
      const s = String(p.status || '').toUpperCase();
      return s === 'ACTIVE' || s === 'OUT_OF_STOCK' || s === '';
    }
  );
  const lowStockItems = activeProducts.filter((p) => p.stock <= p.lowStockThreshold);

  const filtered = activeProducts.filter((p) => {
    const title = p.title || p.name || '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLow = lowStockOnly ? p.stock <= p.lowStockThreshold : true;
    return matchesSearch && matchesLow;
  });

  const totalVaultUnits = activeProducts.reduce((sum, p) => sum + p.stock, 0);
  const totalInventoryValue = activeProducts.reduce((sum, p) => sum + p.stock * p.price, 0);

  const handleStockChange = (id: string, raw: number) => {
    const safeVal = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
    setStockEdits((prev) => ({
      ...prev,
      [id]: safeVal,
    }));
  };

  const handleSaveStock = (id: string) => {
    const newStock = stockEdits[id];
    if (newStock !== undefined) {
      updateProductStock(id, newStock);
      setSavedSuccessId(id);
      setTimeout(() => setSavedSuccessId(null), 2000);
      setStockEdits((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  return (
    <PopUpContainer className="space-y-6 pb-6">
      {/* Header */}
      <PopUpItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#8E6F36] font-bold block mb-1">
            STOCK CONTROLS
          </span>
          <h1 className="text-[1.875rem] sm:text-[2.5rem] leading-[1.15] font-display font-semibold tracking-tight text-[#2B1218]">
            Vault Inventory &amp; Stock Management
          </h1>
          <p className="text-[0.9375rem] text-[#6E5C57] mt-0.5 leading-relaxed">
            Real-time tracking of authenticated vault reserves and automatic low-stock triggers.
          </p>
        </div>
      </PopUpItem>

      {/* KPI Cards */}
      <PopUpItem className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          transition={{ duration: 0.2, ease: luxuryEase }}
          className="p-5 rounded-xl bg-white border border-[#E7DEC9] shadow-[0_1px_3px_rgba(58,16,28,0.03)]"
        >
          <div className="flex items-center justify-between text-[#7A6B66] mb-2">
            <span className="text-[0.75rem] uppercase tracking-[0.06em] font-mono font-semibold">Total Vault Units</span>
            <Layers className="w-4 h-4 text-[#3A101C]" />
          </div>
          <div className="text-[2.25rem] font-bold font-sans text-[#2B1218] tabular-nums leading-none my-1">
            {totalVaultUnits}
          </div>
          <p className="text-xs text-[#6E5C57] mt-1">Across {activeProducts.length} active listings</p>
        </motion.div>

        <motion.div
          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          transition={{ duration: 0.2, ease: luxuryEase }}
          onClick={() => setLowStockOnly((prev) => !prev)}
          className="p-5 rounded-xl bg-white border border-[#E7DEC9] shadow-[0_1px_3px_rgba(58,16,28,0.03)] cursor-pointer hover:border-[#C4A46B] transition-colors"
        >
          <div className="flex items-center justify-between text-[#7A6B66] mb-2">
            <span className="text-[0.75rem] uppercase tracking-[0.06em] font-mono font-semibold">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-[#8A6526]" />
          </div>
          <div className="text-[2.25rem] font-bold font-sans text-[#7A182B] tabular-nums leading-none my-1">
            {lowStockItems.length}
          </div>
          <p className="text-xs text-[#6E5C57] mt-1">Items at or below safe threshold</p>
        </motion.div>

        <motion.div
          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          transition={{ duration: 0.2, ease: luxuryEase }}
          className="p-5 rounded-xl bg-white border border-[#E7DEC9] shadow-[0_1px_3px_rgba(58,16,28,0.03)]"
        >
          <div className="flex items-center justify-between text-[#7A6B66] mb-2">
            <span className="text-[0.75rem] uppercase tracking-[0.06em] font-mono font-semibold">Total Inventory Value</span>
            <Coins className="w-4 h-4 text-[#A68449]" />
          </div>
          <div className="text-[2.25rem] font-bold font-sans text-[#2B1218] tabular-nums leading-none my-1">
            ₹{totalInventoryValue.toLocaleString()}
          </div>
          <p className="text-xs text-[#6E5C57] mt-1">Authenticated assets appraisal</p>
        </motion.div>
      </PopUpItem>

      {/* Low Stock Warning Callout */}
      {lowStockItems.length > 0 && (
        <PopUpItem className="p-4 rounded-xl bg-[#F6EBD4]/60 border border-[#DEC493] flex flex-wrap items-center justify-between gap-3 text-xs text-[#2B1218]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#8A6526] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#3A101C]">Re-order Alert: </span>
              {lowStockItems.length} {lowStockItems.length === 1 ? 'item requires' : 'items require'} replenishment to avoid catalog delisting.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLowStockOnly((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#DFD4C5] hover:border-[#C4A46B] text-[11px] font-semibold text-[#3A101C] cursor-pointer transition-colors"
          >
            {lowStockOnly ? 'Show All Stock' : 'Filter Low Stock Only'}
          </button>
        </PopUpItem>
      )}

      {/* Inventory Table Container */}
      <PopUpItem className="rounded-xl bg-white border border-[#E7DEC9] shadow-[0_1px_3px_rgba(58,16,28,0.03)] overflow-hidden">
        {/* Table Search & Filter Header */}
        <div className="p-4 border-b border-[#EFE7DB] flex flex-wrap items-center justify-between gap-3 bg-[#F5EFE6]/60">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8E8179]" />
            <input
              type="text"
              placeholder="Search inventory by title or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5DACB] rounded-lg text-xs text-[#2B1218] placeholder-[#9B8F85] focus:outline-none focus:border-[#C4A46B]"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-[#E5DACB] rounded-lg p-0.5 flex items-center gap-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setLowStockOnly(false)}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  !lowStockOnly
                    ? 'bg-[#3A101C] text-[#FAF5EE] font-medium'
                    : 'text-[#7A6B66] hover:text-[#2B1218]'
                }`}
              >
                All ({activeProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setLowStockOnly(true)}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  lowStockOnly
                    ? 'bg-[#3A101C] text-[#FAF5EE] font-medium'
                    : 'text-[#7A6B66] hover:text-[#2B1218]'
                }`}
              >
                Reorder Alerts ({lowStockItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5EFE6] text-[#4E383B] font-mono uppercase text-[10px] tracking-wider border-b border-[#E7DEC9]">
              <tr>
                <th className="py-3 px-4">Item &amp; Reference</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Current Vault Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3ECE1] text-[#4E383B]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-[#8E8179]">
                    {lowStockOnly
                      ? 'All active catalog pieces are above their safe reorder thresholds.'
                      : 'No active inventory items match your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((product, idx) => {
                  const isEditing = stockEdits[product.id] !== undefined;
                  const currentStockVal = isEditing ? stockEdits[product.id] : product.stock;
                  const isLow = product.stock <= product.lowStockThreshold;

                  return (
                    <motion.tr
                      key={product.id}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.02, ease: luxuryEase }}
                      onClick={() => setSelectedProduct(product)}
                      className="hover:bg-[#FCF9F4] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            onError={handleImageError}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover border border-[#E5DACB] shrink-0 group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[#2B1218] group-hover:text-[#6E2634] transition-colors truncate max-w-[220px]">
                                {product.title || product.name}
                              </span>
                              {product.verificationStatus === 'approved' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-emerald-800 border border-emerald-200 shadow-sm backdrop-blur-md">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  QC Verified
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-[#7A6B66]">
                              {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#6E5C57]">{product.category}</td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-[#2B1218] tabular-nums">
                        ₹{product.price.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#6E5C57] tabular-nums">
                        ≤ {product.lowStockThreshold} units
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center border border-[#E5DACB] rounded-lg bg-white overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStockChange(product.id, currentStockVal - 1);
                              }}
                              className="px-2.5 py-1 text-[#6E5C57] hover:text-[#2B1218] hover:bg-[#F5EFE6] cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={currentStockVal}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleStockChange(product.id, e.target.valueAsNumber)
                              }
                              className="w-12 text-center bg-transparent text-[#2B1218] font-mono text-xs focus:outline-none tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStockChange(product.id, currentStockVal + 1);
                              }}
                              className="px-2.5 py-1 text-[#6E5C57] hover:text-[#2B1218] hover:bg-[#F5EFE6] cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {product.stock === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                              OUT OF STOCK
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#EFE0E2] text-[#6E2634]">
                              LOW
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveStock(product.id);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#3A101C] hover:bg-[#4F1627] text-[#FAF5EE] font-medium text-xs inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5 text-[#C4A46B]" />
                            <span>Save</span>
                          </button>
                        ) : savedSuccessId === product.id ? (
                          <span className="text-[#3A101C] text-xs inline-flex items-center gap-1 font-mono font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#A68449]" />
                            Saved
                          </span>
                        ) : (
                          <span className="text-[#8E8179] text-[11px] font-mono">In Sync</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </PopUpItem>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </PopUpContainer>
  );
};
