import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Check, Trash2, Search, Filter, Sparkles, AlertCircle, 
  CheckCircle2, UserCheck, Hammer, Camera, Bot, Shield, X, 
  ArrowLeft, Inbox, BadgeCheck, Eye, EyeOff
} from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

interface NotificationItem {
  id: string;
  type: 'Reports' | 'Verification' | 'Authority' | 'Community' | 'AI Updates' | 'System';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  severity: 'red' | 'green' | 'orange' | 'yellow' | 'teal' | 'blue' | 'purple';
  actionText?: string;
  actionHash?: string;
}

interface NotificationsProps {
  onNavigate: (hash: string) => void;
  isWorkspace?: boolean;
}

export default function Notifications({ onNavigate, isWorkspace }: NotificationsProps) {
  // Rich mock data covering all examples and requested types
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'Reports',
      title: 'New Issue Reported',
      description: 'Your pothole report has been successfully submitted to Ward 12 Indiranagar. AI is classifying and geo-tagging details.',
      timestamp: '2 minutes ago',
      isRead: false,
      severity: 'red',
      actionText: 'Track Status',
      actionHash: '#citizen-dashboard'
    },
    {
      id: 'notif-2',
      type: 'Community',
      title: 'Community Verified',
      description: '12 nearby citizens have verified your issue of water leak & flooded sidewalk on MG Road.',
      timestamp: '18 minutes ago',
      isRead: false,
      severity: 'green',
      actionText: 'View on Map',
      actionHash: '#live-map'
    },
    {
      id: 'notif-3',
      type: 'Authority',
      title: 'Officer Assigned',
      description: 'Ward Officer Priya Sharma has accepted your report and is dispatching the sub-grade engineer field team.',
      timestamp: '45 minutes ago',
      isRead: false,
      severity: 'orange',
      actionText: 'View Case'
    },
    {
      id: 'notif-4',
      type: 'Authority',
      title: 'Repair Started',
      description: 'Repair work has begun on your reported road block. Field equipment has been mobilized to the site coordinates.',
      timestamp: 'Yesterday',
      isRead: true,
      severity: 'yellow'
    },
    {
      id: 'notif-5',
      type: 'Verification',
      title: 'Repair Completed',
      description: 'Authority uploaded a repair photo. Awaiting your physical validation of the completed asphalt pavement.',
      timestamp: 'Yesterday',
      isRead: false,
      severity: 'teal',
      actionText: 'Verify Repair',
      actionHash: '#citizen-dashboard'
    },
    {
      id: 'notif-6',
      type: 'AI Updates',
      title: 'AI Verified',
      description: 'The road repairs have been successfully verified through our neural cross-validation engine. Issue closed.',
      timestamp: '2 days ago',
      isRead: true,
      severity: 'blue',
      actionText: 'View Success Story',
      actionHash: '#transparency'
    },
    {
      id: 'notif-7',
      type: 'Community',
      title: 'Community Badge',
      description: 'Congratulations! You earned the "Community Guardian" badge for verifying 5 repair works this month.',
      timestamp: '3 days ago',
      isRead: true,
      severity: 'purple'
    },
    {
      id: 'notif-8',
      type: 'System',
      title: 'System Optimization',
      description: 'CivicQ Platform v2.4 initialized. New high-precision photo alignment algorithms are now online in your sector.',
      timestamp: '4 days ago',
      isRead: true,
      severity: 'blue'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | NotificationItem['type']>('All');

  const filters: ('All' | NotificationItem['type'])[] = [
    'All',
    'Reports',
    'Verification',
    'Authority',
    'Community',
    'AI Updates',
    'System'
  ];

  // Notification action handlers (UI only)
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleToggleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Filter and search logic
  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = selectedFilter === 'All' || notif.type === selectedFilter;
    const matchesSearch = 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Icon selector based on category and severity
  const getIcon = (type: NotificationItem['type'], severity: NotificationItem['severity']) => {
    switch (type) {
      case 'Reports':
        return <AlertCircle className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
      case 'Verification':
        return <Camera className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
      case 'Authority':
        if (severity === 'orange') {
          return <UserCheck className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
        }
        return <Hammer className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
      case 'Community':
        if (severity === 'purple') {
          return <BadgeCheck className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
        }
        return <CheckCircle2 className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
      case 'AI Updates':
        return <Bot className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
      case 'System':
      default:
        return <Shield className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
    }
  };

  const getSeverityColor = (severity: NotificationItem['severity']) => {
    switch (severity) {
      case 'red': return 'text-red-400';
      case 'green': return 'text-emerald-400';
      case 'orange': return 'text-amber-500';
      case 'yellow': return 'text-yellow-400';
      case 'teal': return 'text-[#14B8A6]';
      case 'blue': return 'text-blue-400';
      case 'purple': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getBadgeStyle = (severity: NotificationItem['severity']) => {
    switch (severity) {
      case 'red': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'green': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'orange': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'yellow': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'teal': return 'bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/20';
      case 'blue': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'purple': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-white/5 text-gray-300 border-white/10';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col font-sans antialiased overflow-x-hidden relative">
      {!isWorkspace && <Navbar />}

      {/* Ambient background decoration */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-[550px] h-[550px] bg-[#22C55E]/3 rounded-full blur-3xl pointer-events-none" />

      {/* Primary Container */}
      <main className={`flex-1 max-w-4xl mx-auto w-full px-6 pb-20 relative z-10 flex flex-col gap-6 ${isWorkspace ? 'pt-24' : 'pt-28'}`}>
        
        {/* Navigation Breadcrumb & Page Title */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/8 text-left">
          <div className="flex flex-col">
            <button
              onClick={() => onNavigate('#home')}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-2 transition-colors cursor-pointer w-fit font-mono font-bold tracking-wider uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return Home
            </button>
            <div className="flex items-center gap-3">
              <h1 id="notifications-header" className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500 text-white flex items-center justify-center animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Stay updated with every stage of your civic reports.
            </p>
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
              >
                <Check className="w-4 h-4" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Categories Navigation */}
        <div className="flex flex-col gap-4 text-left">
          <div className="relative w-full">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications, reports, authorities, badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white placeholder-gray-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Chips Scroll container */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0 cursor-pointer ${
                  selectedFilter === filter
                    ? 'bg-gradient-to-r from-[#14B8A6] to-[#22C55E] text-white border-transparent shadow-lg shadow-[#14B8A6]/10'
                    : 'bg-[#111827] text-gray-400 border-white/5 hover:border-white/12 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="flex flex-col gap-4 text-left">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start justify-between gap-4 transition-all duration-300 relative group ${
                    notif.isRead 
                      ? 'bg-[#111827]/40 border-white/5 hover:border-white/10' 
                      : 'bg-[#111827] border-white/10 hover:border-[#14B8A6]/20 shadow-md shadow-black/20'
                  }`}
                >
                  {/* Unread Highlight Accent Border */}
                  {!notif.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#14B8A6] to-[#22C55E] rounded-l-2xl" />
                  )}

                  {/* Left Side: Category Icon and Text description */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                      notif.isRead ? 'bg-white/5 border-white/5' : 'bg-white/10 border-white/10 group-hover:scale-105 transition-transform'
                    }`}>
                      {getIcon(notif.type, notif.severity)}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest border ${getBadgeStyle(notif.severity)}`}>
                          {notif.type}
                        </span>
                        {!notif.isRead && (
                          <span className="flex items-center gap-1 text-[8px] font-black text-red-400 uppercase tracking-widest font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                            New
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-mono font-semibold">
                          {notif.timestamp}
                        </span>
                      </div>
                      
                      <h3 className={`text-sm font-bold tracking-tight ${notif.isRead ? 'text-gray-300' : 'text-white font-extrabold'}`}>
                        {notif.title}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
                        {notif.description}
                      </p>

                      {/* Notification Action button */}
                      {notif.actionText && (
                        <button
                          onClick={() => {
                            if (notif.actionHash) {
                              onNavigate(notif.actionHash);
                            } else {
                              handleMarkAsRead(notif.id);
                            }
                          }}
                          className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#14B8A6] hover:text-white hover:underline transition-colors w-fit flex items-center gap-1 cursor-pointer"
                        >
                          {notif.actionText}
                          <span>&rarr;</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Side Actions: Mark read / Toggle / Delete */}
                  <div className="flex md:flex-col items-center justify-end gap-2 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                    <button
                      onClick={() => handleToggleRead(notif.id)}
                      className={`p-2 rounded-xl border transition-all ${
                        notif.isRead 
                          ? 'bg-[#0B1220] border-white/5 text-gray-500 hover:text-white hover:border-white/15' 
                          : 'bg-white/5 border-white/10 text-[#14B8A6] hover:bg-[#14B8A6]/15'
                      }`}
                      title={notif.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      {notif.isRead ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteNotification(notif.id)}
                      className="p-2 rounded-xl bg-[#0B1220] border border-white/5 text-gray-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 rounded-2xl border border-white/5 bg-[#111827]/20 flex flex-col items-center justify-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                  <Inbox className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-white">No notifications found</h3>
                  <p className="text-xs text-gray-400 max-w-sm mt-1 leading-relaxed">
                    We couldn't find any notifications matching your filters or search query. Take action and report some issues!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFilter('All');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs font-bold text-[#14B8A6] hover:underline"
                >
                  Clear All Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {!isWorkspace && <Footer />}
    </div>
  );
}
