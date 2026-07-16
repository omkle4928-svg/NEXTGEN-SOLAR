import React, { useState, useEffect } from 'react';
import { User, Consumer } from '../types';
import { collection, getDocs, doc, updateDoc, query, where, getDoc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { hashPassword } from '../utils/crypto';
import ConsumerDetailModal from './ConsumerDetailModal';
import ConsumerForm from './ConsumerForm';
import { 
  Search, 
  Filter, 
  LogOut, 
  Sun, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp,
  Award,
  Users,
  DollarSign,
  MapPin,
  Calendar,
  Layers,
  Zap,
  Download,
  RefreshCw,
  Inbox,
  Lock,
  UserCheck,
  ChevronLeft,
  AlertCircle,
  Plus,
  Trash2,
  UserPlus,
  Edit
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [agentFilter, setAgentFilter] = useState<string>('All');
  const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // New features state
  const [activeTab, setActiveTab] = useState<'leads' | 'agents'>('leads');
  const [agents, setAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedAgentForSubmissions, setSelectedAgentForSubmissions] = useState<any | null>(null);
  const [agentLeadsSearch, setAgentLeadsSearch] = useState('');
  const [agentLeadsStatus, setAgentLeadsStatus] = useState('All');
  const [agentSearchText, setAgentSearchText] = useState('');

  // Agent Creation state variables
  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentContact, setNewAgentContact] = useState('');
  const [newAgentPassword, setNewAgentPassword] = useState('');
  const [createAgentSuccess, setCreateAgentSuccess] = useState('');
  const [createAgentErr, setCreateAgentErr] = useState('');
  const [createAgentLoading, setCreateAgentLoading] = useState(false);

  // Agent Editing state variables (mrigangka@admin.solar only)
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [editedAgentName, setEditedAgentName] = useState('');
  const [editedAgentContact, setEditedAgentContact] = useState('');
  const [editAgentSuccess, setEditAgentSuccess] = useState('');
  const [editAgentErr, setEditAgentErr] = useState('');
  const [editAgentLoading, setEditAgentLoading] = useState(false);

  // Fill Lead on Behalf state variables
  const [onBehalfAgent, setOnBehalfAgent] = useState<any | null>(null);
  const [editingConsumer, setEditingConsumer] = useState<Consumer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmittingOnBehalf, setIsSubmittingOnBehalf] = useState(false);
  const [formOnBehalfError, setFormOnBehalfError] = useState('');

  // Agent Deletion state variables
  const [agentToDelete, setAgentToDelete] = useState<any | null>(null);
  const [adminPasswordForDelete, setAdminPasswordForDelete] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Change Admin's Own Password states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Change Agent's Password states (admin-operated)
  const [selectedAgentToReset, setSelectedAgentToReset] = useState<any | null>(null);
  const [agentNewPassword, setAgentNewPassword] = useState('');
  const [agentConfirmPassword, setAgentConfirmPassword] = useState('');
  const [agentPasswordError, setAgentPasswordError] = useState('');
  const [agentPasswordSuccess, setAgentPasswordSuccess] = useState('');
  const [agentPasswordLoading, setAgentPasswordLoading] = useState(false);

  // Admin Creation state variables (main admin only)
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'view_only_admin'>('view_only_admin');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmMainAdminPassword, setConfirmMainAdminPassword] = useState('');
  const [createAdminSuccess, setCreateAdminSuccess] = useState('');
  const [createAdminErr, setCreateAdminErr] = useState('');
  const [createAdminLoading, setCreateAdminLoading] = useState(false);

  // Fetch all agents
  const fetchAgents = async () => {
    setAgentsLoading(true);
    setConnectionError(null);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'agent'));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });

      // Find any agents missing an agentIdCode and assign them one
      const missingAgents = list.filter(a => !a.agentIdCode);
      if (missingAgents.length > 0) {
        // Collect all existing codes
        const existingCodes = new Set<string>();
        list.forEach((a) => {
          if (a.agentIdCode) {
            existingCodes.add(a.agentIdCode);
          }
        });

        // For each missing agent, generate and write a unique code
        for (const agent of missingAgents) {
          let num = Math.floor(Math.random() * 999) + 1;
          let code = `AS-SA${String(num).padStart(3, '0')}`;
          let attempts = 0;
          while (existingCodes.has(code) && attempts < 1000) {
            num = Math.floor(Math.random() * 999) + 1;
            code = `AS-SA${String(num).padStart(3, '0')}`;
            attempts++;
          }
          
          existingCodes.add(code);
          agent.agentIdCode = code; // Update local memory copy

          // Save to Firestore asynchronously
          try {
            await updateDoc(doc(db, 'users', agent.id), {
              agentIdCode: code
            });
          } catch (updateErr) {
            console.error(`Error repairing agentIdCode for ${agent.name}:`, updateErr);
          }
        }
      }

      // Sort agents by creation date or name
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setAgents(list);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setConnectionError('Could not reach the Cloud Firestore database backend. The system will continue to operate in offline mode.');
    } finally {
      setAgentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'agents') {
      fetchAgents();
    }
  }, [activeTab]);

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
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
      // Fetch currently saved admin settings
      let adminPassword = 'IF_tL8a!t@U$tWa';
      const adminDocRef = doc(db, 'admin_settings', 'profile');
      const adminDocSnap = await getDoc(adminDocRef);
      if (adminDocSnap.exists()) {
        adminPassword = adminDocSnap.data().password || 'IF_tL8a!t@U$tWa';
      }

      // Check if stored password is a hash (64-character hex string)
      const isStoredHash = /^[0-9a-f]{64}$/i.test(adminPassword);
      const hashedOldPassword = await hashPassword(oldPassword);
      const isMatch = isStoredHash 
        ? hashedOldPassword === adminPassword 
        : oldPassword === adminPassword;

      if (!isMatch) {
        setPasswordError('Incorrect old password.');
        setPasswordLoading(false);
        return;
      }

      const hashedNewPassword = await hashPassword(newPassword);

      // Update password in Firestore as a hash
      await setDoc(adminDocRef, {
        password: hashedNewPassword,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setPasswordSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Error changing admin password:', err);
      setPasswordError('Failed to update password. Please check network and try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeAgentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role === 'view_only_admin') {
      setAgentPasswordError('Action unauthorized: View-only admins are restricted from this operation.');
      return;
    }
    setAgentPasswordError('');
    setAgentPasswordSuccess('');

    if (!agentNewPassword || !agentConfirmPassword) {
      setAgentPasswordError('All fields are required.');
      return;
    }

    if (agentNewPassword.length < 6) {
      setAgentPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (agentNewPassword !== agentConfirmPassword) {
      setAgentPasswordError('Passwords do not match.');
      return;
    }

    setAgentPasswordLoading(true);

    try {
      const hashedPassword = await hashPassword(agentNewPassword);
      const agentDocRef = doc(db, 'users', selectedAgentToReset.id);
      await updateDoc(agentDocRef, {
        password: hashedPassword
      });

      setAgentPasswordSuccess(`Successfully updated password for ${selectedAgentToReset.name}!`);
      setAgentNewPassword('');
      setAgentConfirmPassword('');
      
      // Refresh the agents list so the UI has latest values (not strictly necessary but good practice)
      fetchAgents();

      setTimeout(() => {
        setSelectedAgentToReset(null);
        setAgentPasswordSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Error changing agent password:', err);
      setAgentPasswordError('Failed to change agent password. Please check connection.');
    } finally {
      setAgentPasswordLoading(false);
    }
  };

  const handleToggleVerification = async (agent: any) => {
    if (user.role === 'view_only_admin') return;
    try {
      const agentDocRef = doc(db, 'users', agent.id);
      const newStatus = !(agent.isVerified ?? true);
      await updateDoc(agentDocRef, {
        isVerified: newStatus
      });

      setActionSuccess(`Agent "${agent.name}" status updated to: ${newStatus ? 'Verified & Active' : 'Suspended'}`);
      
      // Update local state
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, isVerified: newStatus } : a))
      );

      setTimeout(() => {
        setActionSuccess('');
      }, 4000);

    } catch (err) {
      console.error('Error toggling agent verification:', err);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role === 'view_only_admin') {
      setCreateAgentErr('Action unauthorized: View-only admins are restricted from this operation.');
      return;
    }
    setCreateAgentErr('');
    setCreateAgentSuccess('');

    if (!newAgentName.trim() || !newAgentContact.trim() || !newAgentPassword.trim()) {
      setCreateAgentErr('All fields are required.');
      return;
    }

    const cleanPhone = newAgentContact.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setCreateAgentErr('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (newAgentPassword.length < 6) {
      setCreateAgentErr('Password must be at least 6 characters long.');
      return;
    }

    setCreateAgentLoading(true);

    try {
      // Check if contactNumber already exists
      const usersRef = collection(db, 'users');
      const phoneQuery = query(usersRef, where('contactNumber', '==', cleanPhone));
      const phoneSnap = await getDocs(phoneQuery);

      if (!phoneSnap.empty) {
        setCreateAgentErr('This mobile number is already registered.');
        setCreateAgentLoading(false);
        return;
      }

      // Generate unique random agent ID (AS-SA001 to AS-SA999)
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

      const hashedPassword = await hashPassword(newAgentPassword);

      const newAgentData = {
        name: newAgentName.trim(),
        contactNumber: cleanPhone,
        password: hashedPassword,
        role: 'agent',
        isVerified: true, // Created by admin, verify by default
        agentIdCode: code,
        createdAt: new Date().toISOString()
      };

      await addDoc(usersRef, newAgentData);

      setCreateAgentSuccess(`Agent created successfully with ID: ${code}!`);
      setNewAgentName('');
      setNewAgentContact('');
      setNewAgentPassword('');
      fetchAgents();

      setTimeout(() => {
        setIsCreateAgentModalOpen(false);
        setCreateAgentSuccess('');
      }, 3000);

    } catch (err) {
      console.error('Error creating agent:', err);
      setCreateAgentErr('Failed to create agent. Please try again.');
    } finally {
      setCreateAgentLoading(false);
    }
  };

  const handleEditAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.email !== 'mrigangka@admin.solar') return;

    setEditAgentErr('');
    setEditAgentSuccess('');

    if (!editedAgentName.trim() || !editedAgentContact.trim()) {
      setEditAgentErr('All fields are required.');
      return;
    }

    const cleanPhone = editedAgentContact.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setEditAgentErr('Mobile number must be exactly 10 digits.');
      return;
    }

    setEditAgentLoading(true);

    try {
      // Check if contactNumber already exists on OTHER users
      const usersRef = collection(db, 'users');
      const phoneQuery = query(usersRef, where('contactNumber', '==', cleanPhone));
      const phoneSnap = await getDocs(phoneQuery);

      const duplicate = phoneSnap.docs.find(doc => doc.id !== editingAgent.id);
      if (duplicate) {
        setEditAgentErr('This mobile number is already registered to another agent.');
        setEditAgentLoading(false);
        return;
      }

      // Update user document
      const agentDocRef = doc(db, 'users', editingAgent.id);
      await updateDoc(agentDocRef, {
        name: editedAgentName.trim(),
        contactNumber: cleanPhone
      });

      // Update any consumer documents submitted by this agent
      const consumersRef = collection(db, 'consumers');
      const qConsumers = query(consumersRef, where('agentId', '==', editingAgent.id));
      const consumersSnap = await getDocs(qConsumers);

      const batchPromises = consumersSnap.docs.map(async (consumerDoc) => {
        await updateDoc(doc(db, 'consumers', consumerDoc.id), {
          agentName: editedAgentName.trim()
        });
      });
      await Promise.all(batchPromises);

      setEditAgentSuccess('Agent details updated successfully!');

      // Update local state
      setAgents((prev) =>
        prev.map((a) => a.id === editingAgent.id ? { ...a, name: editedAgentName.trim(), contactNumber: cleanPhone } : a)
      );
      setConsumers((prev) =>
        prev.map((c) => c.agentId === editingAgent.id ? { ...c, agentName: editedAgentName.trim() } : c)
      );

      fetchAgents(); // Refresh from DB

      setTimeout(() => {
        setEditingAgent(null);
        setEditAgentSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Error editing agent:', err);
      setEditAgentErr('Failed to update agent. Please try again.');
    } finally {
      setEditAgentLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role === 'view_only_admin') {
      setCreateAdminErr('Action unauthorized: View-only admins are restricted from this operation.');
      return;
    }
    setCreateAdminErr('');
    setCreateAdminSuccess('');

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim() || !confirmMainAdminPassword.trim()) {
      setCreateAdminErr('All fields are required.');
      return;
    }

    const cleanEmail = newAdminEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith('@admin.solar')) {
      setCreateAdminErr('Admin email must end with @admin.solar');
      return;
    }

    setCreateAdminLoading(true);

    try {
      // 1. Verify the main admin's password
      let mainAdminPassword = 'IF_tL8a!t@U$tWa';
      const adminDocRef = doc(db, 'admin_settings', 'profile');
      const adminDocSnap = await getDoc(adminDocRef);
      if (adminDocSnap.exists()) {
        mainAdminPassword = adminDocSnap.data().password || 'IF_tL8a!t@U$tWa';
      }

      const isStoredHash = /^[0-9a-f]{64}$/i.test(mainAdminPassword);
      const hashedInput = await hashPassword(confirmMainAdminPassword);
      const isMatch = isStoredHash 
        ? hashedInput === mainAdminPassword 
        : confirmMainAdminPassword === mainAdminPassword;

      if (!isMatch) {
        setCreateAdminErr('Incorrect main admin password.');
        setCreateAdminLoading(false);
        return;
      }

      // 2. Check if the email is already registered in users
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty || cleanEmail === 'mrigangka@admin.solar' || cleanEmail === 'mirza@admin.solar') {
        setCreateAdminErr('This email is already registered.');
        setCreateAdminLoading(false);
        return;
      }

      // 3. Create the admin user
      const hashedNewAdminPassword = await hashPassword(newAdminPassword);
      const newAdminData = {
        name: newAdminName.trim(),
        email: cleanEmail,
        password: hashedNewAdminPassword,
        role: newAdminRole,
        createdAt: new Date().toISOString()
      };

      await addDoc(usersRef, newAdminData);

      setCreateAdminSuccess(`Admin (${newAdminRole === 'admin' ? 'Full' : 'View-Only'}) created successfully!`);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setConfirmMainAdminPassword('');
      setNewAdminRole('view_only_admin');

      setTimeout(() => {
        setIsCreateAdminModalOpen(false);
        setCreateAdminSuccess('');
      }, 3000);

    } catch (err) {
      console.error('Error creating admin:', err);
      setCreateAdminErr('Failed to create admin user. Please try again.');
    } finally {
      setCreateAdminLoading(false);
    }
  };

  const handleDeleteAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role === 'view_only_admin') {
      setDeleteError('Action unauthorized: View-only admins are restricted from this operation.');
      return;
    }
    setDeleteError('');

    if (!adminPasswordForDelete) {
      setDeleteError('Password is required.');
      return;
    }

    setDeleteLoading(true);

    try {
      // Validate admin password
      let adminPassword = 'IF_tL8a!t@U$tWa';
      const adminDocRef = doc(db, 'admin_settings', 'profile');
      const adminDocSnap = await getDoc(adminDocRef);
      if (adminDocSnap.exists()) {
        adminPassword = adminDocSnap.data().password || 'IF_tL8a!t@U$tWa';
      }

      const isStoredHash = /^[0-9a-f]{64}$/i.test(adminPassword);
      const hashedInput = await hashPassword(adminPasswordForDelete);
      const isMatch = isStoredHash 
        ? hashedInput === adminPassword 
        : adminPasswordForDelete === adminPassword;

      if (!isMatch) {
        setDeleteError('Incorrect admin password.');
        setDeleteLoading(false);
        return;
      }

      // Proceed to delete all associated consumer lead documents (including embedded files/images)
      const consumersRef = collection(db, 'consumers');
      const q = query(consumersRef, where('agentId', '==', agentToDelete.id));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map((docSnap) => 
        deleteDoc(doc(db, 'consumers', docSnap.id))
      );
      await Promise.all(deletePromises);

      // Now delete the agent's account document
      const agentDocRef = doc(db, 'users', agentToDelete.id);
      await deleteDoc(agentDocRef);

      setActionSuccess(`Agent ${agentToDelete.name} and all their ${querySnapshot.size} submitted lead files have been permanently deleted.`);
      setAgentToDelete(null);
      setAdminPasswordForDelete('');
      fetchAgents();
      fetchAllConsumers();

      setTimeout(() => {
        setActionSuccess('');
      }, 4000);

    } catch (err) {
      console.error('Error deleting agent:', err);
      setDeleteError('Failed to delete agent. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSubmit = async (formData: Omit<Consumer, 'id' | 'agentId' | 'agentName' | 'createdAt'>) => {
    if (user.role === 'view_only_admin') {
      setFormOnBehalfError('Action unauthorized: View-only admins are restricted from this operation.');
      return;
    }
    setIsSubmittingOnBehalf(true);
    setFormOnBehalfError('');
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
        setActionSuccess('Consumer Solar Lead updated successfully!');
        setSelectedConsumer(null); // Close detail modal if open
        setEditingConsumer(null);
      } else if (onBehalfAgent) {
        const consumersRef = collection(db, 'consumers');
        const newConsumer = {
          ...formData,
          agentId: onBehalfAgent.id,
          agentName: onBehalfAgent.name,
          createdAt: new Date().toISOString()
        };
        await addDoc(consumersRef, newConsumer);
        setActionSuccess(`Solar Lead submitted successfully on behalf of ${onBehalfAgent.name}!`);
        setOnBehalfAgent(null);
      }

      setIsFormOpen(false);
      
      // Refresh consumer leads list
      fetchAllConsumers();

      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Error saving consumer:', err);
      setFormOnBehalfError('Failed to save solar lead. Please try again.');
    } finally {
      setIsSubmittingOnBehalf(false);
    }
  };

  const fetchAllConsumers = async () => {
    setIsRefreshing(true);
    setConnectionError(null);
    try {
      const consumersRef = collection(db, 'consumers');
      const querySnapshot = await getDocs(consumersRef);
      
      const list: Consumer[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          ...data
        } as Consumer);
      });

      // Sort client-side by creation timestamp (newest first)
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setConsumers(list);
    } catch (err) {
      console.error('Error fetching consumers:', err);
      setConnectionError('Could not reach the Cloud Firestore database backend. The system will continue to operate in offline mode.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllConsumers();
  }, []);

  const handleUpdateStatusAndRemark = async (consumerId: string, status: Consumer['status'], remark: string) => {
    if (user.role === 'view_only_admin') return;
    try {
      const consumerDocRef = doc(db, 'consumers', consumerId);
      await updateDoc(consumerDocRef, {
        status: status,
        remark: remark
      });

      // Update local state
      setConsumers((prev) => 
        prev.map((c) => c.id === consumerId ? { ...c, status, remark } : c)
      );

      // Also update selected consumer if open
      if (selectedConsumer && selectedConsumer.id === consumerId) {
        setSelectedConsumer((prev) => prev ? { ...prev, status, remark } : null);
      }

      setActionSuccess('Lead status updated successfully!');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update lead. Please try again.');
    }
  };

  const handleUpdateAdminDocs = async (consumerId: string, docUpdates: Partial<Consumer>) => {
    try {
      const consumerDocRef = doc(db, 'consumers', consumerId);
      await updateDoc(consumerDocRef, docUpdates);

      // Update local state
      setConsumers((prev) => 
        prev.map((c) => c.id === consumerId ? { ...c, ...docUpdates } : c)
      );

      // Also update selected consumer if open
      if (selectedConsumer && selectedConsumer.id === consumerId) {
        setSelectedConsumer((prev) => prev ? { ...prev, ...docUpdates } : null);
      }

      setActionSuccess('Documents updated successfully!');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Error updating admin docs:', err);
      alert('Failed to update documents. Please try again.');
      throw err;
    }
  };

  const getUniqueAgents = () => {
    const agents = new Set<string>();
    consumers.forEach(c => {
      if (c.agentName) agents.add(c.agentName);
    });
    return Array.from(agents);
  };

  // Export to CSV Function
  const exportToCSV = () => {
    if (consumers.length === 0) return;

    const isViewOnly = user.role === 'view_only_admin';
    const headers = [
      'Name', 'Consumer ID', 'Contact Number', 'Email', 'PAN Number', 'Aadhaar Number',
      'CIBIL Score', 'Roof Type', 'Load Needed', 'Bank', 'Account No', 'IFSC', 
      'Address', 'Landmark', 'District', 'PIN', 'Loan Amount', 'Status', 'Date', 
      ...(isViewOnly ? [] : ['Agent Name']), 'Remark', 'Submission Date'
    ];

    const rows = consumers.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.consumerId}"`,
      `"${c.contactNumber}"`,
      `"${c.email}"`,
      `"${c.panNumber}"`,
      `"${c.aadhaarNumber}"`,
      c.cibilScore,
      c.roofType,
      c.loadNeeded,
      `"${c.bank}"`,
      `"${c.accountNo || ''}"`,
      `"${c.ifsc || ''}"`,
      `"${c.address.replace(/"/g, '""')}"`,
      `"${c.landmark.replace(/"/g, '""')}"`,
      `"${c.district}"`,
      `"${c.pin}"`,
      c.loanAmount,
      c.status,
      c.date,
      ...(isViewOnly ? [] : [`"${c.agentName}"`]),
      `"${(c.remark || '').replace(/"/g, '""')}"`,
      c.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Solar_Leads_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute stats
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
  
  const totalLoanApproved = consumers
    .filter(c => c.status === 'Approved' || c.status === 'Completed' || c.status === 'Installed')
    .reduce((sum, c) => sum + c.loanAmount, 0);

  // Filter & Search Logic
  const filteredConsumers = consumers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.consumerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role !== 'view_only_admin' && c.agentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.pin.includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesAgent = agentFilter === 'All' || c.agentName === agentFilter;

    return matchesSearch && matchesStatus && matchesAgent;
  });

  const getStatusBadge = (status: Consumer['status']) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Applied':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Transfer Pending':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Transfer Applied':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Quotation':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Loan':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Installed':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  // Quick calculations for the sidebar analytics
  const getRoofTypePercentages = () => {
    if (consumers.length === 0) return { RCC: 0, TIN: 0 };
    const rccCount = consumers.filter(c => c.roofType === 'RCC').length;
    return {
      RCC: Math.round((rccCount / consumers.length) * 100),
      TIN: Math.round(((consumers.length - rccCount) / consumers.length) * 100)
    };
  };

  const getLoadBreakdown = () => {
    const breakdown = { '3KV': 0, '5KV': 0, '10KV': 0, '20KV': 0 };
    consumers.forEach(c => {
      if (c.loadNeeded in breakdown) {
        breakdown[c.loadNeeded]++;
      }
    });
    return breakdown;
  };

  const roofPerc = getRoofTypePercentages();
  const loadBreakdown = getLoadBreakdown();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Admin Nav */}
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20">
            <Sun className="w-5 h-5 animate-spin" style={{ animationDuration: '30s' }} />
          </div>
          <div>
            <h1 className="font-extrabold text-white tracking-tight text-base sm:text-lg">Solar Installation Portal</h1>
            <p className="text-[10px] text-amber-500/90 font-bold uppercase tracking-wider font-mono">Administrator Console</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={fetchAllConsumers}
            className={`p-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all ${isRefreshing ? 'animate-spin text-indigo-400 bg-indigo-950/50' : ''}`}
            title="Refresh database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-200">System Admin</span>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">{user.email}</span>
          </div>
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/50 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
            title="Change password"
          >
            <Lock className="w-4 h-4 mr-1.5 text-slate-400" />
            <span className="hidden sm:inline">Change Password</span>
          </button>
          {user.email === 'mrigangka@admin.solar' && (
            <button 
              onClick={() => {
                setIsCreateAdminModalOpen(true);
                setNewAdminName('');
                setNewAdminEmail('');
                setNewAdminPassword('');
                setConfirmMainAdminPassword('');
                setNewAdminRole('view_only_admin');
                setCreateAdminErr('');
                setCreateAdminSuccess('');
              }}
              className="flex items-center px-3 py-2 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 rounded-xl transition-all cursor-pointer"
              title="Create new admin"
            >
              <UserPlus className="w-4 h-4 mr-1.5 text-amber-400" />
              <span className="hidden sm:inline">Create Admin</span>
            </button>
          )}
          <button 
            onClick={onLogout}
            className="flex items-center px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl transition-all"
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
                fetchAllConsumers();
                if (activeTab === 'agents') {
                  fetchAgents();
                }
              }}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer self-start md:self-auto"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Welcome Section & Export Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Lead Administration Centre</h2>
            <p className="text-sm text-slate-400 mt-0.5">Manage vendor leads, verify consumer documentation and approve solar connections.</p>
          </div>
          <button
            type="button"
            onClick={exportToCSV}
            disabled={consumers.length === 0}
            className="inline-flex items-center justify-center px-4.5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-900 disabled:text-slate-600 border border-indigo-500/30 rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/45 cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Leads Report
          </button>
        </div>

        {/* Global Action Banner */}
        {actionSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 flex items-center space-x-2.5 shadow-sm">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold">{actionSuccess}</span>
          </div>
        )}

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('leads')}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'leads'
                ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Installation Leads</span>
          </button>
          {user.role !== 'view_only_admin' && (
            <button
              onClick={() => setActiveTab('agents')}
              className={`py-3 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'agents'
                  ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Agent Partners</span>
            </button>
          )}
        </div>

        {activeTab === 'leads' ? (
          <>
            {/* Bento Stats Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center space-x-4 backdrop-blur-sm">
                <div className="p-3 bg-slate-950 text-slate-300 border border-slate-800 rounded-2xl shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Total Leads</span>
                  <span className="text-2xl font-black text-white block mt-0.5">{totalLeads}</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center space-x-4 backdrop-blur-sm">
                <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Pending Review</span>
                  <span className="text-2xl font-black text-amber-400 block mt-0.5">{pendingLeads}</span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center space-x-4 backdrop-blur-sm">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">In Progress</span>
                  <span className="text-2xl font-black text-indigo-400 block mt-0.5">{inProgressLeads}</span>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center space-x-4 backdrop-blur-sm">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Approved Loans Vol</span>
                  <span className="text-2xl font-black text-emerald-400 block mt-0.5">₹{totalLoanApproved.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Search, Filter & Workspace layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Column: Search & Submissions Table */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg backdrop-blur-sm space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search consumer, ID, district, bank or agent..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-slate-200 placeholder-slate-500"
                      />
                    </div>

                    <div className="flex gap-3">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-slate-300"
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

                      {user.role !== 'view_only_admin' && (
                        <select
                          value={agentFilter}
                          onChange={(e) => setAgentFilter(e.target.value)}
                          className="px-3.5 py-2.5 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-slate-300"
                        >
                          <option value="All">All Agents</option>
                          {getUniqueAgents().map((agent) => (
                            <option key={agent} value={agent}>{agent}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Leads Table Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
                  <div className="border-b border-slate-800 px-6 py-4 flex justify-between items-center bg-slate-900/80">
                    <h3 className="font-bold text-slate-200 text-sm">Consumer Installation Submissions</h3>
                    <span className="text-xs font-mono font-medium text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10">Showing {filteredConsumers.length} entries</span>
                  </div>

                  {loading ? (
                    <div className="p-16 text-center">
                      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-slate-400 text-sm mt-4 font-semibold">Querying Leads Firestore Database...</p>
                    </div>
                  ) : filteredConsumers.length === 0 ? (
                    <div className="p-16 text-center max-w-md mx-auto">
                      <div className="p-4 bg-slate-900 border border-slate-800 inline-flex rounded-xl text-slate-500 mb-4">
                        <Inbox className="w-7 h-7" />
                      </div>
                      <h3 className="text-md font-bold text-white">No matching leads</h3>
                      <p className="text-xs text-slate-400 mt-1">Adjust search strings or parameters to find specific solar submissions.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                            <th className="px-6 py-3.5">Submission Date</th>
                            <th className="px-6 py-3.5">Consumer</th>
                            {user.role !== 'view_only_admin' && <th className="px-6 py-3.5">Agent Partner</th>}
                            <th className="px-6 py-3.5">Specifications</th>
                            <th className="px-6 py-3.5 text-center">Verification Status</th>
                            <th className="px-6 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-xs">
                          {filteredConsumers.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-400 whitespace-nowrap">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{c.date}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-white">{c.name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {c.consumerId}</span>
                                </div>
                              </td>
                              {user.role !== 'view_only_admin' && (
                                <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                                  <div className="flex items-center space-x-1.5">
                                    <div className="w-5.5 h-5.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center font-bold text-[10px]">
                                      {c.agentName.charAt(0)}
                                    </div>
                                    <span className="font-medium">{c.agentName}</span>
                                  </div>
                                </td>
                              )}
                              <td className="px-6 py-4 text-slate-400">
                                <div className="flex flex-col space-y-0.5">
                                  <span className="font-medium text-slate-200 flex items-center">
                                    <Zap className="w-3.5 h-3.5 text-amber-400 mr-1 shrink-0" />
                                    {c.loadNeeded} Connection
                                  </span>
                                  <span className="text-[10px] text-slate-500 truncate max-w-[140px]">{c.bank} • ₹{c.loanAmount.toLocaleString('en-IN')}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedConsumer(c)}
                                  className="text-amber-400 font-bold hover:text-amber-300 hover:underline cursor-pointer"
                                >
                                  Verify & Action →
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Key Portal Analytics Panel */}
              <div className="space-y-6">
                {/* Lead Roof Breakdown Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 backdrop-blur-sm">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                    <Layers className="w-4 h-4 mr-1.5 text-indigo-400" />
                    Structural Roof Types
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span className="font-semibold">RCC (Concrete Roof)</span>
                        <span className="font-bold">{roofPerc.RCC}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${roofPerc.RCC}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span className="font-semibold">TIN (Shade / Metal Sheet)</span>
                        <span className="font-bold">{roofPerc.TIN}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${roofPerc.TIN}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solar Load Needed Breakdown */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 backdrop-blur-sm">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                    <Zap className="w-4 h-4 mr-1.5 text-indigo-400" />
                    Capacity Load Metrics
                  </h4>
                  <div className="space-y-3.5 text-xs">
                    {Object.entries(loadBreakdown).map(([load, count]) => {
                       const perc = totalLeads === 0 ? 0 : Math.round((count / totalLeads) * 100);
                       return (
                         <div key={load} className="flex items-center justify-between">
                           <div className="flex items-center space-x-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                             <span className="font-semibold text-slate-300">{load} Load</span>
                           </div>
                           <div className="flex items-center space-x-3">
                             <span className="text-slate-500 font-medium">{count} leads</span>
                             <span className="font-bold text-slate-200 min-w-[32px] text-right">{perc}%</span>
                           </div>
                         </div>
                       );
                    })}
                  </div>
                </div>

                {/* Admin Instructions Helper */}
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 space-y-2 text-indigo-300 backdrop-blur-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center">
                    <Award className="w-4 h-4 mr-1.5 text-indigo-400" />
                    Verification Guide
                  </h4>
                  <p className="text-xs leading-normal text-indigo-200/85">
                    Open full consumer details to inspect uploaded photo identity documents (PAN, Aadhaar) and site roof photographs. Use the admin panel in the modal to approve, request transfer reviews, or change progress milestones.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : isFormOpen && (onBehalfAgent || editingConsumer) ? (
          /* Submission form (On Behalf or Editing) */
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl shadow-xl p-6 space-y-6 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  {editingConsumer ? 'Edit Consumer Solar Lead' : 'Submit Solar Lead on Behalf of'}
                </h3>
                <p className="text-sm mt-0.5">
                  {editingConsumer ? (
                    <>
                      Editing Lead ID: <span className="text-indigo-400 font-extrabold">{editingConsumer.consumerId}</span> ({editingConsumer.name})
                    </>
                  ) : (
                    <>
                      Agent: <span className="text-indigo-400 font-extrabold">{onBehalfAgent?.name}</span> ({onBehalfAgent?.agentIdCode || onBehalfAgent?.id})
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setOnBehalfAgent(null);
                  setEditingConsumer(null);
                  setFormOnBehalfError('');
                }}
                className="text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-750 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                ← Cancel & Back
              </button>
            </div>

            {formOnBehalfError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold p-3.5 rounded-xl">
                {formOnBehalfError}
              </div>
            )}

            <ConsumerForm
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setOnBehalfAgent(null);
                setEditingConsumer(null);
                setFormOnBehalfError('');
              }}
              isSubmitting={isSubmittingOnBehalf}
              initialData={editingConsumer || undefined}
            />
          </div>
        ) : (
          /* Agent management panel */
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl shadow-xl p-6 space-y-6 backdrop-blur-sm">
            {!selectedAgentForSubmissions && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
                <div>
                  <h3 className="font-extrabold text-white text-lg">Agent Accounts Manager</h3>
                  <p className="text-xs text-slate-400 mt-0.5">View active agent partners, their credentials, and click to view their consumer submissions.</p>
                </div>
                <div className="flex items-center space-x-2.5 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => {
                      setIsCreateAgentModalOpen(true);
                      setNewAgentName('');
                      setNewAgentContact('');
                      setNewAgentPassword('');
                      setCreateAgentErr('');
                      setCreateAgentSuccess('');
                    }}
                    className="p-2.5 hover:bg-indigo-700 text-white bg-indigo-600 rounded-xl transition-all cursor-pointer flex items-center text-xs font-bold shadow-lg shadow-indigo-600/15"
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Create New Agent
                  </button>
                  <button
                    onClick={fetchAgents}
                    disabled={agentsLoading}
                    className="p-2.5 hover:bg-slate-800 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:text-indigo-300 rounded-xl transition-all cursor-pointer flex items-center text-xs font-bold"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1.5 ${agentsLoading ? 'animate-spin' : ''}`} />
                    Reload Agents
                  </button>
                </div>
              </div>
            )}

            {!selectedAgentForSubmissions && agents.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search agents by name, ID or mobile number..."
                    value={agentSearchText}
                    onChange={(e) => setAgentSearchText(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-slate-200 placeholder-slate-500"
                  />
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Total Active Agents: <span className="text-indigo-400 font-extrabold">{agents.length}</span>
                </div>
              </div>
            )}

            {agentsLoading ? (
              <div className="p-16 text-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-400 text-sm mt-4 font-semibold">Fetching Agent Accounts from Firestore...</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="p-16 text-center max-w-md mx-auto">
                <div className="p-4 bg-slate-950 border border-slate-800 inline-flex rounded-xl text-slate-500 mb-4">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-md font-bold text-white">No agent partners registered yet</h3>
                <p className="text-xs text-slate-400 mt-1">Agents will appear here once they complete registration on the portal login screen.</p>
              </div>
            ) : selectedAgentForSubmissions ? (
              /* Submissions view for specific agent */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setSelectedAgentForSubmissions(null);
                        setAgentLeadsSearch('');
                        setAgentLeadsStatus('All');
                      }}
                      className="p-2 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white bg-slate-950"
                      title="Back to agents list"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-extrabold text-white text-lg">
                        Submissions by {selectedAgentForSubmissions.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Contact: {selectedAgentForSubmissions.contactNumber || 'No phone'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Indicator inside Back header */}
                  <span className={`inline-flex self-start sm:self-auto px-3 py-1 rounded-full text-xs font-extrabold border ${
                    selectedAgentForSubmissions.isVerified ?? true
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {selectedAgentForSubmissions.isVerified ?? true ? 'Verified & Active' : 'Pending Verification'}
                  </span>
                </div>

                {/* Submissions Stats cards */}
                {(() => {
                  const agentLeads = consumers.filter(c => c.agentId === selectedAgentForSubmissions.id);
                  const total = agentLeads.length;
                  const pending = agentLeads.filter(c => c.status === 'Pending').length;
                  const progress = agentLeads.filter(c => c.status === 'In Progress').length;
                  const approved = agentLeads.filter(c => c.status === 'Approved').length;
                  const rejected = agentLeads.filter(c => c.status === 'Rejected').length;

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Submissions</span>
                        <span className="text-xl font-black text-white block mt-1">{total}</span>
                      </div>
                      <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-amber-400" /> Pending
                        </span>
                        <span className="text-xl font-black text-amber-400 block mt-1">{pending}</span>
                      </div>
                      <div className="bg-indigo-500/5 border border-indigo-500/15 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1 text-indigo-400" /> In Progress
                        </span>
                        <span className="text-xl font-black text-indigo-400 block mt-1">{progress}</span>
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" /> Approved
                        </span>
                        <span className="text-xl font-black text-emerald-400 block mt-1">{approved}</span>
                      </div>
                      <div className="bg-rose-500/5 border border-rose-500/15 p-4 rounded-2xl col-span-2 md:col-span-1">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block flex items-center">
                          <XCircle className="w-3 h-3 mr-1 text-rose-400" /> Rejected
                        </span>
                        <span className="text-xl font-black text-rose-400 block mt-1">{rejected}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Filters for this specific agent's submissions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search consumer leads..."
                      value={agentLeadsSearch}
                      onChange={(e) => setAgentLeadsSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-slate-200 placeholder-slate-500"
                    />
                  </div>
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
                    <select
                      value={agentLeadsStatus}
                      onChange={(e) => setAgentLeadsStatus(e.target.value)}
                      className="w-full sm:w-36 px-3 py-2 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-slate-300"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Submissions list */}
                {(() => {
                  const agentLeads = consumers.filter(c => c.agentId === selectedAgentForSubmissions.id);
                  const filteredLeads = agentLeads.filter(c => {
                    const matchesSearch = 
                      c.name.toLowerCase().includes(agentLeadsSearch.toLowerCase()) ||
                      c.consumerId.toLowerCase().includes(agentLeadsSearch.toLowerCase()) ||
                      c.district.toLowerCase().includes(agentLeadsSearch.toLowerCase()) ||
                      c.bank.toLowerCase().includes(agentLeadsSearch.toLowerCase());
                    const matchesStatus = agentLeadsStatus === 'All' || c.status === agentLeadsStatus;
                    return matchesSearch && matchesStatus;
                  });

                  if (filteredLeads.length === 0) {
                    return (
                      <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                        <Inbox className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <h4 className="font-bold text-slate-300 text-xs">No consumer leads found</h4>
                        <p className="text-[11px] text-slate-500 mt-1">This agent hasn't submitted any matching leads.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredLeads.map((lead) => {
                        const getStatusStyle = (status: Consumer['status']) => {
                          switch (status) {
                            case 'Approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                            case 'Rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                            case 'In Progress': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                          }
                        };

                        return (
                          <div 
                            key={lead.id} 
                            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusStyle(lead.status)}`}>
                                    {lead.status}
                                  </span>
                                  <h4 className="font-extrabold text-slate-200 text-sm mt-1.5 truncate">{lead.name}</h4>
                                  <p className="text-[10px] text-slate-505 font-mono">ID: {lead.consumerId}</p>
                                </div>
                                <div className="p-1.5 bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px] font-black rounded-lg">
                                  {lead.loadNeeded}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px] pt-2.5 border-t border-slate-800/85">
                                <div>
                                  <span className="text-slate-500 block font-semibold">Bank Name</span>
                                  <span className="text-slate-300 font-bold truncate block">{lead.bank}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block font-semibold">Loan Amount</span>
                                  <span className="text-slate-300 font-extrabold block">₹{lead.loanAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block font-semibold">District</span>
                                  <span className="text-slate-300 font-bold truncate block">{lead.district}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block font-semibold">CIBIL Score</span>
                                  <span className={`font-extrabold block ${lead.cibilScore >= 750 ? 'text-emerald-400' : lead.cibilScore >= 650 ? 'text-amber-400' : 'text-rose-400'}`}>
                                    {lead.cibilScore}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-semibold">
                              <span className="text-slate-500">{lead.date}</span>
                              <button
                                onClick={() => setSelectedConsumer(lead)}
                                className="text-amber-400 hover:text-amber-300 font-bold flex items-center cursor-pointer"
                              >
                                Review & Update Status →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Agent Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                const filteredAgents = agents.filter(agent => {
                  const searchLower = agentSearchText.toLowerCase();
                  return (
                    (agent.name || '').toLowerCase().includes(searchLower) ||
                    (agent.contactNumber || '').toLowerCase().includes(searchLower) ||
                    (agent.agentIdCode && agent.agentIdCode.toLowerCase().includes(searchLower)) ||
                    (agent.id || '').toLowerCase().includes(searchLower)
                  );
                });

                if (filteredAgents.length === 0) {
                  return (
                    <div className="col-span-full text-center py-12 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                      <Search className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <h4 className="font-bold text-slate-300 text-sm">No agent partners found</h4>
                      <p className="text-xs text-slate-500 mt-1">No agents match "{agentSearchText}"</p>
                    </div>
                  );
                }

                return filteredAgents.map((agent) => {
                      const agentLeads = consumers.filter(c => c.agentId === agent.id);
                      const totalLeadsCount = agentLeads.length;
                      const pendingLeadsCount = agentLeads.filter(c => c.status === 'Pending').length;

                      return (
                        <div
                          key={agent.id}
                          className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            {/* Agent Card Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-300 rounded-2xl flex items-center justify-center font-black text-sm border border-indigo-500/20 shadow-sm shrink-0">
                                  {agent.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                    <h4 className="font-extrabold text-slate-200 text-sm truncate">{agent.name}</h4>
                                    {agent.agentIdCode && (
                                      <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-bold font-mono rounded-md border border-indigo-500/10">
                                        {agent.agentIdCode}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-semibold truncate">Phone: {agent.contactNumber || 'N/A'}</p>
                                </div>
                              </div>
                              
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                                agent.isVerified ?? true
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {agent.isVerified ?? true ? 'Verified & Active' : 'Pending Verification'}
                              </span>
                            </div>

                            {/* Agent Information Fields */}
                            <div className="space-y-2 text-[11px] bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-semibold">Mobile</span>
                                <span className="text-slate-300 font-bold font-mono">{agent.contactNumber || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-semibold">Registered</span>
                                <span className="text-slate-300 font-bold">
                                  {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-semibold">Password</span>
                                <span className="font-mono bg-slate-950 px-2 py-0.5 border border-slate-800 text-slate-300 rounded-md font-semibold select-all">
                                  {agent.password && /^[0-9a-f]{64}$/i.test(agent.password)
                                    ? '•••••••• (Hashed)'
                                    : agent.password}
                                </span>
                              </div>
                            </div>

                            {/* Submission Counts Section */}
                            <div className="pt-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-bold">Total Submissions</span>
                                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 font-black rounded-lg text-[10px] border border-indigo-500/20">
                                  {totalLeadsCount} Leads
                                </span>
                              </div>
                              {totalLeadsCount > 0 && (
                                <p className="text-[10px] text-slate-505 mt-1 font-semibold flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5 inline-block animate-pulse"></span>
                                  {pendingLeadsCount} pending review
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Card Action Buttons */}
                          <div className="pt-4 mt-4 border-t border-slate-800 space-y-2.5">
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => {
                                  setOnBehalfAgent(agent);
                                  setIsFormOpen(true);
                                  setFormOnBehalfError('');
                                }}
                                className="flex-1 text-center py-2 text-[10px] font-black text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Fill on Behalf</span>
                              </button>
                              {user.email === 'mrigangka@admin.solar' && (
                                <button
                                  onClick={() => {
                                    setEditingAgent(agent);
                                    setEditedAgentName(agent.name || '');
                                    setEditedAgentContact(agent.contactNumber || '');
                                    setEditAgentErr('');
                                    setEditAgentSuccess('');
                                  }}
                                  className="px-3.5 py-2 text-[10px] font-bold text-indigo-400 hover:text-white bg-indigo-500/5 hover:bg-indigo-950 hover:border-indigo-800/50 border border-indigo-500/10 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center"
                                  title="Edit Agent Partner"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setAgentToDelete(agent);
                                  setAdminPasswordForDelete('');
                                  setDeleteError('');
                                }}
                                className="px-3.5 py-2 text-[10px] font-bold text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-950 hover:border-rose-800/50 border border-rose-500/10 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center"
                                title="Delete Agent Partner"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => handleToggleVerification(agent)}
                                className={`flex-1 text-center py-2 text-[10px] font-black rounded-xl transition-all shadow-sm cursor-pointer border ${
                                  agent.isVerified ?? true
                                    ? 'text-amber-400 hover:text-white hover:bg-amber-600 border-amber-500/20 bg-slate-950/20'
                                    : 'text-emerald-400 hover:text-white hover:bg-emerald-600 border-emerald-500/20 bg-slate-950/20'
                                }`}
                              >
                                {agent.isVerified ?? true ? 'Suspend' : 'Activate'}
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedAgentToReset(agent);
                                  setAgentNewPassword('');
                                  setAgentConfirmPassword('');
                                  setAgentPasswordError('');
                                  setAgentPasswordSuccess('');
                                }}
                                className="px-2.5 py-2 text-[10px] font-bold text-indigo-400 hover:text-white hover:bg-indigo-600 border border-indigo-500/20 bg-slate-950 rounded-xl transition-all shadow-sm cursor-pointer"
                                title="Reset password override"
                              >
                                Reset Pass
                              </button>

                              <button
                                onClick={() => setSelectedAgentForSubmissions(agent)}
                                className="flex-1 text-center py-2 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-950/25 cursor-pointer"
                              >
                                View Leads →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                })()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Selected lead detail action overlay */}
      {selectedConsumer && (
        <ConsumerDetailModal
          isOpen={!!selectedConsumer}
          consumer={selectedConsumer}
          userRole={user.role}
          onClose={() => setSelectedConsumer(null)}
          onUpdateStatus={user.role !== 'view_only_admin' ? handleUpdateStatusAndRemark : undefined}
          onUpdateAdminDocs={handleUpdateAdminDocs}
          onEdit={user.role !== 'view_only_admin' ? (consumer) => {
            setEditingConsumer(consumer);
            setIsFormOpen(true);
          } : undefined}
        />
      )}

      {/* Change Password Modal (Self-Service) */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden p-6 relative"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">Change Admin Password</h3>
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
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeOwnPassword} className="space-y-4">
              {passwordError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold p-3 rounded-xl">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold p-3 rounded-xl">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current admin password"
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
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
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all cursor-pointer"
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

      {/* Change Agent Password Modal (Admin Override) */}
      {selectedAgentToReset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden p-6 relative"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-md sm:text-lg">Override Agent Password</h3>
                  <p className="text-[11px] text-slate-500">Updating credentials for {selectedAgentToReset.name}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedAgentToReset(null);
                  setAgentPasswordError('');
                  setAgentPasswordSuccess('');
                  setAgentNewPassword('');
                  setAgentConfirmPassword('');
                }}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeAgentPassword} className="space-y-4">
              {agentPasswordError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold p-3 rounded-xl">
                  {agentPasswordError}
                </div>
              )}
              {agentPasswordSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold p-3 rounded-xl">
                  {agentPasswordSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={agentNewPassword}
                  onChange={(e) => setAgentNewPassword(e.target.value)}
                  placeholder="Enter direct override password"
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={agentConfirmPassword}
                  onChange={(e) => setAgentConfirmPassword(e.target.value)}
                  placeholder="Re-enter override password"
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAgentToReset(null);
                    setAgentPasswordError('');
                    setAgentPasswordSuccess('');
                    setAgentNewPassword('');
                    setAgentConfirmPassword('');
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={agentPasswordLoading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl transition-all cursor-pointer"
                >
                  {agentPasswordLoading ? 'Applying Override...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create New Agent Modal */}
      {isCreateAgentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 relative"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-white text-lg">Create New Agent</h3>
              </div>
              <button 
                onClick={() => setIsCreateAgentModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Agent Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Rajesh Kumar"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-650"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">10-Digit Mobile Number</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={newAgentContact}
                  onChange={(e) => setNewAgentContact(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-650 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Portal Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={newAgentPassword}
                  onChange={(e) => setNewAgentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-650"
                />
              </div>

              {createAgentErr && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold p-3 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createAgentErr}</span>
                </div>
              )}

              {createAgentSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold p-3 rounded-xl flex items-center space-x-2 animate-pulse">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{createAgentSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateAgentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAgentLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all cursor-pointer flex items-center"
                >
                  {createAgentLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                      Creating...
                    </>
                  ) : (
                    'Create Agent Partner'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Agent Modal */}
      {agentToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 relative"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-white text-lg">Delete Agent Partner</h3>
              </div>
              <button 
                onClick={() => setAgentToDelete(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 mb-4 text-xs text-rose-300 leading-relaxed">
              <p className="font-bold mb-1">⚠️ Warning: Irreversible Action</p>
              <p>You are about to delete agent <strong className="text-white">{agentToDelete.name}</strong> ({agentToDelete.agentIdCode || agentToDelete.id}). They will immediately lose access to the portal.</p>
            </div>

            <form onSubmit={handleDeleteAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Enter Admin Password to Authorize
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter system administrator password"
                  value={adminPasswordForDelete}
                  onChange={(e) => setAdminPasswordForDelete(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-650"
                />
              </div>

              {deleteError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold p-3 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAgentToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-850 disabled:text-slate-500 rounded-xl transition-all cursor-pointer flex items-center"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                      Deleting...
                    </>
                  ) : (
                    'Confirm Delete Agent'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create New Admin Modal (Main Admin only) */}
      {isCreateAdminModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 relative"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-white text-lg">Create Admin User</h3>
              </div>
              <button 
                onClick={() => {
                  setIsCreateAdminModalOpen(false);
                  setCreateAdminErr('');
                  setCreateAdminSuccess('');
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Admin Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Mirza Admin"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-650"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Admin Email (ends with @admin.solar)</label>
                <input
                  type="email"
                  required
                  placeholder="mirza@admin.solar"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-650 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Admin Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'view_only_admin')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                >
                  <option value="view_only_admin">View-Only Admin (Cannot edit / hide agent names)</option>
                  <option value="admin">Full Admin (Full edit permissions / see agent names)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">New Admin Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Set password (min 6 chars)"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-650"
                />
              </div>

              <div className="border-t border-slate-850 pt-4 mt-4">
                <label className="block text-xs font-extrabold text-amber-400 uppercase tracking-wider mb-1.5">
                  Confirm Main Admin Password (Mrigangka's)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your admin password to authorize"
                  value={confirmMainAdminPassword}
                  onChange={(e) => setConfirmMainAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/20 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder:text-slate-650"
                />
              </div>

              {createAdminErr && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold p-3 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createAdminErr}</span>
                </div>
              )}

              {createAdminSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold p-3 rounded-xl flex items-center space-x-2 animate-pulse">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{createAdminSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateAdminModalOpen(false);
                    setCreateAdminErr('');
                    setCreateAdminSuccess('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAdminLoading}
                  className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all cursor-pointer flex items-center"
                >
                  {createAdminLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-1.5" />
                      Creating...
                    </>
                  ) : (
                    'Create Admin'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Agent Modal (Main Admin only) */}
      {editingAgent && user.email === 'mrigangka@admin.solar' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 relative"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-md">Edit Agent Details</h3>
                  {editingAgent.agentIdCode && (
                    <span className="text-[10px] text-indigo-400 font-mono font-bold block mt-0.5">
                      ID: {editingAgent.agentIdCode}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setEditingAgent(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Agent Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Rajesh Kumar"
                  value={editedAgentName}
                  onChange={(e) => setEditedAgentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-650"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">10-Digit Mobile Number</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={editedAgentContact}
                  onChange={(e) => setEditedAgentContact(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-650 font-mono"
                />
              </div>

              {editAgentErr && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold p-3 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editAgentErr}</span>
                </div>
              )}

              {editAgentSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold p-3 rounded-xl flex items-center space-x-2 animate-pulse">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{editAgentSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editAgentLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all cursor-pointer flex items-center"
                >
                  {editAgentLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
