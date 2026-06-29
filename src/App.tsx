/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './utils/firebase';
import Navbar from './components/Navbar';
import LiveBackground from './components/LiveBackground';
import Hero from './components/Hero';
import StatsSection from './components/StatsSection';
import CivicAssistantDemo from './components/CivicAssistantDemo';
import HowItWorks from './components/HowItWorks';
import FeaturesSection from './components/FeaturesSection';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

import Login from './components/Login';
import SignUp from './components/SignUp';
import CitizenDashboard from './components/CitizenDashboard';
import AuthorityDashboard from './components/AuthorityDashboard';
import LiveMap from './components/LiveMap';
import ReportIssue from './components/ReportIssue';
import IssueDetailsPlaceholder from './components/IssueDetailsPlaceholder';
import PublicTransparencyDashboard from './components/PublicTransparencyDashboard';
import CivicAI from './components/CivicAI';
import Notifications from './components/Notifications';
import MyProfile from './components/MyProfile';

import { 
  LayoutDashboard, Plus, MapPin, Inbox, Bell, Bot, User, Award, Settings, LogOut, Menu, X 
} from 'lucide-react';

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'citizen' | 'authority' | 'admin'>('citizen');
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        let role: 'citizen' | 'authority' | 'admin' = 'citizen';
        if (user.email && user.email.toLowerCase().includes('admin')) {
          role = 'admin';
        } else if (user.displayName) {
          const parts = user.displayName.split('|');
          if (parts[1] === 'authority') {
            role = 'authority';
          } else if (parts[1] === 'admin') {
            role = 'admin';
          }
        }
        setUserRole(role);
      } else {
        setCurrentUser(null);
        setUserRole('citizen');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleNavigationChange = () => {
      // Normalize empty hash to #home
      const hash = window.location.hash || '#home';
      setCurrentHash(hash);
      setCurrentPath(window.location.pathname);
      
      // Scroll to top on navigation to secondary pages
      if (['#login', '#signup', '#live-map', '#report-issue', '#citizen-dashboard', '#authority-dashboard', '#transparency', '#notifications', '#profile', '#my-profile', '#my-issues', '#ai-assistant', '#badges', '#settings'].includes(hash) || window.location.pathname.startsWith('/issue/')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('hashchange', handleNavigationChange);
    window.addEventListener('popstate', handleNavigationChange);
    return () => {
      window.removeEventListener('hashchange', handleNavigationChange);
      window.removeEventListener('popstate', handleNavigationChange);
    };
  }, []);

  // Prohibit logged-in citizens from accessing the main public landing page, redirecting them to their private workspace
  useEffect(() => {
    if (currentUser) {
      if (userRole === 'citizen') {
        if (currentHash === '#home' || currentHash === '#authority-dashboard') {
          navigateTo('#citizen-dashboard');
        }
      } else if (userRole === 'authority') {
        const citizenOrLandingHashes = [
          '#home',
          '#citizen-dashboard',
          '#report-issue',
          '#live-map',
          '#notifications',
          '#profile',
          '#my-profile',
          '#my-issues',
          '#ai-assistant',
          '#badges',
          '#settings'
        ];
        if (citizenOrLandingHashes.includes(currentHash)) {
          navigateTo('#authority-dashboard');
        }
      }
    }
  }, [currentUser, userRole, currentHash]);

  const navigateTo = (destination: string) => {
    if (destination.startsWith('/issue/')) {
      window.history.pushState({}, '', destination);
      setCurrentPath(destination);
      setCurrentHash('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // If we navigate back to home or other hash-based views, clean up the pathname
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
      }
      window.location.hash = destination;
    }
  };

  const handleLoginSuccess = async (role: 'citizen' | 'authority') => {
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          if (role === 'authority' || userRole === 'authority') {
            navigateTo('#authority-dashboard');
          } else {
            navigateTo('#citizen-dashboard');
          }
        } else {
          navigateTo('#profile');
        }
      } catch (e) {
        console.error('Error checking profile document:', e);
        if (role === 'citizen') {
          navigateTo('#citizen-dashboard');
        } else {
          navigateTo('#authority-dashboard');
        }
      }
    } else {
      if (role === 'citizen') {
        navigateTo('#citizen-dashboard');
      } else {
        navigateTo('#authority-dashboard');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out:', e);
    }
    navigateTo('#home');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#14B8A6] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Render proper view based on routing hash
  const renderView = () => {
    if (currentPath.startsWith('/issue/')) {
      const issueId = currentPath.substring('/issue/'.length);
      return (
        <IssueDetailsPlaceholder 
          issueId={issueId}
          onNavigate={navigateTo}
        />
      );
    }
    if (currentHash.startsWith('#issue/')) {
      const issueId = currentHash.substring('#issue/'.length);
      return (
        <IssueDetailsPlaceholder 
          issueId={issueId}
          onNavigate={navigateTo}
        />
      );
    }

    const redirectToRoleDashboard = () => {
      if (userRole === 'admin') {
        navigateTo('#transparency');
      } else if (userRole === 'authority') {
        navigateTo('#authority-dashboard');
      } else {
        navigateTo('#citizen-dashboard');
      }
      return null;
    };

    switch (currentHash) {
      case '#login':
        if (currentUser) {
          return redirectToRoleDashboard();
        }
        return (
          <Login 
            onNavigate={navigateTo} 
            onLoginSuccess={handleLoginSuccess} 
          />
        );
      case '#signup':
        if (currentUser) {
          return redirectToRoleDashboard();
        }
        return (
          <SignUp 
            onNavigate={navigateTo} 
            onSignUpSuccess={handleLoginSuccess} 
          />
        );
      case '#live-map':
        if (!currentUser) {
          navigateTo('#login');
          return null;
        }
        return (
          <LiveMap 
            onNavigate={navigateTo}
            onLogout={handleLogout}
          />
        );
      case '#report-issue':
        if (!currentUser) {
          navigateTo('#login');
          return null;
        }
        return (
          <ReportIssue 
            onNavigate={navigateTo}
          />
        );
      case '#citizen-dashboard':
      case '#my-issues':
        if (!currentUser) {
          navigateTo('#login');
          return null;
        }
        return (
          <CitizenDashboard 
            onLogout={handleLogout} 
            currentHash={currentHash}
          />
        );
      case '#authority-dashboard':
        if (!currentUser) {
          navigateTo('#login');
          return null;
        }
        return (
          <AuthorityDashboard 
            onLogout={handleLogout} 
          />
        );
      case '#transparency':
        return (
          <>
            <Navbar />
            <PublicTransparencyDashboard onNavigate={navigateTo} />
            <Footer />
          </>
        );
      case '#notifications':
        if (!currentUser) {
          navigateTo('#login');
          return null;
        }
        return (
          <Notifications onNavigate={navigateTo} isWorkspace={isCitizenWorkspace} />
        );
      case '#profile':
      case '#my-profile':
      case '#badges':
      case '#settings':
        if (!currentUser) {
          navigateTo('#login');
          return null;
        }
        return (
          <MyProfile onNavigate={navigateTo} isWorkspace={isCitizenWorkspace} />
        );
      case '#ai-assistant':
        if (!currentUser) {
          navigateTo('#login');
          return null;
        }
        return (
          <div className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
            <CivicAssistantDemo />
          </div>
        );
      default:
        // Fallback to primary landing page
        return (
          <>
            {/* 1. Transparent Nav Bar */}
            <Navbar />

            {/* 2. Hero viewport with dual-image interactive slide & cross-dissolve transformation */}
            <Hero />

            {/* 3. Floating Statistics indicators */}
            <StatsSection />

            {/* 4. Live AI Action Playground (Simulated report classification, geo-tag, fusion & Live Chat Assistant) */}
            <CivicAssistantDemo />

            {/* 5. Beautiful step-by-step horizontal timeline */}
            <HowItWorks />

            {/* 6. High-end Bento-grid capabilities cards */}
            <FeaturesSection />

            {/* 7. Powerful Final CTA containing email waits modal */}
            <FinalCTA />

            {/* 8. Modern detailed multi-column Footer */}
            <Footer />
          </>
        );
    }
  };

  const isLandingPage = currentPath === '/' && 
    !['#login', '#signup', '#live-map', '#report-issue', '#citizen-dashboard', '#authority-dashboard', '#transparency', '#notifications', '#profile', '#my-profile', '#my-issues', '#ai-assistant', '#badges', '#settings'].includes(currentHash) &&
    !currentHash.startsWith('#issue/');

  const isCitizenWorkspace = currentUser && userRole === 'citizen' && [
    '#citizen-dashboard', 
    '#report-issue', 
    '#live-map', 
    '#notifications', 
    '#profile', 
    '#my-profile', 
    '#my-issues', 
    '#ai-assistant', 
    '#badges', 
    '#settings'
  ].includes(currentHash);

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-[#14B8A6]/20 selection:text-[#14B8A6] font-sans antialiased overflow-x-hidden relative">
      {/* Live background layer (Keep always rendered as live background of the Indian roads as scrolled) */}
      {isLandingPage && <LiveBackground />}

      {isCitizenWorkspace ? (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#0B1220]">
          
          {/* Mobile Top Bar */}
          <div className="md:hidden flex items-center justify-between p-4 bg-[#111827] border-b border-white/8 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] p-[1px] flex items-center justify-center">
                <div className="w-full h-full rounded-[6px] bg-[#0B1220] flex items-center justify-center">
                  <span className="text-xs font-black bg-gradient-to-r from-[#14B8A6] to-[#22C55E] bg-clip-text text-transparent">Q</span>
                </div>
              </div>
              <span className="text-sm font-bold tracking-tight text-white">CivicQ Workspace</span>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-1.5 rounded-lg bg-[#0B1220] border border-white/8 text-gray-400 hover:text-white"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Sidebar */}
          <aside className={`w-full md:w-64 shrink-0 bg-[#111827] border-r border-white/8 flex flex-col md:fixed md:top-0 md:bottom-0 md:left-0 z-30 transition-transform duration-300 ${
            mobileSidebarOpen ? 'block' : 'hidden md:flex'
          }`}>
            {/* Sidebar Header with Logo (Desktop Only) */}
            <div className="hidden md:flex p-6 border-b border-white/8 items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] p-[1px] flex items-center justify-center">
                <div className="w-full h-full rounded-[7px] bg-[#0B1220] flex items-center justify-center">
                  <span className="text-sm font-black bg-gradient-to-r from-[#14B8A6] to-[#22C55E] bg-clip-text text-transparent">Q</span>
                </div>
              </div>
              <span className="text-base font-bold tracking-tight text-white">CivicQ Workspace</span>
            </div>

            {/* Navigation Menu Links */}
            <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
              {[
                { name: 'Dashboard Home', hash: '#citizen-dashboard', icon: LayoutDashboard },
                { name: 'Report Issue', hash: '#report-issue', icon: Plus },
                { name: 'Live Map', hash: '#live-map', icon: MapPin },
                { name: 'My Issues', hash: '#my-issues', icon: Inbox },
                { name: 'Notifications', hash: '#notifications', icon: Bell },
                { name: 'AI Assistant', hash: '#ai-assistant', icon: Bot },
                { name: 'My Profile', hash: '#my-profile', aliases: ['#profile'], icon: User },
                { name: 'Badges', hash: '#badges', icon: Award },
                { name: 'Settings', hash: '#settings', icon: Settings }
              ].map(link => {
                const isActive = currentHash === link.hash || (link.aliases && link.aliases.includes(currentHash));
                return (
                  <button
                    key={link.name}
                    onClick={() => {
                      navigateTo(link.hash);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#14B8A6]/10 text-[#14B8A6] border-l-2 border-[#14B8A6]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </button>
                );
              })}
            </nav>

            {/* User profile section at the bottom of the sidebar */}
            <div className="p-4 border-t border-white/8 bg-[#0B1220]/40 flex flex-col gap-3">
              {currentUser && (
                <div className="flex items-center gap-3">
                  <img 
                    src={currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                    className="w-8 h-8 rounded-lg object-cover border border-white/10" 
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col text-left truncate">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate">{currentUser.displayName?.split('|')[0] || 'Citizen'}</span>
                    <span className="text-[8px] font-mono text-gray-500 truncate">{currentUser.email}</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full py-2.5 rounded-xl border border-white/8 hover:border-red-500/30 hover:bg-red-500/5 text-gray-400 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 md:pl-64 min-h-screen bg-[#0B1220] relative">
            {renderView()}
          </main>
        </div>
      ) : (
        renderView()
      )}

      {/* Global AI Assistant Floating Button & Premium Drawer Overlay */}
      <CivicAI />
    </div>
  );
}

