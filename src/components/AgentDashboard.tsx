import React, { useState, useEffect } from 'react';
import { User, Consumer } from '../types';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ConsumerForm from './ConsumerForm';
import ConsumerDetailModal from './ConsumerDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  LogOut, 
  Sun, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  User as UserIcon,
  Zap,
  TrendingUp,
  Inbox,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AgentDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AgentDashboard({ user, onLogout }: AgentDashboardProps) {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [isVerified, setIsVerified] = useState<boolean>(user.isVerified ?? true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null);
  const [editingConsumer, setEditingConsumer] = useState<Consumer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Password Change States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const userDocRef = doc(db, 'users', user.id);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setPasswordError('User account not found.');
        setPasswordLoading(false);
        return;
      }

      const userData = userDocSnap.data();
      if (userData.password !== oldPassword) {
        setPasswordError('Incorrect old password.');
        setPasswordLoading(false);
        return;
      }

      await updateDoc(userDocRef, {
        password: newPassword
      });

      setPasswordSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError('Failed to update password. Please check network and try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Fetch consumers submitted by this agent
  const fetchConsumers = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      const consumersRef = collection(db, 'consumers');
      const q = query(consumersRef, where('agentId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      const list: Consumer[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          ...data
        } as Consumer);
      });

      // Sort client-side by creation timestamp (newest first) to avoid index requirement
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setConsumers(list);
    } catch (err) {
      console.error('Error fetching consumers:', err);
      setConnectionError('Could not reach the Cloud Firestore database backend. The system will continue to operate in offline mode.');
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const userDocRef = doc(db, 'users', user.id);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.isVerified !== undefined) {
          setIsVerified(userData.isVerified);
        }

        // Auto-repair missing agentIdCode if not set
        if (!userData.agentIdCode) {
          const usersRef = collection(db, 'users');
          const allAgentsQuery = query(usersRef, where('role', '==', 'agent'));
          const allAgentsSnap = await getDocs(allAgentsQuery);
          const existingCodes = new Set<string>();
          allAgentsSnap.forEach((doc) => {
            const data = doc.data();
            if (data.agentIdCode) {
              existingCodes.add(data.agentIdCode);
            }
          });

          let num = Math.floor(Math.random() * 999) + 1;
          let code = `AS-SA${String(num).padStart(3, '0')}`;
          let attempts = 0;
          while (existingCodes.has(code) && attempts < 1000) {
            num = Math.floor(Math.random() * 999) + 1;
            code = `AS-SA${String(num).padStart(3, '0')}`;
            attempts++;
          }

          await updateDoc(userDocRef, {
            agentIdCode: code
          });
          
          user.agentIdCode = code; // update memory ref so display matches
        } else if (!user.agentIdCode) {
          user.agentIdCode = userData.agentIdCode; // update memory ref
        }
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
    }
  };

  useEffect(() => {
    fetchConsumers();
    checkVerificationStatus();
  }, [user.id]);

  const handleFormSubmit = async (formData: Omit<Consumer, 'id' | 'agentId' | 'agentName' | 'createdAt'>) => {
    if (!isVerified) {
      setFormError('Your account is not verified. Please contact administrator to activate.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      if (editingConsumer) {
        const consumerDocRef = doc(db, 'consumers', editingConsumer.id);
        const updatedConsumer = {
          ...formData,
          agentId: editingConsumer.agentId,
          agentName: editingConsumer.agentName,
          createdAt: editingConsumer.createdAt || new Date().toISOString()
        };
        await updateDoc(consumerDocRef, updatedConsumer);
        setSuccessMessage('Solar Lead updated successfully!');
        setEditingConsumer(null);
      } else {
        const consumersRef = collection(db, 'consumers');
        const newConsumer = {
          ...formData,
          agentId: user.id,
          agentName: user.name,
          createdAt: new Date().toISOString()
        };
        await addDoc(consumersRef, newConsumer);
        setSuccessMessage('Solar Lead submitted successfully!');
      }
      
      setIsFormOpen(false);
      fetchConsumers();
      
      // Auto clear success message after 4 seconds
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving consumer:', err);
      setFormError('Failed to save solar lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats calculation
  const totalLeads = consumers.length;
  const pendingLeads = consumers.filter(c => c.status === 'Pending').length;
  const inProgressLeads = consumers.filter(c => 
    c.status === 'In Progress' || 
    c.status === 'Applied' || 
    c.status === 'Transfer Pending' || 
    c.status === 'Transfer Applied' || 
    c.status === 'Quotation' || 
    c.status === 'Loan' ||
    c.status === 'Installed'
  ).length;
  const approvedLeads = consumers.filter(c => c.status === 'Approved' || c.status === 'Completed').length;
  const rejectedLeads = consumers.filter(c => c.status === 'Rejected').length;

  // Filter & Search logic
  const filteredConsumers = consumers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.consumerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bank.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Consumer['status']) => {
    switch (status) {
      case 'Completed':
      case 'Approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Applied': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Transfer Pending': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Transfer Applied': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Quotation': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Loan': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Installed': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'In Progress': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Pending':
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20">
            <Sun className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
          </div>
          <div>
            <h1 className="font-black text-white tracking-tight text-base sm:text-lg">Solar Installation Portal</h1>
            <p className="text-[10px] text-amber-500 font-mono tracking-widest uppercase">Agent Workspace</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-white">{user.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
          </div>
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800 rounded-xl transition-all cursor-pointer"
            title="Change password"
          >
            <Lock className="w-4 h-4 mr-1.5 text-amber-500" />
            <span className="hidden sm:inline">Change Password</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {connectionError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg text-rose-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="flex items-start space-x-3.5 relative z-10">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl shrink-0 mt-0.5 animate-pulse border border-rose-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight text-rose-400">Database Connection Issue</h4>
                <p className="text-xs text-rose-300/80 mt-1 leading-relaxed max-w-2xl">
                  {connectionError}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setConnectionError(null);
                fetchConsumers();
                checkVerificationStatus();
              }}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer self-start md:self-auto"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Verification Alert Banner */}
        {!isVerified && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg text-amber-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="flex items-start space-x-3.5 relative z-10">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl shrink-0 mt-0.5 animate-pulse border border-amber-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight text-amber-400">Account Pending Verification</h4>
                <p className="text-xs text-amber-300/80 mt-1 leading-relaxed max-w-2xl">
                  Your registration is successfully logged! To ensure compliance and verify agent credentials, your partner profile must be activated by the administrator. During this pending state, lead submissions are paused.
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 self-start md:self-auto shrink-0 relative z-10">
              Status: Pending Approval
            </div>
          </div>
        )}

        {/* Welcome Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center flex-wrap gap-2.5">
              <span>Welcome back, {user.name.split(' ')[0]}!</span>
              {user.agentIdCode && (
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-xs font-bold font-mono rounded-md border border-indigo-500/20">
                  {user.agentIdCode}
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">Submit new installation consumer leads and monitor their verification status.</p>
          </div>
          <button
            type="button"
            disabled={!isVerified}
            onClick={() => {
              if (isVerified) {
                setIsFormOpen(true);
              }
            }}
            className={`inline-flex items-center justify-center px-5 py-3 text-sm font-bold text-white rounded-2xl transition-all shadow-lg self-start sm:self-auto ${
              isVerified 
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 cursor-pointer' 
                : 'bg-slate-800 text-slate-500 border border-slate-700 shadow-none cursor-not-allowed opacity-60'
            }`}
          >
            {isVerified ? (
              <Plus className="w-4.5 h-4.5 mr-1.5 stroke-[3]" />
            ) : (
              <Lock className="w-4 h-4 mr-1.5 text-slate-500" />
            )}
            New Solar Lead
          </button>
        </div>

        {/* Global Notifications */}
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 flex items-center space-x-3 shadow-lg"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-bold">{successMessage}</span>
            </motion.div>
          )}
          {formError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl p-4 flex items-center space-x-3 shadow-lg"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-sm font-bold">{formError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        {!isFormOpen && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Total Leads</span>
              <span className="text-2xl font-black text-white block mt-1">{totalLeads}</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />Pending</span>
              <span className="text-2xl font-black text-amber-400 block mt-1">{pendingLeads}</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider flex items-center"><TrendingUp className="w-3.5 h-3.5 mr-1 text-indigo-400" />In Progress</span>
              <span className="text-2xl font-black text-indigo-400 block mt-1">{inProgressLeads}</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider flex items-center"><CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />Approved</span>
              <span className="text-2xl font-black text-emerald-400 block mt-1">{approvedLeads}</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm col-span-2 lg:col-span-1">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider flex items-center"><XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />Rejected</span>
              <span className="text-2xl font-black text-rose-400 block mt-1">{rejectedLeads}</span>
            </div>
          </div>
        )}

        {/* Lead Submit Wizard Form Overlay */}
        {isFormOpen ? (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <button 
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingConsumer(null);
                }}
                className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>
            <ConsumerForm 
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingConsumer(null);
              }}
              isSubmitting={isSubmitting}
              initialData={editingConsumer || undefined}
            />
          </div>
        ) : (
          /* Main Workspace Dashboard */
          <div className="space-y-6">
            {/* Search & Filters Controls */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center backdrop-blur-sm">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search consumer name, ID, bank, or district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto">
                <Filter className="w-4.5 h-4.5 text-slate-500 shrink-0 hidden sm:block" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                >
                  <option value="All">All Statuses</option>
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
            </div>

            {/* List / Cards Grid */}
            {loading ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-400 text-sm mt-4 font-semibold">Loading consumer leads...</p>
              </div>
            ) : filteredConsumers.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 text-center shadow-xl max-w-lg mx-auto">
                <div className="p-4 bg-slate-950 inline-flex rounded-2xl text-slate-500 mb-4 border border-slate-850">
                  <Inbox className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No leads found</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {searchQuery || statusFilter !== 'All' 
                    ? "Try adjusting your search query or status filter." 
                    : "You haven't submitted any consumer leads yet. Click 'New Solar Lead' to get started."}
                </p>
                {(searchQuery || statusFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All');
                    }}
                    className="mt-4 text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-xl border border-indigo-500/20 transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConsumers.map((consumer) => (
                  <motion.div
                    key={consumer.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700/80 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex flex-col justify-between backdrop-blur-sm"
                  >
                    <div className="p-5 space-y-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(consumer.status)}`}>
                            {consumer.status}
                          </span>
                          <h3 className="font-bold text-white mt-2 hover:text-indigo-400 transition-colors line-clamp-1">{consumer.name}</h3>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {consumer.consumerId}</p>
                        </div>
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl font-mono text-xs font-extrabold shrink-0">
                          {consumer.loadNeeded}
                        </div>
                      </div>

                      {/* Details Row */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60 text-xs">
                        <div>
                          <span className="text-slate-500 block font-medium">Financing Bank</span>
                          <span className="text-slate-300 font-semibold truncate block mt-0.5">{consumer.bank}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-medium">Loan Amount</span>
                          <span className="text-slate-200 font-bold block mt-0.5">₹{consumer.loanAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-medium">District</span>
                          <span className="text-slate-300 font-semibold truncate block mt-0.5">{consumer.district}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-medium">CIBIL Score</span>
                          <span className={`font-bold mt-0.5 block ${consumer.cibilScore >= 750 ? 'text-emerald-400' : consumer.cibilScore >= 650 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {consumer.cibilScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="bg-slate-950/60 border-t border-slate-800/60 px-5 py-3.5 flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-500">{consumer.date}</span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setEditingConsumer(consumer);
                            setIsFormOpen(true);
                          }}
                          className="text-amber-500 font-bold hover:text-amber-400 flex items-center cursor-pointer"
                        >
                          Edit Lead
                        </button>
                        <span className="text-slate-700">|</span>
                        <button
                          onClick={() => setSelectedConsumer(consumer)}
                          className="text-indigo-400 font-bold hover:text-indigo-300 flex items-center cursor-pointer"
                        >
                          View Full Lead →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Consumer details modal */}
      {selectedConsumer && (
        <ConsumerDetailModal
          isOpen={!!selectedConsumer}
          consumer={selectedConsumer}
          userRole="agent"
          onClose={() => setSelectedConsumer(null)}
          onEdit={(consumer) => {
            setEditingConsumer(consumer);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 relative"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-white text-lg">Change Your Password</h3>
              </div>
              <button 
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordError('');
                  setPasswordSuccess('');
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold p-3 rounded-xl">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold p-3 rounded-xl">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-650"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-650"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-650"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl transition-all cursor-pointer"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
