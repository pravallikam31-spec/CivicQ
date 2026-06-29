import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Map, Check, ChevronRight, AlertCircle, HelpCircle, Flame, Zap, Compass, Sparkles } from 'lucide-react';

// @ts-ignore
import roadNeglected from '../assets/images/civicq_road_neglected_1782498745967.jpg';
// @ts-ignore
import roadImproved from '../assets/images/civicq_road_improved_1782498762847.jpg';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0-100)
  const [isDragging, setIsDragging] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Monitor scroll progress for the crossfade
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate how far down the hero container we've scrolled
      // Progress starts at 0 (top of hero at top of viewport) and reaches 1 (bottom of hero at top of viewport)
      const scrolled = -rect.top;
      const total = rect.height;
      const progress = Math.min(Math.max(scrolled / total, 0), 1);
      
      setScrollProgress(progress);
      
      // Gradually wipe slider as we scroll
      // If user isn't dragging, auto-wipe the slider from 100 (fully neglected) to 0 (fully improved) as they scroll
      if (!isDragging) {
        // Scroll progress from 0 to 0.8 drives slider from 50 to 5 (or 0 to 100 depending on preference)
        const targetPos = Math.max(0, Math.min(100, 100 - (progress * 120)));
        if (progress > 0.05) {
          setSliderPosition(targetPos);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDragging]);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.querySelector('.image-comparison-container')?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', () => setIsDragging(false));
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', () => setIsDragging(false));
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', () => setIsDragging(false));
    };
  }, [isDragging]);

  const meanings = [
    { label: 'Quality', icon: Check, color: '#14B8A6', desc: 'Transforming neglected spots into premium public spaces' },
    { label: 'Query', icon: HelpCircle, color: '#38BDF8', desc: 'Direct, AI-guided conversational reporting for all citizens' },
    { label: 'Queue', icon: Flame, color: '#F59E0B', desc: 'Algorithmic prioritization based on safety and community impact' },
    { label: 'Quick', icon: Zap, color: '#22C55E', desc: 'Accelerated dispatch with instant official validation routes' },
    { label: 'Quest', icon: Compass, color: '#A855F7', desc: 'A collective citizen mission for modern, thriving cities' },
  ];

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-between pt-24 pb-12 overflow-hidden bg-transparent"
    >
      {/* Visual background ambient glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Side: Editorial Typography & Brand Narrative */}
        <div className="lg:col-span-5 flex flex-col gap-8 text-left">
          
          {/* Tagline Accent Badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 font-mono tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Next-Gen Citizen Empowerment
            </span>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-sans tracking-tight text-white leading-none">
              Transform <br />
              <span className="bg-gradient-to-r from-[#14B8A6] via-[#22C55E] to-[#F59E0B] bg-clip-text text-transparent">
                Reports
              </span>{' '}
              into <br />
              Real Change.
            </h1>
            <p className="text-base sm:text-lg text-gray-300 font-medium leading-relaxed max-w-xl">
              CivicQ empowers citizens and authorities with AI to identify, verify, prioritize, and resolve civic issues transparently.
            </p>
          </div>

          {/* Elegant Q chips */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">
              The 5 Pillars of Q
            </span>
            <div className="flex flex-wrap gap-2.5">
              {meanings.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.label}
                    className="group relative cursor-help"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] border border-white/8 hover:border-white/20 transition-all duration-300">
                      <Icon className="w-3.5 h-3.5" style={{ color: pillar.color }} />
                      <span className="text-xs font-semibold text-white">{pillar.label}</span>
                    </div>
                    {/* Premium Hover Card */}
                    <div className="absolute bottom-full left-0 mb-2.5 w-64 p-3 bg-[#111827] border border-white/10 rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4" style={{ color: pillar.color }} />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          {pillar.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-normal font-sans">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Primary & Secondary Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <a
              id="cta-report-issue"
              href="#interactive-demo"
              className="px-8 py-4 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:from-[#14B8A6]/90 hover:to-[#22C55E]/90 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#14B8A6]/20 hover:shadow-[#14B8A6]/35 flex items-center justify-center gap-2 group text-sm"
            >
              Report an Issue
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              id="cta-live-map"
              href="#interactive-demo"
              className="px-8 py-4 bg-[#111827] hover:bg-[#111827]/80 text-white border border-white/8 hover:border-white/15 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              <Map className="w-4 h-4 text-[#14B8A6]" />
              Explore Live Map
            </a>
          </div>

        </div>

        {/* Right Side: Immersive Cinematic Transformation Comparison */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative w-full">
          <div className="w-full relative max-w-2xl">
            {/* Background cinematic frame decoration */}
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#14B8A6]/20 to-[#22C55E]/10 rounded-2xl blur-xl opacity-80" />
            
            {/* Interactive comparison viewport */}
            <div
              className="image-comparison-container relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#111827] select-none"
              style={{ cursor: isDragging ? 'ew-resize' : 'default' }}
            >
              {/* Underlay Image: Neglected Road */}
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={roadNeglected}
                  alt="Neglected Indian Road"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Visual labels */}
                {sliderPosition < 50 && (
                  <span className="absolute bottom-4 left-4 z-20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-[#F59E0B] rounded-md border border-[#F59E0B]/30 font-mono">
                    NEGLECTED STATE
                  </span>
                )}
              </div>

              {/* Overlay Image: Improved Road (Clipped based on slider position) */}
              <div
                className="absolute inset-0 w-full h-full transition-all duration-75"
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
              >
                <img
                  src={roadImproved}
                  alt="Improved Indian Road"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Visual labels */}
                {sliderPosition >= 50 && (
                  <span className="absolute bottom-4 left-4 z-20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-[#22C55E] rounded-md border border-[#22C55E]/30 font-mono">
                    CIVICQ IMPROVED STATE
                  </span>
                )}
              </div>

              {/* Slider Line / Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white/30 backdrop-blur-sm z-30 transition-all duration-75 flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
              >
                <div
                  id="slider-drag-handle"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onTouchStart={(e) => {
                    setIsDragging(true);
                  }}
                  className="w-10 h-10 rounded-full bg-white text-[#0B1220] shadow-2xl border-4 border-[#0B1220] flex items-center justify-center cursor-ew-resize hover:scale-110 active:scale-95 transition-all"
                >
                  <div className="flex gap-[2px] items-center text-gray-800">
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Prompt Overlay Guide */}
              <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                  Drag slider to transform
                </span>
              </div>
            </div>

            {/* Quote Caption beneath image */}
            <p className="mt-4 text-center text-sm font-medium italic text-gray-400">
              "Every report transforms a community."
            </p>
          </div>
        </div>

      </div>

    </section>
  );
}
