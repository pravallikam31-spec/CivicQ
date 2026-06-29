import { useState, useMemo, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, Search, Bell, MapPin, Plus, Filter, Navigation, Star, 
  CheckCircle2, AlertTriangle, ShieldAlert, Clock, ThumbsUp, 
  Maximize2, ZoomIn, ZoomOut, Compass, ArrowRight, X, Sparkles, LogOut, Info, AlertOctagon, HelpCircle
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

// Import raw image mockups from existing high quality assets for issue thumbnails
// @ts-ignore
import roadNeglected from '../assets/images/civicq_road_neglected_1782498745967.jpg';
// @ts-ignore
import roadImproved from '../assets/images/civicq_road_improved_1782498762847.jpg';
// @ts-ignore
import smartCity from '../assets/images/smart_city_india_1782499431498.jpg';
import { useReportedIssues } from '../utils/issueStore';

interface Issue {
  id: string;
  title: string;
  category: string;
  location: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Resolved';
  reportedTime: string;
  verifiedCount: number;
  status: 'Verified' | 'Investigating' | 'Dispatched' | 'Resolved';
  distance: string;
  image: string;
  lat: number; // percentage coordinate on mockup map
  lng: number; // percentage coordinate on mockup map
  mergedCount: number;
  description: string;
}

interface LiveMapProps {
  onNavigate: (hash: string) => void;
  onLogout: () => void;
}

export default function LiveMap({ onNavigate, onLogout }: LiveMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'profiles', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }
        } catch (e) {
          console.error('Error fetching LiveMap profile:', e);
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [notificationsCount, setNotificationsCount] = useState(3);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'issues'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbIssues = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;
        
        const category = data.category || 'General';
        const ward = data.ward || data.address || 'Ward 12 Indiranagar';
        const title = data.title || `${category} near ${ward}`;
        
        // Map priority
        let priorityVal: 'Critical' | 'High' | 'Medium' | 'Resolved' = 'Medium';
        const sev = (data.severity || data.priority || 'Medium').toLowerCase();
        if (sev === 'critical') {
          priorityVal = 'Critical';
        } else if (sev === 'high') {
          priorityVal = 'High';
        } else if (sev === 'medium') {
          priorityVal = 'Medium';
        } else if (sev === 'resolved') {
          priorityVal = 'Resolved';
        } else {
          priorityVal = 'Medium';
        }

        // Map status
        let statusVal: 'Verified' | 'Investigating' | 'Dispatched' | 'Resolved' = 'Investigating';
        const st = (data.status || 'Reported').toLowerCase();
        if (st === 'resolved' || st === 'closed') {
          statusVal = 'Resolved';
        } else if (st === 'dispatched') {
          statusVal = 'Dispatched';
        } else if (st === 'verified' || st === 'ai verified') {
          statusVal = 'Verified';
        } else {
          statusVal = 'Investigating';
        }

        // Percentage calculations or fallback scatter
        const docLat = data.latitude || data.lat;
        const docLng = data.longitude || data.lng;
        
        let latPct = 42;
        let lngPct = 58;
        if (docLat !== undefined && docLng !== undefined) {
          if (docLat > 12 && docLat < 14 && docLng > 77 && docLng < 79) {
            const latMin = 12.95;
            const latMax = 13.00;
            const lngMin = 77.58;
            const lngMax = 77.66;
            latPct = ((docLat - latMin) / (latMax - latMin)) * 60 + 20;
            lngPct = ((docLng - lngMin) / (lngMax - lngMin)) * 60 + 20;
            latPct = Math.max(10, Math.min(90, latPct));
            lngPct = Math.max(10, Math.min(90, lngPct));
          } else if (docLat <= 100 && docLng <= 100) {
            latPct = docLat;
            lngPct = docLng;
          }
        } else {
          let hash = 0;
          for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
          }
          latPct = Math.abs((hash % 50) + 25);
          lngPct = Math.abs(((hash >> 8) % 50) + 25);
        }

        return {
          id: id,
          title: title,
          category: category,
          location: ward,
          priority: priorityVal,
          reportedTime: 'Just now',
          verifiedCount: data.upvotes || data.verificationCount || 0,
          status: statusVal,
          distance: '350 m away',
          image: data.image || roadNeglected,
          lat: latPct,
          lng: lngPct,
          mergedCount: 1,
          description: data.description || ''
        };
      });

      setIssues(dbIssues);
    }, (error) => {
      console.error("Error in LiveMap Firestore sync:", error);
    });

    return () => unsubscribe();
  }, []);

  const filters = [
    { name: 'All', icon: Filter },
    { name: 'Potholes', icon: AlertTriangle },
    { name: 'Garbage', icon: Sparkles },
    { name: 'Water Leakage', icon: Info },
    { name: 'Streetlights', icon: Clock },
    { name: 'Drainage', icon: AlertOctagon },
    { name: 'Resolved', icon: CheckCircle2 },
    { name: 'Critical', icon: ShieldAlert },
    { name: 'Nearby', icon: Navigation }
  ];

  // Quick statistics at bottom of map
  const stats = [
    { label: 'Nearby Issues', value: '14 Active', color: 'text-red-400' },
    { label: 'Resolved Today', value: '8 Resolved', color: 'text-green-400' },
    { label: 'Avg Dispatch Time', value: '1.4 Hours', color: 'text-[#14B8A6]' },
    { label: 'Community Trust', value: '98.2%', color: 'text-yellow-400' }
  ];

  // Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Filter & Search logic
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // 1. Filter by Search Query
      const matchesSearch = 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // 2. Filter by Category / Priority Chips
      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Critical') return issue.priority === 'Critical';
      if (selectedFilter === 'Resolved') return issue.priority === 'Resolved';
      if (selectedFilter === 'Nearby') return parseInt(issue.distance) < 1000; // nearby under 1km
      
      return issue.category.toLowerCase().includes(selectedFilter.toLowerCase());
    });
  }, [issues, selectedFilter, searchQuery]);

  // Handle mock duplicate reporting
  const handleReportDuplicate = async (id: string) => {
    try {
      const docRef = doc(db, 'issues', id);
      await updateDoc(docRef, {
        upvotes: increment(1),
        verificationCount: increment(1)
      });
      triggerToast(`Duplicate reported! Urgency level increased for ${id}.`);
    } catch (e) {
      console.error("Error reporting duplicate in Firestore:", e);
    }
  };

  // Handle upvote / verification on popup
  const handleVerifyIssue = async (id: string) => {
    try {
      const docRef = doc(db, 'issues', id);
      await updateDoc(docRef, {
        upvotes: increment(1),
        verificationCount: increment(1)
      });
      triggerToast(`Thank you! You verified the active status of ${id}.`);
    } catch (e) {
      console.error("Error upvoting issue in Firestore:", e);
    }
  };

  // Map dragging logic
  const handleMouseDown = (e: MouseEvent) => {
    setIsDraggingMap(true);
    setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingMap) return;
    setMapOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDraggingMap(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col font-sans overflow-hidden select-none">
      
      {/* 1. TOP STICKY BAR HEADER */}
      <header className="sticky top-0 z-40 bg-[#0B1220]/80 backdrop-blur-md border-b border-white/8 py-3.5 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            id="btn-sidebar-menu"
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"
            onClick={() => triggerToast("Municipal Side Drawer opened (Simulated)")}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('#home')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] p-[1px] flex items-center justify-center">
              <div className="w-full h-full rounded-[7px] bg-[#0B1220] flex items-center justify-center">
                <span className="text-sm font-black bg-gradient-to-r from-[#14B8A6] to-[#22C55E] bg-clip-text text-transparent">Q</span>
              </div>
            </div>
            <span className="text-base font-bold tracking-tight text-white hidden sm:inline-block">CivicQ</span>
          </div>

          {/* Current Location Chip */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-[#14B8A6] rounded-xl text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>Indiranagar Ward, BLR</span>
          </div>
        </div>

        {/* Universal Search Bar */}
        <div className="flex-grow max-w-lg mx-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="map-search-bar"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roads, locations or issue IDs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all placeholder-gray-500 shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User profile controls & Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div 
              onClick={() => onNavigate('#profile')}
              className="flex items-center gap-3 bg-[#111827] border border-white/8 pl-3 pr-4 h-11 rounded-xl cursor-pointer hover:border-white/20 transition-all"
            >
              <img 
                src={profile?.avatar || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                className="w-7 h-7 rounded-lg object-cover" 
                alt="Profile"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{profile?.fullName || user.displayName?.split('|')[0] || 'User'}</span>
                <span className="text-[8px] font-mono text-gray-400">{profile?.ward || 'Ward Member'}</span>
              </div>
            </div>
          )}
          
          {/* Notifications */}
          <button 
            id="btn-map-notifications"
            onClick={() => onNavigate('#notifications')}
            className="p-2 bg-[#111827] hover:bg-[#111827]/80 text-gray-400 hover:text-white rounded-xl border border-white/8 relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                {notificationsCount}
              </span>
            )}
          </button>

          {/* Logout button */}
          <button
            id="btn-map-logout"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-white/8 hover:border-red-500/20 text-xs font-bold transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* 2. BODY LAYOUT COMPONENT */}
      <div className="flex-grow flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* Left Side (30% Width): Scrollable Issue Feed */}
        <aside className="w-full lg:w-[30%] bg-[#111827]/60 backdrop-blur-md border-r border-white/8 flex flex-col justify-between overflow-y-auto hidden lg:flex relative z-20">
          
          {/* Headings */}
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-gray-300">
                Live Incident Feed
              </h2>
              <span className="text-[10px] bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 px-2 py-0.5 rounded-md font-bold font-mono">
                {filteredIssues.length} ISSUES
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Explore issues happening around you. Click cards to view.
            </p>
          </div>

          {/* Issue Cards Stack */}
          <div className="flex-grow p-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-220px)]">
            {filteredIssues.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center text-center p-8 mt-12 gap-4">
                <span className="text-4xl animate-bounce">🎉</span>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Great news!</h4>
                  <p className="text-xs text-gray-400">No active civic issues nearby matching filters.</p>
                </div>
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onNavigate(`#issue/${issue.id}`)}
                  className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col gap-3 group relative overflow-hidden ${
                    selectedIssue?.id === issue.id
                      ? 'bg-[#14B8A6]/5 border-[#14B8A6] shadow-[0_0_20px_rgba(20,184,166,0.1)]'
                      : 'bg-[#111827] border-white/5 hover:border-white/12 hover:bg-[#111827]/85'
                  }`}
                >
                  {/* Subtle top indicator glow based on priority */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                    issue.priority === 'Critical' ? 'bg-red-500' :
                    issue.priority === 'High' ? 'bg-orange-500' :
                    issue.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />

                  {/* Thumbnail and Title */}
                  <div className="flex gap-3 items-start">
                    <img
                      src={issue.image}
                      alt="Issue Thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-white/10 group-hover:scale-105 transition-transform shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-bold font-mono text-gray-500">{issue.id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          issue.priority === 'Critical' ? 'bg-red-500/10 text-red-400' :
                          issue.priority === 'High' ? 'bg-orange-500/10 text-orange-400' :
                          issue.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-green-500/10 text-green-400'
                        }`}>
                          {issue.priority}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white group-hover:text-[#14B8A6] transition-colors truncate">
                        {issue.title}
                      </h3>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{issue.location}</p>
                    </div>
                  </div>

                  {/* Distance & Verifiers stats */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-2.5 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-[#14B8A6]" />
                      {issue.distance}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <ThumbsUp className="w-3 h-3 text-green-400" />
                      Verified by {issue.verifiedCount} citizens
                    </span>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      issue.status === 'Resolved' ? 'bg-green-500/10 text-green-400' :
                      issue.status === 'Dispatched' ? 'bg-[#14B8A6]/10 text-[#14B8A6]' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {issue.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(`#issue/${issue.id}`);
                      }}
                      className="text-[10px] font-bold text-[#14B8A6] hover:underline flex items-center gap-1 group/btn"
                    >
                      Open Details
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Prompt banner bottom of sidebar */}
          <div className="p-4 border-t border-white/5 bg-[#0B1220]/40 flex items-center gap-2.5">
            <Info className="w-4 h-4 text-[#14B8A6] shrink-0" />
            <p className="text-[10px] text-gray-400 leading-normal">
              Need immediate assistance? Speak with our conversational <span className="text-white font-bold cursor-pointer hover:underline" onClick={() => onNavigate('#home')}>AI Assistant</span> on the home page.
            </p>
          </div>

        </aside>

        {/* Right Side (70% Width): Interactive Map Viewport */}
        <main className="flex-grow relative flex flex-col justify-between overflow-hidden">
          
          {/* Filter chips bar above map */}
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex gap-2 p-1.5 bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-white/8 shadow-2xl">
              {filters.map((filterItem) => {
                const Icon = filterItem.icon;
                return (
                  <button
                    key={filterItem.name}
                    onClick={() => {
                      setSelectedFilter(filterItem.name);
                      setSelectedIssue(null);
                      triggerToast(`Filter changed: ${filterItem.name}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      selectedFilter === filterItem.name
                        ? 'bg-[#14B8A6] text-white shadow-md shadow-[#14B8A6]/20'
                        : 'text-gray-400 hover:text-white bg-[#0B1220]/60 hover:bg-[#0B1220]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {filterItem.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INTERACTIVE VECTOR MAP CONTAINER */}
          <div 
            className="flex-grow w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden bg-[#0a0f1d]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Realistically styled dark vector map background canvas/SVG overlay */}
            <div 
              className="absolute inset-0 transition-transform duration-150 ease-out origin-center"
              style={{
                transform: `scale(${zoomLevel}) translate(${mapOffset.x}px, ${mapOffset.y}px)`,
                width: '100%',
                height: '100%'
              }}
            >
              {/* Detailed Mock Vector Map Roads, Grid lines & Waterways */}
              <svg className="w-full h-full min-w-[800px] min-h-[600px] opacity-45 pointer-events-none" viewBox="0 0 1000 700">
                {/* Parks and green areas */}
                <rect x="50" y="80" width="180" height="120" rx="12" fill="#14B8A6" fillOpacity="0.08" />
                <rect x="650" y="450" width="250" height="180" rx="20" fill="#22C55E" fillOpacity="0.05" />
                
                {/* Waterbody / River segment */}
                <path d="M 0,400 Q 250,380 500,420 T 1000,390" fill="none" stroke="#0284c7" strokeWidth="24" strokeOpacity="0.15" />

                {/* Major Highways & Arterial Roads */}
                <path d="M 100,0 L 100,700" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                <path d="M 500,0 L 500,700" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                <path d="M 900,0 L 900,700" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                
                <path d="M 0,150 L 1000,150" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                <path d="M 0,350 L 1000,350" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                <path d="M 0,550 L 1000,550" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />

                {/* Smaller grid lanes */}
                <line x1="250" y1="0" x2="250" y2="700" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                <line x1="750" y1="0" x2="750" y2="700" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                <line x1="0" y1="480" x2="1000" y2="480" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />

                {/* Text locations labels */}
                <text x="110" y="50" fill="rgba(255,255,255,0.2)" fontSize="11" fontFamily="monospace" letterSpacing="2">MG ROAD</text>
                <text x="510" y="230" fill="rgba(255,255,255,0.2)" fontSize="11" fontFamily="monospace" letterSpacing="2">INDIRANAGAR 100FT RD</text>
                <text x="760" y="500" fill="rgba(255,255,255,0.2)" fontSize="11" fontFamily="monospace" letterSpacing="2">HAL STAGE 2</text>
              </svg>

              {/* LIVE PULSING MARKERS */}
              {filteredIssues.map((issue) => {
                const isSelected = selectedIssue?.id === issue.id;
                
                // Set priority color exactly as requested: Red = High, Orange = Medium, Yellow = Low
                let markerColor = 'bg-yellow-500';
                let ringColor = 'ring-yellow-500/40';
                let glowBg = 'bg-yellow-500/20';
                let pulseBgColor = '#eab308'; // default low priority (Yellow)

                const priorityLower = (issue.priority || '').toLowerCase();
                if (priorityLower === 'high' || priorityLower === 'critical') {
                  markerColor = 'bg-red-500';
                  ringColor = 'ring-red-500/40';
                  glowBg = 'bg-red-500/20';
                  pulseBgColor = '#ef4444';
                } else if (priorityLower === 'medium') {
                  markerColor = 'bg-orange-500';
                  ringColor = 'ring-orange-500/40';
                  glowBg = 'bg-orange-500/20';
                  pulseBgColor = '#f97316';
                } else if (priorityLower === 'low' || priorityLower === 'resolved') {
                  markerColor = 'bg-yellow-500';
                  ringColor = 'ring-yellow-500/40';
                  glowBg = 'bg-yellow-500/20';
                  pulseBgColor = '#eab308';
                }

                return (
                  <div
                    key={issue.id}
                    className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300"
                    style={{ top: `${issue.lat}%`, left: `${issue.lng}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(`#issue/${issue.id}`);
                    }}
                  >
                    {/* Ring Pulse outer wave */}
                    <span className="absolute inline-flex h-10 w-10 -top-3 -left-3 rounded-full bg-inherit animate-ping opacity-25" style={{ backgroundColor: pulseBgColor }} />
                    
                    {/* Floating pinpoint marker */}
                    <div className={`w-5 h-5 rounded-full border-2 border-white shadow-2xl flex items-center justify-center transition-all duration-300 ${markerColor} ${
                      isSelected ? 'scale-130 ring-8 ' + ringColor : 'hover:scale-115'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    {/* Compact tag above marker */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#111827]/95 border border-white/10 px-2 py-1 rounded-lg shadow-2xl z-40 text-[9px] font-bold text-white flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                      <span className={`w-1.5 h-1.5 rounded-full ${markerColor}`} />
                      {issue.id} • {issue.category}
                    </div>
                  </div>
                );
              })}

            </div>

            {/* Map Utilities: Zoom and center buttons (Right Edge) */}
            <div className="absolute right-4 top-24 z-30 flex flex-col gap-2">
              <button
                id="btn-zoom-in"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2))}
                className="w-10 h-10 rounded-xl bg-[#111827]/90 backdrop-blur-md border border-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-xl"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                id="btn-zoom-out"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                className="w-10 h-10 rounded-xl bg-[#111827]/90 backdrop-blur-md border border-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-xl"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                id="btn-center-map"
                onClick={() => {
                  setMapOffset({ x: 0, y: 0 });
                  setZoomLevel(1);
                }}
                className="w-10 h-10 rounded-xl bg-[#111827]/90 backdrop-blur-md border border-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-xl"
                title="Recenter"
              >
                <Compass className="w-5 h-5" />
              </button>
            </div>

            {/* FLOATING ACTION BUTTON (FAB): Report Issue (Bottom Right) */}
            <div className="absolute right-4 bottom-24 z-30">
              <button
                id="fab-report-map"
                onClick={() => {
                  onNavigate('#report-issue');
                }}
                className="flex items-center gap-2 px-5 py-4 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:from-[#14B8A6]/90 hover:to-[#22C55E]/90 text-white font-bold text-xs uppercase tracking-widest shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group"
              >
                <Plus className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
                <span>Report Issue</span>
              </button>
            </div>

            {/* 3. INTERACTIVE MAP SELECTED POPUP CONTAINER */}
            <AnimatePresence>
              {selectedIssue && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 z-30 bg-[#111827]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2.5 items-center">
                      <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center border border-[#14B8A6]/20">
                        <MapPin className="w-4 h-4 text-[#14B8A6]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest">Selected Spot</span>
                        <h4 className="text-xs font-bold text-white">{selectedIssue.id} • {selectedIssue.category}</h4>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedIssue(null)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail / Meta info */}
                  <div className="grid grid-cols-12 gap-3 items-center bg-[#0B1220]/60 p-2.5 rounded-xl border border-white/5">
                    <img
                      src={selectedIssue.image}
                      alt="Spot"
                      className="col-span-4 w-full aspect-[4/3] rounded-lg object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="col-span-8 text-xs flex flex-col gap-1">
                      <p className="font-bold text-white leading-snug line-clamp-2">{selectedIssue.title}</p>
                      <span className="text-[10px] text-gray-400">{selectedIssue.location}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                    {selectedIssue.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 text-[10px] font-mono">
                    <div className="bg-[#111827] p-2 rounded-lg border border-white/5">
                      <span className="block text-gray-500 uppercase tracking-wider">Urgency Status</span>
                      <span className="text-orange-400 font-bold">{selectedIssue.priority} Priority</span>
                    </div>
                    <div className="bg-[#111827] p-2 rounded-lg border border-white/5">
                      <span className="block text-gray-500 uppercase tracking-wider">Reports Merged</span>
                      <span className="text-[#14B8A6] font-bold">{selectedIssue.mergedCount} duplicates</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 border-t border-white/5 pt-3 mt-1">
                    <button
                      onClick={() => handleVerifyIssue(selectedIssue.id)}
                      className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#22C55E] text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#14B8A6]/10"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verify Status
                    </button>
                    <button
                      onClick={() => handleReportDuplicate(selectedIssue.id)}
                      className="w-1/2 py-2.5 rounded-xl border border-white/8 hover:border-white/12 bg-[#111827] hover:bg-[#111827]/80 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-[#F59E0B]" />
                      Report Duplicate
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4. COMPACT FLOATING STATISTICS PANEL (Bottom Left Edge Desktop) */}
            <div className="absolute left-4 bottom-4 z-30 hidden md:flex gap-3">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 bg-[#111827]/90 backdrop-blur-md border border-white/8 rounded-xl shadow-2xl flex flex-col gap-0.5"
                >
                  <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <span className={`text-xs font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

          </div>

        </main>

      </div>

      {/* MOBILE SHEET TRIGGER / DRAWER */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111827] border-t border-white/8 rounded-t-3xl shadow-2xl">
        <div 
          className="w-full py-3.5 flex items-center justify-center cursor-pointer"
          onClick={() => setIsMobileSheetOpen(!isMobileSheetOpen)}
        >
          <div className="w-12 h-1 bg-gray-500 rounded-full" />
        </div>
        <div className="px-6 pb-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Incident Stream</span>
            <span className="text-xs font-bold text-white">Showing {filteredIssues.length} nearby complaints</span>
          </div>
          <button 
            onClick={() => setIsMobileSheetOpen(true)}
            className="px-4 py-2 bg-[#14B8A6] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-[#14B8A6]/20"
          >
            Expand List
          </button>
        </div>

        {/* Draggable Drawer contents */}
        <AnimatePresence>
          {isMobileSheetOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 350 }}
              exit={{ height: 0 }}
              className="px-6 overflow-y-auto flex flex-col gap-4 pb-8"
            >
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => {
                    onNavigate(`#issue/${issue.id}`);
                    setIsMobileSheetOpen(false);
                  }}
                  className="p-3.5 rounded-xl border border-white/5 bg-[#0B1220]/60 flex items-center justify-between gap-4"
                >
                  <div className="flex gap-2.5 items-center">
                    <img 
                      src={issue.image} 
                      alt="Thumb" 
                      className="w-10 h-10 rounded-lg object-cover border border-white/5" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-xs">
                      <h4 className="font-bold text-white leading-snug">{issue.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{issue.distance} • {issue.priority}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                    issue.status === 'Resolved' ? 'bg-green-500/10 text-green-400' : 'bg-[#14B8A6]/10 text-[#14B8A6]'
                  }`}>
                    {issue.status}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. FLOATING GLASS FEEDBACK TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 bg-[#111827]/95 border border-white/10 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-white tracking-wide">
              {toastMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
