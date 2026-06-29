import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Sparkles, Chrome, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../utils/firebase';
// @ts-ignore
import authBg from '../assets/images/auth_street_night_1782499708292.jpg';

interface SignUpProps {
  onNavigate: (hash: string) => void;
  onSignUpSuccess: (role: 'citizen' | 'authority') => void;
}

export default function SignUp({ onNavigate, onSignUpSuccess }: SignUpProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'authority'>('citizen');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getFriendlyErrorMessage = (err: any) => {
    const code = err?.code || err?.message || '';
    if (code.includes('auth/invalid-email') || code.includes('invalid-email')) {
      return 'Invalid Email. Please check the email format.';
    }
    if (code.includes('auth/email-already-in-use') || code.includes('email-already-exists')) {
      return 'Email Already Exists. Try logging in instead.';
    }
    if (code.includes('auth/weak-password') || code.includes('weak-password')) {
      return 'Weak Password. Password must be at least 6 characters.';
    }
    return err?.message || 'An error occurred. Please try again.';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !mobile || !password || !confirmPassword || !agreeTerms) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: `${fullName}|${role}`
      });
      // Redirect to login
      onNavigate('#login');
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#0B1220] text-white">
      
      {/* Left Column: Full-height cinematic image (Desktop Only) */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden flex-col justify-between p-12 border-r border-white/8">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={authBg} 
            alt="Modern Indian Road at Night" 
            className="w-full h-full object-cover opacity-60 scale-102"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-transparent to-[#0B1220]/80 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0B1220] z-10" />
        </div>

        {/* Top Branding */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] p-[1px] flex items-center justify-center">
            <div className="w-full h-full rounded-[10px] bg-[#0B1220] flex items-center justify-center">
              <span className="text-base font-black bg-gradient-to-r from-[#14B8A6] to-[#22C55E] bg-clip-text text-transparent">Q</span>
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-sans">CivicQ</span>
        </div>

        {/* Narrative text overlay */}
        <div className="relative z-20 flex flex-col gap-3 max-w-sm mt-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 self-start">
            <Sparkles className="w-3 h-3" />
            Empowering Change
          </div>
          <h2 className="text-3xl font-black tracking-tight leading-tight">
            Building Better Communities Together
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Every report brings us one step closer to cleaner, safer and smarter neighborhoods.
          </p>
        </div>
      </div>

      {/* Right Column: Premium Auth Card */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center px-6 py-12 relative overflow-y-auto">
        {/* Dynamic Glow effects in background */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md flex flex-col gap-6 relative z-10 my-8">
          
          {/* Back to Home Button */}
          <button
            onClick={() => onNavigate('#home')}
            className="self-start flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors duration-200 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to home page
          </button>

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create an Account
            </h1>
            <p className="text-xs text-gray-400">
              Join the CivicQ collective to report issues, verify, and resolve local concerns.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full p-3 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all placeholder-gray-600"
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. aarav@district.org"
                className="w-full p-3 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all placeholder-gray-600"
              />
            </div>

            {/* Mobile Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                Mobile Number
              </label>
              <input
                id="signup-mobile"
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full p-3 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all placeholder-gray-600"
              />
            </div>

            {/* User Role Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                User Role
              </label>
              <select
                id="signup-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'citizen' | 'authority')}
                className="w-full p-3 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all cursor-pointer"
              >
                <option value="citizen">Citizen</option>
                <option value="authority">Authority</option>
              </select>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-3 pr-10 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all placeholder-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                Confirm Password
              </label>
              <input
                id="signup-confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-3 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white transition-all placeholder-gray-600"
              />
            </div>

            {/* Agree Terms Checkbox */}
            <div className="flex items-center mt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-gray-400 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-white/10 bg-[#111827] text-[#14B8A6] focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                I agree to the Terms & Privacy Policy
              </label>
            </div>

            {/* Create Account CTA Button */}
            <button
              id="btn-signup-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-[#14B8A6]/20 hover:shadow-lg hover:shadow-[#14B8A6]/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Registering...' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Bottom redirection link */}
          <p className="text-center text-xs text-gray-400 mt-2">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('#login')}
              className="font-bold text-[#14B8A6] hover:underline"
            >
              Login
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}
