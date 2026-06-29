import { motion } from 'motion/react';
import { ShieldCheck, ClipboardList, Clock, Heart } from 'lucide-react';

export default function StatsSection() {
  const stats = [
    {
      id: 'stat-reported',
      value: '24,853+',
      label: 'Issues Reported',
      sub: 'Verified by citizens',
      color: 'from-[#14B8A6] to-[#06B6D4]',
      icon: ClipboardList,
    },
    {
      id: 'stat-resolved',
      value: '18,762+',
      label: 'Issues Resolved',
      sub: 'Proof verified on-chain/AI',
      color: 'from-[#22C55E] to-[#10B981]',
      icon: ShieldCheck,
    },
    {
      id: 'stat-time',
      value: '2.4 Days',
      label: 'Avg. Resolution Time',
      sub: 'Reduces civic latency by 85%',
      color: 'from-[#F59E0B] to-[#D97706]',
      icon: Clock,
    },
    {
      id: 'stat-satisfaction',
      value: '4.8 / 5',
      label: 'Citizen Satisfaction',
      sub: 'Based on 12k community votes',
      color: 'from-[#A855F7] to-[#8B5CF6]',
      icon: Heart,
    },
  ];

  return (
    <section id="impact" className="py-24 bg-transparent relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Headings */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-3">
          <span className="text-xs font-bold text-[#14B8A6] font-mono tracking-widest uppercase">
            Empirical Results
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-sans tracking-tight">
            Our Shared Impact in Real-Time
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            A real-time overview of reports, resolutions, and civic efficiency improvements made possible by CivicQ.
          </p>
        </div>

        {/* Floating Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                id={stat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="relative overflow-hidden rounded-2xl bg-[#111827] border border-white/8 p-6 shadow-2xl flex flex-col gap-4 group"
              >
                {/* Accent glow on top */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.color} opacity-80`} />
                
                {/* Icon wrapper with subtle background color */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/8 group-hover:bg-white/10 transition-colors">
                    <Icon className="w-5 h-5 text-gray-300 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono font-bold tracking-wider uppercase">
                    Verified
                  </span>
                </div>

                {/* Stat Text */}
                <div className="flex flex-col">
                  <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-sm font-semibold text-gray-200">
                    {stat.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {stat.sub}
                  </p>

                  {/* Elegant Dark theme decorations */}
                  {stat.id === 'stat-reported' && (
                    <div className="mt-3 h-1 w-1/2 bg-[#14B8A6] rounded-full" />
                  )}
                  {stat.id === 'stat-resolved' && (
                    <div className="mt-3 h-1 w-1/2 bg-[#22C55E] rounded-full" />
                  )}
                  {stat.id === 'stat-time' && (
                    <div className="mt-3 h-1 w-1/2 bg-[#F59E0B] rounded-full" />
                  )}
                  {stat.id === 'stat-satisfaction' && (
                    <div className="flex gap-1 mt-3">
                      <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                      <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                      <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                      <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                      <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                    </div>
                  )}
                </div>
                
                {/* Decorative background grid element */}
                <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none group-hover:scale-105 transition-transform">
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
