import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Landmark, Compass, Sparkles, Bot, Bell } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

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
          console.error('Error fetching navbar profile:', e);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Transparency', href: '#transparency' },
    { name: 'My Profile', href: '#profile' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Features', href: '#features' },
    { name: 'Impact', href: '#impact' },
    { name: 'Contact', href: '#contact' },
  ];

  const visibleNavLinks = navLinks.filter(
    (link) => link.name !== 'My Profile' || user
  );

  return (
    <>
      <nav
        id="navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          isScrolled
            ? 'bg-[#0B1220]/80 backdrop-blur-md border-white/8 py-3'
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo Section */}
          <a href="#home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] p-[1.5px] shadow-lg shadow-[#14B8A6]/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full rounded-[10px] bg-[#0B1220] flex items-center justify-center">
                <span className="text-xl font-black bg-gradient-to-r from-[#14B8A6] to-[#22C55E] bg-clip-text text-transparent font-sans">
                  Q
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
                CivicQ
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#14B8A6]/10 text-[#14B8A6] rounded-md border border-[#14B8A6]/20">
                  AI
                </span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wider font-mono">
                FROM QUERY TO QUALITY
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {visibleNavLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Notification Bell Icon */}
            {user && (
              <button
                id="btn-navbar-notifications"
                onClick={() => window.location.hash = '#notifications'}
                className="p-2.5 bg-[#111827] hover:bg-[#111827]/80 text-gray-400 hover:text-white rounded-xl border border-white/8 relative hover:scale-105 transition-all cursor-pointer"
                title="Notifications Center"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                  4
                </span>
              </button>
            )}

            <button
              id="btn-navbar-ai"
              onClick={() => window.dispatchEvent(new CustomEvent('open-civic-ai'))}
              className="p-2.5 bg-[#14B8A6]/10 border border-[#14B8A6]/30 rounded-xl hover:border-[#14B8A6] text-[#14B8A6] hover:text-white transition-all flex items-center gap-2 font-semibold text-xs uppercase tracking-wider cursor-pointer"
              title="Open CivicQ AI Assistant"
            >
              <Bot className="w-4 h-4 animate-pulse" />
              <span>AI Assistant</span>
            </button>
            {user ? (
              <div 
                onClick={() => window.location.hash = '#profile'}
                className="flex items-center gap-3 bg-[#111827] border border-white/8 pl-3 pr-4 h-11 rounded-xl cursor-pointer hover:border-white/20 transition-all"
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
            ) : (
              <>
                <button
                  id="btn-login"
                  onClick={() => window.location.hash = '#login'}
                  className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 transition-colors"
                >
                  Login
                </button>
                <a
                  id="btn-get-started"
                  href="#interactive-demo"
                  className="text-sm font-semibold text-white bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:from-[#14B8A6]/90 hover:to-[#22C55E]/90 px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-[#14B8A6]/20 hover:shadow-lg hover:shadow-[#14B8A6]/30 flex items-center gap-2 group"
                >
                  Get Started
                  <Sparkles className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button
            id="mobile-menu-trigger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-drawer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[70px] left-0 right-0 z-45 bg-[#0B1220] border-b border-white/8 backdrop-blur-xl md:hidden py-6 px-6 flex flex-col gap-5 shadow-2xl"
          >
            <div className="flex flex-col gap-4">
              {visibleNavLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-gray-300 hover:text-white transition-colors py-1 border-b border-white/5"
                >
                  {link.name}
                </a>
              ))}
            </div>
            <button
              id="btn-navbar-ai-mobile"
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open-civic-ai'));
              }}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[#14B8A6] bg-[#14B8A6]/10 border border-[#14B8A6]/30 py-3 rounded-xl transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 animate-pulse" />
              <span>LAUNCH CIVICQ AI ASSISTANT</span>
            </button>

            {user && (
              <button
                id="btn-navbar-notif-mobile"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.hash = '#notifications';
                }}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#111827] border border-white/8 py-3 rounded-xl transition-all cursor-pointer hover:border-white/20"
              >
                <div className="relative">
                  <Bell className="w-4.5 h-4.5" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
                    4
                  </span>
                </div>
                <span>VIEW NOTIFICATIONS</span>
              </button>
            )}

            {user ? (
              <div 
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.hash = '#profile';
                }}
                className="w-full flex items-center gap-3 bg-[#111827] border border-white/8 p-3 rounded-xl cursor-pointer hover:border-white/20 transition-all"
              >
                <img 
                  src={profile?.avatar || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                  className="w-8 h-8 rounded-lg object-cover" 
                  alt="Profile"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{profile?.fullName || user.displayName?.split('|')[0] || 'User'}</span>
                  <span className="text-[10px] font-mono text-gray-400">{profile?.ward || 'Ward Member'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 pt-2">
                <button
                  id="btn-login-mobile"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.hash = '#login';
                  }}
                  className="w-1/2 text-center text-sm font-medium text-gray-300 hover:text-white py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                >
                  Login
                </button>
                <a
                  id="btn-get-started-mobile"
                  href="#interactive-demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 text-center text-sm font-semibold text-white bg-gradient-to-r from-[#14B8A6] to-[#22C55E] py-2.5 rounded-xl transition-all block"
                >
                  Get Started
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
