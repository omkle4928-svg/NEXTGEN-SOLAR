import { useState } from 'react';
import { Consumer, UserRole } from '../types';
import { 
  X, 
  Calendar, 
  User as UserIcon, 
  Phone, 
  Mail, 
  FileText, 
  Home, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  Eye, 
  Download,
  Building,
  MapPin,
  MessageSquare,
  RefreshCw,
  Award,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConsumerDetailModalProps {
  consumer: Consumer;
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  onUpdateStatus?: (consumerId: string, status: Consumer['status'], remark: string) => Promise<void>;
  onEdit?: (consumer: Consumer) => void;
}

export default function ConsumerDetailModal({ 
  consumer, 
  isOpen, 
  onClose, 
  userRole, 
  onUpdateStatus,
  onEdit
}: ConsumerDetailModalProps) {
  const [adminStatus, setAdminStatus] = useState<Consumer['status']>(consumer.status);
  const [adminRemark, setAdminRemark] = useState<string>(consumer.remark || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string, title: string } | null>(null);

  if (!isOpen) return null;

  const handleStatusUpdate = async () => {
    if (!onUpdateStatus) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(consumer.id, adminStatus, adminRemark);
    } catch (error) {
      console.error('Failed to update consumer status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: Consumer['status']) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            {status}
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Rejected
          </span>
        );
      case 'Applied':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Applied
          </span>
        );
      case 'Transfer Pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-cyan-600" />
            Transfer Pending
          </span>
        );
      case 'Transfer Applied':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Transfer Applied
          </span>
        );
      case 'Quotation':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <FileText className="w-3.5 h-3.5 mr-1 text-purple-600" />
            Quotation
          </span>
        );
      case 'Loan':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <DollarSign className="w-3.5 h-3.5 mr-1 text-sky-600" />
            Loan Stage
          </span>
        );
      case 'Installed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Sun className="w-3.5 h-3.5 mr-1 text-teal-600" />
            Installed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            In Progress
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Lightbox for viewing photos fullscreen */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button 
              className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 rounded-full bg-slate-800/50 hover:bg-slate-800 transition-all focus:outline-none"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="max-w-4xl max-h-[80vh] relative rounded-xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800" onClick={e => e.stopPropagation()}>
              <img 
                src={lightboxImage.src} 
                alt={lightboxImage.title} 
                className="max-w-full max-h-[75vh] object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-t border-slate-800">
                <span className="font-semibold text-sm">{lightboxImage.title}</span>
                <a 
                  href={lightboxImage.src} 
                  download={`${consumer.name.replace(/\s+/g, '_')}_${lightboxImage.title.replace(/\s+/g, '_')}.jpg`}
                  className="flex items-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden w-full max-w-5xl max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-slate-800">{consumer.name}</h3>
                {getStatusBadge(consumer.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Consumer ID: <span className="font-mono font-semibold">{consumer.consumerId}</span> • Submitted by {consumer.agentName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {(userRole === 'agent' || userRole === 'admin') && onEdit && (
              <button
                onClick={() => {
                  onEdit(consumer);
                  onClose();
                }}
                className="inline-flex items-center text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-xl shadow-sm transition-all cursor-pointer mr-1"
              >
                Edit Lead
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {/* Main 2 Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1 & 2: Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                  <UserIcon className="w-4 h-4 mr-1.5 text-indigo-500" />
                  Basic & Contact Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Consumer Name</span>
                    <span className="text-sm text-slate-700 font-semibold">{consumer.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Consumer ID</span>
                    <span className="text-sm text-slate-700 font-mono font-semibold">{consumer.consumerId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Contact Number</span>
                      <span className="text-sm text-slate-700 font-semibold">{consumer.contactNumber}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Email Address</span>
                      <span className="text-sm text-slate-700 font-semibold break-all">{consumer.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Details Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                  <Home className="w-4 h-4 mr-1.5 text-indigo-500" />
                  Installation & Property Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                  <div className="md:col-span-2">
                    <span className="text-xs text-slate-400 block font-medium flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />Site Address</span>
                    <span className="text-sm text-slate-700 font-medium">{consumer.address}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Landmark</span>
                    <span className="text-sm text-slate-700 font-semibold">{consumer.landmark}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">District</span>
                    <span className="text-sm text-slate-700 font-semibold">{consumer.district}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">PIN Code</span>
                    <span className="text-sm text-slate-700 font-mono font-semibold">{consumer.pin}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Roof Structure</span>
                    <span className="inline-flex mt-1 items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                      {consumer.roofType} Roof
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Solar Load Needed</span>
                    <span className="inline-flex mt-1 items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700">
                      {consumer.loadNeeded} Load
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                  <DollarSign className="w-4 h-4 mr-1.5 text-indigo-500" />
                  Financial & Banking Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">CIBIL Score</span>
                    <span className={`text-sm font-bold ${consumer.cibilScore >= 750 ? 'text-emerald-600' : consumer.cibilScore >= 650 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {consumer.cibilScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Loan Amount Required</span>
                    <span className="text-sm text-slate-700 font-bold">₹{consumer.loanAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Financing Bank</span>
                      <span className="text-sm text-slate-700 font-semibold">{consumer.bank}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Account Number</span>
                    <span className="text-sm text-slate-700 font-mono font-semibold">{consumer.accountNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">IFSC Code</span>
                    <span className="text-sm text-slate-700 font-mono font-semibold">{consumer.ifsc || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Submission Date</span>
                    <span className="text-sm text-slate-700 font-semibold flex items-center mt-0.5">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {consumer.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transfer Details Section (Show only if some fields are populated) */}
              {(consumer.transfer || consumer.transferFromName || consumer.transferTo) && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                    <RefreshCw className="w-4 h-4 mr-1.5 text-indigo-500" />
                    Connection / Property Transfer Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Transfer Status/Process</span>
                      <span className="text-sm text-slate-700 font-medium">{consumer.transfer || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Transfer FROM Name</span>
                      <span className="text-sm text-slate-700 font-semibold">{consumer.transferFromName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Relation with Original Owner</span>
                      <span className="text-sm text-slate-700 font-medium">{consumer.transferFromRelation || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Transfer TO Name</span>
                      <span className="text-sm text-slate-700 font-semibold">{consumer.transferTo || 'N/A'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-xs text-slate-400 block font-medium">Reason for Transfer</span>
                      <span className="text-sm text-slate-700 font-medium italic">"{consumer.reason || 'N/A'}"</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Column 3: Photo Gallery & Admin Actions */}
            <div className="space-y-8 lg:border-l lg:border-slate-100 lg:pl-8">
              {/* KYC Photo Gallery */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-indigo-500" />
                  Uploaded Verification Photos
                </h4>
                <div className="space-y-4">
                  {/* PAN CARD */}
                  <div className="group border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-slate-50 relative">
                    <div className="aspect-[3/2] w-full overflow-hidden bg-slate-100 relative">
                      {consumer.panPhoto ? (
                        <img 
                          src={consumer.panPhoto} 
                          alt="PAN Card" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">No Image Uploaded</div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => setLightboxImage({ src: consumer.panPhoto, title: 'PAN Card Photo' })}
                          className="p-2 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-lg transition-transform focus:outline-none hover:scale-105"
                          title="View Enlarged"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">PAN Card Photo</span>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{consumer.panNumber}</span>
                    </div>
                  </div>

                  {/* AADHAAR CARD FRONT */}
                  <div className="group border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-slate-50 relative">
                    <div className="aspect-[3/2] w-full overflow-hidden bg-slate-100 relative">
                      {consumer.aadhaarPhoto ? (
                        <img 
                          src={consumer.aadhaarPhoto} 
                          alt="Aadhaar Card Front" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">No Image Uploaded</div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => setLightboxImage({ src: consumer.aadhaarPhoto, title: 'Aadhaar Card Front Photo' })}
                          className="p-2 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-lg transition-transform focus:outline-none hover:scale-105"
                          title="View Enlarged"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Aadhaar Front Photo</span>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{consumer.aadhaarNumber}</span>
                    </div>
                  </div>

                  {/* AADHAAR CARD BACK */}
                  <div className="group border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-slate-50 relative">
                    <div className="aspect-[3/2] w-full overflow-hidden bg-slate-100 relative">
                      {consumer.aadhaarPhotoBack ? (
                        <img 
                          src={consumer.aadhaarPhotoBack} 
                          alt="Aadhaar Card Back" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">No Back Image Uploaded</div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        {consumer.aadhaarPhotoBack && (
                          <button 
                            onClick={() => setLightboxImage({ src: consumer.aadhaarPhotoBack, title: 'Aadhaar Card Back Photo' })}
                            className="p-2 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-lg transition-transform focus:outline-none hover:scale-105"
                            title="View Enlarged"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Aadhaar Back Photo</span>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{consumer.aadhaarNumber}</span>
                    </div>
                  </div>

                  {/* HOUSE PHOTO */}
                  <div className="group border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-slate-50 relative">
                    <div className="aspect-[3/2] w-full overflow-hidden bg-slate-100 relative">
                      {consumer.housePhoto ? (
                        <img 
                          src={consumer.housePhoto} 
                          alt="House / Site" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic font-medium">Optional House Photo Not Uploaded</div>
                      )}
                      {consumer.housePhoto && (
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => setLightboxImage({ src: consumer.housePhoto!, title: 'House / Site Roof Photo' })}
                            className="p-2 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-lg transition-transform focus:outline-none hover:scale-105"
                            title="View Enlarged"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">House Roof Photo</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{consumer.loadNeeded}</span>
                    </div>
                  </div>

                  {/* PASSBOOK PHOTO */}
                  <div className="group border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-slate-50 relative">
                    <div className="aspect-[3/2] w-full overflow-hidden bg-slate-100 relative">
                      {consumer.passbookPhoto ? (
                        <img 
                          src={consumer.passbookPhoto} 
                          alt="Bank Passbook / Cancelled Cheque" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic font-medium">Optional Passbook Not Uploaded</div>
                      )}
                      {consumer.passbookPhoto && (
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => setLightboxImage({ src: consumer.passbookPhoto!, title: 'Bank Passbook Photo' })}
                            className="p-2 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-lg transition-transform focus:outline-none hover:scale-105"
                            title="View Enlarged"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Bank Passbook / Cheque</span>
                      <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">Optional</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Decision panel or Agent Display Panel */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                {userRole === 'admin' && onUpdateStatus ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1.5 text-indigo-500" />
                      Lead Action Centre (Admin)
                    </h4>
                    
                    <div className="space-y-1">
                      <label htmlFor="adminStatus" className="block text-xs font-medium text-slate-500">Update Lead Status</label>
                      <select
                        id="adminStatus"
                        value={adminStatus}
                        onChange={(e) => setAdminStatus(e.target.value as Consumer['status'])}
                        className="mt-1 block w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Applied">Applied</option>
                        <option value="Transfer Pending">Transfer Pending</option>
                        <option value="Transfer Applied">Transfer Applied</option>
                        <option value="Quotation">Quotation</option>
                        <option value="Loan">Loan</option>
                        <option value="Installed">Installed</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="adminRemark" className="block text-xs font-medium text-slate-500">Admin Remarks</label>
                      <textarea
                        id="adminRemark"
                        rows={3}
                        value={adminRemark}
                        onChange={(e) => setAdminRemark(e.target.value)}
                        placeholder="Provide feedback, instructions or approval details..."
                        className="mt-1 block w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleStatusUpdate}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 rounded-xl transition-all shadow-md hover:shadow-indigo-100 focus:outline-none"
                    >
                      {isUpdating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                          Saving...
                        </>
                      ) : (
                        'Save Lead Updates'
                      )}
                    </button>
                  </div>
                ) : (
                  /* Agent Feedback Viewer */
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1.5 text-indigo-500" />
                      Admin Remarks & Comments
                    </h4>
                    {consumer.remark ? (
                      <p className="text-xs text-slate-600 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-100">
                        "{consumer.remark}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No feedback provided by the administrator yet.</p>
                    )}
                    <div className="text-[10px] text-slate-400 mt-2 font-mono flex justify-between items-center bg-white/50 border border-slate-100 rounded-lg p-2">
                      <span>Submitted: {consumer.date}</span>
                      <span>Last Modified: {new Date(consumer.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
