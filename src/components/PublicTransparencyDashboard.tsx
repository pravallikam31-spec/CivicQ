import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { 
  Landmark, Sparkles, Search, RefreshCw, Download, MapPin, 
  ThumbsUp, CheckCircle2, User, HelpCircle, Sliders, Calendar, 
  Users, Award, ShieldAlert, ArrowRight, TrendingUp, ChevronDown, 
  Clock, AlertTriangle, Eye, ShieldCheck, Activity, BarChart3
} from 'lucide-react';

// Sourced Images from the project
// @ts-ignore
import roadNeglected from '../assets/images/civicq_road_neglected_1782498745967.jpg';
// @ts-ignore
import roadImproved from '../assets/images/civicq_road_improved_1782498762847.jpg';
// @ts-ignore
import smartCity from '../assets/images/smart_city_india_1782499431498.jpg';

interface PublicTransparencyDashboardProps {
  onNavigate: (dest: string) => void;
}

export default function PublicTransparencyDashboard({ onNavigate }: PublicTransparencyDashboardProps) {
  // Navigation & Control States
  const [selectedWard, setSelectedWard] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChart, setActiveChart] = useState<'trends' | 'resolution' | 'participation'>('trends');
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'potholes' | 'water' | 'garbage' | 'streetlights' | 'drainage'>('all');
  const [activeSuccessIndex, setActiveSuccessIndex] = useState(0);
  const [exportingProgress, setExportingProgress] = useState<number | null>(null);

  // Live feed state
  const [liveActivities, setLiveActivities] = useState([
    { id: 1, type: 'resolve', text: 'Road pothole repaired', location: 'Ward 12 - Indiranagar', time: 'Just now', icon: '🟢' },
    { id: 2, type: 'verify', text: 'Community verified drainage cleanup', location: 'Ward 45 - Koramangala', time: '4 mins ago', icon: '✨' },
    { id: 3, type: 'report', text: 'New streetlamp failure reported', location: 'Ward 45 - Koramangala', time: '12 mins ago', icon: '⚡' },
    { id: 4, type: 'resolve', text: 'Water leakage pipe sealed near hospital', location: 'Ward 62 - Jayanagar', time: '28 mins ago', icon: '💧' },
    { id: 5, type: 'verify', text: 'Garbage hotspot cleared & verified', location: 'Ward 82 - Whitefield', time: '45 mins ago', icon: '🧹' }
  ]);

  // Handle simulated refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      // Prepend an update to the activity feed
      const newUpdate = {
        id: Date.now(),
        type: 'verify',
        text: 'AI verified resolution of cable hazard',
        location: 'Ward 12 - Indiranagar',
        time: 'Just now',
        icon: '🤖'
      };
      setLiveActivities(prev => [newUpdate, ...prev.slice(0, 4)]);
    }, 1200);
  };

  // Simulate report export
  const handleExport = () => {
    if (exportingProgress !== null) return;
    setExportingProgress(0);
    const interval = setInterval(() => {
      setExportingProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setExportingProgress(null), 1500);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  // Live ticker animation
  useEffect(() => {
    const alerts = [
      { type: 'resolve', text: 'Electrical grid connection restored', location: 'Ward 45 - Koramangala', icon: '⚡' },
      { type: 'report', text: 'New sewage overflow reported', location: 'Ward 62 - Jayanagar', icon: '🤢' },
      { type: 'verify', text: 'Citizens verified pothole filling', location: 'Ward 12 - Indiranagar', icon: '✅' },
      { type: 'resolve', text: 'Fallen branch cleared from roadway', location: 'Ward 45 - Koramangala', icon: '🌳' }
    ];

    const interval = setInterval(() => {
      const selected = alerts[Math.floor(Math.random() * alerts.length)];
      setLiveActivities(prev => {
        const item = {
          id: Date.now(),
          ...selected,
          time: 'Just now'
        };
        // update other times
        const updated = prev.map(act => {
          if (act.time === 'Just now') return { ...act, time: '1 min ago' };
          if (act.time.endsWith('mins ago')) {
            const mins = parseInt(act.time) + 1;
            return { ...act, time: `${mins} mins ago` };
          }
          return act;
        });
        return [item, ...updated.slice(0, 4)];
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Real-time Firestore issues
  const [dbIssues, setDbIssues] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'issues'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data
        };
      });
      setDbIssues(issuesData);
    }, (error) => {
      console.error("Error in Public Dashboard Firestore snapshot:", error);
    });
    return () => unsubscribe();
  }, []);

  const computedData = useMemo(() => {
    const filtered = dbIssues.filter(issue => {
      if (selectedWard === 'All') return true;
      const w = issue.ward || issue.address || '';
      return w.toLowerCase().includes(selectedWard.toLowerCase());
    });

    const total = filtered.length;

    const resolvedIssuesList = filtered.filter(issue => {
      const status = (issue.status || '').toLowerCase();
      return status === 'resolved' || status === 'closed' || status === 'ai verified' || status === 'awaiting community verification';
    });
    const resolvedCount = resolvedIssuesList.length;
    const pendingCount = total - resolvedCount;

    let totalHours = 0;
    let timedResolvedCount = 0;
    resolvedIssuesList.forEach(issue => {
      if (issue.createdAt && issue.updatedAt) {
        const start = issue.createdAt.toDate ? issue.createdAt.toDate() : new Date(issue.createdAt);
        const end = issue.updatedAt.toDate ? issue.updatedAt.toDate() : new Date(issue.updatedAt);
        if (start instanceof Date && !isNaN(start.getTime()) && end instanceof Date && !isNaN(end.getTime())) {
          const diffMs = end.getTime() - start.getTime();
          const diffHrs = diffMs / (1000 * 60 * 60);
          if (diffHrs >= 0) {
            totalHours += diffHrs;
            timedResolvedCount++;
          }
        }
      }
    });

    const avgResolutionTime = timedResolvedCount > 0 ? (totalHours / timedResolvedCount) : 18.4;

    const getWardStats = (wardName: string, defaultTotal: number, defaultResolved: number, defaultPending: number, defaultAvgTime: string, defaultScore: string, defaultProgress: number) => {
      const wardIssues = dbIssues.filter(issue => {
        const w = issue.ward || issue.address || '';
        return w.toLowerCase().includes(wardName.toLowerCase());
      });

      if (wardIssues.length === 0) {
        return {
          name: `${wardName === 'Ward 12' ? 'Indiranagar (Ward 12)' : wardName === 'Ward 62' ? 'Jayanagar (Ward 62)' : wardName === 'Ward 45' ? 'Koramangala (Ward 45)' : 'Whitefield (Ward 82)'}`,
          total: defaultTotal.toLocaleString(),
          resolved: defaultResolved.toLocaleString(),
          pending: defaultPending.toLocaleString(),
          avgTime: defaultAvgTime,
          score: defaultScore,
          progress: defaultProgress
        };
      }

      const wTotal = wardIssues.length;
      const wResolvedList = wardIssues.filter(issue => {
        const s = (issue.status || '').toLowerCase();
        return s === 'resolved' || s === 'closed' || s === 'ai verified' || s === 'awaiting community verification';
      });
      const wResolved = wResolvedList.length;
      const wPending = wTotal - wResolved;

      let wTotalHours = 0;
      let wTimedCount = 0;
      wResolvedList.forEach(issue => {
        if (issue.createdAt && issue.updatedAt) {
          const start = issue.createdAt.toDate ? issue.createdAt.toDate() : new Date(issue.createdAt);
          const end = issue.updatedAt.toDate ? issue.updatedAt.toDate() : new Date(issue.updatedAt);
          if (start instanceof Date && !isNaN(start.getTime()) && end instanceof Date && !isNaN(end.getTime())) {
            const diffMs = end.getTime() - start.getTime();
            const diffHrs = diffMs / (1000 * 60 * 60);
            if (diffHrs >= 0) {
              wTotalHours += diffHrs;
              wTimedCount++;
            }
          }
        }
      });
      const wAvgTimeVal = wTimedCount > 0 ? (wTotalHours / wTimedCount) : parseFloat(defaultAvgTime);
      const wScoreVal = Math.round((wResolved / (wTotal || 1)) * 100);

      return {
        name: `${wardName === 'Ward 12' ? 'Indiranagar (Ward 12)' : wardName === 'Ward 62' ? 'Jayanagar (Ward 62)' : wardName === 'Ward 45' ? 'Koramangala (Ward 45)' : 'Whitefield (Ward 82)'}`,
        total: wTotal.toLocaleString(),
        resolved: wResolved.toLocaleString(),
        pending: wPending.toLocaleString(),
        avgTime: `${wAvgTimeVal.toFixed(1)} Hrs`,
        score: `${wScoreVal}%`,
        progress: wScoreVal
      };
    };

    const dynamicWardDetails = [
      getWardStats('Ward 12', 1420, 1310, 110, '13.5 Hrs', '94%', 92),
      getWardStats('Ward 62', 1150, 1050, 100, '14.8 Hrs', '92%', 91),
      getWardStats('Ward 45', 1320, 1180, 140, '19.2 Hrs', '87%', 89),
      getWardStats('Ward 82', 1002, 840, 162, '21.5 Hrs', '82%', 83)
    ];

    const getCategoryCount = (categoryKey: string, defaultVal: number) => {
      const matchingIssues = dbIssues.filter(issue => {
        const c = (issue.category || '').toLowerCase();
        if (categoryKey === 'potholes') return c.includes('pothole') || c.includes('road');
        if (categoryKey === 'water') return c.includes('water') || c.includes('leak') || c.includes('pipe');
        if (categoryKey === 'garbage') return c.includes('garbage') || c.includes('waste') || c.includes('sanitation');
        if (categoryKey === 'streetlights') return c.includes('light');
        if (categoryKey === 'drainage') return c.includes('drain');
        return false;
      });
      return matchingIssues.length || defaultVal;
    };

    const getCategoryScore = (categoryKey: string, defaultScore: number) => {
      const matchingIssues = dbIssues.filter(issue => {
        const c = (issue.category || '').toLowerCase();
        if (categoryKey === 'potholes') return c.includes('pothole') || c.includes('road');
        if (categoryKey === 'streetlights') return c.includes('light');
        if (categoryKey === 'water') return c.includes('water') || c.includes('leak') || c.includes('pipe');
        if (categoryKey === 'garbage') return c.includes('garbage') || c.includes('waste') || c.includes('sanitation');
        if (categoryKey === 'drainage') return c.includes('drain');
        return false;
      });

      if (matchingIssues.length === 0) return defaultScore;

      const resolvedInCat = matchingIssues.filter(issue => {
        const s = (issue.status || '').toLowerCase();
        return s === 'resolved' || s === 'closed' || s === 'ai verified' || s === 'awaiting community verification';
      }).length;

      return Math.round((resolvedInCat / matchingIssues.length) * 100);
    };

    const dynamicCategoryScores = [
      { name: 'Road Infrastructure', score: getCategoryScore('potholes', 84), color: 'from-[#14B8A6] to-teal-500' },
      { name: 'Streetlights & Safety', score: getCategoryScore('streetlights', 92), color: 'from-[#14B8A6] to-emerald-500' },
      { name: 'Water Supply Network', score: getCategoryScore('water', 88), color: 'from-blue-500 to-[#14B8A6]' },
      { name: 'Waste Management (BBMP)', score: getCategoryScore('garbage', 79), color: 'from-amber-500 to-[#14B8A6]' },
      { name: 'Stormwater Drainage', score: getCategoryScore('drainage', 81), color: 'from-cyan-500 to-blue-600' },
      { name: 'Public Spaces & Parks', score: 89, color: 'from-emerald-500 to-green-600' }
    ];

    const getLeaderboardItem = (rank: number, wardName: string, deptName: string, categoryKeys: string[], defaultRate: string, defaultTime: string, defaultRating: string, defaultStatus: string, defaultColor: string) => {
      const deptIssues = dbIssues.filter(issue => {
        const w = issue.ward || issue.address || '';
        const c = (issue.category || '').toLowerCase();
        const matchesW = w.toLowerCase().includes(wardName.toLowerCase());
        const matchesC = categoryKeys.some(key => {
          if (key === 'road') return c.includes('pothole') || c.includes('road');
          if (key === 'water') return c.includes('water') || c.includes('leak') || c.includes('pipe');
          if (key === 'garbage') return c.includes('garbage') || c.includes('waste') || c.includes('sanitation');
          if (key === 'streetlight') return c.includes('light');
          if (key === 'drainage') return c.includes('drain');
          return false;
        });
        return matchesW && matchesC;
      });

      if (deptIssues.length === 0) {
        return { rank, ward: wardName, department: deptName, rate: defaultRate, time: defaultTime, rating: defaultRating, status: defaultStatus, color: defaultColor };
      }

      const dTotal = deptIssues.length;
      const dResolvedList = deptIssues.filter(issue => {
        const s = (issue.status || '').toLowerCase();
        return s === 'resolved' || s === 'closed' || s === 'ai verified' || s === 'awaiting community verification';
      });
      const dResolved = dResolvedList.length;

      const rateVal = Math.round((dResolved / dTotal) * 100);
      const rateStr = `${rateVal}%`;

      let dTotalHours = 0;
      let dTimedCount = 0;
      dResolvedList.forEach(issue => {
        if (issue.createdAt && issue.updatedAt) {
          const start = issue.createdAt.toDate ? issue.createdAt.toDate() : new Date(issue.createdAt);
          const end = issue.updatedAt.toDate ? issue.updatedAt.toDate() : new Date(issue.updatedAt);
          if (start instanceof Date && !isNaN(start.getTime()) && end instanceof Date && !isNaN(end.getTime())) {
            const diffMs = end.getTime() - start.getTime();
            const diffHrs = diffMs / (1000 * 60 * 60);
            if (diffHrs >= 0) {
              dTotalHours += diffHrs;
              dTimedCount++;
            }
          }
        }
      });

      const dAvgTimeVal = dTimedCount > 0 ? (dTotalHours / dTimedCount) : parseFloat(defaultTime);
      const timeStr = `${dAvgTimeVal.toFixed(1)} Hrs`;

      const statusBadge = rateVal >= 90 ? 'Excellent' : rateVal >= 75 ? 'Good' : rateVal >= 50 ? 'Needs Attention' : 'Critical';
      const badgeColor = rateVal >= 90 ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' :
                         rateVal >= 75 ? 'text-teal-400 bg-teal-500/5 border-teal-500/10' :
                         rateVal >= 50 ? 'text-amber-400 bg-amber-500/5 border-amber-500/10' :
                         'text-red-400 bg-red-500/5 border-red-500/10';

      return {
        rank,
        ward: wardName,
        department: deptName,
        rate: rateStr,
        time: timeStr,
        rating: defaultRating,
        status: statusBadge,
        color: badgeColor
      };
    };

    const dynamicLeaderboard = [
      getLeaderboardItem(1, 'Ward 12 (Indiranagar)', 'Water Supply & Sewerage', ['water'], '96.2%', '12.8 Hrs', '4.8', 'Excellent', 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'),
      getLeaderboardItem(2, 'Ward 45 (Koramangala)', 'Public Lighting (BESCOM)', ['streetlight'], '94.5%', '14.2 Hrs', '4.7', 'Excellent', 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'),
      getLeaderboardItem(3, 'Ward 62 (Jayanagar)', 'Roads & Infrastructure', ['road'], '89.1%', '18.5 Hrs', '4.3', 'Good', 'text-teal-400 bg-teal-500/5 border-teal-500/10'),
      getLeaderboardItem(4, 'Ward 82 (Whitefield)', 'Waste Management (BBMP)', ['garbage'], '82.4%', '22.1 Hrs', '4.1', 'Good', 'text-teal-400 bg-teal-500/5 border-teal-500/10'),
      getLeaderboardItem(5, 'Ward 12 (Indiranagar)', 'Stormwater Drainage', ['drainage'], '74.8%', '31.2 Hrs', '3.6', 'Needs Attention', 'text-amber-400 bg-amber-500/5 border-amber-500/10'),
      getLeaderboardItem(6, 'Ward 45 (Koramangala)', 'Telecom & Overhead Cables', [], '61.2%', '45.6 Hrs', '3.0', 'Critical', 'text-red-400 bg-red-500/5 border-red-500/10')
    ];

    return {
      total,
      resolvedCount,
      pendingCount,
      avgResolutionTime,
      dynamicWardDetails,
      dynamicCategoryScores,
      dynamicLeaderboard,
      potholesCount: getCategoryCount('potholes', 2),
      waterCount: getCategoryCount('water', 2),
      garbageCount: getCategoryCount('garbage', 1),
      streetlightsCount: getCategoryCount('streetlights', 2),
      drainageCount: getCategoryCount('drainage', 1)
    };
  }, [dbIssues, selectedWard]);

  // Statistic Cards Data
  const stats = useMemo(() => [
    { id: 'total', name: 'Total Issues Reported', value: computedData.total === 0 ? '4,892' : computedData.total.toLocaleString(), trend: '+12.4%', label: 'vs last month', color: 'border-white/10' },
    { id: 'resolved', name: 'Issues Resolved', value: computedData.total === 0 ? '4,210' : computedData.resolvedCount.toLocaleString(), trend: computedData.total === 0 ? '86.1%' : `${((computedData.resolvedCount / (computedData.total || 1)) * 100).toFixed(1)}%`, label: 'Overall Closure Rate', color: 'border-emerald-500/20' },
    { id: 'active', name: 'Currently Active', value: computedData.total === 0 ? '682' : computedData.pendingCount.toLocaleString(), trend: '-18.5%', label: 'Active Queue Size', color: 'border-amber-500/20' },
    { id: 'time', name: 'Average Resolution Time', value: computedData.total === 0 ? '18.4 Hrs' : `${computedData.avgResolutionTime.toFixed(1)} Hrs`, trend: '-24.2%', label: 'SLA Speed Gain', color: 'border-teal-500/20' },
    { id: 'participation', name: 'Citizen Participation Rate', value: '94.2%', trend: '+8.3%', label: 'Verified Community Users', color: 'border-blue-500/20' },
    { id: 'health', name: 'Overall Civic Health Score', value: computedData.total === 0 ? '89.5' : Math.round((computedData.resolvedCount / (computedData.total || 1)) * 100).toString(), trend: 'Excellent', label: 'Computed from 6 parameters', color: 'border-[#14B8A6]/20' }
  ], [computedData]);

  const wardDetails = computedData.dynamicWardDetails;

  // Filter leaderboard based on query or ward
  const filteredLeaderboard = useMemo(() => {
    return computedData.dynamicLeaderboard.filter(item => {
      const matchesWard = selectedWard === 'All' || item.ward.includes(selectedWard);
      const matchesSearch = item.department.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.ward.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesWard && matchesSearch;
    });
  }, [computedData.dynamicLeaderboard, selectedWard, searchQuery]);

  // Success Stories
  const successStories = [
    {
      id: 1,
      category: 'Water Infrastructure',
      title: 'Emergency Water Pipeline Fracture Restoration',
      ward: 'Ward 12 - Indiranagar main lane',
      repairTime: '8 Hours',
      citizensAffected: '180 households',
      description: 'Major underground pipeline burst flooding main transit lanes. High-pressure welding dispatches completed in record speed, verified via AI computer vision coordinate matching.',
      before: roadNeglected, // Use available road images
      after: roadImproved
    },
    {
      id: 2,
      category: 'Road Defect',
      title: 'High-Transit Expressway Crater Patching',
      ward: 'Ward 45 - Outer Ring Road Block',
      repairTime: '12 Hours',
      citizensAffected: '2,500 daily commuters',
      description: 'Severe structural road sinkage near traffic corridor causing heavy congestion. Excavation, asphalt relaying, and lane marking finished in single night shift.',
      before: roadNeglected,
      after: roadImproved
    },
    {
      id: 3,
      category: 'Drainage Systems',
      title: 'Pre-Monsoon Culvert Blockage Desilting',
      ward: 'Ward 82 - Whitefield Main Bypass',
      repairTime: '15 Hours',
      citizensAffected: '450 commercial units',
      description: 'Silt and solid waste completely choking structural storm conduits. Heavy-machinery dredging and high-pressure jet washing completed before heavy precipitation events.',
      before: roadNeglected,
      after: roadImproved
    }
  ];

  // Interactive Smart City Heatmap Overlay Simulation
  // Grid of coordinates representing simulated hotspots
  const heatmapHotspots = useMemo(() => {
    const baseHotspots = [
      { x: '25%', y: '30%', r: 40, type: 'potholes', intensity: 'high', label: 'ORR Pothole Group' },
      { x: '70%', y: '20%', r: 30, type: 'water', intensity: 'medium', label: 'Indiranagar Water Leaks' },
      { x: '45%', y: '65%', r: 50, type: 'garbage', intensity: 'critical', label: 'Koramangala Dumping Zone' },
      { x: '80%', y: '75%', r: 35, type: 'streetlights', intensity: 'low', label: 'Jayanagar Lighting Corridors' },
      { x: '15%', y: '80%', r: 45, type: 'drainage', intensity: 'high', label: 'Whitefield Drainage Clog' },
      { x: '55%', y: '40%', r: 38, type: 'potholes', intensity: 'medium', label: 'Koramangala road craters' },
      { x: '35%', y: '25%', r: 28, type: 'streetlights', intensity: 'medium', label: 'Sector 4 Outages' },
      { x: '90%', y: '45%', r: 42, type: 'water', intensity: 'critical', label: 'MG Road Main Burst' }
    ];

    if (heatmapFilter === 'all') return baseHotspots;
    return baseHotspots.filter(h => h.type === heatmapFilter);
  }, [heatmapFilter]);

  // Contributors list
  const contributors = [
    { name: 'Aditya Hegde', trustScore: '99', reports: 42, verifications: 184, level: 'Lvl 8', badge: 'Community Guardian', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { name: 'Meera BBMP-Desk', trustScore: '98', reports: 31, verifications: 142, level: 'Lvl 7', badge: 'Neighborhood Hero', badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    { name: 'Siddharth Gowda', trustScore: '97', reports: 56, verifications: 110, level: 'Lvl 7', badge: 'Civic Champion', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { name: 'Priya Narayanan', trustScore: '95', reports: 22, verifications: 95, level: 'Lvl 5', badge: 'Neighborhood Hero', badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20' }
  ];

  // AI Predictive Insights
  const aiInsights = [
    {
      id: 1,
      title: 'Monsoon Flood Inundation Forecast',
      type: 'Drainage & Stormwater',
      probability: '92% Confidence',
      reason: 'A combination of 70mm forecasted rainfall next Wednesday and sub-surface solid waste density in Koramangala 4th Block conduit indicates high risk of flooding.',
      action: 'Emergency desilting crew pre-dispatched.',
      color: 'border-red-500/20 bg-red-500/5 text-red-400'
    },
    {
      id: 2,
      title: 'Sub-grade Soil Structural Subsidence',
      type: 'Road Quality',
      probability: '84% Confidence',
      reason: 'Outer Ring Road intersection has been patched twice within 180 days. Continuous vibration analysis indicates moisture-induced sub-grade breakdown under heavy axles.',
      action: 'Comprehensive core soil test scheduled.',
      color: 'border-amber-500/20 bg-amber-500/5 text-amber-400'
    },
    {
      id: 3,
      title: 'Grid Overvoltage Surge Outage Wave',
      type: 'Streetlighting Grid',
      probability: '76% Confidence',
      reason: 'Sequencing failures spotted in Sector 4 lighting grid controller. Thermal load patterns signal high likelihood of circuit overload during twilight activation cycle.',
      action: 'Automatic smart regulator balancing active.',
      color: 'border-blue-500/20 bg-blue-500/5 text-blue-400'
    },
    {
      id: 4,
      title: 'Illegal Waste Dumping Accumulation Spike',
      type: 'Waste Management',
      probability: '89% Confidence',
      reason: 'Spatial temporal modeling detects garbage pile accretion near Indiranagar commercial corners every Saturday midnight due to retail commercial overflow.',
      action: 'Proactive midnight collection sweep routing enabled.',
      color: 'border-[#14B8A6]/20 bg-[#14B8A6]/5 text-[#14B8A6]'
    }
  ];

  return (
    <div className="bg-[#0B1220] min-h-screen text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative selection:bg-[#14B8A6]/20 selection:text-[#14B8A6]">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#14B8A6]/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-emerald-500/2 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PAGE HEADER SECTION
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#14B8A6]/10 text-[#14B8A6] rounded-md border border-[#14B8A6]/20 flex items-center gap-1.5 uppercase">
                <Landmark className="w-3.5 h-3.5 animate-pulse" />
                Live Civic Portal
              </span>
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/5 text-gray-400 rounded-md border border-white/5 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                No Login Required
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Public Transparency Dashboard
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl">
              Building trust through transparency and community participation. Real-time municipal responsiveness ledgers, AI verified remediations, and spatial urban telemetry.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Location Selector */}
            <div className="relative group">
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="appearance-none bg-[#111827] border border-white/10 hover:border-[#14B8A6]/30 text-xs rounded-xl px-4 py-2.5 pr-8 text-gray-300 font-medium focus:outline-none focus:border-[#14B8A6] transition-all cursor-pointer"
              >
                <option value="All">All Bengaluru</option>
                <option value="Ward 12">Ward 12 - Indiranagar</option>
                <option value="Ward 45">Ward 45 - Koramangala</option>
                <option value="Ward 62">Ward 62 - Jayanagar</option>
                <option value="Ward 82">Ward 82 - Whitefield</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-gray-300 transition-colors" />
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search departments or wards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111827] border border-white/10 hover:border-white/15 focus:border-[#14B8A6] text-xs rounded-xl pl-9 pr-4 py-2.5 w-48 sm:w-60 focus:outline-none text-white transition-all placeholder-gray-500"
              />
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-[#111827] border border-white/10 hover:border-[#14B8A6]/20 text-gray-400 hover:text-white transition-all focus:outline-none disabled:opacity-50 cursor-pointer flex items-center justify-center"
              title="Refresh live parameters"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#14B8A6]' : ''}`} />
            </button>

            {/* Export Report */}
            <button
              onClick={handleExport}
              disabled={exportingProgress !== null}
              className="bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-[#14B8A6]/10 hover:shadow-lg focus:outline-none cursor-pointer disabled:opacity-80"
            >
              {exportingProgress !== null ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting ({exportingProgress}%)</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CITY OVERVIEW STATS CARDS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className={`bg-[#111827] border ${stat.color} rounded-2xl p-5 shadow-xl hover:scale-[1.01] transition-all relative overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full blur-2xl pointer-events-none group-hover:bg-[#14B8A6]/5 transition-all duration-500" />
              
              <div className="flex flex-col gap-1.5 relative z-10">
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
                  {stat.name}
                </span>
                
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-black text-white tracking-tight font-sans">
                    {stat.value}
                  </span>
                  <span className={`text-xs font-mono font-extrabold px-1.5 py-0.5 rounded ${
                    stat.trend.startsWith('+') || stat.trend === 'Excellent'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                      : stat.trend.includes('%') 
                        ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/10'
                        : 'bg-teal-500/10 text-teal-400 border border-teal-500/10'
                  }`}>
                    {stat.trend}
                  </span>
                </div>

                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500 shrink-0" />
                  {stat.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CIVIC HEALTH INDEX & OVERVIEW
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Circular Score display */}
          <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-4 left-4">
              <span className="text-[9px] font-mono font-black text-[#14B8A6] uppercase tracking-widest">
                Score Vector
              </span>
            </div>

            <div className="relative w-44 h-44 flex items-center justify-center mt-4">
              {/* Animated Progress Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="72"
                  className="stroke-white/5"
                  strokeWidth="10"
                  fill="transparent"
                />
                <motion.circle
                  cx="88"
                  cy="88"
                  r="72"
                  className="stroke-[#14B8A6]"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 72}
                  initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                  whileInView={{ strokeDashoffset: 2 * Math.PI * 72 * (1 - 0.89) }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>
              
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white font-sans tracking-tight">
                  89%
                </span>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">
                  Index Score
                </span>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-base font-bold text-white">Overall Civic Health</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                BBMP computational model aggregating spatial street conditions, utility uptimes, and closure speed vectors.
              </p>
            </div>
          </div>

          {/* Category Scores with progress bars */}
          <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-5 justify-between">
            <div>
              <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
                Category Diagnostic
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Core Public Asset Health Breakdown
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Computed daily using computerized vision reports, volunteer verification signatures, and IoT street indicators.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 my-2">
              {computedData.dynamicCategoryScores.map((category) => (
                <div key={category.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">{category.name}</span>
                    <span className="font-bold text-white font-mono">{category.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${category.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${category.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/5 text-[10px] font-mono text-gray-400 flex items-center justify-between">
              <span>ALGORITHM VERSION: <span className="text-white font-bold">V2.4.9</span></span>
              <span>LAST CALCULATED: <span className="text-[#14B8A6] font-bold">10 MINS AGO</span></span>
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            OFFICIAL RESPONSIVENESS SCORECARD (LEADERBOARD)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-black text-[#14B8A6] uppercase tracking-widest">
                Official Responsiveness Scorecard
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Administrative Performance Ledgers
              </h3>
              <p className="text-xs text-gray-400">
                Transparent rankings of municipal wards and division departments. Sorted by closure speed and public rating.
              </p>
            </div>
            
            <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5 bg-[#0B1220] px-3 py-1.5 rounded-lg border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>DUMP RECORD SHUTTLE SECURE</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Ward Location</th>
                  <th className="py-3 px-4 font-semibold">Department Division</th>
                  <th className="py-3 px-4 font-semibold text-center">Resolution Rate</th>
                  <th className="py-3 px-4 font-semibold text-center">Avg Repair Time</th>
                  <th className="py-3 px-4 font-semibold text-center">Rating</th>
                  <th className="py-3 px-4 font-semibold text-right">Status Badge</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 font-mono">
                      No matching divisions found in active filters.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((item, idx) => (
                    <tr 
                      key={item.rank}
                      className="border-b border-white/3 hover:bg-white/1 transition-colors group"
                    >
                      <td className="py-4 px-4 font-mono font-bold text-gray-400 group-hover:text-white transition-colors">
                        #{item.rank}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          <span className="font-bold text-white">{item.ward}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-gray-300">
                        {item.department}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-[#14B8A6] font-mono">
                        {item.rate}
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-gray-300">
                        {item.time}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-white/3 px-2 py-0.5 rounded font-mono text-white">
                          <span>⭐</span>
                          <span>{item.rating}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${item.color}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            WARD PERFORMANCE CARDS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
              Zonal Analytics
            </span>
            <h3 className="text-xl font-bold text-white">
              Ward Performance Highlights
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Individual municipal ward scorecards based on live active issue resolutions and citizen trust vectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {wardDetails.map((ward, idx) => (
              <motion.div
                key={ward.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-[#111827] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-[#14B8A6]/20 transition-all relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex flex-col min-w-0">
                    <h4 className="text-xs font-black text-white truncate">{ward.name}</h4>
                    <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider mt-0.5">
                      District Sub-Division
                    </span>
                  </div>

                  {/* Progress Ring */}
                  <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        className="stroke-white/5"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        className="stroke-[#14B8A6]"
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={2 * Math.PI * 16 * (1 - ward.progress / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white font-mono">{ward.score}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 my-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-400">Total Issues</span>
                    <span className="font-bold text-white font-mono">{ward.total}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-400">Resolved Cases</span>
                    <span className="font-bold text-emerald-400 font-mono">{ward.resolved}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-400">Pending Queue</span>
                    <span className="font-bold text-amber-500 font-mono">{ward.pending}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-400">Avg Repair Speed</span>
                    <span className="font-bold text-teal-400 font-mono">{ward.avgTime}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 mt-2 flex items-center justify-between">
                  <span className="text-[8px] font-mono text-gray-500 uppercase">Trust Index</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400 font-mono">{ward.score}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SMART CITY HEATMAP PLACEHOLDER
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-5 justify-between">
            <div>
              <span className="text-[9px] font-mono font-black text-[#14B8A6] uppercase tracking-widest block">
                Spatial Coordinates
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Smart City Urban Heatmap
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Density layers of active municipal alerts and citizen reports. Toggle filter overlays to isolate patterns.
              </p>
            </div>

            {/* Simulated Map Container */}
            <div className="w-full h-80 rounded-xl border border-white/5 bg-black/40 relative overflow-hidden flex items-center justify-center group">
              {/* Background abstract city lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px]" />
              <svg className="w-full h-full opacity-5 absolute inset-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 40 Q 150 10 300 120 T 600 140 T 900 60 T 1200 180" fill="none" stroke="#ffffff" strokeWidth="3" />
                <path d="M 120 -20 Q 200 240 320 320 T 800 280" fill="none" stroke="#ffffff" strokeWidth="2" />
                <path d="M 400 -10 L 450 450" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                <path d="M 0 250 L 1200 290" fill="none" stroke="#ffffff" strokeWidth="1.5" />
              </svg>

              {/* Animated Heatmap Spots */}
              <AnimatePresence mode="popLayout">
                {heatmapHotspots.map((spot, idx) => {
                  let colorClass = 'bg-[#14B8A6]';
                  let borderClass = 'border-[#14B8A6]/40';
                  let glowColor = 'rgba(20, 184, 166, 0.2)';
                  
                  if (spot.intensity === 'critical') {
                    colorClass = 'bg-red-500';
                    borderClass = 'border-red-500/40';
                    glowColor = 'rgba(239, 68, 68, 0.3)';
                  } else if (spot.intensity === 'high') {
                    colorClass = 'bg-amber-500';
                    borderClass = 'border-amber-500/40';
                    glowColor = 'rgba(245, 158, 11, 0.25)';
                  } else if (spot.intensity === 'medium') {
                    colorClass = 'bg-yellow-500';
                    borderClass = 'border-yellow-500/40';
                    glowColor = 'rgba(234, 179, 8, 0.2)';
                  }

                  return (
                    <motion.div
                      key={spot.label}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className="absolute cursor-pointer group"
                      style={{ 
                        left: spot.x, 
                        top: spot.y, 
                      }}
                    >
                      {/* Pulse Ring */}
                      <div 
                        className={`rounded-full absolute -translate-x-1/2 -translate-y-1/2 animate-ping`}
                        style={{
                          width: spot.r * 1.5,
                          height: spot.r * 1.5,
                          backgroundColor: glowColor,
                          animationDuration: `${2 + (idx % 2)}s`
                        }}
                      />
                      
                      {/* Core Area Spot */}
                      <div 
                        className={`rounded-full border -translate-x-1/2 -translate-y-1/2 ${borderClass} backdrop-blur-[2px] relative flex items-center justify-center`}
                        style={{
                          width: spot.r,
                          height: spot.r,
                          backgroundColor: glowColor
                        }}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${colorClass} shadow-lg`} />
                      </div>

                      {/* Tooltip on Hover */}
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#111827] border border-white/10 p-2 rounded-lg text-[9px] font-mono text-gray-300 w-32 left-4 top-4 z-20 shadow-2xl">
                        <span className="text-white font-bold block">{spot.label}</span>
                        <span className="text-gray-500 uppercase block mt-0.5">TYPE: {spot.type}</span>
                        <span className="text-gray-500 uppercase block">DENSITY: {spot.intensity}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Legend overlay */}
              <div className="absolute bottom-3 left-3 bg-[#111827]/90 border border-white/5 p-2.5 rounded-lg text-[8px] font-mono flex flex-col gap-1 z-10 backdrop-blur-sm">
                <span className="text-gray-400 font-bold uppercase mb-0.5">Density Legend</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-gray-300">CRITICAL HOTSPOT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-gray-300">HIGH OUTAGE CONGESTION</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-gray-300">MODERATE INCIDENT CORRIDOR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                  <span className="text-gray-300">NORMALIZING DISPATCHED GRID</span>
                </div>
              </div>

              <span className="absolute bottom-2 right-3 text-[8px] font-mono text-gray-500 bg-[#111827]/80 px-2 py-1 rounded border border-white/5 backdrop-blur-sm">
                GEOSPATIAL VECTOR MAP ACTIVE
              </span>
            </div>
          </div>

          {/* Interactive filter list */}
          <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between gap-4">
            <div>
              <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
                Filter Layer
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Isolate Heatmap Vectors
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Choose a specific public asset category below to project its exact density hotspots onto the live smart city GIS simulator.
              </p>
            </div>

            <div className="flex flex-col gap-2 my-2">
              {[
                { id: 'all', label: 'All Categories Combined', icon: '🌐', count: computedData.total },
                { id: 'potholes', label: 'Potholes & Road Crates', icon: '🕳️', count: computedData.potholesCount },
                { id: 'water', label: 'Water Leakage Pipes', icon: '💧', count: computedData.waterCount },
                { id: 'garbage', label: 'Garbage Dump Accumulations', icon: '🧹', count: computedData.garbageCount },
                { id: 'streetlights', label: 'Streetlight Corridor Failures', icon: '⚡', count: computedData.streetlightsCount },
                { id: 'drainage', label: 'Drainage Culvert Blockages', icon: '🤢', count: computedData.drainageCount }
              ].map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setHeatmapFilter(layer.id as any)}
                  className={`px-3.5 py-3 rounded-xl border flex items-center justify-between text-left text-xs font-medium cursor-pointer transition-all ${
                    heatmapFilter === layer.id
                      ? 'bg-gradient-to-r from-[#14B8A6]/10 to-transparent border-[#14B8A6] text-white font-bold ring-2 ring-[#14B8A6]/10'
                      : 'bg-[#0B1220]/40 border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{layer.icon}</span>
                    <span>{layer.label}</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-white/5 text-[9px] font-mono rounded text-gray-400">
                    {layer.count} points
                  </span>
                </button>
              ))}
            </div>

            <div className="text-[9px] font-mono text-gray-500 leading-relaxed text-center mt-2 p-2 bg-[#0B1220]/30 rounded-lg border border-white/5">
              💡 Click on hotspots in the spatial map to view local sector labels and computed density indicators.
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            BEFORE & AFTER SUCCESS STORIES GALLERY
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest">
                Resolution Proof Loop
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Before & After Success Stories
              </h3>
              <p className="text-xs text-gray-400">
                Visual municipal accountability. Real photographs of reported issues juxtaposed with finished remediation works.
              </p>
            </div>

            {/* Stories Tab navigation */}
            <div className="flex items-center gap-1.5 bg-[#0B1220] p-1 rounded-xl border border-white/5">
              {successStories.map((story, index) => (
                <button
                  key={story.id}
                  onClick={() => setActiveSuccessIndex(index)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer transition-all ${
                    activeSuccessIndex === index
                      ? 'bg-gradient-to-r from-[#14B8A6] to-[#22C55E] text-white shadow-lg'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Case {story.id}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSuccessIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Visual Before & After comparison columns */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Before Image */}
                <div className="bg-[#0B1220] border border-white/5 rounded-xl p-3 flex flex-col gap-2 relative group">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-mono font-bold uppercase tracking-widest animate-pulse">
                      Before Repair
                    </span>
                  </div>
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/5 bg-black/40">
                    <img 
                      src={successStories[activeSuccessIndex].before} 
                      alt="Neglected condition before municipal intervention" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase mt-0.5">
                    STATUS: CITIZEN REPORT FILED
                  </span>
                </div>

                {/* After Image */}
                <div className="bg-[#0B1220] border border-white/5 rounded-xl p-3 flex flex-col gap-2 relative group">
                  <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      After Restoration
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8px] font-mono font-black uppercase tracking-widest flex items-center gap-1">
                      ✔ AI Verified Repair
                    </span>
                  </div>
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/5 bg-black/40">
                    <img 
                      src={successStories[activeSuccessIndex].after} 
                      alt="Completed reconstruction work" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    STATUS: AI VERIFIED REMEDIATION
                  </span>
                </div>
              </div>

              {/* Case facts text summary */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="px-2.5 py-0.5 rounded bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 text-[9px] font-mono font-bold uppercase self-start">
                    {successStories[activeSuccessIndex].category}
                  </span>
                  <h4 className="text-lg font-black text-white leading-snug">
                    {successStories[activeSuccessIndex].title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>{successStories[activeSuccessIndex].ward}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0B1220]/60 border border-white/5 flex flex-col gap-2">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                    Diagnostic Case Description
                  </span>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {successStories[activeSuccessIndex].description}
                  </p>
                </div>

                {/* Case metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0B1220]/60 border border-white/5 rounded-xl p-3 flex flex-col gap-0.5 font-mono">
                    <span className="text-[8px] text-gray-500 uppercase">REPAIR TIME</span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {successStories[activeSuccessIndex].repairTime}
                    </span>
                  </div>
                  <div className="bg-[#0B1220]/60 border border-white/5 rounded-xl p-3 flex flex-col gap-0.5 font-mono">
                    <span className="text-[8px] text-gray-500 uppercase">CITIZENS BENEFITED</span>
                    <span className="text-xs font-bold text-[#14B8A6] flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                      {successStories[activeSuccessIndex].citizensAffected}
                    </span>
                  </div>
                </div>

                {/* Proof ledger badge */}
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Award className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">
                      Verified by AI Ledger
                    </span>
                    <span className="text-[9px] font-mono text-gray-400">
                      Cross-examination of dual-sensor pixels: CONFIDENCE 99.2%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            COMMUNITY IMPACT METRICS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
              Citizen Force
            </span>
            <h3 className="text-xl font-bold text-white">
              Democratizing Civic Change
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              The power of active citizens validating and reporting municipal updates directly in their local communities.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Citizen Reports', value: '12,450', color: 'border-white/5' },
              { label: 'Community Verifications', value: '38,210', color: 'border-emerald-500/10' },
              { label: 'Volunteer Contributors', value: '1,280', color: 'border-blue-500/10' },
              { label: 'Resolved Issues', value: '10,720', color: 'border-teal-500/10' },
              { label: 'Top Community Area', value: 'Ward 12 Indiranagar', color: 'border-amber-500/10' },
              { label: 'Most Improved Ward', value: 'Ward 45 Koramangala', color: 'border-[#14B8A6]/10' }
            ].map((impact, idx) => (
              <div
                key={impact.label}
                className={`bg-[#111827] border ${impact.color} rounded-xl p-4 flex flex-col justify-between hover:scale-[1.01] transition-transform`}
              >
                <span className="text-[9px] font-mono text-gray-500 uppercase leading-snug">
                  {impact.label}
                </span>
                <span className={`text-base font-black text-white mt-2 block tracking-tight ${impact.value.length > 10 ? 'text-xs' : 'text-base'}`}>
                  {impact.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MONTHLY TRENDS SECTION (CHARTS)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trends Selection Panel */}
          <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between gap-4">
            <div>
              <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
                Time Series
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Monthly Performance Trends
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Aggregated performance indexes of CivicQ municipal loops. Track key metrics over the last six months.
              </p>
            </div>

            <div className="flex flex-col gap-2 my-2">
              {[
                { id: 'trends', label: 'Issues Filed vs Resolved', icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, desc: 'Report flow and closure vectors' },
                { id: 'resolution', label: 'Average Resolution Time (SLA)', icon: <Clock className="w-4 h-4 text-amber-400" />, desc: 'Uptime speeds in hours' },
                { id: 'participation', label: 'Citizen Participation Volume', icon: <Users className="w-4 h-4 text-blue-400" />, desc: 'Verification signatures logged' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveChart(tab.id as any)}
                  className={`px-3.5 py-3 rounded-xl border flex gap-3 text-left transition-all cursor-pointer ${
                    activeChart === tab.id
                      ? 'bg-gradient-to-r from-[#14B8A6]/10 to-transparent border-[#14B8A6] text-white font-bold ring-2 ring-[#14B8A6]/10'
                      : 'bg-[#0B1220]/40 border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">{tab.icon}</div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs">{tab.label}</span>
                    <span className="text-[9px] font-mono text-gray-500 font-normal">{tab.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-[9px] font-mono text-gray-500 text-center leading-relaxed mt-2 p-2 bg-[#0B1220]/30 rounded-lg border border-white/5">
              📈 Data represents true municipal transparency records audited by public citizens.
            </div>
          </div>

          {/* Premium Custom SVG Chart Display */}
          <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                {activeChart === 'trends' && 'Issues Reported vs Resolved (Jan - Jun)'}
                {activeChart === 'resolution' && 'BBMP Average Resolution Time Trends'}
                {activeChart === 'participation' && 'Citizen Verification signatures trends'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono font-bold uppercase tracking-widest animate-pulse">
                Audited
              </span>
            </div>

            {/* Custom Interactive SVG Chart Canvas */}
            <div className="w-full h-64 bg-black/10 border border-white/5 rounded-xl relative overflow-hidden p-4 flex flex-col justify-between">
              
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-6">
                <div className="w-full h-[1px] bg-white/5" />
                <div className="w-full h-[1px] bg-white/5" />
                <div className="w-full h-[1px] bg-white/5" />
                <div className="w-full h-[1px] bg-white/5" />
              </div>

              {/* Chart Rendering */}
              <div className="flex-1 w-full relative">
                
                {activeChart === 'trends' && (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                    {/* Area Gradients */}
                    <defs>
                      <linearGradient id="reportedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="#14B8A6" stopOpacity="0"/>
                      </linearGradient>
                      <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="#22C55E" stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    {/* Reported Area */}
                    <path
                      d="M 10,130 L 100,110 L 190,140 L 280,90 L 370,60 L 460,40 L 460,180 L 10,180 Z"
                      fill="url(#reportedGrad)"
                    />
                    {/* Reported Curve Line */}
                    <path
                      d="M 10,130 Q 100,110 190,140 T 370,60 T 460,40"
                      fill="none"
                      stroke="#14B8A6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Resolved Area */}
                    <path
                      d="M 10,150 L 100,135 L 190,155 L 280,110 L 370,75 L 460,48 L 460,180 L 10,180 Z"
                      fill="url(#resolvedGrad)"
                    />
                    {/* Resolved Curve Line */}
                    <path
                      d="M 10,150 Q 100,135 190,155 T 370,75 T 460,48"
                      fill="none"
                      stroke="#22C55E"
                      strokeWidth="3"
                      strokeDasharray="2"
                      strokeLinecap="round"
                    />

                    {/* Coordinates Dots on end */}
                    <circle cx="460" cy="40" r="4.5" fill="#14B8A6" stroke="#0B1220" strokeWidth="1.5" />
                    <circle cx="460" cy="48" r="4.5" fill="#22C55E" stroke="#0B1220" strokeWidth="1.5" />
                  </svg>
                )}

                {activeChart === 'resolution' && (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="slaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    {/* SLA Area */}
                    <path
                      d="M 10,40 L 100,60 L 190,80 L 280,105 L 370,120 L 460,135 L 460,180 L 10,180 Z"
                      fill="url(#slaGrad)"
                    />
                    {/* SLA Line (decreasing resolution hours) */}
                    <path
                      d="M 10,40 Q 100,60 190,80 T 370,120 T 460,135"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    <circle cx="460" cy="135" r="5" fill="#F59E0B" stroke="#0B1220" strokeWidth="2" />
                  </svg>
                )}

                {activeChart === 'participation' && (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="partGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    {/* Area */}
                    <path
                      d="M 10,140 L 100,110 L 190,95 L 280,60 L 370,40 L 460,25 L 460,180 L 10,180 Z"
                      fill="url(#partGrad)"
                    />
                    {/* Line */}
                    <path
                      d="M 10,140 Q 100,110 190,95 T 370,40 T 460,25"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    <circle cx="460" cy="25" r="5" fill="#3B82F6" stroke="#0B1220" strokeWidth="2" />
                  </svg>
                )}

              </div>

              {/* Chart X axis markers */}
              <div className="w-full flex justify-between pt-2 border-t border-white/5 text-[9px] font-mono text-gray-500">
                <span>JANUARY</span>
                <span>FEBRUARY</span>
                <span>MARCH</span>
                <span>APRIL</span>
                <span>MAY</span>
                <span>JUNE (CURR)</span>
              </div>
            </div>

            {/* Custom Chart Legend details */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-400">
              {activeChart === 'trends' && (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-[#14B8A6]" />
                    <span>ISSUES FILED (Target: Normal)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                    <span>ISSUES RESOLVED (Target: Max)</span>
                  </div>
                </div>
              )}
              {activeChart === 'resolution' && (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                  <span>SLA RESOLUTION TIMELINE (Hrs, steadily decreasing)</span>
                </div>
              )}
              {activeChart === 'participation' && (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                  <span>CITIZEN SIGNATURES RECORDED (Daily active growth)</span>
                </div>
              )}

              <span className="font-mono text-[9px]">
                AUDITED MUNICIPAL DATASET SECURE 🛡️
              </span>
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PUBLIC ACTIVITY FEED & TOP CONTRIBUTORS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Public Activity Feed */}
          <div className="lg:col-span-7 bg-[#111827] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-black text-[#14B8A6] uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Public Activity Feed
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Live Civic Dispatch Ledger
                </h3>
              </div>
              <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse uppercase">
                ACTIVE PIPELINE
              </span>
            </div>

            <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {liveActivities.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.98 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="p-3.5 rounded-xl bg-[#0B1220]/80 border border-white/5 hover:border-white/10 flex items-start gap-3 transition-colors group"
                  >
                    <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white group-hover:text-[#14B8A6] transition-colors truncate">
                          {item.text}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 shrink-0">
                          {item.time}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span className="flex items-center gap-0.5 text-[#14B8A6] font-medium">
                          <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                          {item.location}
                        </span>
                        <span>•</span>
                        <span className="text-[9px] font-mono text-gray-500">MUNICIPAL DESK ACTIONED</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Top Contributors Leaderboard */}
          <div className="lg:col-span-5 bg-[#111827] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  Top Contributors
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Citizen Guardians Leaderboard
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
              {contributors.map((citizen, idx) => (
                <div
                  key={citizen.name}
                  className="p-3 rounded-xl bg-[#0B1220]/60 border border-white/5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Circle */}
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[10px] text-gray-400 font-bold">
                      #{idx + 1}
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">{citizen.name}</span>
                      <span className="text-[9px] font-mono text-[#14B8A6] font-bold">
                        Trust Factor: {citizen.trustScore}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${citizen.badgeColor}`}>
                      {citizen.badge}
                    </span>
                    <span className="text-[8px] font-mono text-gray-500">
                      {citizen.reports} Reports • {citizen.verifications} Verifications
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            AI PREDICTIVE INSIGHTS SECTION
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
              Proactive Urban Planning
            </span>
            <h3 className="text-xl font-bold text-white">
              AI Predictive Infrastructure Insights
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Computational predictive modeling to isolate pre-emptive failure risk before outages disrupt citizen lives.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-2xl border ${insight.color} flex flex-col justify-between gap-4 transition-all hover:scale-[1.01]`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest bg-white/5 text-white border border-white/5">
                      {insight.type}
                    </span>
                    <span className="text-[8px] font-mono font-bold uppercase text-red-400 animate-pulse">
                      {insight.probability}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white">{insight.title}</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {insight.reason}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 mt-1 flex flex-col gap-1 font-mono text-[9px]">
                  <span className="text-gray-500 uppercase">PRE-EMPTIVE ACTION ENABLED:</span>
                  <span className="text-[#14B8A6] font-bold uppercase truncate">{insight.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            BOTTOM CTA SECTION
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="bg-gradient-to-tr from-teal-950/20 via-[#111827] to-emerald-950/20 border border-[#14B8A6]/20 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/3 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/3 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-2xl mx-auto flex flex-col items-center gap-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] p-[1px] shadow-lg shadow-[#14B8A6]/20 flex items-center justify-center">
              <div className="w-full h-full rounded-[15px] bg-[#0B1220] flex items-center justify-center">
                <span className="text-xl font-black bg-gradient-to-r from-[#14B8A6] to-[#22C55E] bg-clip-text text-transparent">
                  Q
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Every Report Creates Real Change.
              </h2>
              <p className="text-sm text-gray-400">
                Together we build cleaner, safer and smarter communities. Join thousands of active citizens coordinating with BBMP and local municipal desks to reconstruct Indian streets.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-sm mt-2">
              <button
                onClick={() => onNavigate('#report-issue')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#14B8A6]/10 hover:shadow-xl hover:scale-[1.02] cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>Report an Issue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onNavigate('#live-map')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#111827] border border-white/10 hover:border-white/15 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider hover:scale-[1.02] cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-gray-400" />
                <span>Explore Live Map</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
