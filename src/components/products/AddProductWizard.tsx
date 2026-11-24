import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  X, 
  Package, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Camera,
  Video,
  FileVideo,
  Check,
  Trash2,
  Play,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCategory, ProductSpecs, AnglePhotos, PackingVideo } from '../../types';
import {
  CATEGORY_QC_ANGLES,
  getCategoryQcAngles,
  getAngleDescription,
  getCategoryFallbackImage,
  getEmptyAnglePhotosForCategory,
  getSampleAnglePhotosForCategory
} from '../../utils/qcAngles';
import { modalDialogVariants, luxuryEase } from '../common/MotionPrimitives';

interface AddProductWizardProps {
  onClose: () => void;
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 24 : -24,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.28, ease: luxuryEase }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 24 : -24,
    opacity: 0,
    transition: { duration: 0.2, ease: luxuryEase }
  })
};

export const AddProductWizard: React.FC<AddProductWizardProps> = ({ onClose }) => {
  const { addProduct, currentSeller } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState<number>(1);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const [name, setName] = useState('');
  const [sku, setSku] = useState(`TM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`);
  const [category, setCategory] = useState<ProductCategory>('Watches');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<number>(5);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(2);
  const [description, setDescription] = useState('');
  
  const [specs, setSpecs] = useState<ProductSpecs>({
    brand: 'Geneve Heritage',
    model: 'Atelier Edition',
    movement: 'Mechanical Automatic Caliber 2026',
    caseMaterial: '316L Surgical Stainless Steel',
    dialColor: 'Midnight Royal Blue',
    condition: 'Brand New In Box'
  });

  const categoryAngles =
    CATEGORY_QC_ANGLES[category.toLowerCase()] ||
    getCategoryQcAngles(category) ||
    CATEGORY_QC_ANGLES.watches;
  const [anglePhotos, setAnglePhotos] = useState<AnglePhotos>(() =>
    getEmptyAnglePhotosForCategory('Watches', false)
  );
  // Actual File objects for multipart/form-data upload directly to Supabase Storage
  const [angleFiles, setAngleFiles] = useState<Record<string, File>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [activeAngleKey, setActiveAngleKey] = useState<string>('dial');
  const [packingVideo, setPackingVideo] = useState<PackingVideo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isStep1Valid = Boolean(
    name.trim() &&
    category &&
    price.trim() !== '' &&
    Number(price) > 0
  );

  const validAngleEntries = categoryAngles.filter(
    slot => (angleFiles[slot.id] || (typeof anglePhotos[slot.id] === 'string' && anglePhotos[slot.id].trim().length > 0))
  );
  const hasAtLeastOnePhoto = validAngleEntries.length > 0;
  const hasAllSixAngles = validAngleEntries.length === 6 && categoryAngles.length === 6;

  // Validation requirements for submission: title, price, and at least 1 photo
  const missingRequirements: string[] = [];
  if (!name.trim()) missingRequirements.push('title');
  if (!price.trim() || Number(price) <= 0) missingRequirements.push('price');
  if (!hasAtLeastOnePhoto) missingRequirements.push('at least 1 photo');

  const canSubmit = missingRequirements.length === 0;
  const disabledHint = !canSubmit
    ? `Enter product ${missingRequirements.join(', ')} to submit`
    : null;

  const handleCategoryChange = (newCat: ProductCategory) => {
    setCategory(newCat);
    const newAngles = getCategoryQcAngles(newCat);
    setAnglePhotos(getEmptyAnglePhotosForCategory(newCat, false));
    setAngleFiles({});
    setVideoFile(null);
    setActiveAngleKey(newAngles[0]?.id || 'front');

    if (newCat === 'Watches') {
      setSpecs({
        brand: 'Geneve Heritage',
        model: 'Royal Atelier Chrono',
        movement: 'Mechanical Automatic',
        caseMaterial: '316L Stainless Steel',
        dialColor: 'Obsidian Navy',
        condition: 'Mint / Unworn'
      });
    } else if (newCat === 'Electronics') {
      setSpecs({
        brand: 'AudioPhile Atelier',
        deviceType: 'Hi-Fi Wireless Headphones',
        technicalSpecs: 'Beryllium Drivers, 5Hz-45kHz, Lossless',
        warrantyPeriod: '24 Months International',
        condition: 'Factory Sealed'
      });
    } else if (newCat === 'Apparel') {
      setSpecs({
        brand: 'Dubois Sartorial',
        material: '100% Cashmere',
        size: 'EU 50 / US 40R',
        color: 'Royal Navy',
        condition: 'Brand New with Tags'
      });
    } else {
      setSpecs({
        brand: 'Tuscan Leather Guild',
        material: 'Hand-burnished Full-Grain Leather',
        condition: 'New with Dustbag',
        generalNotes: 'Certified handmade in Florence.'
      });
    }
  };

  const handleAutoFillSampleAngles = () => {
    const samples = getSampleAnglePhotosForCategory(category);
    setAnglePhotos(samples);
  };

  const handleAttachSamplePackingClip = () => {
    setPackingVideo({
      fileName: `TM-SEAL-${sku}.mp4`,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      uploadedAt: new Date().toISOString()
    });
  };

  const handlePhotoUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store actual binary File object for multipart/form-data upload to Supabase Storage
    setAngleFiles(prev => ({ ...prev, [key]: file }));

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 720;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setAnglePhotos(prev => ({ ...prev, [key]: rawDataUrl }));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.75);
          setAnglePhotos(prev => ({ ...prev, [key]: compressedUrl }));
        } catch {
          setAnglePhotos(prev => ({ ...prev, [key]: rawDataUrl }));
        }
      };
      img.onerror = () => {
        setAnglePhotos(prev => ({ ...prev, [key]: rawDataUrl }));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setPackingVideo({
      fileName: file.name,
      videoUrl: url,
      uploadedAt: new Date().toISOString()
    });
  };

  const handleNextStep = () => {
    setDirection(1);
    setStep(prev => Math.min(4, prev + 1) as 1 | 2 | 3 | 4);
  };

  const handlePrevStep = () => {
    setDirection(-1);
    setStep(prev => Math.max(1, prev - 1) as 1 | 2 | 3 | 4);
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('title', name.trim());
      formData.append('name', name.trim());
      formData.append('sku', sku);
      formData.append('category', category);
      formData.append('brand', specs.brand || 'Atelier Dubois Horlogerie');
      formData.append('condition', specs.condition || 'Brand New In Box');
      formData.append('price', String(Number(price) || 0));
      formData.append('stock', String(Number(stock) || 1));
      formData.append('lowStockThreshold', String(Number(lowStockThreshold) || 2));
      formData.append('description', description.trim() || `Certified authentic ${category.toLowerCase()} curated exclusively for TrueMotion QC verified marketplace.`);
      formData.append('specs', JSON.stringify(specs));
      const sId = currentSeller?.id || '';
      formData.append('seller_id', sId);
      formData.append('sellerId', sId);

      // Append binary files for all 6 macro angle captures
      const samplePhotosList: string[] = [];
      categoryAngles.forEach((slot, index) => {
        const file = angleFiles[slot.id];
        if (file) {
          formData.append('macroPhotos', file, `macro-${index}-${slot.id}.jpg`);
        } else if (anglePhotos[slot.id]) {
          samplePhotosList.push(anglePhotos[slot.id]);
        }
      });

      if (samplePhotosList.length > 0) {
        formData.append('samplePhotos', JSON.stringify(samplePhotosList));
      }

      // Append condition / tamper-seal video
      if (videoFile) {
        formData.append('conditionVideo', videoFile, videoFile.name);
      } else if (packingVideo?.videoUrl) {
        formData.append('conditionVideoUrl', packingVideo.videoUrl);
      }

      const res = await addProduct(formData);
      if (res && res.success === false) {
        setSubmitError(res.error || 'Failed to list product in Supabase.');
        setIsSubmitting(false);
        return;
      }

      onClose();
    } catch (err: any) {
      console.error('Submit error:', err);
      setSubmitError(err?.message || 'Error uploading product to Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: luxuryEase }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#352013]/60 backdrop-blur-xs"
    >
      <motion.div 
        variants={modalDialogVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#F3ECE0] border border-[#D3C8B7] rounded-[1.75rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#352013]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D3C8B7] flex items-center justify-between shrink-0 bg-[#FBF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#A9B89C]/35 border border-[#96A685] text-[#384D35] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[1.75rem] leading-[1.2] font-display font-medium text-[#352013]">
                List New Atelier Piece
              </h2>
              <p className="text-[11px] text-[#6B5344] font-mono">
                Step {step} of 4: {
                  step === 1 ? 'Primary Details' :
                  step === 2 ? 'Authentication Specifications' :
                  step === 3 ? 'Proof & Photographic Assets' : 'Final Verification Review'
                }
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#6B5344] hover:text-[#352013] hover:bg-[#EFE5D3] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Progress Bar */}
        <div className="h-1.5 bg-[#E3D8C4] w-full shrink-0 overflow-hidden">
          <motion.div 
            className="h-full bg-[#B5613D]"
            initial={false}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.35, ease: luxuryEase }}
          />
        </div>

        {/* Content Body with Step Transitions */}
        <div className="p-6 overflow-y-auto flex-1 text-xs relative min-h-[360px]">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={shouldReduceMotion ? undefined : stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <div>
                  <label className="block text-[#4A2E1B] font-semibold mb-1">Item Title / Model Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Handcrafted Stoneware Vessel or Heritage Watch"
                    className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013] placeholder-[#8C7362] focus:outline-none focus:border-[#B5613D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#4A2E1B] font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => handleCategoryChange(e.target.value as ProductCategory)}
                      className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013] focus:outline-none focus:border-[#B5613D]"
                    >
                      <option value="Watches">Watches</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#4A2E1B] font-semibold mb-1">Assigned SKU / Reference</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#EFE5D3]/60 border border-[#D3C8B7] rounded-2xl text-[#352013] font-mono focus:outline-none focus:border-[#B5613D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#4A2E1B] font-semibold mb-1">Retail Price (₹ INR)</label>
                    <input
                      type="number"
                      min="1"
                      value={price}
                      placeholder="e.g. 2450"
                      onChange={e => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013] placeholder-[#8C7362] font-mono focus:outline-none focus:border-[#B5613D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4A2E1B] font-semibold mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={e => setStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013] font-mono focus:outline-none focus:border-[#B5613D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4A2E1B] font-semibold mb-1">Low Stock Alert</label>
                    <input
                      type="number"
                      min="0"
                      value={lowStockThreshold}
                      onChange={e => setLowStockThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013] font-mono focus:outline-none focus:border-[#B5613D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#4A2E1B] font-semibold mb-1">Description &amp; Provenance</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Detail craftsman origin, material authenticity, serial references, and accompanying packaging..."
                    className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013] placeholder-[#8C7362] focus:outline-none focus:border-[#B5613D]"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={shouldReduceMotion ? undefined : stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <div className="p-3.5 rounded-2xl bg-[#A9B89C]/35 border border-[#96A685] text-[#384D35] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#384D35] shrink-0" />
                  <span>
                    QC authenticator specifications for <strong className="text-[#352013]">{category}</strong>
                  </span>
                </div>

                {category === 'Watches' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#4A2E1B] font-semibold mb-1">Manufacture / Brand</label>
                      <input
                        type="text"
                        value={specs.brand || ''}
                        onChange={e => setSpecs({ ...specs, brand: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#4A2E1B] font-semibold mb-1">Movement Type</label>
                      <input
                        type="text"
                        value={specs.movement || ''}
                        onChange={e => setSpecs({ ...specs, movement: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#4A2E1B] font-semibold mb-1">Case Material</label>
                      <input
                        type="text"
                        value={specs.caseMaterial || ''}
                        onChange={e => setSpecs({ ...specs, caseMaterial: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#4A2E1B] font-semibold mb-1">Dial Color</label>
                      <input
                        type="text"
                        value={specs.dialColor || ''}
                        onChange={e => setSpecs({ ...specs, dialColor: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013]"
                      />
                    </div>
                  </div>
                )}

                {category === 'Electronics' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#4A2E1B] font-semibold mb-1">Device Type</label>
                      <input
                        type="text"
                        value={specs.deviceType || ''}
                        onChange={e => setSpecs({ ...specs, deviceType: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#4A2E1B] font-semibold mb-1">Warranty Term</label>
                      <input
                        type="text"
                        value={specs.warrantyPeriod || ''}
                        onChange={e => setSpecs({ ...specs, warrantyPeriod: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[#4A2E1B] font-semibold mb-1">Technical Specifications</label>
                      <input
                        type="text"
                        value={specs.technicalSpecs || ''}
                        onChange={e => setSpecs({ ...specs, technicalSpecs: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013]"
                      />
                    </div>
                  </div>
                )}

                {(category === 'Apparel' || category === 'Accessories' || category === 'Other') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#4A2E1B] font-semibold mb-1">Material Composition</label>
                      <input
                        type="text"
                        value={specs.material || ''}
                        onChange={e => setSpecs({ ...specs, material: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#4A2E1B] font-semibold mb-1">Size / Dimension</label>
                      <input
                        type="text"
                        value={specs.size || ''}
                        onChange={e => setSpecs({ ...specs, size: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[#4A2E1B] font-semibold mb-1">Physical Condition</label>
                  <input
                    type="text"
                    value={specs.condition || 'Brand New In Box'}
                    onChange={e => setSpecs({ ...specs, condition: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl text-[#352013]"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={shouldReduceMotion ? undefined : stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5"
              >
                {/* 6-Angle Photography Header & Fast Auto-Fill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                  <div>
                    <label className="block text-[#352013] font-bold text-xs uppercase tracking-wider">
                      6-Angle Authentication Photography &middot; {category}
                    </label>
                    <p className="text-[11px] text-[#6B5344]">
                      Category-tailored angles transmitted directly to the Admin TMQC inspection pipeline.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillSampleAngles}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-full bg-[#A9B89C]/40 hover:bg-[#A9B89C]/60 text-[#384D35] border border-[#96A685] text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#384D35]" />
                    <span>Quick-Fill Studio Angles</span>
                  </button>
                </div>

                {/* 6-Slot Interactive Selector Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {categoryAngles.map((slot, idx) => {
                    const isSelected = activeAngleKey === slot.id;
                    const isFilled = Boolean(anglePhotos[slot.id]);
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setActiveAngleKey(slot.id)}
                        className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer relative flex flex-col justify-between min-h-[70px] ${
                          isSelected
                            ? 'bg-[#384D35] text-[#FFFBF2] border-[#384D35] shadow-xs'
                            : isFilled
                            ? 'bg-[#FBF9F5] hover:bg-[#EFE5D3] text-[#352013] border-[#96A685]'
                            : 'bg-[#FBF9F5]/70 hover:bg-[#FBF9F5] text-[#6B5344] border-[#D3C8B7]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[#EFE5D3]' : 'text-[#7A6252]'}`}>
                            0{idx + 1}
                          </span>
                          {isFilled && (
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                              isSelected ? 'bg-[#A9B89C] text-[#352013]' : 'bg-[#A9B89C]/45 text-[#384D35]'
                            }`}>
                              ✓
                            </span>
                          )}
                        </div>
                        <div>
                          <div className={`font-semibold text-[11px] leading-tight line-clamp-2 ${isSelected ? 'text-[#FFFBF2]' : 'text-[#352013]'}`}>
                            {slot.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Slot Detailed Uploader / Preview */}
                {(() => {
                  const activeIndex = Math.max(0, categoryAngles.findIndex(s => s.id === activeAngleKey));
                  const currentSlot = categoryAngles[activeIndex] || categoryAngles[0];
                  const currentPhoto = anglePhotos[currentSlot.id];
                  const slotDescription = getAngleDescription(category, currentSlot.id);

                  return (
                    <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#D3C8B7] space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#B5613D] font-bold">
                            ACTIVE ANGLE 0{activeIndex + 1}: {currentSlot.label}
                          </span>
                          <p className="text-xs text-[#6B5344]">{slotDescription}</p>
                        </div>
                        {currentPhoto && (
                          <button
                            type="button"
                            onClick={() => {
                              setAnglePhotos(prev => ({ ...prev, [currentSlot.id]: '' }));
                              setAngleFiles(prev => {
                                const next = { ...prev };
                                delete next[currentSlot.id];
                                return next;
                              });
                            }}
                            className="text-[11px] text-rose-700 hover:text-rose-900 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {currentPhoto ? (
                        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-xl overflow-hidden bg-[#EFE5D3] border border-[#D3C8B7]">
                          <img
                            src={currentPhoto}
                            alt={currentSlot.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-[#352013]/85 backdrop-blur-xs text-[#F3ECE0] px-2.5 py-1 rounded-full text-[10px] font-mono flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[#A9B89C]" />
                            <span>0{activeIndex + 1} &middot; {currentSlot.label.toUpperCase()} ATTACHED</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-2 right-2 bg-[#FBF9F5]/95 hover:bg-[#FBF9F5] text-[#352013] px-3 py-1.5 rounded-full text-xs font-medium shadow-sm transition-colors cursor-pointer border border-[#D3C8B7]"
                          >
                            Replace Angle
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-[16/9] sm:aspect-[21/9] w-full rounded-xl border-2 border-dashed border-[#D3C8B7] hover:border-[#B5613D] bg-[#F3ECE0]/50 hover:bg-[#FBF9F5] transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center space-y-2"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#A9B89C]/35 text-[#384D35] flex items-center justify-center">
                            <Camera className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-semibold text-xs text-[#352013] block">
                              Upload 0{activeIndex + 1} &middot; {currentSlot.label}
                            </span>
                            <span className="text-[11px] text-[#7A6252] block max-w-sm mt-0.5">
                              High-resolution macro capture • Drag &amp; drop or click to browse
                            </span>
                          </div>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(currentSlot.id, e)}
                        className="hidden"
                      />
                    </div>
                  );
                })()}

                {!hasAtLeastOnePhoto ? (
                  <div className="px-3.5 py-2.5 rounded-2xl bg-[#B5613D]/10 border border-[#B5613D]/30 text-[#9E4F2F] text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#B5613D]" />
                    <span>Upload at least 1 photo or studio angle to proceed ({validAngleEntries.length}/6 angles uploaded).</span>
                  </div>
                ) : (
                  <div className="px-3.5 py-2 rounded-2xl bg-[#A9B89C]/25 border border-[#96A685] text-[#384D35] text-xs font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#384D35]" />
                      <span>{validAngleEntries.length} angle{validAngleEntries.length > 1 ? 's' : ''} uploaded. Minimum photo requirement met!</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#6B5344]">{validAngleEntries.length}/6 angles</span>
                  </div>
                )}

                {/* Mandatory Packing & Tamper-Seal Video Card */}
                <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#D3C8B7] space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3D8C4] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#A9B89C]/35 border border-[#96A685] flex items-center justify-center text-[#384D35]">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#352013]">
                            Packing &amp; Tamper-Seal Video
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#EFE5D3] text-[#B5613D] border border-[#D3C8B7] font-semibold">
                            Mandatory For TMQC
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B5344]">
                          Unedited clip recording the piece, packaging, serial tag, and holographic seal application.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAttachSamplePackingClip}
                        className="px-3 py-1 rounded-full bg-[#EFE5D3] hover:bg-[#E3D8C4] text-[#352013] border border-[#D3C8B7] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <FileVideo className="w-3.5 h-3.5 text-[#B5613D]" />
                        <span>Attach Sample Packing Clip</span>
                      </button>
                    </div>
                  </div>

                  {packingVideo ? (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden bg-[#352013] max-h-48">
                        <video
                          controls
                          src={packingVideo.videoUrl}
                          className="w-full h-44 object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-2 text-[#384D35] font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[240px] font-medium text-[#352013]">{packingVideo.fileName}</span>
                          <span className="text-[#7A6252]">• Attached &amp; Ready for Admin TMQC</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPackingVideo(null);
                            setVideoFile(null);
                          }}
                          className="text-rose-700 hover:text-rose-900 text-[11px] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Video</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="p-4 rounded-xl border border-dashed border-[#D3C8B7] hover:border-[#B5613D] bg-[#F3ECE0]/60 hover:bg-[#FBF9F5] transition-all cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FBF9F5] border border-[#D3C8B7] flex items-center justify-center text-[#384D35]">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-xs text-[#352013] block">
                            Attach Tamper-Seal Video Clip (.mp4, .mov, max 100MB)
                          </span>
                          <span className="text-[11px] text-[#7A6252] block">
                            Direct transmission to Admin Verification specialist queue
                          </span>
                        </div>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-[#FBF9F5] border border-[#D3C8B7] text-xs font-medium text-[#352013] shadow-2xs">
                        Browse Video
                      </span>
                    </div>
                  )}

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={shouldReduceMotion ? undefined : stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                {/* Primary Card Preview */}
                <div className="p-4 rounded-2xl bg-[#A9B89C]/35 border border-[#96A685] flex items-center gap-4">
                  <img 
                    src={anglePhotos[categoryAngles[0]?.id || 'front'] || getCategoryFallbackImage(category)} 
                    alt="preview" 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-[#96A685] shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase text-[#384D35] font-bold">{category} • {sku}</span>
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#EFE5D3] text-[#B5613D] border border-[#D3C8B7] font-semibold">
                        Status: Draft (Pending Admin QC)
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#352013] truncate mt-0.5 font-serif">{name || 'Unnamed Atelier Listing'}</h3>
                    <div className="text-xs font-mono font-semibold text-[#384D35] mt-0.5 tabular-nums">
                      ₹{(Number(price) || 0).toLocaleString()} • Stock: {stock} units
                    </div>
                  </div>
                </div>

                {/* 6-Angle Photography Review Strip */}
                <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B5344] font-semibold flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#B5613D]" />
                      <span>6 AUTHENTICATION ANGLES TRANSMITTED ({category.toUpperCase()})</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#384D35] font-semibold">
                      {categoryAngles.filter(s => Boolean(anglePhotos[s.id])).length}/6 Angles Captured
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {categoryAngles.map((slot, idx) => {
                      const photo = anglePhotos[slot.id];
                      return (
                        <div key={slot.id} className="space-y-1">
                          <div className="aspect-square rounded-xl overflow-hidden border border-[#D3C8B7] bg-[#F3ECE0] relative group">
                            {photo ? (
                              <img src={photo} alt={slot.label} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-[#EFE5D3]/60 text-[#8C7362]">
                                <Camera className="w-4 h-4 text-[#A99382] mb-0.5" />
                                <span className="text-[8px] font-mono">Pending</span>
                              </div>
                            )}
                            {photo && (
                              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#384D35] text-[#FFFBF2] flex items-center justify-center text-[8px]">
                                ✓
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-[#6B5344] block truncate text-center font-medium" title={slot.label}>
                            0{idx + 1}. {slot.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Packing Video Review Card */}
                <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-4 space-y-2 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B5344] font-semibold flex items-center gap-1.5">
                    <FileVideo className="w-3.5 h-3.5 text-[#B5613D]" />
                    <span>PACKING &amp; TAMPER-SEAL EVIDENCE</span>
                  </span>
                  {packingVideo ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#A9B89C]/25 border border-[#96A685]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#384D35] text-[#FFFBF2] flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-[#352013] block">{packingVideo.fileName}</span>
                          <span className="text-[10px] font-mono text-[#384D35]">Transmitted to Admin TMQC Review Queue</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#A9B89C]/45 text-[#384D35] border border-[#96A685] font-semibold">
                        Verified Attached
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#EFE5D3] border border-[#D3C8B7] text-[#4A2E1B] text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#B5613D] shrink-0" />
                      <span>No tamper-seal video attached. External admin verification may request additional physical evidence before approving this lot.</span>
                    </div>
                  )}
                </div>

                {/* Admin External Review Protocol */}
                <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#D3C8B7] space-y-2">
                  <div className="flex items-center gap-2 text-[#384D35] font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#384D35]" />
                    <span>External Admin TMQC Verification Protocol</span>
                  </div>
                  <p className="text-[#6B5344] leading-relaxed text-[11px]">
                    Upon clicking submit, this piece will immediately be created under <strong className="text-[#352013]">Draft</strong> with verification status <strong className="text-[#352013]">Submitted</strong>. All 6 angle captures and the tamper-seal packing footage are queued for external Admin Verification. Note: This workstation is seller-facing only; external administrators review and issue approvals via their dedicated platform.
                  </p>
                </div>
                {submitError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
                {!canSubmit && (
                  <div className="p-3.5 rounded-2xl bg-[#B5613D]/10 border border-[#B5613D]/35 text-[#9E4F2F] text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#B5613D] shrink-0" />
                    <span>{disabledHint || 'Please enter product title, price, and at least 1 photo to submit.'}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-4 border-t border-[#D3C8B7] flex items-center justify-between gap-4 shrink-0 bg-[#FBF9F5]">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2 rounded-full bg-[#FBF9F5] hover:bg-[#EFE5D3] text-[#352013] border border-[#D3C8B7] text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#6B5344] hover:text-[#352013] cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={(step === 1 && !isStep1Valid) || (step === 3 && !hasAtLeastOnePhoto)}
              className="px-5 py-2 rounded-full bg-[#384D35] hover:bg-[#2D3C25] disabled:opacity-45 disabled:cursor-not-allowed text-[#FFFBF2] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex flex-col items-end gap-1">
              {!canSubmit && (
                <span className="text-[10px] text-[#B5613D] font-mono">
                  {disabledHint}
                </span>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="px-6 py-2.5 rounded-full bg-[#B5613D] hover:bg-[#9E5231] disabled:opacity-45 disabled:cursor-not-allowed text-[#FFFBF2] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish Listing</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
