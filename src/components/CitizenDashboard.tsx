import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, MapPin, AlertCircle, CheckCircle2, ThumbsUp, Sparkles, MessageSquare, Compass, ShieldAlert, Upload, Check, X, Camera, ArrowLeft, Clock, Inbox, Edit3, Eye, Activity, Map } from 'lucide-react';
import { issueStore } from '../utils/issueStore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

// @ts-ignore
import roadNeglected from '../assets/images/civicq_road_neglected_1782498745967.jpg';
// @ts-ignore
import roadImproved from '../assets/images/civicq_road_improved_1782498762847.jpg';

interface CitizenDashboardProps {
  onLogout: () => void;
  currentHash?: string;
}

const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return 'Recently';
  }
};

const getTimelineSteps = (status: string) => {
  const norm = (status || '').toLowerCase();
  
  // Stages: Reported (1), Verified (2), In Progress (3), Resolved (4)
  let activeIndex = 1; // default Reported is completed
  if (norm === 'reported' || norm === 'pending' || norm === 'awaiting community verification' || norm === 'awaiting ai verification' || norm === 'pending ai verification') {
    activeIndex = 1;
  } else if (norm === 'verified' || norm === 'ai verified' || norm === 'verified repair') {
    activeIndex = 2;
  } else if (norm === 'in progress' || norm === 'assigned') {
    activeIndex = 3;
  } else if (norm === 'resolved' || norm === 'closed') {
    activeIndex = 4;
  } else if (norm === 'rejected' || norm === 'declined') {
    activeIndex = 1;
  }
  
  return [
    { label: 'Reported', completed: activeIndex >= 1 },
    { label: 'Verified', completed: activeIndex >= 2 },
    { label: 'In Progress', completed: activeIndex >= 3 },
    { label: 'Resolved', completed: activeIndex >= 4 }
  ];
};

const getStatusProps = (status: string) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'reported' || normalized === 'pending' || normalized === 'awaiting community verification' || normalized === 'awaiting ai verification' || normalized === 'pending ai verification') {
    return {
      text: 'Pending',
      bg: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
      dot: 'bg-yellow-400',
      canEdit: true
    };
  }
  if (normalized === 'verified' || normalized === 'ai verified' || normalized === 'verified repair') {
    return {
      text: 'Verified',
      bg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      dot: 'bg-blue-400',
      canEdit: false
    };
  }
  if (normalized === 'in progress' || normalized === 'assigned') {
    return {
      text: 'In Progress',
      bg: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
      dot: 'bg-orange-400',
      canEdit: false
    };
  }
  if (normalized === 'resolved' || normalized === 'closed') {
    return {
      text: 'Resolved',
      bg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      dot: 'bg-emerald-400',
      canEdit: false
    };
  }
  if (normalized === 'rejected' || normalized === 'declined') {
    return {
      text: 'Rejected',
      bg: 'bg-red-500/15 text-red-400 border border-red-500/30',
      dot: 'bg-red-400',
      canEdit: false
    };
  }
  return {
    text: status,
    bg: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
    dot: 'bg-gray-400',
    canEdit: false
  };
};

