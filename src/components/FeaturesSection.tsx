import { motion } from 'motion/react';
import { Brain, Merge, RotateCw, Users, Map, Award, TrendingUp, Bot, Sparkles } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      id: 'feat-ai-detect',
      title: 'AI Issue Detection',
      icon: Brain,
      desc: 'Transforms raw photos and multi-lingual voice descriptions into structured tickets instantly with computer vision and LLMs.',
      tag: 'Core Model',
    },
    {
      id: 'feat-fusion',
      title: 'Duplicate Report Fusion',
      icon: Merge,
      desc: 'Saves resource overhead by automatically flagging and grouping overlapping complaints within a specific geospatial radius.',
      tag: 'Optimization',
    },
    {
      id: 'feat-proof-loop',
      title: 'Resolution Proof Loop',
      icon: RotateCw,
      desc: 'A robust dual-verification cycle requiring both physical repair photos and matching citizen feedback to mark a ticket resolved.',
      tag: 'Integrity',
    },
    {
      id: 'feat-community',
      title: 'Community Verification',
      icon: Users,
      desc: 'Harnesses local consensus. Nearby residents receive automated notifications to endorse or update issues reported around them.',
      tag: 'Democracy',
    },
    {
      id: 'feat-live-track',
      title: 'Live Geospatial Tracking',
      icon: Map,
      desc: 'A real-time vector map plotting active ward issues, scheduled municipal trucks, and active patch-work repairs transparently.',
      tag: 'Transparency',
    },
    {
      id: 'feat-officials',
      title: 'Officials Scorecard',
      icon: Award,
      desc: 'Maintains healthy accountability with public performance scorecards tracking departments and ward engineers on dispatch speed.',
      tag: 'Accountability',
    },
    {
      id: 'feat-predictive',
      title: 'Predictive Insights',
      icon: TrendingUp,
      desc: 'Leverages historic resolution times to predict infrastructure failure rates, aiding municipal budget and maintenance plans.',
      tag: 'Big Data',
    },
    {
      id: 'feat-civic-assistant',
      title: 'AI Civic Assistant',
      icon: Bot,
      desc: 'A conversational interface that walks citizens through complex reporting guidelines, local regulations, and updates.',
      tag: 'Accessibility',
    },
  ];

  return (
    <section id="features" className="py-24 bg-transparent relative overflow-hidden">
      {/* Background visual graphics */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#14B8A6]/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#22C55E]/3 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Headings */}
        <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col gap-3">
          <span className="text-xs font-bold text-[#14B8A6] font-mono tracking-widest uppercase">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-sans tracking-tight">
            Engineered for High-Trust Governance
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            A comprehensive stack of automated protocols and AI interfaces designed to remove friction from civic collaboration.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.id}
                id={feat.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ 
                  y: -5,
                  borderColor: 'rgba(255,255,255,0.15)',
                  boxShadow: '0 20px 40px -15px rgba(20, 184, 166, 0.05)',
                  transition: { duration: 0.2 }
                }}
                className="rounded-2xl bg-[#111827] border border-white/8 p-6 flex flex-col justify-between min-h-[220px] transition-colors group relative overflow-hidden"
              >
                {/* Background accent hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#14B8A6]/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Card Header: Icon + Category Badge */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/8 group-hover:bg-[#14B8A6]/10 group-hover:border-[#14B8A6]/20 transition-all">
                    <Icon className="w-5 h-5 text-gray-300 group-hover:text-[#14B8A6] transition-colors" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/5">
                    {feat.tag}
                  </span>
                </div>

                {/* Card Content */}
                <div className="flex flex-col gap-2 relative z-10">
                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-[#14B8A6] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">
                    {feat.desc}
                  </p>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
