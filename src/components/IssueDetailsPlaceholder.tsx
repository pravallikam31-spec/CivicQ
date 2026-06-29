import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Share2, Bookmark, MapPin, AlertTriangle, Check, 
  ThumbsUp, Calendar, Landmark, HelpCircle, Layers, Eye, 
  Clock, Sparkles, CheckCircle2, ChevronRight, Map, ExternalLink, ShieldAlert
} from 'lucide-react';
import { doc, collection, query, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../utils/firebase';

// @ts-ignore
import roadNeglected from '../assets/images/civicq_road_neglected_1782498745967.jpg';
// @ts-ignore
import roadImproved from '../assets/images/civicq_road_improved_1782498762847.jpg';
import { issueStore } from '../utils/issueStore';

interface IssueDetailsPlaceholderProps {
  issueId: string;
  onNavigate: (hash: string) => void;
}

export default function IssueDetailsPlaceholder({ issueId, onNavigate }: IssueDetailsPlaceholderProps) {
  // Normalize empty or default issueId
  const normalizedId = issueId || 'CQ-2026-004812';

  const [dbIssue, setDbIssue] = useState<any>(null);

  useEffect(() => {
    // We want to listen to this specific issue in Firestore
    const q1 = query(collection(db, 'issues'));
    const unsubscribe = onSnapshot(q1, (snapshot) => {
      // Find the document that matches normalizedId
      const foundDoc = snapshot.docs.find(docSnap => {
        const data = docSnap.data();
        return docSnap.id === normalizedId || data.issueId === normalizedId;
      });

      if (foundDoc) {
        const data = foundDoc.data();
        const id = data.issueId || foundDoc.id;
        const category = data.category || 'General';
        const ward = data.ward || data.address || 'Ward 12 Indiranagar';
        const title = data.title || `${category} near ${ward}`;
        const severity = data.severity || 'Medium';
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

        setDbIssue({
          id,
          docId: foundDoc.id,
          title,
          location: ward,
          category,
          reportedBy: data.reportedByName || 'Anonymous Citizen',
          urgency: severity,
          priority: severity,
          severity,
          aiPriority: severity,
          reportedTime: dateStr,
          status,
          assignedOfficer: data.assignedOfficer || 'Unassigned',
          verifiedCount: data.upvotes || data.verificationCount || 0,
          image: data.image || '',
          resolvedImage: data.resolvedImage || data.citizenVerificationImage || '',
          description: data.description || '',
          landmark: data.landmark || 'Not specified',
          completionNotes: data.completionNotes || '',
          completionDate: data.completionDate || '',
          raw: data
        });
      }
    }, (error) => {
      console.error("Error in onSnapshot for IssueDetailsPlaceholder:", error);
    });

    return () => unsubscribe();
  }, [normalizedId]);

  const reportedIssue = dbIssue || issueStore.getIssueById(normalizedId);
  const beforeImage = (reportedIssue && (reportedIssue.image || reportedIssue.raw?.image)) ? (reportedIssue.image || reportedIssue.raw?.image) : roadNeglected;
  const titleText = reportedIssue ? reportedIssue.title : "Pothole near MG Road Metro Station";
  const locationText = reportedIssue ? reportedIssue.location : "MG Road Metro Station (Near Exit A) • Shantala Nagar";
  const categoryText = reportedIssue ? reportedIssue.category : "Road Defect";
  const priorityText = reportedIssue ? `${reportedIssue.priority || 'High'} Severity` : "High Severity";
  const descriptionText = reportedIssue ? reportedIssue.description : "A high-severity structural defect situated on the main arterial lane immediately next to the MG Road Metro entry staircase. Rapid water logging during rains has exacerbated sub-surface erosion, causing deep asphalt disintegration that poses serious hazards to two-wheelers and slows commute speed drastically.";
  const landmarkText = reportedIssue ? reportedIssue.landmark || "Opposite MG Road Metro exit A" : "Opposite MG Road Metro exit A";
  const timestampText = reportedIssue ? (reportedIssue.reportedTime === 'Just now' ? 'Just now' : reportedIssue.reportedTime) : "26 June 2026, 11:42 AM";
  const statusText = reportedIssue ? reportedIssue.status : "In Progress";

  // Interactive States
  const [isVerified, setIsVerified] = useState(false);
  const [verificationCount, setVerificationCount] = useState(42);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDuplicateToast, setShowDuplicateToast] = useState(false);
  
  // Horizontal Timeline Active Stage (4th stage: "In Progress" has index 3)
  const [activeStage, setActiveStage] = useState(3);

  // Sync verificationCount when reportedIssue updates
  useEffect(() => {
    if (reportedIssue) {
      setVerificationCount(reportedIssue.verifiedCount ?? 42);
    }
  }, [reportedIssue?.verifiedCount]);

  // Sync activeStage based on statusText
  useEffect(() => {
    if (!statusText) return;
    const lowerStatus = statusText.toLowerCase();
    if (lowerStatus === 'reported') setActiveStage(0);
    else if (lowerStatus === 'verified' || lowerStatus === 'awaiting verification' || lowerStatus === 'awaiting community verification') setActiveStage(1);
    else if (lowerStatus === 'assigned') setActiveStage(2);
    else if (lowerStatus === 'in progress' || lowerStatus === 'in-progress') setActiveStage(3);
    else if (lowerStatus === 'resolved') setActiveStage(4);
    else if (lowerStatus === 'ai verification' || lowerStatus === 'ai verified') setActiveStage(5);
    else if (lowerStatus === 'closed') setActiveStage(6);
  }, [statusText]);

  // Timeline stages definition
  const stages = [
    { name: 'Reported', desc: 'Logged on ledger' },
    { name: 'Awaiting Verification', desc: 'Community voting' },
    { name: 'Assigned', desc: 'Ward officer assigned' },
    { name: 'In Progress', desc: 'Repairs underway' },
    { name: 'Resolved', desc: 'Fix uploaded' },
    { name: 'AI Verification', desc: 'Satellite scanning' },
    { name: 'Closed', desc: 'Case archived' }
  ];

  const handleVerify = async () => {
    const docId = dbIssue?.docId || normalizedId;
    try {
      const docRef = doc(db, 'issues', docId);
      if (!isVerified) {
        setIsVerified(true);
        setVerificationCount(prev => prev + 1);
        await updateDoc(docRef, {
          upvotes: increment(1)
        });
      } else {
        setIsVerified(false);
        setVerificationCount(prev => prev - 1);
        await updateDoc(docRef, {
          upvotes: increment(-1)
        });
      }
    } catch (error) {
      console.error("Error updating upvote count in Firestore:", error);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/issue/${normalizedId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleReportDuplicate = () => {
    setShowDuplicateToast(true);
    setTimeout(() => setShowDuplicateToast(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white pt-24 pb-16 px-4 sm:px-6 md:px-8 relative overflow-hidden font-sans">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating duplicate logged notification toast */}
      <AnimatePresence>
        {showDuplicateToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#111827] border border-red-500/30 px-5 py-4 rounded-xl flex items-center gap-3.5 shadow-2xl max-w-sm"
          >
            <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Duplicate Logged</h4>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                Thank you! Our system is evaluating overlapping coordinates to merge these reports.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto flex flex-col gap-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('#live-map')}
            className="group flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#14B8A6] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-[#14B8A6]/30 transition-all">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            Back to Live Map
          </button>

          <div className="flex items-center gap-2 font-mono text-[11px] text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
            LIVE PROTOCOL ENGAGED
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PAGE HEADER
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="bg-[#111827]/75 backdrop-blur-md border border-white/8 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          
          {/* Neon vertical glow bar */}
          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#14B8A6] to-[#22C55E]" />

          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300">
                ID: <span className="text-white font-black tracking-wide">{normalizedId}</span>
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#14B8A6]/10 text-[#14B8A6] rounded-md border border-[#14B8A6]/20 uppercase tracking-wider">
                {categoryText}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                {statusText}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 rounded-md border border-red-500/20 uppercase tracking-wider">
                {priorityText}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-none mt-1">
              {titleText}
            </h1>

            <div className="flex items-center gap-6 text-xs text-gray-400 font-mono mt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>REPORTED: {timestampText.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>WARD 111, BENGALURU</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Bookmark button */}
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isBookmarked 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md' 
                  : 'bg-[#0B1220] border-white/8 text-gray-400 hover:text-white hover:border-white/15'
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Issue"}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className={`px-4 h-11 rounded-xl border flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer relative ${
                copied 
                  ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]' 
                  : 'bg-[#0B1220] border-white/8 text-gray-400 hover:text-white hover:border-white/15'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share Issue
                </>
              )}
            </button>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STATUS TIMELINE
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="bg-[#111827]/70 border border-white/8 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Real-time Lifecycle Tracker
            </h3>
            <span className="text-[10px] font-mono text-gray-500">
              CLICK NODES TO INTERACT / TEST VIEWS
            </span>
          </div>

          {/* Horizontal scroll helper wrapper for small viewports */}
          <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="min-w-[800px] flex justify-between items-start relative px-4 mt-2">
              
              {/* Connected track line behind nodes */}
              <div className="absolute top-[18px] left-[5%] right-[5%] h-[2px] bg-white/10 -z-0">
                <div 
                  className="h-full bg-gradient-to-r from-[#14B8A6] to-[#22C55E] transition-all duration-500" 
                  style={{ width: `${(activeStage / (stages.length - 1)) * 100}%` }}
                />
              </div>

              {/* Staged indicators */}
              {stages.map((stage, idx) => {
                const isCompleted = idx < activeStage;
                const isActive = idx === activeStage;
                const isUpcoming = idx > activeStage;

                return (
                  <div 
                    key={stage.name}
                    onClick={() => setActiveStage(idx)}
                    className="flex flex-col items-center text-center w-[12%] z-10 cursor-pointer group"
                  >
                    {/* Circle Node */}
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] border-transparent text-white shadow-lg shadow-[#14B8A6]/20' 
                          : isActive 
                            ? 'bg-[#0B1220] border-[#14B8A6] text-[#14B8A6] shadow-xl shadow-[#14B8A6]/30 ring-4 ring-[#14B8A6]/20 animate-pulse' 
                            : 'bg-[#111827] border-white/10 text-gray-500 group-hover:border-white/20'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3px]" />
                      ) : isActive ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]" />
                      ) : (
                        <span className="text-xs font-bold font-mono">{idx + 1}</span>
                      )}
                    </div>

                    {/* Stage Details */}
                    <div className="mt-3.5">
                      <h4 className={`text-[11px] font-black tracking-tight leading-tight uppercase transition-colors ${
                        isActive ? 'text-[#14B8A6]' : isCompleted ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {stage.name}
                      </h4>
                      <p className="text-[9px] text-gray-500 font-mono mt-0.5 leading-snug max-w-[110px] mx-auto">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TWO COLUMN GRID LAYOUT (BENTO DASHBOARD)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT & CENTER COLUMN (Main Content Panel) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                MAIN SECTION - HERO IMAGE & OVERVIEW
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="bg-[#111827]/70 border border-white/8 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
              
              {/* Hero Image Frame */}
              <div className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden border border-white/10 bg-black/40 relative group">
                <img 
                  src={beforeImage} 
                  alt={titleText} 
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Badge overlay */}
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-[10px] font-mono flex items-center gap-2 z-10">
                  <MapPin className="w-4 h-4 text-[#14B8A6]" />
                  <span className="tracking-wide">LATLONG: 12.9716° N, 77.5946° E</span>
                </div>

                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-[9px] font-mono text-gray-400 z-10">
                  REFID: {normalizedId}
                </div>
              </div>

              {/* Title & Coordinate Details block */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[#14B8A6] font-mono text-xs font-bold uppercase tracking-widest">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{locationText}</span>
                </div>
                
                <h2 className="text-xl font-black text-white tracking-tight">
                  {titleText}
                </h2>
                
                <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                  {descriptionText}
                </p>
              </div>

              {/* AI Summary Card */}
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-[#14B8A6]/5 p-5 flex gap-4">
                {/* Side glow bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500/40" />
                
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase font-black text-emerald-400 tracking-wider">
                      AI Diagnostic Insights
                    </span>
                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-[#14B8A6]/20 text-white rounded font-mono uppercase tracking-widest">
                      Copilot Verified
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-300 leading-relaxed">
                    AI identified a high-severity pothole affecting traffic flow and recommends urgent repair. Sub-surface moisture levels indicate elevated erosion risks with 98% threat validation. Recommendation: Immediate backfill with high-grade polymer asphalt compound.
                  </p>
                </div>
              </div>

            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                BEFORE & AFTER SECTION
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="bg-[#111827]/70 border border-white/8 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] mb-1.5 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Remediation Comparison
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Compare the site coordinates before municipal response and after structural verification.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BEFORE CARD */}
                <div className="bg-[#0B1220] border border-white/5 rounded-xl p-4 flex flex-col gap-3.5 relative overflow-hidden group">
                  <div className="absolute top-2.5 left-2.5 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest z-10">
                    Before Repair
                  </div>
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-white/5 bg-black/20">
                    <img 
                      src={beforeImage} 
                      alt="Before repair asset" 
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                    <span>STATUS: ORIGINAL ISSUE</span>
                    <span>{timestampText.toUpperCase()}</span>
                  </div>
                </div>

                {/* AFTER CARD */}
                <div className="bg-[#0B1220] border border-white/5 rounded-xl p-4 flex flex-col gap-3.5 justify-between relative overflow-hidden group">
                  <div className="absolute top-2.5 left-2.5 bg-[#14B8A6]/10 border border-[#14B8A6]/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#14B8A6] uppercase tracking-widest z-10">
                    After Repair
                  </div>

                  {(statusText === 'Resolved' || statusText === 'Awaiting Community Verification' || statusText === 'AI Verified' || (reportedIssue && reportedIssue.resolvedImage)) ? (
                    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-white/5 bg-black/20">
                      <img 
                        src={reportedIssue?.resolvedImage || roadImproved} 
                        alt="After repair asset" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] rounded-lg border border-dashed border-white/10 bg-[#0B1220] flex flex-col items-center justify-center p-5 text-center gap-3 group-hover:border-[#14B8A6]/30 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 mb-1 group-hover:text-[#14B8A6] group-hover:bg-[#14B8A6]/5 transition-all">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">Awaiting Fix Upload</span>
                      <p className="text-[10px] text-gray-500 leading-relaxed max-w-[200px]">
                        Repair evidence will appear after the authority uploads a completion photo.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mt-2">
                    <span>LOCK: {(statusText === 'Resolved' || statusText === 'Awaiting Community Verification' || statusText === 'AI Verified') ? 'RESOLVED' : 'IN_PROGRESS'}</span>
                    <span>{(statusText === 'Resolved' || statusText === 'Awaiting Community Verification' || statusText === 'AI Verified') ? (reportedIssue?.completionDate || 'COMPLETED') : 'EST: 48 HOURS'}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                MAP SECTION
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="bg-[#111827]/70 border border-white/8 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] mb-1.5 flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    Location Reference
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Precise geo-location bounds logged for the assigned field officer's guidance.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('#live-map')}
                  className="px-3.5 py-1.5 rounded-lg border border-[#14B8A6]/20 bg-[#14B8A6]/5 text-[10px] font-black uppercase tracking-widest text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Live Map
                </button>
              </div>

              {/* Styled mock SVG Vector Map component */}
              <div className="w-full h-52 rounded-xl border border-white/10 bg-[#0B1220] relative overflow-hidden p-4">
                
                {/* SVG Mock Map Grid Gridlines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                {/* SVG Paths representing roads */}
                <svg className="w-full h-full opacity-30 absolute inset-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  {/* Primary Roads */}
                  <path d="M -50 80 Q 200 40 500 120 T 1200 150" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 120 -50 L 220 300" fill="none" stroke="#ffffff" strokeWidth="6" />
                  <path d="M 600 -50 L 520 300" fill="none" stroke="#ffffff" strokeWidth="6" />
                  
                  {/* Secondary lanes */}
                  <path d="M 10 140 L 400 140" fill="none" stroke="#14B8A6" strokeWidth="2" strokeDasharray="4,4" />
                  <path d="M 300 20 L 700 220" fill="none" stroke="#22C55E" strokeWidth="1.5" />
                </svg>

                {/* Styled Central Pulse and Marker */}
                <div className="absolute top-[40%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  
                  {/* Map Pin Pulse animation */}
                  <span className="absolute w-12 h-12 rounded-full bg-[#14B8A6]/25 animate-ping -z-0" />
                  <span className="absolute w-6 h-6 rounded-full bg-[#14B8A6]/45 animate-pulse -z-0" />
                  
                  {/* Marker Core */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] p-[1.5px] shadow-lg shadow-[#14B8A6]/30 flex items-center justify-center relative z-10">
                    <div className="w-full h-full rounded-[9px] bg-[#0B1220] flex items-center justify-center">
                      <MapPin className="w-4.5 h-4.5 text-[#14B8A6]" />
                    </div>
                  </div>

                  {/* Tiny tag label */}
                  <div className="mt-1.5 bg-black/95 border border-white/10 rounded-md py-0.5 px-2 text-[8px] font-mono text-[#14B8A6] font-bold shadow-md whitespace-nowrap">
                    MG ROAD METRO
                  </div>
                </div>

                {/* Additional landmark pins */}
                <div className="absolute top-[70%] left-[65%] flex items-center gap-1.5 bg-[#111827]/90 border border-white/5 py-1 px-2.5 rounded-lg text-[9px]">
                  <Landmark className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-mono text-gray-400">Jayanagar 4th Block</span>
                </div>

                <div className="absolute top-[20%] left-[75%] flex items-center gap-1.5 bg-[#111827]/90 border border-white/5 py-1 px-2.5 rounded-lg text-[9px]">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-mono text-gray-400">Police Station</span>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (Sidebar Panel: Actions, Stats, Logs) */}
          <div className="flex flex-col gap-8">
            
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ACTIONS CARD
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="bg-[#111827]/70 border border-white/8 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Citizen Actions Panel
              </h3>

              <div className="flex flex-col gap-3.5">
                {/* Verify / Upvote button */}
                <button
                  onClick={handleVerify}
                  className={`w-full py-3.5 rounded-xl border font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer ${
                    isVerified 
                      ? 'bg-gradient-to-r from-[#22C55E] to-[#14B8A6] border-transparent text-white shadow-lg shadow-[#22C55E]/10' 
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/15'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isVerified ? 'fill-white stroke-[2.5px]' : ''}`} />
                  {isVerified ? 'Issue Verified!' : 'Verify This Issue'}
                </button>

                {/* Report Duplicate button */}
                <button
                  onClick={handleReportDuplicate}
                  className="w-full py-3.5 rounded-xl border border-white/8 bg-[#0B1220] hover:bg-white/5 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Report As Duplicate
                </button>

                {/* Share Issue button */}
                <button
                  onClick={handleShare}
                  className="w-full py-3.5 rounded-xl border border-white/8 bg-[#0B1220] hover:bg-white/5 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  {copied ? 'Link Copied To Clipboard!' : 'Share Live Link'}
                </button>

                {/* Back to Map button */}
                <button
                  onClick={() => onNavigate('#live-map')}
                  className="w-full py-3.5 rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/5 text-[#14B8A6] hover:bg-[#14B8A6]/10 font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  View On Live Map
                </button>
              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ISSUE INFORMATION METRIC CARDS
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="bg-[#111827]/70 border border-white/8 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Issue Metadata
              </h3>

              <div className="grid grid-cols-1 gap-3.5 font-mono">
                
                {/* Category Metric */}
                <div className="bg-[#0B1220] border border-white/5 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">Category</span>
                  <span className="text-xs font-bold text-white">{categoryText}</span>
                </div>

                {/* Severity Metric */}
                <div className="bg-[#0B1220] border border-white/5 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">Severity Tier</span>
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {priorityText}
                  </span>
                </div>

                {/* Ward Metric */}
                <div className="bg-[#0B1220] border border-white/5 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">Municipal Ward</span>
                  <span className="text-xs font-bold text-white">Ward 111 — Shantala Nagar</span>
                </div>

                {/* Reported Date */}
                <div className="bg-[#0B1220] border border-white/5 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">Report Timestamp</span>
                  <span className="text-xs font-bold text-white">{timestampText}</span>
                </div>

                {/* Location Latitude and Longitude */}
                <div className="bg-[#0B1220] border border-white/5 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">GPS Coordinates</span>
                  <span className="text-xs font-bold text-[#14B8A6]">12.9716, 77.5946 (Arterial)</span>
                </div>

                {/* Landmark */}
                <div className="bg-[#0B1220] border border-white/5 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">Assigned Landmark</span>
                  <span className="text-xs font-bold text-white">{landmarkText}</span>
                </div>

                {/* Estimated Impact */}
                <div className="bg-[#0B1220] border border-white/5 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">Estimated Impact</span>
                  <span className="text-xs font-bold text-amber-400">5,000+ Commuters/Day</span>
                </div>

                {/* AI Confidence */}
                <div className="bg-[#0B1220] border border-white/5 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">AI Confidence Score</span>
                  <span className="text-xs font-bold text-emerald-400">98.4% Precision Verified</span>
                </div>

                {/* Community Verifications */}
                <div className="bg-[#0B1220] border border-white/5 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">Community Votes</span>
                  <span className="text-xs font-bold text-white">{verificationCount} Verifications</span>
                </div>

                {/* Merged Reports */}
                <div className="bg-[#0B1220] border border-white/5 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">Merged Duplicates</span>
                  <span className="text-xs font-bold text-gray-400">3 Duplicates auto-fused</span>
                </div>

              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                COMMUNITY ACTIVITY FEED
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="bg-[#111827]/70 border border-white/8 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Community Audit Trail
              </h3>

              {/* Staggered Vertical Activity List */}
              <div className="flex flex-col gap-5 pl-1 relative">
                
                {/* Thin vertical connector strip */}
                <div className="absolute top-1 bottom-1 left-2.5 w-[1.5px] bg-white/5" />

                {/* Activity 1 */}
                <div className="flex gap-4 relative">
                  <div className="w-5.5 h-5.5 rounded-full bg-[#14B8A6]/20 border border-[#14B8A6]/30 flex items-center justify-center shrink-0 z-10 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-[#14B8A6]" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] text-white">
                      <span className="font-bold text-gray-300">Rahul K.</span> verified this issue.
                    </p>
                    <span className="text-[9px] font-mono text-gray-500">5 mins ago</span>
                  </div>
                </div>

                {/* Activity 2 */}
                <div className="flex gap-4 relative">
                  <div className="w-5.5 h-5.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 z-10 mt-0.5">
                    <Calendar className="w-2.5 h-2.5 text-emerald-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] text-white">
                      <span className="font-bold text-gray-300">Ananya S.</span> uploaded another site image.
                    </p>
                    <span className="text-[9px] font-mono text-gray-500">1 hour ago</span>
                  </div>
                </div>

                {/* Activity 3 */}
                <div className="flex gap-4 relative">
                  <div className="w-5.5 h-5.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 z-10 mt-0.5">
                    <Landmark className="w-2.5 h-2.5 text-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] text-white">
                      <span className="font-bold text-gray-300">Municipal Officer</span> accepted the issue.
                    </p>
                    <span className="text-[9px] font-mono text-gray-500">3 hours ago</span>
                  </div>
                </div>

                {/* Activity 4 */}
                <div className="flex gap-4 relative">
                  <div className="w-5.5 h-5.5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 z-10 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-purple-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] text-white">
                      <span className="font-bold text-gray-300">Repair work scheduled</span> by Ward Division 11.
                    </p>
                    <span className="text-[9px] font-mono text-gray-500">4 hours ago</span>
                  </div>
                </div>

                {/* Activity 5 */}
                <div className="flex gap-4 relative">
                  <div className="w-5.5 h-5.5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 z-10 mt-0.5">
                    <Layers className="w-2.5 h-2.5 text-amber-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] text-white">
                      <span className="font-bold text-gray-300">AI Fusion Engine</span> merged 2 duplicate reports.
                    </p>
                    <span className="text-[9px] font-mono text-gray-500">5 hours ago</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
