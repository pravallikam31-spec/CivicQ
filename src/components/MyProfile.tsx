import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, MapPin, Calendar, Award, Shield, Trophy, TrendingUp, 
  Map, Bell, MessageSquare, Plus, CheckCircle2, ChevronRight, 
  Flame, Sparkles, Camera, Edit2, Zap, Star, AlertCircle, Heart
} from 'lucide-react';
import { auth, db } from '../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Navbar from './Navbar';
import Footer from './Footer';

interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  isUnlocked: boolean;
  category: 'report' | 'verify' | 'community' | 'special';
}

interface Activity {
  id: string;
  title: string;
  desc: string;
  time: string;
  icon: any;
  iconBg: string;
}

interface Achievement {
  id: string;
  title: string;
  desc: string;
  progress: number;
  max: number;
  points: number;
  isCompleted: boolean;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  trustScore: number;
  points: number;
  isCurrentUser: boolean;
  avatar?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface MyProfileProps {
  onNavigate: (hash: string) => void;
  isWorkspace?: boolean;
}

export default function MyProfile({ onNavigate, isWorkspace }: MyProfileProps) {
  // User profile core details
  const [profile, setProfile] = useState({
    name: '',
    city: '',
    ward: '',
    memberSince: '',
    trustScore: 0,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    civicLevel: 'Neighbour',
    pointsToNextLevel: 100,
    nextLevelPoints: 100,
    currentPoints: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editWard, setEditWard] = useState('');

  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states for creating a profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [ward, setWard] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      onNavigate('#login');
      return;
    }

    // Prepopulate email and display name from auth if available
    setEmail(user.email || '');
    if (user.displayName) {
      const parts = user.displayName.split('|');
      setFullName(parts[0] || '');
    }

    try {
      setError('');
      const docRef = doc(db, 'profiles', user.uid);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `profiles/${user.uid}`);
      }

      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          name: data.fullName || '',
          city: data.city || '',
          ward: data.ward || '',
          memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'October 2025',
          trustScore: data.trustScore !== undefined ? data.trustScore : 0,
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          civicLevel: data.civicLevel || 'Neighbour',
          pointsToNextLevel: data.pointsToNextLevel !== undefined ? data.pointsToNextLevel : 100,
          nextLevelPoints: data.nextLevelPoints !== undefined ? data.nextLevelPoints : 100,
          currentPoints: data.currentPoints !== undefined ? data.currentPoints : 0
        });
        setEditName(data.fullName || '');
        setEditWard(data.ward || '');
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      let friendlyMessage = 'Failed to load profile details. Please try refreshing the page.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) {
          friendlyMessage = `Failed to load profile details: ${parsed.error}`;
        }
      } catch (parseErr) {
        if (err.message) {
          friendlyMessage = `Failed to load profile: ${err.message}`;
        }
      }
      setError(friendlyMessage);
      setHasProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [onNavigate]);

  const handleCreateProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    setError('');

    const now = new Date().toISOString();

    const newProfile = {
      fullName,
      email,
      phone,
      city,
      ward,
      preferredLanguage,
      trustScore: 0,
      civicLevel: 'Neighbour',
      createdAt: now,
      updatedAt: now
    };

    try {
      const docRef = doc(db, 'profiles', user.uid);
      try {
        await setDoc(docRef, newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `profiles/${user.uid}`);
      }
      
      setProfile({
        name: fullName,
        city: city,
        ward: ward,
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        trustScore: 0,
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        civicLevel: 'Neighbour',
        pointsToNextLevel: 100,
        nextLevelPoints: 100,
        currentPoints: 0
      });
      setHasProfile(true);
      onNavigate('#live-map');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      let friendlyMessage = 'Failed to save profile. Please try again.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) {
          friendlyMessage = `Failed to create profile: ${parsed.error}`;
        }
      } catch (parseErr) {
        if (err.message) {
          friendlyMessage = `Failed to create profile: ${err.message}`;
        }
      }
      setError(friendlyMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        setError('');
        const docRef = doc(db, 'profiles', user.uid);
        try {
          await setDoc(docRef, {
            fullName: editName,
            ward: editWard,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `profiles/${user.uid}`);
        }
        
        await fetchProfile();
        setIsEditing(false);
      } catch (e: any) {
        console.error('Error saving edited profile:', e);
        let friendlyMessage = 'Failed to save profile changes. Please try again.';
        try {
          const parsed = JSON.parse(e.message);
          if (parsed.error) {
            friendlyMessage = `Failed to save changes: ${parsed.error}`;
          }
        } catch (parseErr) {
          if (e.message) {
            friendlyMessage = `Failed to save changes: ${e.message}`;
          }
        }
        setError(friendlyMessage);
      }
    }
  };

  // Statistic cards data
  const stats = [
    { label: 'Reports Submitted', value: '14', desc: 'Civic issues reported', color: 'text-red-400' },
    { label: 'Issues Verified', value: '42', desc: 'Local consensus votes', color: 'text-amber-400' },
    { label: 'Issues Resolved', value: '11', desc: 'Closed civil cases', color: 'text-emerald-400' },
    { label: 'Community Points', value: '1,850', desc: 'All-time active score', color: 'text-purple-400' },
    { label: 'Current Ranking', value: '#12', desc: 'Indiranagar Ward Leaderboard', color: 'text-blue-400' },
    { label: 'AI Verified Repairs', value: '8', desc: 'Cross-validated closures', color: 'text-teal-400' }
  ];

  // Badge collection
  const badges: Badge[] = [
    { id: 'b1', name: 'First Report', desc: 'Reported first municipal hazard', icon: '🥇', isUnlocked: true, category: 'report' },
    { id: 'b2', name: 'Road Guardian', desc: 'Resolved 5 road structural potholes', icon: '🛣', isUnlocked: true, category: 'report' },
    { id: 'b3', name: 'Water Warrior', desc: 'Identified 3 minor/major pipeline fractures', icon: '💧', isUnlocked: true, category: 'verify' },
    { id: 'b4', name: 'Light Saver', desc: 'Identified 10 broken street lamp units', icon: '💡', isUnlocked: false, category: 'verify' },
    { id: 'b5', name: 'Clean City Hero', desc: 'Logged 3 severe public refuse/garbage sites', icon: '♻', isUnlocked: true, category: 'special' },
    { id: 'b6', name: 'Civic Champion', desc: 'Maintained 95%+ Trust score over 90 days', icon: '🏆', isUnlocked: false, category: 'special' },
    { id: 'b7', name: 'Community Guardian', desc: 'Verified 20+ active repairs in Indiranagar', icon: '🤝', isUnlocked: true, category: 'community' }
  ];

  // Recent activity timelines
  const activities: Activity[] = [
    { id: 'a1', title: 'Reported pothole on MG Road', desc: 'AI auto-classified severity to High. Assigned to Ward Officer.', time: '2 hours ago', icon: AlertCircle, iconBg: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { id: 'a2', title: 'Verified water leakage', desc: 'Participated in community consensus for pipeline breach in Sector 4.', time: 'Yesterday', icon: CheckCircle2, iconBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    { id: 'a3', title: 'Earned Community Guardian badge', desc: 'Accumulated 25 community repair confirmations this quarter.', time: '2 days ago', icon: Award, iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { id: 'a4', title: 'Successfully verified a repaired road', desc: 'Photographed completed asphalt layout. Match verification 97%.', time: '3 days ago', icon: Sparkles, iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { id: 'a5', title: 'Received Trust Score increase', desc: 'Platform consensus rating boosted from 89% to 92%.', time: '5 days ago', icon: TrendingUp, iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
  ];

  // Achievement milestones
  const achievements: Achievement[] = [
    { id: 'm1', title: 'First Report', desc: 'File your initial public issue report', progress: 1, max: 1, points: 50, isCompleted: true },
    { id: 'm2', title: '10 Reports', desc: 'Consistently report active civil repairs', progress: 14, max: 20, points: 250, isCompleted: false },
    { id: 'm3', title: '50 Verifications', desc: 'Verify unresolved or resolved issues nearby', progress: 42, max: 50, points: 300, isCompleted: false },
    { id: 'm4', title: '100 Community Points', desc: 'Earn points through community consensus action', progress: 1850, max: 2000, points: 500, isCompleted: false },
    { id: 'm5', title: '30-Day Active Member', desc: 'Check or active vote over 30 consecutive days', progress: 30, max: 30, points: 150, isCompleted: true }
  ];

  // Leaderboard previews
  const leaderboard: LeaderboardUser[] = [
    { rank: 1, name: 'Ananya Sharma', trustScore: 99, points: 4210, isCurrentUser: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' },
    { rank: 2, name: 'Karthik Rao', trustScore: 98, points: 3850, isCurrentUser: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' },
    { rank: 11, name: 'Siddharth Iyer', trustScore: 93, points: 1980, isCurrentUser: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
    { rank: 12, name: profile.name ? `${profile.name} (You)` : 'You', trustScore: profile.trustScore || 92, points: profile.currentPoints || 1850, isCurrentUser: true, avatar: profile.avatar },
    { rank: 13, name: 'Meera Patel', trustScore: 91, points: 1720, isCurrentUser: false, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100' }
  ];

  // Community impact statistics
  const impactStats = [
    { label: 'Roads Improved', value: '4 Potholes Fixed', desc: 'Asphalt & structures re-leveled' },
    { label: 'Streetlights Fixed', value: '3 Units Restored', desc: 'Safe street vectors illuminated' },
    { label: 'Water Leaks Reported', value: '2 Pipelines Sealed', desc: 'Liters of clean water conserved' },
    { label: 'Community Verifications', value: '18 Direct Sign-offs', desc: 'Ensuring resolution transparency' },
    { label: 'Estimated Citizens Helped', value: '450+ Citizens', desc: 'Immediate direct neighborhood impact' }
  ];

  // TRUST SCORE Ring attributes
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (profile.trustScore / 100) * circumference;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#14B8A6] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (hasProfile === false) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-white flex flex-col font-sans antialiased overflow-x-hidden relative">
        {!isWorkspace && <Navbar />}

        {/* Decorative radial gradients */}
        <div className="absolute top-24 left-10 w-[450px] h-[450px] bg-[#14B8A6]/4 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-96 right-10 w-[500px] h-[500px] bg-[#22C55E]/4 rounded-full blur-3xl pointer-events-none" />

        <main className={`flex-1 max-w-lg mx-auto w-full px-6 pb-20 relative z-10 flex flex-col gap-6 justify-center ${isWorkspace ? 'pt-24' : 'pt-32'}`}>
          <div className="bg-[#111827] border border-white/8 rounded-2xl p-8 flex flex-col gap-6 text-left shadow-2xl">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono font-bold text-[#14B8A6] uppercase tracking-widest flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Setup Profile
              </span>
              <h2 className="text-xl font-black text-white">Create Your Citizen Profile</h2>
              <p className="text-xs text-gray-400">
                Please complete your profile to start reporting civic issues and participating in your neighborhood.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProfileSubmit} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all placeholder-gray-600"
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  readOnly
                  value={email}
                  className="w-full p-3 rounded-xl bg-[#0B1220]/50 border border-white/5 text-xs text-gray-500 outline-none cursor-not-allowed"
                />
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all placeholder-gray-600"
                />
              </div>

              {/* City */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all placeholder-gray-600"
                />
              </div>

              {/* Ward */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  Ward
                </label>
                <input
                  type="text"
                  required
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="e.g. Ward 12 Indiranagar"
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all placeholder-gray-600"
                />
              </div>

              {/* Preferred Language */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#14B8A6] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save & Continue to Map
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
        {!isWorkspace && <Footer />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col font-sans antialiased overflow-x-hidden relative">
      {!isWorkspace && <Navbar />}

      {/* Decorative radial gradients */}
      <div className="absolute top-24 left-10 w-[450px] h-[450px] bg-[#14B8A6]/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 right-10 w-[500px] h-[500px] bg-[#22C55E]/4 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className={`flex-1 max-w-7xl mx-auto w-full px-6 pb-20 relative z-10 flex flex-col gap-8 ${isWorkspace ? 'pt-24' : 'pt-28'}`}>
        
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* PROFILE HEADER & CIVIC LEVEL BAR */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Column 1: Core Avatar & Name details */}
          <div className="lg:col-span-2 bg-[#111827] border border-white/8 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden text-left">
            {/* Visual shine */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/3 to-transparent rounded-full blur-xl pointer-events-none" />
            
            {/* Circular Trust Score Ring with Profile Image inside */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 absolute">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className="stroke-white/5"
                  strokeWidth="6"
                  fill="transparent"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className="stroke-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              {/* Profile Image container */}
              <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 relative group">
                <img src={profile.avatar} className="w-full h-full object-cover" alt="Citizen Avatar" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              {/* Trust Score Badge */}
              <div className="absolute -bottom-1 bg-gradient-to-r from-emerald-500 to-[#14B8A6] px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20">
                TS {profile.trustScore}%
              </div>
            </div>

            {/* Profile Text & Edit fields */}
            <div className="flex-1 flex flex-col justify-between h-full gap-4 w-full">
              <div className="flex flex-col gap-1.5">
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <div className="flex flex-col gap-2 mt-2 w-full max-w-sm">
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        className="p-2.5 rounded-xl bg-[#0B1220] border border-[#14B8A6] focus:outline-none text-sm text-white font-extrabold"
                        placeholder="Full Name"
                      />
                      <input 
                        type="text" 
                        value={editWard} 
                        onChange={(e) => setEditWard(e.target.value)}
                        className="p-2.5 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white"
                        placeholder="Ward"
                      />
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-0.5"
                    >
                      <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        {profile.name}
                        <span className="px-2 py-0.5 rounded bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-[9px] font-bold text-[#14B8A6] uppercase tracking-wider">
                          Active Citizen
                        </span>
                      </h2>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-400 mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {profile.city}, {profile.ward}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          Joined {profile.memberSince}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Edit Button or Confirm */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-[#14B8A6] hover:opacity-90 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile.name);
                        setEditWard(profile.ward);
                      }}
                      className="px-4 py-1.5 bg-transparent border border-white/8 text-gray-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setError('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-white/8 hover:border-[#14B8A6] bg-[#0B1220] hover:bg-white/5 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Profile Details
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Civic level & progress */}
          <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden text-left">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono font-bold text-[#14B8A6] uppercase tracking-widest flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-[#14B8A6]" />
                Civic Achievement Standing
              </span>
              <h3 className="text-xl font-black text-white">{profile.civicLevel}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                You are in the top 5% of helpful community monitors in Bengaluru. Resolve 3 more cases to reach <span className="text-[#14B8A6] font-bold">Civic Champion</span>.
              </p>
            </div>

            {/* Level Progress Bar */}
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-gray-400">
                <span>PROGRESS TO LEVEL UP</span>
                <span className="text-white font-black">{profile.currentPoints} / {profile.nextLevelPoints} XP</span>
              </div>
              <div className="w-full h-2.5 bg-[#0B1220] border border-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(profile.currentPoints / profile.nextLevelPoints) * 100}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#14B8A6] to-[#22C55E]"
                />
              </div>
              <span className="text-[9px] font-mono text-gray-500 text-right uppercase tracking-wider block mt-0.5">
                {profile.pointsToNextLevel} points remaining
              </span>
            </div>
          </div>
        </section>

        {/* STATS GRID */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-left">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -3, borderColor: 'rgba(255, 255, 255, 0.12)' }}
              className="p-4 rounded-xl border border-white/5 bg-[#111827]/60 flex flex-col justify-between gap-1 transition-all shadow-md"
            >
              <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
              <span className={`text-2xl font-black font-mono tracking-tight my-1.5 ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-[10px] text-gray-500 font-medium leading-normal">{stat.desc}</span>
            </motion.div>
          ))}
        </section>

        {/* TWO-COLUMN GRID: BADGES & MAIN CONTENT */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT PANEL: BADGE COLLECTION & COMMUNITY LEADERBOARD PREVIEW */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* BADGES COLLECTION */}
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#14B8A6]" />
                  Badge Collection
                </h3>
                <span className="text-[10px] font-mono font-bold text-gray-500">
                  {badges.filter(b => b.isUnlocked).length} / {badges.length} UNLOCKED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-xl border flex flex-col gap-1.5 items-center text-center transition-all ${
                      badge.isUnlocked
                        ? 'bg-[#0B1220] border-white/5 hover:border-[#14B8A6]/30 hover:scale-[1.03] cursor-pointer'
                        : 'bg-[#111827]/40 border-white/4 opacity-40 select-none'
                    }`}
                  >
                    <span className="text-2xl" role="img" aria-label={badge.name}>
                      {badge.icon}
                    </span>
                    <span className="text-[10px] font-extrabold text-white leading-tight">
                      {badge.name}
                    </span>
                    <span className="text-[8px] text-gray-500 leading-snug">
                      {badge.desc}
                    </span>
                    {badge.isUnlocked ? (
                      <span className="mt-1 text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        UNLOCKED
                      </span>
                    ) : (
                      <span className="mt-1 text-[8px] font-mono font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                        LOCKED
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* LEADERBOARD PREVIEW */}
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[#14B8A6]" />
                  Leaderboard Preview
                </h3>
                <button
                  onClick={() => onNavigate('#transparency')}
                  className="text-[10px] font-bold text-[#14B8A6] hover:underline cursor-pointer uppercase tracking-wider"
                >
                  Full Board
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {leaderboard.map((user) => (
                  <div
                    key={user.rank}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                      user.isCurrentUser 
                        ? 'bg-[#14B8A6]/10 border-[#14B8A6]/20' 
                        : 'bg-[#0B1220]/50 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-black text-gray-400 w-5 text-center">
                        #{user.rank}
                      </span>
                      {user.avatar && (
                        <img src={user.avatar} className="w-7 h-7 rounded-full object-cover border border-white/10" alt="Leaderboard Profile" referrerPolicy="no-referrer" />
                      )}
                      <span className={`text-xs font-bold ${user.isCurrentUser ? 'text-white font-black' : 'text-gray-300'}`}>
                        {user.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      <span className="text-emerald-400 font-bold">TS {user.trustScore}%</span>
                      <span className="text-gray-500 font-bold">{user.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: TIMELINE, ACHIEVEMENTS, COMMUNITY IMPACT, QUICK ACTIONS */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* IMPACT SUMMARY */}
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-0.5 pb-3 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-[#14B8A6]" />
                  My Community Impact
                </h3>
                <span className="text-[10px] text-gray-500">Live platform photometrics based on your reported contributions.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {impactStats.map((item, idx) => (
                  <div key={idx} className="bg-[#0B1220]/60 border border-white/5 rounded-xl p-4 flex flex-col gap-1 hover:border-white/10 transition-colors">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">{item.label}</span>
                    <span className="text-sm font-black text-white mt-0.5">{item.value}</span>
                    <span className="text-[10px] text-gray-400 leading-normal">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MILESTONE ACHIEVEMENTS */}
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#14B8A6]" />
                  Milestone Achievements
                </h3>
                <span className="text-[10px] font-mono font-bold text-gray-500">BOOST YOUR TRUST SCORE</span>
              </div>

              <div className="flex flex-col gap-3.5">
                {achievements.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 p-3 bg-[#0B1220]/40 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {item.title}
                          {item.isCompleted && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] text-emerald-400 font-mono">COMPLETED</span>
                          )}
                        </span>
                        <span className="text-[10px] text-gray-400 leading-relaxed">{item.desc}</span>
                      </div>
                      <span className="text-[10px] font-mono font-black text-[#14B8A6] shrink-0">+{item.points} XP</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-[#0B1220] border border-white/5 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-gradient-to-r from-[#14B8A6] to-[#22C55E]" 
                          style={{ width: `${Math.min((item.progress / item.max) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 w-12 text-right shrink-0">
                        {item.progress} / {item.max}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RECENT ACTIVITY TIMELINE */}
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#14B8A6]" />
                  Recent Activity Timeline
                </h3>
                <span className="text-[10px] font-mono font-bold text-gray-500">LIVE HISTORY</span>
              </div>

              <div className="flex flex-col gap-5 pl-2 relative border-l border-white/5 ml-3">
                {activities.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div key={item.id} className="relative flex items-start gap-4">
                      {/* Circle node connector */}
                      <div className={`absolute -left-[27px] top-1 p-1 rounded-full border ${item.iconBg}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-white">{item.title}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{item.time}</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUICK ACTIONS PANEL */}
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 text-left">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#14B8A6]" />
                Civic Quick Actions
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => onNavigate('#report-issue')}
                  className="p-3 bg-[#0B1220]/80 border border-white/5 hover:border-red-500/20 hover:bg-red-500/5 hover:scale-[1.02] rounded-xl flex flex-col items-center text-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-red-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Report New Issue</span>
                </button>

                <button
                  onClick={() => onNavigate('#citizen-dashboard')}
                  className="p-3 bg-[#0B1220]/80 border border-white/5 hover:border-[#14B8A6]/20 hover:bg-[#14B8A6]/5 hover:scale-[1.02] rounded-xl flex flex-col items-center text-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Map className="w-5 h-5 text-[#14B8A6]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">View My Reports</span>
                </button>

                <button
                  onClick={() => onNavigate('#notifications')}
                  className="p-3 bg-[#0B1220]/80 border border-white/5 hover:border-amber-500/20 hover:bg-amber-500/5 hover:scale-[1.02] rounded-xl flex flex-col items-center text-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Bell className="w-5 h-5 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Open Notifications</span>
                </button>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-civic-ai'))}
                  className="p-3 bg-[#0B1220]/80 border border-white/5 hover:border-purple-500/20 hover:bg-purple-500/5 hover:scale-[1.02] rounded-xl flex flex-col items-center text-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Open AI Assistant</span>
                </button>
              </div>
            </div>

          </div>

        </section>

      </main>

      {!isWorkspace && <Footer />}
    </div>
  );
}
