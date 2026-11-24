import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  Package, 
  Search, 
  Plus, 
  Archive, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  SlidersHorizontal,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, VerificationStage } from '../../types';
import { ProductDetailModal } from './ProductDetailModal';
import { getProductImage, handleImageError } from '../../utils/productImages';
import { PopUpContainer, PopUpItem } from '../common/MotionPrimitives';

const luxuryEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ProductsView: React.FC = () => {
  const { 
    products, 
    archiveProduct, 
    restoreProduct, 
    deleteProduct, 
    setOpenAddProductWizard,
    resubmitProductEvidence,
    activeSubTab
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(activeSubTab === 'archived' ? 'archived' : 'all');
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [productForEvidence, setProductForEvidence] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (activeSubTab === 'archived') {
      setSelectedStatusFilter('archived');
    } else if (activeSubTab === 'all') {
      setSelectedStatusFilter('all');
    }
  }, [activeSubTab]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProductDetail(null);
        setShowEvidenceModal(false);
        setProductForEvidence(null);
        setProductToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories: (ProductCategory | 'All')[] = ['All', 'Watches', 'Electronics', 'Apparel', 'Accessories', 'Other'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    
    const isArchived = String(product.status || '').toLowerCase() === 'archived';
    const isApproved = String(product.verificationStatus || '').toLowerCase() === 'approved';
    const isRejected = String(product.verificationStatus || '').toLowerCase() === 'rejected';
    const isPending = !isApproved && !isRejected;

    const matchesStatus = 
      selectedStatusFilter === 'all' 
        ? !isArchived 
        : selectedStatusFilter === 'verified'
        ? isApproved && !isArchived
        : selectedStatusFilter === 'pending'
        ? isPending && !isArchived
        : selectedStatusFilter === 'flagged'
        ? isRejected && !isArchived
        : selectedStatusFilter === 'archived' 
        ? isArchived
        : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenEvidence = (product: Product) => {
    setProductForEvidence(product);
    setShowEvidenceModal(true);
    setEvidenceNote('');
  };

  const handleEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForEvidence) return;
    resubmitProductEvidence(productForEvidence.id, evidenceNote || 'High-resolution macro photos and movement certificates attached.');
    setShowEvidenceModal(false);
    setProductForEvidence(null);
  };

  const getVerificationBadge = (stage: VerificationStage) => {
    switch (stage) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-emerald-800 border border-emerald-200 shadow-sm backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>QC Verified</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold text-rose-900 bg-rose-50/95 border border-rose-200 backdrop-blur-xs shadow-2xs">
            <XCircle className="w-3 h-3 text-rose-700" />
            QC Rejected
          </span>
        );
      case 'additional_evidence':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold text-[#B5613D] bg-[#EFE5D3]/95 border border-[#D3C8B7] backdrop-blur-xs shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-[#B5613D]" />
            Needs Evidence
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold text-[#6B5344] bg-[#FBF9F5]/95 border border-[#D3C8B7] backdrop-blur-xs shadow-2xs">
            <Clock className="w-3 h-3 text-[#B5613D]" />
            Under Review
          </span>
        );
    }
  };

  return (
    <PopUpContainer className="space-y-6">
      {/* Header with Title and Add Product */}
      <PopUpItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#B5613D] font-bold block mb-1">
            MERCHANT CATALOG
          </span>
          <h1 className="font-display text-[1.875rem] sm:text-[2.5rem] leading-[1.15] font-semibold tracking-tight text-[#352013] flex items-center gap-2.5">
            <span>Atelier Catalog &amp; Listings</span>
          </h1>
          <p className="text-[0.9375rem] text-[#6B5344] mt-0.5 leading-relaxed">
            Manage authenticated inventory, review verification status, and update stock specifications.
          </p>
        </div>

        <motion.button
          whileHover={shouldReduceMotion ? undefined : { y: -1 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          onClick={() => setOpenAddProductWizard(true)}
          className="px-5 py-2.5 bg-[#384D35] hover:bg-[#2D3C25] text-[#FFFBF2] font-semibold text-xs rounded-full shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Piece</span>
        </motion.button>
      </PopUpItem>

      {/* Filter and Search Bar */}
      <PopUpItem className="p-4 sm:p-5 rounded-[1.75rem] bg-[#FBF9F5] border border-[#D3C8B7] shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#7A6252]" />
            <input
              type="text"
              placeholder="Search by title, reference SKU, description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F3ECE0]/70 border border-[#D3C8B7] rounded-full text-xs text-[#352013] placeholder-[#8C7362] focus:outline-none focus:border-[#B5613D] focus:bg-[#FBF9F5] transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full self-start md:self-auto overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedStatusFilter === 'all' 
                  ? 'bg-[#0A22B8] text-white font-bold shadow-xs' 
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              All Lots ({products.filter(p => p.status !== 'archived').length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('verified')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedStatusFilter === 'verified' 
                  ? 'bg-[#0A22B8] text-white font-bold shadow-xs' 
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              QC Verified ({products.filter(p => p.verificationStatus === 'approved' && p.status !== 'archived').length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedStatusFilter === 'pending' 
                  ? 'bg-[#0A22B8] text-white font-bold shadow-xs' 
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Pending QC ({products.filter(p => p.verificationStatus !== 'approved' && p.verificationStatus !== 'rejected' && p.status !== 'archived').length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('flagged')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedStatusFilter === 'flagged' 
                  ? 'bg-[#0A22B8] text-white font-bold shadow-xs' 
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              QC Flagged ({products.filter(p => p.verificationStatus === 'rejected' && p.status !== 'archived').length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('archived')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedStatusFilter === 'archived' 
                  ? 'bg-[#0A22B8] text-white font-bold shadow-xs' 
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Archived ({products.filter(p => p.status === 'archived').length})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-xs text-[#6B5344] flex items-center gap-1.5 shrink-0 font-medium mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#B5613D]" />
            Category:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#B5613D] text-[#FFFBF2] shadow-2xs font-semibold'
                  : 'text-[#6B5344] hover:text-[#352013] bg-[#EFE5D3]/70 border border-[#D3C8B7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </PopUpItem>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <PopUpItem className="p-12 rounded-[1.75rem] bg-[#FBF9F5] border border-dashed border-[#D3C8B7] text-center space-y-3">
          <Package className="w-10 h-10 text-[#96A685] mx-auto" />
          <h3 className="font-display text-[1.25rem] leading-[1.3] font-medium text-[#352013]">
            No products match your criteria
          </h3>
          <p className="text-[0.9375rem] text-[#6B5344] max-w-sm mx-auto leading-relaxed">
            Try adjusting your search query, clearing filters, or list a new item in your atelier catalog.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedStatusFilter('all');
            }}
            className="text-xs text-[#B5613D] font-semibold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </PopUpItem>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product, idx) => {
            const isLowStock = product.stock <= product.lowStockThreshold;

            return (
              <PopUpItem 
                key={product.id}
                onClick={() => setSelectedProductDetail(product)}
                className="rounded-[1.75rem] bg-[#FBF9F5] border border-[#D3C8B7] hover:border-[#B5613D]/70 transition-all overflow-hidden flex flex-col shadow-2xs group cursor-pointer"
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-4/3 bg-[#EFE5D3] overflow-hidden">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    onError={handleImageError}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {getVerificationBadge(product.verificationStatus)}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FBF9F5]/95 backdrop-blur-md text-[#352013] border border-[#D3C8B7] shadow-2xs">
                      {product.category}
                    </span>
                  </div>

                  {isLowStock && product.status === 'active' && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#B5613D] text-[#FFFBF2] shadow-2xs">
                        LOW STOCK ({product.stock})
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#6B5344] mb-1">
                      <span className="font-mono text-[11px]">{product.sku}</span>
                      <span className="text-[11px]">
                        Stock: <span className="font-mono font-semibold text-[#352013] tabular-nums">{product.stock}</span>
                      </span>
                    </div>

                    <h3 className="font-display font-medium text-[#352013] text-[1.25rem] leading-[1.3] line-clamp-1 group-hover:text-[#B5613D] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[0.9375rem] text-[#6B5344] line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Reviewer Note Banner if Rejected / Needs Evidence */}
                  {(product.verificationStatus === 'rejected' || product.verificationStatus === 'additional_evidence') && (
                    <div className="p-3 rounded-2xl bg-[#EFE5D3] border border-[#D3C8B7] text-[11px] text-[#352013] space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-[#B5613D]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#B5613D]" />
                        <span>QC Specialist Note:</span>
                      </div>
                      <p className="text-[#4A2E1B] line-clamp-2">
                        {product.reviewerNotes}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEvidence(product);
                        }}
                        className="text-[10px] font-mono text-[#384D35] font-bold hover:underline cursor-pointer block pt-0.5"
                      >
                        Submit Evidence Document ➔
                      </button>
                    </div>
                  )}

                  {/* Price & Actions Row */}
                  <div className="pt-3 border-t border-[#E3D8C4] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#7A6252] block">Price</span>
                      <span className="text-base font-bold font-mono text-[#352013] tabular-nums">
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductDetail(product);
                        }}
                        className="p-2 rounded-full text-[#6B5344] hover:text-[#384D35] hover:bg-[#EFE5D3] transition-colors cursor-pointer"
                        title="View Full Specifications"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {String(product.status || '').toLowerCase() === 'active' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveProduct(product.id);
                          }}
                          className="p-2 rounded-full text-[#6B5344] hover:text-[#B5613D] hover:bg-[#EFE5D3] transition-colors cursor-pointer"
                          title="Archive Listing"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreProduct(product.id);
                          }}
                          className="p-2 rounded-full text-[#6B5344] hover:text-[#384D35] hover:bg-[#A9B89C]/35 transition-colors cursor-pointer"
                          title="Restore Listing"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToDelete(product);
                        }}
                        className="p-2 rounded-full text-[#6B5344] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </PopUpItem>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
      />

      {/* QC Resubmission Modal */}
      <AnimatePresence>
        {showEvidenceModal && productForEvidence && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: luxuryEase }}
            onClick={() => setShowEvidenceModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#352013]/60 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: luxuryEase }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[#FBF9F5] border border-[#D3C8B7] rounded-[1.75rem] p-6 shadow-2xl relative space-y-4 text-[#352013]"
            >
              <h3 className="text-lg font-bold font-serif text-[#352013]">
                Submit Supplemental QC Evidence
              </h3>
              <p className="text-xs text-[#6B5344]">
                Provide photographic provenance, macro dial shots, or certificates requested by the atelier authenticator.
              </p>

              <form onSubmit={handleEvidenceSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#4A2E1B] mb-1">
                    Evidence Notes &amp; Reference Numbers
                  </label>
                  <textarea
                    rows={3}
                    value={evidenceNote}
                    onChange={e => setEvidenceNote(e.target.value)}
                    placeholder="Detail timegrapher calibration, serial number engraving match, or warranty card verification..."
                    className="w-full px-3.5 py-2.5 bg-[#F3ECE0]/60 border border-[#D3C8B7] rounded-2xl text-xs text-[#352013] placeholder-[#8C7362] focus:outline-none focus:border-[#B5613D] focus:bg-[#FBF9F5]"
                    required
                  />
                </div>

                <div className="p-3 rounded-2xl bg-[#EFE5D3]/60 border border-dashed border-[#D3C8B7] text-center text-xs text-[#6B5344]">
                  <span>Macro_Inspection_Verification_Proof.pdf (Simulated upload ready)</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEvidenceModal(false)}
                    className="px-4 py-2 text-xs text-[#6B5344] hover:text-[#352013] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#384D35] hover:bg-[#2D3C25] text-[#FFFBF2] text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    Submit for Re-evaluation
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setProductToDelete(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#352013]/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: luxuryEase }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#FBF9F5] border border-[#D3C8B7] rounded-[1.75rem] p-6 shadow-2xl relative space-y-4 text-[#352013]"
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-bold text-[#352013]">
                  Remove Lot from Catalog?
                </h3>
                <p className="text-xs text-[#6B5344] leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-[#352013] font-semibold">{productToDelete.name}</strong> ({productToDelete.sku})? This action removes all historical docket references and cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2 rounded-full text-xs text-[#6B5344] hover:text-[#352013] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteProduct(productToDelete.id);
                    setProductToDelete(null);
                  }}
                  className="px-5 py-2.5 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PopUpContainer>
  );
};
