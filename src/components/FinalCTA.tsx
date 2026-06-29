import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Heart, Shield, Check } from 'lucide-react';

export default function FinalCTA() {
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setEmail('');
    }, 2500);
  };

  return (
    <section id="contact" className="py-24 bg-transparent relative overflow-hidden">
      {/* Visual glowing ring decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[#14B8A6]/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#22C55E]/5 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Massive Card Container */}
        <div className="relative rounded-3xl bg-[#111827] border border-white/8 p-8 sm:p-12 lg:p-16 overflow-hidden text-center flex flex-col items-center gap-6 shadow-2xl">
          
          {/* Top glowing ambient backplate */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] opacity-10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] p-[1px] shadow-lg shadow-[#14B8A6]/10 flex items-center justify-center">
            <div className="w-full h-full rounded-[15px] bg-[#111827] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#14B8A6]" />
            </div>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-4 max-w-2xl">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-sans tracking-tight leading-none">
              Small Reports. <br />
              <span className="bg-gradient-to-r from-[#14B8A6] via-[#22C55E] to-[#F59E0B] bg-clip-text text-transparent">
                Massive Impact.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-400 font-medium leading-relaxed">
              Together we can build cleaner, safer, and smarter communities across India. Join CivicQ today and make your voice the catalyst for real physical progress.
            </p>
          </div>

          {/* Button */}
          <div className="mt-4">
            <button
              id="btn-join-civicq"
              onClick={() => window.location.hash = '#login'}
              className="px-10 py-5 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:from-[#14B8A6]/95 hover:to-[#22C55E]/95 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-[#14B8A6]/20 hover:shadow-2xl hover:shadow-[#14B8A6]/35 hover:scale-103 transition-all duration-300 active:scale-98"
            >
              Join CivicQ Today
            </button>
          </div>

        </div>

      </div>

      {/* Premium Sign Up Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1220]/80 backdrop-blur-md">
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-[#111827] border border-white/10 p-6 shadow-2xl flex flex-col gap-6"
            >
              {/* Close Button */}
              <button
                id="btn-close-modal"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Success State */}
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-8 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] flex items-center justify-center">
                    <Check className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-white">Welcome to the CivicQ Movement!</h3>
                    <p className="text-xs text-gray-400">
                      We have registered your interest. Watch your inbox for access keys.
                    </p>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center border border-[#14B8A6]/20">
                      <Shield className="w-4 h-4 text-[#14B8A6]" />
                    </div>
                    <span className="text-xs font-bold text-gray-300 font-mono uppercase tracking-wider">
                      Early Access Waitlist
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Empower Your Neighborhood
                    </h3>
                    <p className="text-xs text-gray-400">
                      Be among the first citizens in your district to unlock civic dispatch authorization privileges.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                      Email Address
                    </label>
                    <input
                      id="modal-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. citizen@district.org"
                      className="w-full p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white"
                    />
                  </div>

                  <button
                    id="btn-modal-submit"
                    type="submit"
                    className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#22C55E] text-white font-bold text-xs uppercase tracking-widest shadow-md shadow-[#14B8A6]/15 hover:shadow-lg hover:shadow-[#14B8A6]/25 transition-all"
                  >
                    Submit Waitlist Entry
                  </button>

                  <p className="text-[10px] text-gray-500 text-center leading-normal font-sans">
                    By submitting, you agree to localized civic safety validation processes. We respect your data and privacy.
                  </p>
                </form>
              )}

            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