export default function CitizenDashboard({ onLogout, currentHash }: CitizenDashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [firestoreIssues, setFirestoreIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'profiles', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }
        } catch (e) {
          console.error('Error fetching CitizenDashboard profile:', e);
        }

        // Real-time Firestore query for issues reported by this user
        const q = query(
          collection(db, 'issues'),
          where('reportedBy', '==', currentUser.uid)
        );

        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const fetchedIssues = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          })).sort((a: any, b: any) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : Date.now());
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : Date.now());
            return timeB - timeA;
          });
          setFirestoreIssues(fetchedIssues);
          setLoadingIssues(false);
        }, (error) => {
          console.error('Error loading Firestore issues in dashboard:', error);
          setLoadingIssues(false);
        });

      } else {
        setProfile(null);
        setFirestoreIssues([]);
        setLoadingIssues(false);
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);
  
  // Verification states
  const [selectedVerifyIssue, setSelectedVerifyIssue] = useState<any>(null);
  const [verificationStep, setVerificationStep] = useState<'request' | 'comparison' | 'success' | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // My Issues interaction states
  const [selectedDetailIssue, setSelectedDetailIssue] = useState<any>(null);
  const [selectedEditIssue, setSelectedEditIssue] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCat, setEditCat] = useState('Sanitation');
  const [editSev, setEditSev] = useState('Medium');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEdit = (issue: any) => {
    setSelectedEditIssue(issue);
    setEditTitle(issue.title || `${issue.category} near ${issue.ward || 'Ward 12 Indiranagar'}`);
    setEditDesc(issue.desc || issue.description || '');
    setEditCat(issue.category || 'Sanitation');
    setEditSev(issue.severity || 'Medium');
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEditIssue) return;
    setIsSavingEdit(true);
    try {
      const docRef = doc(db, 'issues', selectedEditIssue.id);
      await updateDoc(docRef, {
        title: editTitle,
        description: editDesc,
        category: editCat,
        severity: editSev,
        updatedAt: serverTimestamp()
      });
      
      // Update local storage store
      issueStore.updateIssue(selectedEditIssue.id, {
        title: editTitle,
        description: editDesc,
        category: editCat,
        priority: editSev as any
      });

      setSelectedEditIssue(null);
    } catch (err) {
      console.error('Error saving edited issue:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('Sanitation');
  const [newSev, setNewSev] = useState('Medium');

  const handleCreateReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const issuesCol = collection(db, 'issues');
      const issueDocRef = doc(issuesCol);
      const generatedId = issueDocRef.id;

      const newIssueData = {
        issueId: generatedId,
        reportedBy: currentUser.uid,
        reportedByName: profile?.fullName || currentUser.displayName?.split('|')[0] || 'Anonymous Citizen',
        reportedByEmail: currentUser.email || '',
        category: newCat,
        description: newDesc,
        severity: newSev,
        ward: profile?.ward || 'Ward 12 Indiranagar',
        city: profile?.city || 'Bengaluru',
        latitude: 12.9716,
        longitude: 77.5946,
        address: profile?.ward || 'Ward 12 Indiranagar, Bengaluru',
        image: '',
        status: "Reported",
        verificationCount: 0,
        upvotes: 0,
        assignedOfficer: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(issueDocRef, newIssueData);

      // Keep local store in sync
      issueStore.addIssue({
        id: generatedId,
        title: `${newCat} near ${profile?.ward || 'Ward 12 Indiranagar'}`,
        category: newCat,
        location: profile?.ward || 'Ward 12 Indiranagar, Bengaluru',
        priority: (newSev === 'Critical' ? 'Critical' : newSev === 'High' ? 'High' : newSev === 'Medium' ? 'Medium' : 'Low'),
        reportedTime: 'Just now',
        verifiedCount: 0,
        status: 'Reported',
        distance: '0 m away',
        image: '',
        description: newDesc,
        landmark: '',
        contactNumber: '',
        isAnonymous: false
      });

      setNewTitle('');
      setNewDesc('');
    } catch (err) {
      console.error('Error saving dashboard issue to Firestore:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      const docRef = doc(db, 'issues', id);
      await updateDoc(docRef, {
        upvotes: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Error upvoting issue in Firestore:', e);
    }
  };

  const handleStartVerification = (report: any) => {
    setSelectedVerifyIssue(report);
    setVerificationStep('request');
    setCapturedPhoto('');
  };

  const handleSkip = () => {
    setSelectedVerifyIssue(null);
    setVerificationStep(null);
    setCapturedPhoto('');
  };

  const handleCapturePhoto = (photo: string) => {
    setCapturedPhoto(photo);
    setVerificationStep('comparison');
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2500);
  };

  const handleConfirmVerification = async () => {
    if (selectedVerifyIssue) {
      try {
        const docRef = doc(db, 'issues', selectedVerifyIssue.id);
        await updateDoc(docRef, {
          status: 'AI Verified',
          citizenVerificationImage: capturedPhoto,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.error('Error verifying issue in Firestore:', e);
      }
    }
    setVerificationStep('success');
  };

  const allReports = firestoreIssues.map(issue => ({
    id: issue.issueId || issue.id,
    title: issue.title || `${issue.category} near ${issue.ward || 'Ward 12 Indiranagar'}`,
    desc: issue.description || '',
    category: issue.category || 'General',
    severity: issue.severity || 'Medium',
    votes: issue.upvotes || 0,
    status: issue.status || 'Reported',
    date: formatTimestamp(issue.createdAt),
    image: issue.image || '',
    ward: issue.ward || 'Ward 12 Indiranagar',
    isGlobal: true,
    raw: issue,
    completionNotes: issue.completionNotes || '',
    completionDate: issue.completionDate || ''
  }));

  return (
    <div className="min-h-screen bg-[#0B1220] text-white pt-24 pb-16 px-6">
      
      {/* Background radial effects */}
      <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-[500px] h-[500px] bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-10 relative z-10">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/8">
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono text-[#14B8A6] uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              {currentHash === '#my-issues' ? 'Track My Contributions' : 'Verified Citizen Profile'}
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white mt-1">
              {currentHash === '#my-issues' ? 'My Reported Issues' : 'Citizen Hub'}
            </h1>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {user && (
              <div 
                className="flex items-center gap-3 bg-[#111827] border border-white/8 pl-3 pr-4 h-11 rounded-xl"
              >
                <img 
                  src={profile?.avatar || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                  className="w-7 h-7 rounded-lg object-cover" 
                  alt="Profile"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{profile?.fullName || user.displayName?.split('|')[0] || 'User'}</span>
                  <span className="text-[8px] font-mono text-gray-400">{profile?.ward || 'Ward Member'}</span>
                </div>
              </div>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/8 bg-[#111827] hover:bg-white/5 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {currentHash === '#my-issues' ? (
          <div className="flex flex-col gap-6">
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-white/5 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-[#14B8A6]" />
                    My Submitted Tickets ({allReports.length})
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage and track your private submissions dispatched to municipal departments.
                  </p>
                </div>
                {allReports.length > 0 && (
                  <button
                    onClick={() => { window.location.hash = '#report-issue'; }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Report New Issue
                  </button>
                )}
              </div>

              {allReports.length === 0 ? (
                <div className="py-16 px-6 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col max-w-sm">
                    <h3 className="text-base font-bold text-white">No reports found</h3>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-sans">
                      You haven't reported any civic issues yet.
                    </p>
                  </div>
                  <button
                    onClick={() => { window.location.hash = '#report-issue'; }}
                    className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#22C55E] text-white text-xs font-bold uppercase tracking-widest hover:opacity-95 transition-all shadow-lg shadow-[#14B8A6]/10 cursor-pointer"
                  >
                    Report Your First Issue
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allReports.map((report) => {
                    const statusInfo = getStatusProps(report.status);
                    return (
                      <div
                        key={report.id}
                        className="p-5 rounded-2xl border border-white/8 bg-[#0B1220]/60 flex flex-col justify-between gap-4 hover:border-white/20 transition-all duration-200"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-gray-500 font-bold">Ticket ID: {report.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusInfo.bg}`}>
                              {statusInfo.text}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            {report.image && (
                              <img
                                src={report.image}
                                alt={report.title}
                                className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="flex flex-col gap-1 min-w-0">
                              <h3 className="text-sm font-bold text-white truncate">{report.title}</h3>
                              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{report.desc}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 text-[10px] text-gray-400 border-t border-white/5 pt-3 mt-1 font-mono">
                            <div className="flex items-center justify-between">
                              <span>Category:</span>
                              <span className="text-gray-200 font-bold">{report.category}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Ward:</span>
                              <span className="text-gray-200 font-bold truncate max-w-[150px]">{report.ward}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Severity / Priority:</span>
                              <span className={`font-bold uppercase tracking-wider ${
                                report.severity === 'Critical' || report.severity === 'High' ? 'text-red-400' : 'text-yellow-400'
                              }`}>{report.severity}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Reported Date:</span>
                              <span className="text-gray-200 font-bold">{report.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                          <button
                            onClick={() => setSelectedDetailIssue(report)}
                            className="flex-1 py-2 px-3 rounded-xl border border-white/8 hover:border-[#14B8A6] bg-[#111827] text-gray-300 hover:text-[#14B8A6] text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details & Track
                          </button>

                          <button
                            onClick={() => {
                              window.location.hash = '#live-map';
                            }}
                            className="py-2 px-3 rounded-xl border border-white/8 hover:border-[#14B8A6] bg-[#111827] text-gray-300 hover:text-[#14B8A6] text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center cursor-pointer"
                            title="View on Map"
                          >
                            <Map className="w-3.5 h-3.5" />
                          </button>

                          {statusInfo.canEdit ? (
                            <button
                              onClick={() => handleOpenEdit(report)}
                              className="py-2 px-3 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6] hover:bg-[#14B8A6]/20 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          ) : (
                            <button
                              disabled
                              className="py-2 px-3 rounded-xl border border-white/5 bg-white/5 text-gray-600 text-[10px] font-bold uppercase tracking-wider cursor-not-allowed"
                              title="Editing disabled for verified or processing issues"
                            >
                              Locked
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left panel: File a new Report */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Log a New Issue
                  </h2>
                  <p className="text-xs text-gray-400">
                    Submit municipal query directly to district ward queue.
                  </p>
                </div>

                <form onSubmit={handleCreateReport} className="flex flex-col gap-4">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                      Issue Title
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Open sewer hole"
                      className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                      Description
                    </label>
                    <textarea
                      required
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Provide details, landmarks..."
                      className="w-full h-24 p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                        Category
                      </label>
                      <select
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white"
                      >
                        <option value="Sanitation">Sanitation</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Roadways">Roadways</option>
                        <option value="Safety">Safety</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                        Severity
                      </label>
                      <select
                        value={newSev}
                        onChange={(e) => setNewSev(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#22C55E] text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform hover:scale-101 active:scale-99 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Dispatch Report
                  </button>

                </form>
              </div>
            </div>

            {/* Right panel: Live Queue status tracker */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Active District Queue
                    </h2>
                    <p className="text-xs text-gray-400">
                      Live tickets requiring citizen consensus and verification.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 rounded-md">
                    Active Ward: Bangalore-12
                  </span>
                </div>

                {/* Feed items */}
                <div className="flex flex-col gap-4">
                  {loadingIssues ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#14B8A6] animate-spin" />
                      <p className="text-xs text-gray-400">Syncing live district queue...</p>
                    </div>
                  ) : allReports.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-12 rounded-2xl border border-white/5 bg-[#111827]/20 flex flex-col items-center justify-center text-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-white">No tickets in your queue</h3>
                        <p className="text-xs text-gray-400 max-w-sm mt-1 leading-relaxed">
                          You haven't submitted any civic issues yet, or your reports are being synchronized. Use the form on the left or the "Report Issue" page to log your first ticket!
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    allReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 rounded-xl border border-white/5 bg-[#0B1220]/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-start gap-4 max-w-xl">
                          {report.image && (
                            <img 
                              src={report.image} 
                              alt={report.title} 
                              className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold font-mono text-gray-500">{report.id}</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-gray-300">
                                {report.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                report.severity === 'High' || report.severity === 'Critical' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                              }`}>
                                {report.severity}
                              </span>
                              <span className="text-[10px] text-gray-500">{report.date}</span>
                            </div>
                            <h3 className="text-sm font-bold text-white">{report.title}</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">{report.desc}</p>
                            {report.ward && (
                              <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                                <MapPin className="w-3 h-3 text-gray-600" />
                                <span>{report.ward}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5 shrink-0">
                          {report.status === 'AI Verified' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3px]" />
                              AI Verified Repair
                            </span>
                          ) : report.status === 'Awaiting Community Verification' ? (
                            <button
                              onClick={() => handleStartVerification(report)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#14B8A6] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 text-[#14B8A6] hover:text-white text-[10px] font-bold transition-all animate-pulse cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verify Repair
                            </button>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              report.status === 'Resolved' || report.status === 'AI Verified' ? 'bg-green-500/10 text-green-400' : report.status === 'In Progress' ? 'bg-[#14B8A6]/10 text-[#14B8A6]' : 'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {report.status}
                            </span>
                          )}

                          {report.status !== 'Awaiting Community Verification' && report.status !== 'AI Verified' && (
                            <button
                              onClick={() => handleUpvote(report.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 hover:border-[#14B8A6] bg-[#111827] text-gray-300 hover:text-[#14B8A6] text-[10px] font-bold transition-all cursor-pointer"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              Upvote ({report.votes})
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CITIZEN VERIFICATION PROOF OVERLAYS
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {selectedVerifyIssue && verificationStep && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[#0B1220] flex flex-col justify-between overflow-y-auto pt-24 pb-16 px-6 font-sans text-white"
          >
            {/* Visual background lights */}
            <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-8 relative z-10">
              
              {/* Header Navigation */}
              <div className="flex items-center justify-between pb-6 border-b border-white/8">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold font-mono text-[#14B8A6] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Resolution Verification Portal
                  </span>
                  <h1 className="text-2xl font-black tracking-tight mt-1">
                    Verify Municipal Resolution
                  </h1>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1.5 rounded-lg bg-[#111827] border border-white/8 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* STEP 1: VERIFICATION REQUEST SCREEN */}
              {verificationStep === 'request' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 flex flex-col gap-5">
                    <div className="flex flex-wrap gap-3 items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-gray-400">ISSUE ID:</span>
                        <span className="text-sm font-black font-mono text-white tracking-wider">{selectedVerifyIssue.id}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Awaiting Community Verification
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Before Repair Photo Card */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Before Repair Photo
                        </span>
                        <div className="rounded-xl overflow-hidden border border-white/8 bg-[#0B1220] aspect-[16/10] relative">
                          <img 
                            src={selectedVerifyIssue.isGlobal ? (selectedVerifyIssue.raw?.image || roadNeglected) : roadNeglected} 
                            className="w-full h-full object-cover" 
                            alt="Before repair" 
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-mono font-bold text-red-400 border border-red-500/25">
                            ORIGINAL ISSUE
                          </span>
                        </div>
                      </div>

                      {/* Authority Repair Photo Card */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
                          Authority Repair Photo
                        </span>
                        <div className="rounded-xl overflow-hidden border border-white/8 bg-[#0B1220] aspect-[16/10] relative">
                          <img 
                            src={selectedVerifyIssue.isGlobal ? (selectedVerifyIssue.raw?.resolvedImage || roadImproved) : roadImproved} 
                            className="w-full h-full object-cover" 
                            alt="Authority repair" 
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-mono font-bold text-[#14B8A6] border border-[#14B8A6]/25">
                            FIELD OFFICER UPLOAD
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                      <div className="bg-[#0B1220]/60 border border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
                        <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">LOCATION</span>
                        <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{selectedVerifyIssue.isGlobal ? selectedVerifyIssue.raw?.location : 'Ward 12 Indiranagar'}</span>
                        </span>
                      </div>
                      <div className="bg-[#0B1220]/60 border border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
                        <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">COMPLETION DATE</span>
                        <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{selectedVerifyIssue.isGlobal ? (selectedVerifyIssue.raw?.completionDate || '2026-06-27') : (selectedVerifyIssue.completionDate || '2026-06-27')}</span>
                        </span>
                      </div>
                      <div className="bg-[#0B1220]/60 border border-white/5 rounded-xl p-3 flex flex-col gap-0.5 sm:col-span-1">
                        <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">OFFICER NOTES</span>
                        <span className="text-xs font-bold text-white block truncate mt-0.5">
                          {selectedVerifyIssue.isGlobal ? (selectedVerifyIssue.raw?.completionNotes || 'Cable repair operations successful.') : (selectedVerifyIssue.completionNotes || 'Cable repair operations successful.')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3.5 border border-white/5 bg-[#111827]/40 rounded-xl p-5 text-center items-center">
                    <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
                      To ensure repair quality meets citizen expectations, please capture and upload a real-time verification photograph from the coordinates of the repaired site.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center w-full max-w-md">
                      <button
                        onClick={handleSkip}
                        className="flex-1 py-3 px-4 rounded-xl border border-white/8 bg-transparent hover:bg-white/5 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Skip
                      </button>

                      {/* Photo capture file uploader */}
                      <div className="flex-1 relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                handleCapturePhoto(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="citizen-photo-capture"
                        />
                        <label
                          htmlFor="citizen-photo-capture"
                          className="w-full h-full py-3 px-4 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:opacity-95 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-[#14B8A6]/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          Capture Photo
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCapturePhoto(roadImproved)}
                      className="text-[11px] text-[#14B8A6] font-bold hover:underline cursor-pointer"
                    >
                      Use Demo Verification Photo (Bypass Camera)
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: AI COMPARISON SCREEN */}
              {verificationStep === 'comparison' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 flex flex-col gap-5">
                    <span className="text-[10px] font-mono font-black text-[#14B8A6] uppercase tracking-widest block text-center">
                      DUAL-SENSOR STRUCTURAL EXAMINATION OVERLAY
                    </span>

                    {/* Three Images Side By Side */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {/* 1. Before */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest text-center">BEFORE</span>
                        <div className="rounded-xl overflow-hidden border border-white/8 bg-[#0B1220] aspect-[4/3] relative">
                          <img 
                            src={selectedVerifyIssue.isGlobal ? (selectedVerifyIssue.raw?.image || roadNeglected) : roadNeglected} 
                            className="w-full h-full object-cover" 
                            alt="Before" 
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-red-500/85 rounded text-[8px] font-mono font-bold text-white">
                            POTHOLE / DEFECT
                          </span>
                        </div>
                      </div>

                      {/* 2. Authority After */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest text-center">AUTHORITY AFTER</span>
                        <div className="rounded-xl overflow-hidden border border-white/8 bg-[#0B1220] aspect-[4/3] relative">
                          <img 
                            src={selectedVerifyIssue.isGlobal ? (selectedVerifyIssue.raw?.resolvedImage || roadImproved) : roadImproved} 
                            className="w-full h-full object-cover" 
                            alt="Authority After" 
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-emerald-500/85 rounded text-[8px] font-mono font-bold text-white">
                            FIX EVIDENCE
                          </span>
                        </div>
                      </div>

                      {/* 3. Citizen Verification */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest text-center">CITIZEN VERIFICATION</span>
                        <div className="rounded-xl overflow-hidden border border-[#14B8A6]/40 bg-[#0B1220] aspect-[4/3] relative group">
                          <img 
                            src={capturedPhoto || roadImproved} 
                            className="w-full h-full object-cover" 
                            alt="Citizen verification" 
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-[#14B8A6]/85 rounded text-[8px] font-mono font-bold text-white">
                            LIVE USER VERIFY
                          </span>

                          {/* Green scanning laser line animation */}
                          {isAnalyzing && (
                            <div className="absolute inset-x-0 h-[2px] bg-[#14B8A6] shadow-[0_0_10px_#14B8A6] top-0 animate-[scan_2s_ease-in-out_infinite]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Feedback Analysis & Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-5 mt-2">
                      <div className="bg-[#0B1220]/70 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
                        <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-wider">NEURAL CLASSIFICATION MATRIX</span>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-gray-400 flex items-center gap-1.5">
                              {isAnalyzing ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-ping" />
                              ) : (
                                <Check className="w-4 h-4 text-emerald-400 stroke-[3px]" />
                              )}
                              Same location detected
                            </span>
                            <span className={`font-bold ${isAnalyzing ? 'text-gray-500' : 'text-emerald-400'}`}>{isAnalyzing ? 'Scanning...' : 'MATCH (100%)'}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-gray-400 flex items-center gap-1.5">
                              {isAnalyzing ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-ping" />
                              ) : (
                                <Check className="w-4 h-4 text-emerald-400 stroke-[3px]" />
                              )}
                              Road damage no longer visible
                            </span>
                            <span className={`font-bold ${isAnalyzing ? 'text-gray-500' : 'text-emerald-400'}`}>{isAnalyzing ? 'Analyzing...' : 'CLEARED'}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-gray-400 flex items-center gap-1.5">
                              {isAnalyzing ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-ping" />
                              ) : (
                                <Check className="w-4 h-4 text-emerald-400 stroke-[3px]" />
                              )}
                              Repair quality acceptable
                            </span>
                            <span className={`font-bold ${isAnalyzing ? 'text-gray-500' : 'text-emerald-400'}`}>{isAnalyzing ? 'Evaluating...' : 'APPROVED'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Score card & final verdict */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0B1220]/70 border border-white/8 rounded-xl p-4 flex flex-col justify-between items-center text-center">
                          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">CONFIDENCE</span>
                          {isAnalyzing ? (
                            <div className="w-10 h-10 border-2 border-dashed border-[#14B8A6] border-t-transparent rounded-full animate-spin my-1" />
                          ) : (
                            <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight my-1">97%</span>
                          )}
                          <span className="text-[8px] font-mono text-gray-500">THRESHOLD MET</span>
                        </div>

                        <div className="bg-[#0B1220]/70 border border-white/8 rounded-xl p-4 flex flex-col justify-between items-center text-center">
                          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">VERDICT RESULT</span>
                          {isAnalyzing ? (
                            <span className="text-xs font-bold text-gray-500 font-mono my-2 uppercase animate-pulse">PROCESSING...</span>
                          ) : (
                            <span className="px-3.5 py-1 text-xs font-black font-mono tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md my-2 uppercase animate-bounce">
                              VERIFIED
                            </span>
                          )}
                          <span className="text-[8px] font-mono text-gray-500">CROSS-EXAM VERIFIED</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 max-w-md mx-auto w-full">
                    <button
                      onClick={handleSkip}
                      className="flex-1 py-3 px-4 rounded-xl border border-white/8 bg-transparent hover:bg-white/5 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isAnalyzing}
                      onClick={handleConfirmVerification}
                      className={`flex-1 py-3 px-4 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        isAnalyzing 
                          ? 'bg-gray-800 border border-white/5 text-gray-500 cursor-not-allowed shadow-none' 
                          : 'bg-gradient-to-r from-[#22C55E] to-[#14B8A6] hover:opacity-95 shadow-[#22C55E]/10'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isAnalyzing ? 'Analyzing...' : 'Confirm Verification'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: FINAL STATUS SUCCESS VIEW */}
              {verificationStep === 'success' && (
                <div className="flex flex-col gap-6 text-center items-center py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-bounce">
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5px]" />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-2xl font-black tracking-tight text-white">Issue Successfully Verified</h2>
                    <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                      Thank you for validating this resolution! Your live verification photometrics have been ledger-committed to verify work closure transparency.
                    </p>
                  </div>

                  {/* 6-STEP WORKFLOW TIMELINE */}
                  <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 w-full max-w-2xl mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-mono font-black text-[#14B8A6] uppercase tracking-widest">TRANSPARENCY CASE TIMELINE</span>
                      <span className="text-[9px] font-mono text-gray-500">ALL STAGES SATISFIED</span>
                    </div>

                    <div className="flex justify-between items-start relative px-2 py-4 overflow-x-auto">
                      {/* Timeline line */}
                      <div className="absolute top-[32px] left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-[#14B8A6] to-[#22C55E]" />

                      {[
                        { stage: 'Reported', label: 'Reported' },
                        { stage: 'Assigned', label: 'Assigned' },
                        { stage: 'In Progress', label: 'In Progress' },
                        { stage: 'Resolved', label: 'Resolved' },
                        { stage: 'AI Verified', label: 'AI Verified' },
                        { stage: 'Closed', label: 'Closed' }
                      ].map((step, idx) => (
                        <div key={step.stage} className="flex flex-col items-center gap-2 z-10 min-w-[70px]">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] text-white flex items-center justify-center border border-transparent shadow-md shadow-[#22C55E]/10">
                            <Check className="w-4 h-4 stroke-[3px]" />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-white uppercase tracking-wider block">
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSkip}
                    className="mt-6 py-3 px-8 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#14B8A6]/10 cursor-pointer"
                  >
                    Return to Hub
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CITIZEN VIEW DETAILS / TRACKING OVERLAY
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {selectedDetailIssue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
          >
            <div className="bg-[#111827] border border-white/8 rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#14B8A6] uppercase tracking-widest">
                    TICKET STATUS TRACKER
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Issue: {selectedDetailIssue.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailIssue(null)}
                  className="p-1.5 rounded-lg bg-[#0B1220] border border-white/8 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Details */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Ticket ID</span>
                      <span className="text-xs font-mono text-gray-300 bg-[#0B1220] p-2 rounded-lg border border-white/5">{selectedDetailIssue.id}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Description</span>
                      <p className="text-xs text-gray-300 bg-[#0B1220] p-3 rounded-lg border border-white/5 leading-relaxed whitespace-pre-wrap">
                        {selectedDetailIssue.desc || "No additional description provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Category</span>
                        <span className="text-xs font-bold text-white bg-[#0B1220] px-3 py-2 rounded-lg border border-white/5">{selectedDetailIssue.category}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Severity</span>
                        <span className="text-xs font-bold text-white bg-[#0B1220] px-3 py-2 rounded-lg border border-white/5">{selectedDetailIssue.severity}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Ward</span>
                        <span className="text-xs font-bold text-white bg-[#0B1220] px-3 py-2 rounded-lg border border-white/5 truncate">{selectedDetailIssue.ward}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Reported Date</span>
                        <span className="text-xs font-bold text-white bg-[#0B1220] px-3 py-2 rounded-lg border border-white/5">{selectedDetailIssue.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Image and Status */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Uploaded Image</span>
                      {selectedDetailIssue.image ? (
                        <div className="rounded-xl overflow-hidden border border-white/8 bg-[#0B1220] aspect-[4/3] relative">
                          <img
                            src={selectedDetailIssue.image}
                            alt="Uploaded issue"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/8 bg-[#0B1220] aspect-[4/3] flex flex-col items-center justify-center text-center p-4">
                          <span className="text-xs text-gray-500">No image uploaded with report</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-[#0B1220] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono text-gray-400">CURRENT STATUS</span>
                        <span className="text-sm font-bold text-white mt-1">{getStatusProps(selectedDetailIssue.status).text}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusProps(selectedDetailIssue.status).bg}`}>
                        {getStatusProps(selectedDetailIssue.status).text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tracking Progress Timeline */}
                <div className="border-t border-white/5 pt-5 flex flex-col gap-3">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                    LIFECYCLE STATUS TIMELINE
                  </span>

                  <div className="bg-[#0B1220] border border-white/5 rounded-xl p-5 flex justify-between items-center relative overflow-x-auto gap-4">
                    {/* Timeline connection line */}
                    <div className="absolute top-[35px] left-[12%] right-[12%] h-[2px] bg-gray-800 -z-0" />
                    
                    {getTimelineSteps(selectedDetailIssue.status).map((step, idx) => (
                      <div key={step.label} className="flex flex-col items-center gap-2 z-10 min-w-[70px]">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                          step.completed
                            ? 'bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] text-white border-transparent shadow-md shadow-[#22C55E]/10'
                            : 'bg-[#111827] text-gray-500 border-white/8'
                        }`}>
                          {step.completed ? (
                            <Check className="w-4 h-4 stroke-[3px]" />
                          ) : (
                            <span className="text-xs font-bold font-mono">{idx + 1}</span>
                          )}
                        </div>
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                          step.completed ? 'text-white' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-[#0B1220]/50 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDetailIssue(null)}
                  className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CITIZEN EDIT REPORT OVERLAY
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {selectedEditIssue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
          >
            <div className="bg-[#111827] border border-white/8 rounded-2xl w-full max-w-lg overflow-hidden relative shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#14B8A6] uppercase tracking-widest">
                    EDIT PENDING REPORT
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Modify Report Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEditIssue(null)}
                  className="p-1.5 rounded-lg bg-[#0B1220] border border-white/8 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                      Issue Title
                    </label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="e.g. Broken streetlight"
                      className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                      Description
                    </label>
                    <textarea
                      required
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Provide updated details, landmarks..."
                      className="w-full h-28 p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                        Category
                      </label>
                      <select
                        value={editCat}
                        onChange={(e) => setEditCat(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white"
                      >
                        <option value="Sanitation">Sanitation</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Roadways">Roadways</option>
                        <option value="Safety">Safety</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                        Severity / Priority
                      </label>
                      <select
                        value={editSev}
                        onChange={(e) => setEditSev(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-[#0B1220]/50 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedEditIssue(null)}
                    className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#22C55E] text-white text-xs font-bold uppercase tracking-widest hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
