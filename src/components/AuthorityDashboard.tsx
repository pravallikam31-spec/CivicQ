import { useState, useMemo, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ListTodo, MapPin, Map, Bell, User, LogOut, 
  Search, Shield, AlertCircle, Clock, ThumbsUp, CheckCircle2, 
  Upload, X, ChevronRight, Check, RefreshCw, Filter, ShieldAlert, Sparkles, Phone, Briefcase, Landmark, CheckSquare
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

// @ts-ignore
import roadNeglected from '../assets/images/civicq_road_neglected_1782498745967.jpg';
// @ts-ignore
import roadImproved from '../assets/images/civicq_road_improved_1782498762847.jpg';
import { issueStore } from '../utils/issueStore';

interface Issue {
  id: string;
  docId?: string;
  title: string;
  location: string;
  category: string;
  reportedBy: string;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  aiPriority: 'Critical' | 'High' | 'Medium' | 'Low';
  timeElapsed: string;
  status: 'Reported' | 'Verified' | 'Assigned' | 'In Progress' | 'Resolved' | 'Awaiting Community Verification' | 'Awaiting AI Verification' | 'Pending AI Verification' | 'AI Verified' | 'Closed';
  assignedOfficer: string;
  slaCountdown: string;
  isOverdue: boolean;
  communityVerifications: number;
  image: string;
  resolvedImage?: string;
  description: string;
  landmark: string;
  coordinates: { x: number; y: number };
  activity: Array<{ actor: string; action: string; time: string }>;
  completionNotes?: string;
}

interface AuthorityDashboardProps {
  onLogout: () => void;
}

export default function AuthorityDashboard({ onLogout }: AuthorityDashboardProps) {
  // Navigation: ONLY these sections are permitted: Home, Queue, Map, Notifications, Profile
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'map' | 'notifications' | 'profile'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    fullName: '',
    employeeId: 'EMP-BBMP-4821',
    department: 'Civil Infrastructure Division',
    designation: 'Ward Commissioner',
    ward: 'Ward 12 Indiranagar',
    phone: '+91 98450 12345'
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');

  // Fetch current user & authority profile details
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'profiles', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile((prev: any) => ({
              ...prev,
              fullName: data.fullName || currentUser.displayName?.split('|')[0] || '',
              employeeId: data.employeeId || 'EMP-BBMP-4821',
              department: data.department || 'Civil Infrastructure Division',
              designation: data.designation || 'Ward Commissioner',
              ward: data.ward || 'Ward 12 Indiranagar',
              phone: data.phone || '+91 98450 12345'
            }));
          } else {
            setProfile((prev: any) => ({
              ...prev,
              fullName: currentUser.displayName?.split('|')[0] || ''
            }));
          }
        } catch (e) {
          console.error('Error fetching AuthorityDashboard profile:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Core issues state
  const [issues, setIssues] = useState<Issue[]>([]);
  // Selected issue for Drawer Details
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Resolution Modal states
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionPhoto, setResolutionPhoto] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Dynamic notifications list
  const [notifications, setNotifications] = useState<any[]>([
    { id: '1', type: 'new', title: 'New Issue Reported', body: 'Potentially severe pothole reported in Indiranagar Ward 12 by citizen.', time: 'Just now', unread: true },
    { id: '2', type: 'high', title: 'High Priority Alert', body: 'Water pipeline burst on Indiranagar Double Road requires immediate clearance.', time: '10 mins ago', unread: true },
    { id: '3', type: 'assigned', title: 'Issue Assigned', body: 'Task CQ-804 has been assigned to Officer Rajesh Gowda for inspection.', time: '1 hour ago', unread: false },
    { id: '4', type: 'resolved', title: 'Issue Resolved', body: 'Garbage dump clearance at Koramangala block has been completed.', time: '3 hours ago', unread: false }
  ]);

  // Load issues from Firestore
  useEffect(() => {
    const q = query(collection(db, 'issues'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedIssues = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const id = data.issueId || docSnap.id;
        const category = data.category || 'General';
        const ward = data.ward || data.address || 'Ward 12 Indiranagar';
        const title = data.title || `${category} near ${ward}`;
        const severity = data.severity || 'Medium';
        const urgency = severity;
        const aiPriority = severity;
        const status = data.status || 'Reported';
        
        let dateStr = 'Just now';
        if (data.createdAt) {
          try {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            dateStr = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          } catch (e) {
            dateStr = 'Recently';
          }
        }

        let slaCountdown = '24 Hours Remaining';
        if (status === 'Resolved') {
          slaCountdown = 'Resolved';
        } else {
          if (severity === 'Critical') slaCountdown = '4 Hours Remaining';
          else if (severity === 'High') slaCountdown = '24 Hours Remaining';
          else if (severity === 'Medium') slaCountdown = '36 Hours Remaining';
          else if (severity === 'Low') slaCountdown = '72 Hours Remaining';
        }

        let coordinates = { x: 50, y: 50 };
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const latNorm = Math.min(100, Math.max(0, (data.latitude - 12.9) * 1000));
          const lngNorm = Math.min(100, Math.max(0, (data.longitude - 77.5) * 1000));
          coordinates = { x: Math.round(lngNorm % 100), y: Math.round(latNorm % 100) };
        }

        const activity = Array.isArray(data.activity) ? data.activity : [
          { actor: data.reportedByName || 'Citizen', action: 'Uploaded civic report with coordinates', time: dateStr },
          { actor: 'AI Fusion Engine', action: 'Auto-prioritized and routed to Ward Queue', time: dateStr }
        ];

        return {
          id,
          docId: docSnap.id,
          title,
          location: ward,
          category,
          reportedBy: data.reportedByName || 'Anonymous Citizen',
          urgency,
          severity,
          aiPriority,
          timeElapsed: dateStr,
          status,
          assignedOfficer: data.assignedOfficer || 'Unassigned',
          slaCountdown,
          isOverdue: false,
          communityVerifications: data.upvotes || data.verificationCount || 0,
          image: data.image || '',
          resolvedImage: data.resolvedImage || data.citizenVerificationImage || '',
          description: data.description || '',
          landmark: data.landmark || 'Not specified',
          coordinates,
          activity,
          completionNotes: data.completionNotes || '',
          raw: data
        } as Issue;
      });

      // Sort: newly created first
      const sortedIssues = fetchedIssues.sort((a: any, b: any) => {
        const timeA = a.raw?.createdAt?.toDate ? a.raw.createdAt.toDate().getTime() : (a.raw?.createdAt ? new Date(a.raw.createdAt).getTime() : 0);
        const timeB = b.raw?.createdAt?.toDate ? b.raw.createdAt.toDate().getTime() : (b.raw?.createdAt ? new Date(b.raw.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      setIssues(sortedIssues);
    }, (error) => {
      console.error('Error loading Firestore issues in AuthorityDashboard:', error);
    });

    return () => unsubscribe();
  }, []);

  // Detail Drawer Field States
  const [tempNotes, setTempNotes] = useState('');
  const [tempOfficer, setTempOfficer] = useState('Unassigned');
  const [uploadedFixPreview, setUploadedFixPreview] = useState<string | null>(null);

  // Filter States
  const [filterWard, setFilterWard] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  // Find currently opened issue
  const activeIssue = useMemo(() => {
    return issues.find(i => i.id === selectedIssueId) || null;
  }, [issues, selectedIssueId]);

  // Open details helper
  const openIssueDetails = (issue: Issue) => {
    setSelectedIssueId(issue.id);
    setTempNotes(issue.completionNotes || '');
    setTempOfficer(issue.assignedOfficer || 'Unassigned');
    setUploadedFixPreview(issue.resolvedImage || null);
  };

  // Filter issues for the queue and maps
  const filteredIssuesList = useMemo(() => {
    return issues.filter(issue => {
      const matchesSearch = 
        issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.assignedOfficer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesWard = filterWard === 'All' || issue.location.includes(filterWard);
      const matchesSeverity = filterSeverity === 'All' || issue.severity === filterSeverity;
      const matchesStatus = filterStatus === 'All' || issue.status === filterStatus;
      const matchesCategory = filterCategory === 'All' || issue.category === filterCategory;

      return matchesSearch && matchesWard && matchesSeverity && matchesStatus && matchesCategory;
    });
  }, [issues, searchQuery, filterWard, filterSeverity, filterStatus, filterCategory]);

  // Statistics calculation for Dashboard Home
  const totalIssuesCount = issues.length;
  const pendingIssuesCount = issues.filter(i => i.status === 'Reported' || i.status === 'Verified').length;
  const inProgressIssuesCount = issues.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length;
  const resolvedIssuesCount = issues.filter(i => i.status === 'Resolved').length;
  const highPriorityIssuesCount = issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length;

  // Manual status workflow actions in drawer
  const handleVerifyIssue = async () => {
    if (!selectedIssueId || !activeIssue) return;
    try {
      const docId = activeIssue.docId || activeIssue.id;
      const docRef = doc(db, 'issues', docId);
      const newActivity = [
        { actor: 'Authority Officer', action: 'Verified reported details on-site', time: 'Just now' },
        ...activeIssue.activity
      ];
      await updateDoc(docRef, {
        status: 'Verified',
        activity: newActivity,
        updatedAt: serverTimestamp()
      });
      // Add notification
      setNotifications(prev => [
        { id: String(Date.now()), type: 'assigned', title: 'Issue Verified', body: `Ticket ID: ${activeIssue.id} has been marked as Verified.`, time: 'Just now', unread: true },
        ...prev
      ]);
    } catch (error) {
      console.error('Error verifying issue:', error);
    }
  };

  const handleMarkInProgress = async () => {
    if (!selectedIssueId || !activeIssue) return;
    try {
      const docId = activeIssue.docId || activeIssue.id;
      const docRef = doc(db, 'issues', docId);
      const newActivity = [
        { actor: 'Authority Dispatch', action: 'Initiated active on-field restoration efforts', time: 'Just now' },
        ...activeIssue.activity
      ];
      await updateDoc(docRef, {
        status: 'In Progress',
        activity: newActivity,
        updatedAt: serverTimestamp()
      });
      // Add notification
      setNotifications(prev => [
        { id: String(Date.now()), type: 'assigned', title: 'Status In Progress', body: `Restoration works are now underway for ${activeIssue.id}.`, time: 'Just now', unread: true },
        ...prev
      ]);
    } catch (error) {
      console.error('Error setting in progress:', error);
    }
  };

  const handleAssignOfficer = async () => {
    if (!selectedIssueId || !activeIssue) return;
    try {
      const docId = activeIssue.docId || activeIssue.id;
      const docRef = doc(db, 'issues', docId);
      const newActivity = [
        { actor: 'Authority Dispatch', action: `Assigned division dispatch agent: ${tempOfficer}`, time: 'Just now' },
        ...activeIssue.activity
      ];
      await updateDoc(docRef, {
        assignedOfficer: tempOfficer,
        status: 'Assigned',
        activity: newActivity,
        updatedAt: serverTimestamp()
      });
      // Add notification
      setNotifications(prev => [
        { id: String(Date.now()), type: 'assigned', title: 'Officer Dispatched', body: `Officer ${tempOfficer} assigned to resolve ${activeIssue.id}.`, time: 'Just now', unread: true },
        ...prev
      ]);
    } catch (error) {
      console.error('Error assigning officer:', error);
    }
  };

  const handleOpenResolutionModal = () => {
    if (!selectedIssueId || !activeIssue) return;
    setResolutionNotes(tempNotes || activeIssue.completionNotes || '');
    setResolutionPhoto(activeIssue.resolvedImage || '');
    setCompletionDate(new Date().toISOString().slice(0, 10));
    setShowResolutionModal(true);
  };

  const handleCommitResolutionProof = async (photo: string, notes: string, date: string) => {
    if (!selectedIssueId || !activeIssue) return;
    const finalPhoto = photo || roadImproved;
    const finalNotes = notes || 'Repairs fully executed and approved by Ward Command.';
    
    try {
      const docId = activeIssue.docId || activeIssue.id;
      const docRef = doc(db, 'issues', docId);
      const newActivity = [
        { actor: 'Field Engineer', action: 'Uploaded repair photo proof: Completed', time: 'Just now' },
        ...activeIssue.activity
      ];

      await updateDoc(docRef, {
        status: 'Resolved',
        resolvedImage: finalPhoto,
        completionNotes: finalNotes,
        completionDate: date,
        activity: newActivity,
        updatedAt: serverTimestamp()
      });

      setUploadedFixPreview(finalPhoto);
      issueStore.updateIssue(selectedIssueId, {
        status: 'Resolved',
        resolvedImage: finalPhoto,
        completionNotes: finalNotes,
        completionDate: date
      });

      // Add notification
      setNotifications(prev => [
        { id: String(Date.now()), type: 'resolved', title: 'Issue Resolved', body: `Ticket ID: ${activeIssue.id} resolved successfully and uploaded proof.`, time: 'Just now', unread: true },
        ...prev
      ]);
    } catch (error) {
      console.error('Error resolving issue:', error);
    }
    
    setShowResolutionModal(false);
  };

  // Save profile to Firestore
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    setProfileSuccessMessage('');
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        ...profile,
        role: 'authority',
        updatedAt: serverTimestamp()
      }, { merge: true });

      setProfileSuccessMessage('Authority Profile updated successfully in BBMP command database.');
      setTimeout(() => setProfileSuccessMessage(''), 4000);
    } catch (error) {
      console.error('Error updating authority profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex relative overflow-hidden font-sans">
      
      {/* Background glow effects */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          LEFT SIDEBAR (DESKTOP)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111827] border-r border-white/8 pt-20 pb-6 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Navigation Block */}
        <div className="flex flex-col gap-8 px-4 mt-6">
          <div className="flex items-center gap-3.5 px-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] flex items-center justify-center shadow-lg shadow-[#14B8A6]/15">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide uppercase text-white">CIVICQ COMMAND</h2>
              <span className="text-[10px] font-mono text-[#14B8A6] uppercase tracking-widest font-bold">Authority Portal</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard Home', icon: LayoutDashboard },
              { id: 'queue', label: 'AI Priority Queue', icon: ListTodo },
              { id: 'map', label: 'Live Incident Map', icon: Map },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'profile', label: 'Authority Profile', icon: User },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#14B8A6]/15 to-[#22C55E]/5 border border-[#14B8A6]/20 text-[#14B8A6]' 
                      : 'border border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#14B8A6]' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="px-4 flex flex-col gap-4">
          <div className="border-t border-white/5 pt-4 flex flex-col gap-1 px-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Logged-In Agent</span>
            <span className="text-xs font-bold text-gray-300 truncate">{profile?.fullName || 'Command Officer'}</span>
          </div>

          <button
            onClick={onLogout}
            className="w-full px-3.5 py-3 rounded-xl border border-white/8 bg-[#0B1220] hover:bg-red-500/10 hover:border-red-500/20 text-gray-400 hover:text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Securely
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MAIN CONTENT CONTAINER
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <main className="flex-1 min-w-0 pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-y-auto h-screen relative z-10 flex flex-col gap-8">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-white/8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/5 text-white"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-bold font-mono text-[#22C55E] uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Bengaluru Central Control Room
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                {activeTab === 'dashboard' && 'Command Overview'}
                {activeTab === 'queue' && 'AI Priority Queue'}
                {activeTab === 'map' && 'Live Incident Map'}
                {activeTab === 'notifications' && 'Operational Notifications'}
                {activeTab === 'profile' && 'Authority Profile'}
              </h1>
            </div>
          </div>

          {/* Quick Stats Search / Refresh */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] font-mono text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-[#14B8A6]" />
              SECURE BBMP CHANNEL
            </span>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 1: DASHBOARD HOME
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            
            {/* Summary Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { label: 'Total Issues', value: totalIssuesCount, desc: 'Registered ward reports', color: 'text-white', border: 'border-white/5' },
                { label: 'Pending Issues', value: pendingIssuesCount, desc: 'Awaiting action/triage', color: 'text-amber-400', border: 'border-amber-500/10' },
                { label: 'In Progress', value: inProgressIssuesCount, desc: 'Active field operations', color: 'text-[#14B8A6]', border: 'border-[#14B8A6]/10' },
                { label: 'Resolved Today', value: resolvedIssuesCount, desc: 'Repairs fully closed', color: 'text-emerald-400', border: 'border-emerald-500/10' },
                { label: 'High Priority Issues', value: highPriorityIssuesCount, desc: 'Critical/High severity reports', color: 'text-red-400', border: 'border-red-500/10' },
              ].map((stat, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={stat.label}
                  className={`bg-[#111827] border rounded-2xl p-5 flex flex-col gap-1 shadow-lg ${stat.border}`}
                >
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                  <span className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</span>
                  <span className="text-[10px] text-gray-400 leading-tight mt-1">{stat.desc}</span>
                </motion.div>
              ))}
            </div>

            {/* Smart Emergency Highlight */}
            <div className="bg-gradient-to-r from-red-950/30 via-amber-950/10 to-[#111827] border border-red-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 animate-pulse mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">AI Recommended Action Escalation</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[8px] font-mono font-bold text-red-400 uppercase">Emergency</span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-1">Sewer Grid Overflow • Indiranagar Double Road</h4>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xl">
                    Water backup detected near commercial block. 4 citizen reports correlated. Urgent field dispatch suggested.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('queue')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest shadow-lg cursor-pointer shrink-0 transition-transform hover:scale-102"
              >
                Inspect Queue
              </button>
            </div>

            {/* Quick Actions / Activity overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Ward Command Status
                </h3>
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex justify-between p-3 rounded-xl bg-[#0B1220]/60 border border-white/5">
                    <span className="text-gray-400">Target Ward Jurisdiction</span>
                    <span className="text-white font-bold">{profile?.ward || 'Ward 12 Indiranagar'}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[#0B1220]/60 border border-white/5">
                    <span className="text-gray-400">Department Head</span>
                    <span className="text-white font-bold">{profile?.fullName || 'Senior Officer'}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[#0B1220]/60 border border-white/5">
                    <span className="text-gray-400">Total Field Crews Available</span>
                    <span className="text-emerald-400 font-bold">4 Active Teams</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Recent Alerts
                </h3>
                <div className="flex flex-col gap-3">
                  {notifications.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-2.5 items-start bg-[#0B1220]/40 p-2.5 rounded-xl border border-white/5 text-[11px]">
                      <span className="text-xs">🔔</span>
                      <div className="flex-1">
                        <span className="font-bold text-white block">{item.title}</span>
                        <span className="text-gray-400 leading-relaxed block mt-0.5">{item.body}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 2: AI PRIORITY QUEUE
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'queue' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* Search and Filters Bar */}
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, category, ward..."
                    className="w-full pl-9 pr-4 py-2 bg-[#0B1220] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
                  <select
                    value={filterWard}
                    onChange={(e) => setFilterWard(e.target.value)}
                    className="px-3 py-2 bg-[#0B1220] border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="All">All Wards</option>
                    <option value="Ward 12">Ward 12</option>
                    <option value="Ward 84">Ward 84</option>
                    <option value="Ward 45">Ward 45</option>
                    <option value="Koramangala">Koramangala</option>
                    <option value="Indiranagar">Indiranagar</option>
                  </select>

                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="px-3 py-2 bg-[#0B1220] border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="All">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-[#0B1220] border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Reported">Reported</option>
                    <option value="Verified">Verified</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 bg-[#0B1220] border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="Water Infrastructure">Water Infrastructure</option>
                    <option value="Road Defect">Road Defect</option>
                    <option value="Electrical Safety">Electrical Safety</option>
                    <option value="Sewage Network">Sewage Network</option>
                    <option value="Public Lighting">Public Lighting</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI priority table */}
            <div className="bg-[#111827] border border-white/8 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/[0.02] text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-4 px-5">Ticket ID</th>
                      <th className="py-4 px-5">Issue Image</th>
                      <th className="py-4 px-5">Category</th>
                      <th className="py-4 px-5">Ward</th>
                      <th className="py-4 px-5">Severity</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5">Date Reported</th>
                      <th className="py-4 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredIssuesList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-500 font-mono">
                          No active tickets matching the requested criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredIssuesList.map((issue) => (
                        <tr 
                          key={issue.id} 
                          className="hover:bg-white/[0.01] transition-all duration-150 cursor-pointer"
                          onClick={() => openIssueDetails(issue)}
                        >
                          <td className="py-4 px-5 font-mono font-bold text-[#14B8A6]">{issue.id}</td>
                          <td className="py-4 px-5">
                            <img 
                              src={issue.image || roadNeglected} 
                              alt="thumbnail" 
                              className="w-12 h-9 rounded object-cover border border-white/10 bg-black/20"
                              referrerPolicy="no-referrer"
                            />
                          </td>
                          <td className="py-4 px-5 font-bold text-white">{issue.category}</td>
                          <td className="py-4 px-5 text-gray-300 max-w-[150px] truncate">{issue.location}</td>
                          <td className="py-4 px-5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              issue.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              issue.severity === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {issue.severity}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              issue.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              issue.status === 'In Progress' ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20' :
                              'bg-gray-500/10 text-gray-400 border border-white/5'
                            }`}>
                              {issue.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-gray-400 font-mono text-[10px]">{issue.timeElapsed}</td>
                          <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => openIssueDetails(issue)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-white/10 text-gray-300 hover:text-white hover:border-[#14B8A6] text-[10px] font-bold uppercase cursor-pointer"
                              >
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 3: LIVE INCIDENT MAP
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'map' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Live Incident Vector Map
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Visual distribution plot of reported issues. Selecting a marker reveals its ticket details.
                </p>
              </div>

              {/* Styled Mock Vector Canvas Map */}
              <div className="w-full h-[450px] rounded-xl border border-white/10 bg-[#0B1220] relative overflow-hidden flex items-center justify-center">
                
                {/* SVG Mock Map Grid Gridlines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                <svg className="w-full h-full opacity-20 absolute inset-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M -50 80 Q 200 40 500 120 T 1200 150" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 120 -50 L 220 300" fill="none" stroke="#ffffff" strokeWidth="6" />
                  <path d="M 600 -50 L 520 300" fill="none" stroke="#ffffff" strokeWidth="6" />
                  <path d="M 10 140 L 400 140" fill="none" stroke="#14B8A6" strokeWidth="2" strokeDasharray="4,4" />
                  <path d="M 300 20 L 700 220" fill="none" stroke="#22C55E" strokeWidth="1.5" />
                </svg>

                {/* Plot coordinates */}
                {issues.map(issue => {
                  const isSelected = issue.id === selectedIssueId;
                  const isHigh = issue.severity === 'Critical' || issue.severity === 'High';
                  const isMedium = issue.severity === 'Medium';
                  // Marker colors rule: Red = High/Critical, Orange = Medium, Yellow = Low
                  const pinColor = isHigh ? 'bg-red-500' : isMedium ? 'bg-orange-500' : 'bg-yellow-500';

                  return (
                    <div
                      key={issue.id}
                      style={{ left: `${issue.coordinates.x}%`, top: `${issue.coordinates.y}%` }}
                      onClick={() => openIssueDetails(issue)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 flex flex-col items-center group"
                    >
                      <div className={`w-7 h-7 rounded-full border border-white/15 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'ring-4 ring-[#14B8A6]/35 scale-125 z-20 bg-gradient-to-tr from-[#14B8A6] to-[#22C55E]' 
                          : 'bg-[#111827] hover:border-[#14B8A6] hover:scale-110'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${pinColor}`} />
                      </div>

                      <div className="absolute bottom-8 scale-0 group-hover:scale-100 transition-all bg-black border border-white/10 px-2 py-1 rounded text-[9px] font-mono whitespace-nowrap shadow-xl">
                        <span className="font-bold text-white uppercase">{issue.id}</span>
                        <span className="text-gray-400 font-mono ml-1.5">({issue.category})</span>
                      </div>
                    </div>
                  );
                })}

                {/* Map Color Legend */}
                <div className="absolute bottom-3 left-3 bg-black/80 border border-white/8 rounded-lg py-1.5 px-3 flex items-center gap-3 text-[9px] font-mono text-gray-400 z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Red = High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>Orange = Medium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span>Yellow = Low</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 4: NOTIFICATIONS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'notifications' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#14B8A6] flex items-center gap-2">
                    <Bell className="w-4.5 h-4.5" />
                    Operational Alert Notifications
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Real-time automated dispatches regarding new reports, severity alerts, and resolutions.
                  </p>
                </div>
                <button 
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                  className="px-3 py-1.5 rounded-lg bg-[#0B1220] hover:bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-gray-300 hover:text-white cursor-pointer"
                >
                  Mark all read
                </button>
              </div>

              <div className="flex flex-col gap-3.5">
                {notifications.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                      item.unread 
                        ? 'bg-gradient-to-r from-[#14B8A6]/5 to-[#22C55E]/2 border-[#14B8A6]/20' 
                        : 'bg-[#0B1220]/40 border-white/5'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-white/5 text-xs mt-0.5 shrink-0">
                      {item.type === 'new' && '🆕'}
                      {item.type === 'high' && '🚨'}
                      {item.type === 'assigned' && '⚙️'}
                      {item.type === 'resolved' && '✅'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          {item.title}
                          {item.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-ping" />}
                        </h4>
                        <span className="text-[9px] font-mono text-gray-500 shrink-0">{item.time}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 5: AUTHORITY PROFILE
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#14B8A6] flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                <User className="w-4.5 h-4.5" />
                Command Credentials & Profile
              </h3>

              {profileSuccessMessage && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4" />
                  {profileSuccessMessage}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      required
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      placeholder="e.g. Commissioner K. Rao"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                {/* Employee ID */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Employee ID</label>
                  <div className="relative">
                    <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      required
                      type="text"
                      value={profile.employeeId}
                      onChange={(e) => setProfile({ ...profile, employeeId: e.target.value })}
                      placeholder="e.g. EMP-BBMP-4821"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Department</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      required
                      type="text"
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                      placeholder="e.g. Civil Infrastructure Division"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                {/* Designation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Designation</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      required
                      type="text"
                      value={profile.designation}
                      onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                      placeholder="e.g. Ward Commissioner"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                {/* Assigned Ward */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Assigned Ward Jurisdiction</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      required
                      type="text"
                      value={profile.ward}
                      onChange={(e) => setProfile({ ...profile, ward: e.target.value })}
                      placeholder="e.g. Ward 12 Indiranagar"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                {/* Contact Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      required
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="e.g. +91 98450 12345"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end mt-4">
                  <button
                    disabled={isSavingProfile}
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:opacity-90 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg cursor-pointer flex items-center gap-2 transition-transform hover:scale-102"
                  >
                    {isSavingProfile ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Commit Profile Changes
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}

      </main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ISSUE DETAILS DRAWER (SLIDE-OUT)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {activeIssue && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIssueId(null)}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            />

            {/* Slide-out Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-[#111827] border-l border-white/10 shadow-2xl pt-20 pb-6 flex flex-col justify-between"
            >
              {/* Scrollable contents */}
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
                
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#14B8A6]">{activeIssue.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      activeIssue.severity === 'Critical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {activeIssue.severity} Severity
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedIssueId(null)}
                    className="p-1.5 rounded-lg bg-[#0B1220] border border-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Image block */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-mono font-black text-[#14B8A6] uppercase tracking-widest">Uploaded Image</span>
                  <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/8 bg-black/40 relative">
                    <img 
                      src={uploadedFixPreview || activeIssue.image || roadNeglected} 
                      alt="Incident Evidence" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 border border-white/10 px-2.5 py-1 rounded text-[9px] font-mono text-[#14B8A6] font-bold">
                      {uploadedFixPreview || activeIssue.resolvedImage ? 'COMPLETION PHOTO' : 'REPORTED PROBLEM PHOTO'}
                    </div>
                  </div>
                </div>

                {/* Details list fields */}
                <div className="flex flex-col gap-4 bg-[#0B1220]/60 p-4 rounded-xl border border-white/5">
                  <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                    <div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase block">Issue Category</span>
                      <span className="font-bold text-white">{activeIssue.category}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase block">Current Status</span>
                      <span className="font-bold text-[#14B8A6]">{activeIssue.status}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase block">Citizen Name</span>
                      <span className="font-bold text-white">{activeIssue.reportedBy}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase block">Date & Time</span>
                      <span className="font-bold text-white font-mono">{activeIssue.timeElapsed}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase block">Ward</span>
                      <span className="font-bold text-white">{activeIssue.location}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase block">AI Severity</span>
                      <span className="font-bold text-red-400 font-mono">{activeIssue.severity}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[8px] font-mono text-gray-500 uppercase block">Address</span>
                      <span className="font-bold text-white">{activeIssue.landmark}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[8px] font-mono text-gray-500 uppercase block">GPS Location</span>
                      <span className="font-bold text-white font-mono">12.9716° N, 77.5946° E</span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 mt-1">
                    <span className="text-[8px] font-mono text-gray-500 uppercase block mb-1">Description</span>
                    <p className="text-xs text-gray-300 leading-relaxed">{activeIssue.description}</p>
                  </div>
                </div>

                {/* Dispatch Officer Dropdown Control */}
                <div className="bg-[#0B1220]/60 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest">Assign Active Officer</span>
                  <div className="flex gap-3">
                    <select
                      value={tempOfficer}
                      onChange={(e) => setTempOfficer(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#111827] border border-white/10 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                    >
                      <option value="Unassigned">Unassigned</option>
                      <option value="Officer Mahesh Babu">Officer Mahesh Babu (Roads)</option>
                      <option value="Officer Rajesh Gowda">Officer Rajesh Gowda (Sewerage)</option>
                      <option value="Officer Suresh Kumar">Officer Suresh Kumar (Electrical)</option>
                    </select>
                    <button
                      onClick={handleAssignOfficer}
                      className="px-4 py-2 bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all cursor-pointer shrink-0"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Workflow Buttons requested explicitly */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest">Remediation Status Actions</span>
                  <div className="grid grid-cols-2 gap-2">
                    
                    <button
                      onClick={handleVerifyIssue}
                      disabled={activeIssue.status === 'Verified' || activeIssue.status === 'Resolved'}
                      className="px-3 py-2.5 rounded-lg bg-[#111827] hover:bg-white/5 border border-white/10 hover:border-[#14B8A6]/30 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-[#14B8A6]" />
                      Verify Issue
                    </button>

                    <button
                      onClick={handleMarkInProgress}
                      disabled={activeIssue.status === 'In Progress' || activeIssue.status === 'Resolved'}
                      className="px-3 py-2.5 rounded-lg bg-[#111827] hover:bg-white/5 border border-white/10 hover:border-[#14B8A6]/30 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Mark In Progress
                    </button>

                    <button
                      onClick={handleOpenResolutionModal}
                      className="px-3 py-2.5 rounded-lg bg-[#111827] hover:bg-white/5 border border-white/10 hover:border-emerald-500/30 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all col-span-2"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      Upload Completion Photo & Resolve
                    </button>

                  </div>
                </div>

                {/* Activity log tracker */}
                <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                  <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest">Command Audit Trails</span>
                  <div className="flex flex-col gap-3.5 pl-1 relative">
                    <div className="absolute top-1 bottom-1 left-2 w-[1px] bg-white/5" />
                    
                    {activeIssue.activity.map((act, idx) => (
                      <div key={idx} className="flex gap-3 relative">
                        <div className="w-4 h-4 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0 z-10 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        </div>
                        <div className="flex flex-col text-[11px]">
                          <span className="text-gray-300">
                            <span className="font-bold text-white">{act.actor}</span>: {act.action}
                          </span>
                          <span className="text-[9px] font-mono text-gray-500 mt-0.5">{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          RESOLUTION MODAL OVERLAY
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {showResolutionModal && activeIssue && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResolutionModal(false)}
              className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[10%] bottom-auto md:inset-0 m-auto z-[70] max-w-lg h-fit max-h-[85vh] overflow-y-auto bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-left text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-[#14B8A6] uppercase tracking-widest">Resolution Audit Proof</span>
                  <h3 className="text-base font-bold text-white">Upload Completion Verification Proof (ID: {activeIssue.id})</h3>
                </div>
                <button
                  onClick={() => setShowResolutionModal(false)}
                  className="p-1.5 rounded-lg bg-[#0B1220] border border-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                
                {/* Photo uploader */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Completion Photo Evidence</label>
                  {resolutionPhoto ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[16/9] max-h-48">
                      <img src={resolutionPhoto} className="w-full h-full object-cover" alt="repaired proof" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => setResolutionPhoto('')}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-black/85"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/15 hover:border-[#14B8A6]/40 rounded-xl p-6 bg-[#0B1220]/50 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setResolutionPhoto(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="modal-resolution-file"
                      />
                      <label htmlFor="modal-resolution-file" className="flex flex-col items-center gap-2 cursor-pointer w-full">
                        <Upload className="w-6 h-6 text-[#14B8A6]" />
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">Select Completion Photo</span>
                        <span className="text-[9px] text-gray-500 font-mono">JPG, PNG, WEBP max 5MB</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setResolutionPhoto(roadImproved)}
                        className="text-[10px] font-bold text-[#14B8A6] hover:underline mt-2 cursor-pointer"
                      >
                        Use Demo Improved Road Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Completion Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Completion / Remediation Notes</label>
                  <textarea
                    required
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe repair metrics (e.g. 12 cubic meters of asphalt paved)..."
                    className="w-full h-20 p-3 rounded-xl bg-[#0B1220] border border-white/8 text-xs text-white focus:outline-none focus:border-[#14B8A6] resize-none placeholder-gray-500"
                  />
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Completion Date</label>
                  <input
                    type="date"
                    required
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>

              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4 mt-1">
                <button
                  type="button"
                  onClick={() => setShowResolutionModal(false)}
                  className="flex-1 py-2 rounded-xl border border-white/8 bg-transparent hover:bg-white/5 text-gray-300 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCommitResolutionProof(resolutionPhoto, resolutionNotes, completionDate)}
                  className="flex-1 py-2 bg-gradient-to-r from-[#22C55E] to-[#14B8A6] hover:opacity-90 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#22C55E]/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Resolved
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
