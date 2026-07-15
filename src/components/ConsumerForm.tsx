import React, { useState } from 'react';
import { Consumer } from '../types';
import ImageUploader from './ImageUploader';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  User as UserIcon, 
  Zap, 
  RefreshCw, 
  CreditCard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ConsumerFormProps {
  onSubmit: (data: Omit<Consumer, 'id' | 'agentId' | 'agentName' | 'createdAt'>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  initialData?: Consumer;
}

export default function ConsumerForm({ onSubmit, onCancel, isSubmitting, initialData }: ConsumerFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    consumerId: initialData?.consumerId || '',
    panNumber: initialData?.panNumber || '',
    panPhoto: initialData?.panPhoto || '',
    aadhaarNumber: initialData?.aadhaarNumber || '',
    aadhaarPhoto: initialData?.aadhaarPhoto || '',
    aadhaarPhotoBack: initialData?.aadhaarPhotoBack || '',
    contactNumber: initialData?.contactNumber || '',
    email: initialData?.email || '',
    cibilScore: initialData?.cibilScore?.toString() || '',
    roofType: (initialData?.roofType || 'RCC') as 'RCC' | 'TIN',
    housePhoto: initialData?.housePhoto || '',
    loadNeeded: (initialData?.loadNeeded || '3KV') as '3KV' | '5KV' | '10KV' | '20KV',
    
    // Transfer details
    transfer: initialData?.transfer || '',
    reason: initialData?.reason || '',
    transferFromRelation: initialData?.transferFromRelation || '',
    transferFromName: initialData?.transferFromName || '',
    transferTo: initialData?.transferTo || '',

    status: initialData?.status || 'Pending',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    bank: initialData?.bank || '',
    accountNo: initialData?.accountNo || '',
    ifsc: initialData?.ifsc || '',
    address: initialData?.address || '',
    landmark: initialData?.landmark || '',
    district: initialData?.district || '',
    pin: initialData?.pin || '',
    loanAmount: initialData?.loanAmount?.toString() || '',
    remark: initialData?.remark || '',
    passbookPhoto: initialData?.passbookPhoto || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Consumer Name is required';
      if (!formData.consumerId.trim()) newErrors.consumerId = 'Consumer ID is required';
      if (!formData.contactNumber.trim()) {
        newErrors.contactNumber = 'Contact Number is required';
      } else if (!/^\d{10}$/.test(formData.contactNumber.trim())) {
        newErrors.contactNumber = 'Contact Number must be exactly 10 digits';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email Address is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email address format';
      }
      if (!formData.panNumber.trim()) {
        newErrors.panNumber = 'PAN Number is required';
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.panNumber.trim())) {
        newErrors.panNumber = 'Invalid PAN format (e.g. ABCDE1234F)';
      }
      if (!formData.panPhoto) newErrors.panPhoto = 'PAN Card Photo is required';
      if (!formData.aadhaarNumber.trim()) {
        newErrors.aadhaarNumber = 'Aadhaar Number is required';
      } else if (!/^\d{12}$/.test(formData.aadhaarNumber.trim())) {
        newErrors.aadhaarNumber = 'Aadhaar must be exactly 12 digits';
      }
      if (!formData.aadhaarPhoto) newErrors.aadhaarPhoto = 'Aadhaar Card Front Photo is required';
      if (!formData.aadhaarPhotoBack) newErrors.aadhaarPhotoBack = 'Aadhaar Card Back Photo is required';
    }

    if (step === 2) {
      if (!formData.address.trim()) newErrors.address = 'Property Address is required';
      if (!formData.landmark.trim()) newErrors.landmark = 'Landmark is required';
      if (!formData.district.trim()) newErrors.district = 'District is required';
      if (!formData.pin.trim()) {
        newErrors.pin = 'PIN Code is required';
      } else if (!/^\d{6}$/.test(formData.pin.trim())) {
        newErrors.pin = 'PIN Code must be exactly 6 digits';
      }
      if (!formData.roofType) newErrors.roofType = 'Roof type is required';
      if (!formData.loadNeeded) newErrors.loadNeeded = 'Load Needed is required';
    }

    if (step === 4) {
      if (!formData.cibilScore.trim()) {
        newErrors.cibilScore = 'CIBIL Score is required';
      } else {
        const score = parseInt(formData.cibilScore);
        if (isNaN(score) || score < 300 || score > 900) {
          newErrors.cibilScore = 'CIBIL Score must be between 300 and 900';
        }
      }
      if (!formData.bank.trim()) newErrors.bank = 'Bank Name is required';
      if (!formData.loanAmount.trim()) {
        newErrors.loanAmount = 'Loan Amount is required';
      } else {
        const amount = parseFloat(formData.loanAmount);
        if (isNaN(amount) || amount <= 0) {
          newErrors.loanAmount = 'Loan Amount must be a positive number';
        }
      }
      if (!formData.date) newErrors.date = 'Submission Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handlePhotoChange = (fieldName: string, base64: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: base64 }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(4)) {
      onSubmit({
        ...formData,
        cibilScore: parseInt(formData.cibilScore),
        loanAmount: parseFloat(formData.loanAmount),
        roofType: formData.roofType as 'RCC' | 'TIN',
        loadNeeded: formData.loadNeeded as '3KV' | '5KV' | '10KV' | '20KV',
        status: (initialData ? (initialData.status === 'Rejected' ? 'Pending' : initialData.status) : 'Pending') as any
      });
    }
  };

  const steps = [
    { id: 1, title: 'KYC & Contacts', icon: UserIcon },
    { id: 2, title: 'Property & Load', icon: Zap },
    { id: 3, title: 'Transfer Details', icon: RefreshCw },
    { id: 4, title: 'Finance & Bank', icon: CreditCard },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl shadow-xl overflow-hidden max-w-4xl mx-auto backdrop-blur-sm">
      {/* Header with Steps */}
      <div className="bg-slate-950/40 border-b border-slate-800/80 px-6 py-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-white">
              {initialData ? 'Edit Solar Lead Submission' : 'New Solar Lead Submission'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {initialData ? 'Update the consumer installation details or upload missing documents.' : 'Please enter the consumer installation details. Asterisk (*) denotes mandatory fields.'}
            </p>
          </div>
          <div className="text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full self-start md:self-auto">
            STEP {currentStep} OF {totalSteps}
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="mt-6 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />

          <div className="relative flex justify-between z-10">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === currentStep;
              const isCompleted = s.id < currentStep;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    // Only allow clicking steps if they are already validated or completed
                    if (s.id < currentStep) {
                      setCurrentStep(s.id);
                    } else if (s.id > currentStep) {
                      // Validate all steps leading up to target
                      let valid = true;
                      for (let i = currentStep; i < s.id; i++) {
                        if (!validateStep(i)) {
                          valid = false;
                          break;
                        }
                      }
                      if (valid) {
                        setCurrentStep(s.id);
                      }
                    }
                  }}
                  className="flex flex-col items-center focus:outline-none group"
                >
                  <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 font-semibold text-sm transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : isActive 
                          ? 'bg-slate-950 border-indigo-500 text-indigo-400 shadow-lg ring-4 ring-indigo-500/10' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 group-hover:border-slate-750'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[11px] font-medium mt-1.5 hidden md:block ${isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div 
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'TEXTAREA') {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }}
        className="p-6 md:p-8 space-y-6"
      >
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Consumer Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter name as on Aadhaar/PAN"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.name ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="consumerId" className="block text-sm font-medium text-slate-700">
                    Consumer ID / Connection ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="consumerId"
                    name="consumerId"
                    value={formData.consumerId}
                    onChange={handleChange}
                    placeholder="E.g. ELEC9837482"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.consumerId ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.consumerId && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.consumerId}</p>}
                </div>

                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-slate-700">
                    Contact Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    maxLength={10}
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.contactNumber ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.contactNumber && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.contactNumber}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="consumer@example.com"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.email ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="panNumber" className="block text-sm font-medium text-slate-700">
                    PAN Card Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    maxLength={10}
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="ABCDE1234F"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.panNumber ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white uppercase shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.panNumber && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.panNumber}</p>}
                </div>

                <div>
                  <label htmlFor="aadhaarNumber" className="block text-sm font-medium text-slate-700">
                    Aadhaar Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="aadhaarNumber"
                    name="aadhaarNumber"
                    maxLength={12}
                    value={formData.aadhaarNumber}
                    onChange={handleChange}
                    placeholder="12-digit Aadhaar number"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.aadhaarNumber ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.aadhaarNumber && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.aadhaarNumber}</p>}
                </div>
              </div>

              {/* Photos Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div>
                  <ImageUploader
                    id="panPhoto"
                    label="PAN Card Photo"
                    required={true}
                    value={formData.panPhoto}
                    onChange={(base64) => handlePhotoChange('panPhoto', base64)}
                  />
                  {errors.panPhoto && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.panPhoto}</p>}
                </div>

                <div>
                  <ImageUploader
                    id="aadhaarPhoto"
                    label="Aadhaar Front Photo"
                    required={true}
                    value={formData.aadhaarPhoto}
                    onChange={(base64) => handlePhotoChange('aadhaarPhoto', base64)}
                  />
                  {errors.aadhaarPhoto && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.aadhaarPhoto}</p>}
                </div>

                <div>
                  <ImageUploader
                    id="aadhaarPhotoBack"
                    label="Aadhaar Back Photo"
                    required={true}
                    value={formData.aadhaarPhotoBack}
                    onChange={(base64) => handlePhotoChange('aadhaarPhotoBack', base64)}
                  />
                  {errors.aadhaarPhotoBack && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.aadhaarPhotoBack}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                    Property Full Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter complete installation site address"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.address ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.address && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.address}</p>}
                </div>

                <div>
                  <label htmlFor="landmark" className="block text-sm font-medium text-slate-700">
                    Landmark <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="landmark"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Nearby popular spot"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.landmark ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.landmark && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.landmark}</p>}
                </div>

                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-slate-700">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Enter district"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.district ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.district && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.district}</p>}
                </div>

                <div>
                  <label htmlFor="pin" className="block text-sm font-medium text-slate-700">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="pin"
                    name="pin"
                    maxLength={6}
                    value={formData.pin}
                    onChange={handleChange}
                    placeholder="6-digit PIN code"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.pin ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.pin && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.pin}</p>}
                </div>

                <div>
                  <label htmlFor="roofType" className="block text-sm font-medium text-slate-700">
                    Roof Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="roofType"
                    name="roofType"
                    value={formData.roofType}
                    onChange={handleChange}
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="RCC">RCC (Reinforced Cement Concrete)</option>
                    <option value="TIN">TIN Shade / Sheet</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="loadNeeded" className="block text-sm font-medium text-slate-700">
                    Solar Load Needed <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="loadNeeded"
                    name="loadNeeded"
                    value={formData.loadNeeded}
                    onChange={handleChange}
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="3KV">3 KV</option>
                    <option value="5KV">5 KV</option>
                    <option value="10KV">10 KV</option>
                    <option value="20KV">20 KV</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <ImageUploader
                    id="housePhoto"
                    label="House / Site Roof Photo (PoHOT) (Optional)"
                    required={false}
                    value={formData.housePhoto}
                    onChange={(base64) => handlePhotoChange('housePhoto', base64)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start space-x-3 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Transfer Details:</span> This section is optional. Only fill these fields if the solar connection or property ownership is being transferred from another family member or previous owner.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="transfer" className="block text-sm font-medium text-slate-700">
                    Is Connection/Property Transfer Involved?
                  </label>
                  <input
                    type="text"
                    id="transfer"
                    name="transfer"
                    value={formData.transfer}
                    onChange={handleChange}
                    placeholder="Yes / No / Process detail"
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="transferFromName" className="block text-sm font-medium text-slate-700">
                    Transfer FROM Name
                  </label>
                  <input
                    type="text"
                    id="transferFromName"
                    name="transferFromName"
                    value={formData.transferFromName}
                    onChange={handleChange}
                    placeholder="Original owner/account name"
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="transferFromRelation" className="block text-sm font-medium text-slate-700">
                    Relation with Original Owner
                  </label>
                  <input
                    type="text"
                    id="transferFromRelation"
                    name="transferFromRelation"
                    value={formData.transferFromRelation}
                    onChange={handleChange}
                    placeholder="E.g. Father, Mother, Spouse, etc."
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="transferTo" className="block text-sm font-medium text-slate-700">
                    Transfer TO Name
                  </label>
                  <input
                    type="text"
                    id="transferTo"
                    name="transferTo"
                    value={formData.transferTo}
                    onChange={handleChange}
                    placeholder="New proposed owner name"
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
                    Reason for Transfer
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={2}
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Describe the reason for ownership/connection transfer"
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cibilScore" className="block text-sm font-medium text-slate-700">
                    CIBIL Score <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="cibilScore"
                    name="cibilScore"
                    min={300}
                    max={900}
                    value={formData.cibilScore}
                    onChange={handleChange}
                    placeholder="300 - 900"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.cibilScore ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.cibilScore && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.cibilScore}</p>}
                </div>

                <div>
                  <label htmlFor="loanAmount" className="block text-sm font-medium text-slate-700">
                    Loan Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="loanAmount"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleChange}
                    placeholder="Required loan amount in INR"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.loanAmount ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.loanAmount && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.loanAmount}</p>}
                </div>

                <div>
                  <label htmlFor="bank" className="block text-sm font-medium text-slate-700">
                    Proposed Bank <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bank"
                    name="bank"
                    value={formData.bank}
                    onChange={handleChange}
                    placeholder="Proposed bank for loan/financing"
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.bank ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.bank && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.bank}</p>}
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-slate-700">
                    Submission Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={`mt-1.5 block w-full px-4 py-2.5 rounded-xl border ${errors.date ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2`}
                  />
                  {errors.date && <p className="mt-1 text-xs text-rose-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />{errors.date}</p>}
                </div>

                <div>
                  <label htmlFor="accountNo" className="block text-sm font-medium text-slate-700">
                    Consumer Account Number
                  </label>
                  <input
                    type="text"
                    id="accountNo"
                    name="accountNo"
                    value={formData.accountNo}
                    onChange={handleChange}
                    placeholder="Enter account number (optional)"
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="ifsc" className="block text-sm font-medium text-slate-700">
                    Bank IFSC Code
                  </label>
                  <input
                    type="text"
                    id="ifsc"
                    name="ifsc"
                    value={formData.ifsc}
                    onChange={handleChange}
                    placeholder="E.g. SBIN0001234 (optional)"
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <ImageUploader
                    id="passbookPhoto"
                    label="Bank Passbook / Cancelled Cheque Photo (Optional)"
                    required={false}
                    value={formData.passbookPhoto}
                    onChange={(base64) => handlePhotoChange('passbookPhoto', base64)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="remark" className="block text-sm font-medium text-slate-700">
                    Remarks / Additional Comments
                  </label>
                  <textarea
                    id="remark"
                    name="remark"
                    rows={3}
                    value={formData.remark}
                    onChange={handleChange}
                    placeholder="Any specific instructions, special conditions or details"
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={currentStep === 1 ? onCancel : handlePrev}
            className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 rounded-xl transition-all duration-200 shadow-md hover:shadow-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {initialData ? 'Saving Changes...' : 'Submitting Lead...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  {initialData ? 'Save Changes' : 'Submit Solar Lead'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
