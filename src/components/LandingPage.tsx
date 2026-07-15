import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Sun, Shield, User as UserIcon, Lock, Mail, Phone, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { hashPassword } from '../utils/crypto';

interface LandingPageProps {
  onLoginSuccess: (user: User) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isAdminMode) {
        // Pre-seeded Admin Login (updated to mrigangka@admin.solar per request)
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail === 'mrigangka@admin.solar') {
          // Fetch updated admin settings if any
          let adminPassword = 'IF_tL8a!t@U$tWa';
          try {
            const adminDocRef = doc(db, 'admin_settings', 'profile');
            const adminDocSnap = await getDoc(adminDocRef);
            if (adminDocSnap.exists()) {
              adminPassword = adminDocSnap.data().password || 'IF_tL8a!t@U$tWa';
            }
          } catch (e) {
            console.warn('Failed to load updated admin settings, using default', e);
          }

          // Check if stored password is a hash (64-character hex string)
          const isStoredHash = /^[0-9a-f]{64}$/i.test(adminPassword);
          const hashedInput = await hashPassword(password);
          const isMatch = isStoredHash 
            ? hashedInput === adminPassword 
            : password === adminPassword;

          if (isMatch) {
            const adminUser: User = {
              id: 'admin-1',
              name: 'Solar Admin',
              email: cleanEmail,
              role: 'admin',
              createdAt: new Date().toISOString()
            };
            onLoginSuccess(adminUser);
          } else {
            setError('Invalid administrator email or password.');
          }
        } else {
          setError('Invalid administrator email or password.');
        }
      } else {
        // Agent Login from Firestore using contact number
        const cleanPhone = contactNumber.trim();
        if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
          setError('Please enter a valid 10-digit mobile number.');
          setLoading(false);
          return;
        }

        const hashedInput = await hashPassword(password);
        const usersRef = collection(db, 'users');
        
        // 1. Query with hashed password
        let q = query(
          usersRef, 
          where('contactNumber', '==', cleanPhone), 
          where('password', '==', hashedInput),
          where('role', '==', 'agent')
        );
        let querySnapshot = await getDocs(q);

        // 2. Fallback check for legacy plain-text passwords
        if (querySnapshot.empty) {
          const plainQ = query(
            usersRef,
            where('contactNumber', '==', cleanPhone),
            where('password', '==', password),
            where('role', '==', 'agent')
          );
          const plainSnapshot = await getDocs(plainQ);
          if (!plainSnapshot.empty) {
            querySnapshot = plainSnapshot;
            // Upgrade legacy plain-text password to hash in background
            try {
              const docSnap = plainSnapshot.docs[0];
              const docRef = doc(db, 'users', docSnap.id);
              await updateDoc(docRef, { password: hashedInput });
            } catch (upgradeErr) {
              console.warn('Could not upgrade password to hash in background:', upgradeErr);
            }
          }
        }

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const userData = docSnap.data();
          const loggedInUser: User = {
            id: docSnap.id,
            name: userData.name,
            role: 'agent',
            contactNumber: userData.contactNumber,
            isVerified: userData.isVerified ?? true,
            createdAt: userData.createdAt
          };
          onLoginSuccess(loggedInUser);
        } else {
          setError('Invalid agent mobile number or password.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection failed. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }
    const cleanPhone = contactNumber.trim();
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Check if contactNumber already exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("contactNumber", "==", cleanPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError("This mobile number is already registered.");
        setLoading(false);
        return;
      }

      // Generate a unique random agent ID code (AS-SA001 to AS-SA999)
      const allAgentsQuery = query(usersRef, where("role", "==", "agent"));
      const allAgentsSnap = await getDocs(allAgentsQuery);
      const existingCodes = new Set<string>();
      allAgentsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.agentIdCode) {
          existingCodes.add(data.agentIdCode);
        }
      });

      let num = Math.floor(Math.random() * 999) + 1;
      let code = `AS-SA${String(num).padStart(3, "0")}`;
      let attempts = 0;
      while (existingCodes.has(code) && attempts < 1000) {
        num = Math.floor(Math.random() * 999) + 1;
        code = `AS-SA${String(num).padStart(3, "0")}`;
        attempts++;
      }

      const hashedPassword = await hashPassword(password);

      // Create new agent in Firestore
      const newAgentData = {
        name: name.trim(),
        contactNumber: cleanPhone,
        password: hashedPassword,
        role: "agent" as UserRole,
        isVerified: false,
        agentIdCode: code,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(usersRef, newAgentData);
      
      const registeredUser: User = {
        id: docRef.id,
        name: newAgentData.name,
        role: "agent",
        contactNumber: newAgentData.contactNumber,
        isVerified: false,
        agentIdCode: code,
        createdAt: newAgentData.createdAt,
      };

      onLoginSuccess(registeredUser);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Interactive, animated Solar Dashboard & Branding */}
      <div className="lg:w-1/2 bg-slate-950 text-white relative flex flex-col justify-between p-6 lg:p-16 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
        {/* Animated Background Gradients & Glows */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Floating animated ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{
                top: `${(i * 17) % 100}%`,
                left: `${(i * 23) % 100}%`,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.1, 0.8, 0.1],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 6 + (i % 4) * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (i % 3) * 1.5,
              }}
            />
          ))}
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20">
            <Sun className="w-6 h-6 animate-spin" style={{ animationDuration: '15s' }} />
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold tracking-widest text-amber-500 uppercase">NEXTGEN SOLAR</span>
            <h2 className="text-lg font-bold tracking-tight text-white">Solar Installation Portal</h2>
          </div>
        </div>

        {/* Centerpiece: Immersive Animated Vector Graphic */}
        <div className="hidden lg:flex relative z-10 my-10 lg:my-0 flex-1 flex-col justify-center items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full max-w-[340px] aspect-square rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col justify-between overflow-hidden shadow-2xl shadow-amber-500/5 backdrop-blur-sm"
          >
            {/* Animated Sun & Grid Graphic */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="w-[150%] h-[150%] border border-dashed border-slate-700 rounded-full animate-spin" style={{ animationDuration: '60s' }} />
              <div className="absolute w-[110%] h-[110%] border border-dashed border-slate-700 rounded-full animate-spin" style={{ animationDuration: '40s' }} />
              <div className="absolute w-[70%] h-[70%] border border-dashed border-slate-700 rounded-full animate-spin" style={{ animationDuration: '25s' }} />
            </div>

            {/* Simulated interactive solar panel layout */}
            <div className="relative w-full h-[60%] flex items-center justify-center">
              {/* Sun Ray Beams */}
              <svg className="absolute w-full h-full pointer-events-none" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="rayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.polygon 
                  points="100,20 60,140 140,140" 
                  fill="url(#rayGrad)"
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.polygon 
                  points="100,20 30,130 90,135" 
                  fill="url(#rayGrad)"
                  animate={{ opacity: [0.1, 0.4, 0.1] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
                <motion.polygon 
                  points="100,20 110,135 170,130" 
                  fill="url(#rayGrad)"
                  animate={{ opacity: [0.15, 0.5, 0.15] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
              </svg>

              {/* Sun Orb */}
              <motion.div 
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 w-12 h-12 bg-amber-400 rounded-full shadow-2xl shadow-amber-400/50 flex items-center justify-center border border-amber-300"
              >
                <Sun className="w-6 h-6 text-slate-950" />
              </motion.div>

              {/* Solar Panels Grid with reflective flash */}
              <div className="absolute bottom-4 grid grid-cols-4 gap-1.5 w-[85%] rotate-[18deg] transform skew-x-3">
                {[...Array(8)].map((_, i) => (
                  <motion.div 
                    key={i}
                    className="relative aspect-video rounded bg-indigo-950/80 border border-indigo-500/30 overflow-hidden shadow-inner flex items-center justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                    {/* Reflective light beam animation */}
                    <motion.div 
                      className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent skew-x-12"
                      animate={{ left: ['200%', '-100%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut", delay: i * 0.2 }}
                    />
                    {/* Grid lines inside each mini panel */}
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-30">
                      <div className="border-r border-b border-indigo-400/40" />
                      <div className="border-b border-indigo-400/40" />
                      <div className="border-r border-indigo-400/40" />
                      <div className="border-indigo-400/40" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mini Dashboard Data Widget inside the graphic card */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Live System Active</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/50">
                  <span className="block text-[9px] font-medium text-slate-500">HOMES POWERED</span>
                  <span className="text-xs font-bold text-white font-mono">1,248+</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/50">
                  <span className="block text-[9px] font-medium text-slate-500">MW CAPACITY</span>
                  <span className="text-xs font-bold text-amber-500 font-mono">3.42 MW</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Slogan */}
          <div className="text-center mt-6 max-w-sm">
            <h3 className="text-lg font-bold text-slate-100">Clean Energy, Seamless Flow</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Empowering field agents to upload, verify, and track solar installation leads efficiently.
            </p>
          </div>
        </div>

        {/* Stats & Proof footer on Desktop */}
        <div className="relative z-10 pt-8 border-t border-slate-800/60 hidden lg:grid grid-cols-3 gap-6 text-center">
          <div>
            <span className="block text-xl font-extrabold text-white font-mono">99.4%</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Approval Rate</span>
          </div>
          <div>
            <span className="block text-xl font-extrabold text-amber-500 font-mono">24 Hours</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Avg. Turnaround</span>
          </div>
          <div>
            <span className="block text-xl font-extrabold text-indigo-400 font-mono">Paperless</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Digital KYC</span>
          </div>
        </div>
      </div>

      {/* Right Column: Login & Sign Up Form Container */}
      <div className="lg:w-1/2 bg-slate-950 flex flex-col justify-center py-6 lg:py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Subtle orange ambient background glow for the right form side */}
        <div className="absolute right-[-10%] bottom-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-slate-900/80 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-sm">
            {/* Tab Selector */}
            {!isRegisterMode && (
              <div className="flex border border-slate-800 rounded-xl p-1 bg-slate-950 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminMode(false);
                    setError('');
                    setShowPassword(false);
                  }}
                  className={`flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-lg transition-all ${
                    !isAdminMode 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5 mr-1.5" />
                  Agent Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminMode(true);
                    setError('');
                    setShowPassword(false);
                  }}
                  className={`flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-lg transition-all ${
                    isAdminMode 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  Admin Panel
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3.5 text-xs font-semibold flex items-start space-x-2">
                <span className="block mt-0.5">⚠️</span>
                <span className="leading-normal">{error}</span>
              </div>
            )}

            {isRegisterMode ? (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-4">
                <h2 className="text-lg font-bold text-slate-100 mb-1 flex items-center">
                  <UserPlus className="w-5 h-5 mr-1.5 text-indigo-400" />
                  Register as Agent
                </h2>
                <p className="text-xs text-slate-400 mb-4">Create your solar agent credentials to start uploading leads.</p>

                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-400 uppercase">Full Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="E.g. John Doe"
                      className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-400 uppercase">Contact Number</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      maxLength={10}
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-pass" className="block text-xs font-semibold text-slate-400 uppercase">Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-pass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 transition-all focus:outline-none mt-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Agent Account
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(false);
                      setError('');
                      setShowPassword(false);
                    }}
                    className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 focus:outline-none cursor-pointer"
                  >
                    Already registered? Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor={isAdminMode ? "email" : "login-phone"} className="block text-xs font-semibold text-slate-400 uppercase">
                    {isAdminMode ? 'Administrator Email' : 'Agent Mobile Number'}
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      {isAdminMode ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </div>
                    {isAdminMode ? (
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
                      />
                    ) : (
                      <input
                        id="login-phone"
                        name="contactNumber"
                        type="tel"
                        required
                        maxLength={10}
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="Enter mobile number"
                        className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase">Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 transition-all focus:outline-none cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </button>

                {!isAdminMode && (
                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-400">New agent? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(true);
                        setError('');
                        setShowPassword(false);
                      }}
                      className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 focus:outline-none cursor-pointer"
                    >
                      Register here
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
