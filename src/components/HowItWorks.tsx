import { motion } from 'motion/react';
import { FileText, BrainCircuit, CheckSquare, Forward, ShieldCheck, Camera, Sparkles, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Report',
      icon: FileText,
      desc: 'Citizen snaps a photo or types a quick description of the issue in any local language.',
      color: '#14B8A6',
    },
    {
      num: '02',
      title: 'AI Analysis',
      icon: BrainCircuit,
      desc: 'Our Gemini-powered engine categorizes, extracts GPS data, and rates severity instantly.',
      color: '#38BDF8',
    },
    {
      num: '03',
      title: 'Verify',
      icon: CheckSquare,
      desc: 'Nearby residents verify the ticket status via micro-votes, preventing false reporting.',
      color: '#A855F7',
    },
    {
      num: '04',
      title: 'Assign',
      icon: Forward,
      desc: 'CivicQ auto-fuses duplicates and dispatches a verified package to the relevant department.',
      color: '#F59E0B',
    },
    {
      num: '05',
      title: 'Resolve',
      icon: ShieldCheck,
      desc: 'Municipal workers execute repairs on-site and upload their structured completion photos.',
      color: '#22C55E',
    },
    {
      num: '06',
      title: 'AI Confirms',
      icon: Camera,
      desc: 'Vision models cross-examine completion photos against original reports to confirm repairs.',
      color: '#E11D48',
    },
    {
      num: '07',
      title: 'Impact',
      icon: Sparkles,
      desc: 'Repaired spot is logged in the public ledger, rewarding participants and boosting ward scores.',
      color: '#EC4899',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-transparent border-t border-b border-white/5 relative">
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Headings */}
        <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col gap-3">
          <span className="text-xs font-bold text-[#14B8A6] font-mono tracking-widest uppercase">
            Operation Model
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-sans tracking-tight">
            How CivicQ Orchestrates Resolution
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            A frictionless, end-to-end loop that connects citizen awareness with authority action, supervised by advanced AI.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          
          {/* Horizontal dotted connector line (Visible only on large desktop screens) */}
          <div className="hidden lg:block absolute top-16 left-8 right-8 h-0.5 border-t-2 border-dashed border-white/10 -z-10" />

          {/* Grid Layout: Stacks on mobile, forms horizontal layout on lg */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 items-stretch">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              return (
                <motion.div
                  key={stepItem.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="flex flex-col gap-4 p-5 rounded-2xl bg-[#111827] border border-white/8 relative group hover:border-white/15 hover:bg-[#111827]/90 transition-all duration-300"
                >
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-gray-500">
                      STEP {stepItem.num}
                    </span>
                    {/* Tiny connector arrows inside grid columns on smaller screens */}
                    <span className="lg:hidden text-xs text-[#14B8A6] font-bold font-mono">
                      → Next
                    </span>
                  </div>

                  {/* Icon with colored backplate */}
                  <div className="relative w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300"
                       style={{ 
                         borderColor: `${stepItem.color}20`,
                         backgroundColor: `${stepItem.color}08`
                       }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stepItem.color }} />
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                         style={{ backgroundColor: stepItem.color }} 
                    />
                  </div>

                  {/* Text Details */}
                  <div className="flex flex-col gap-1.5 flex-grow">
                    <h3 className="text-base font-bold text-white tracking-tight group-hover:text-white transition-colors">
                      {stepItem.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {stepItem.desc}
                    </p>
                  </div>

                  {/* Connector arrow pointing to the next card (Visible on desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-14 -right-4 w-8 h-8 rounded-full bg-[#111827] border border-white/10 items-center justify-center z-20 group-hover:border-[#14B8A6]/30 transition-all">
                      <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Elegant Dark - Sub-Timeline Visualization (Static) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex px-12 gap-1">
        <div className="flex-grow h-full bg-[#14B8A6]/80"></div>
        <div className="flex-grow h-full bg-[#14B8A6]/80"></div>
        <div className="flex-grow h-full bg-[#14B8A6]/20"></div>
        <div className="flex-grow h-full bg-white/5"></div>
        <div className="flex-grow h-full bg-white/5"></div>
        <div className="flex-grow h-full bg-white/5"></div>
        <div className="flex-grow h-full bg-white/5"></div>
      </div>
    </section>
  );
}
