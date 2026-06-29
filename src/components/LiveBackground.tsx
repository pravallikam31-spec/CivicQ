import { useState, useEffect } from 'react';

// @ts-ignore
import roadNeglected from '../assets/images/civicq_road_neglected_1782498745967.jpg';
// @ts-ignore
import roadImproved from '../assets/images/civicq_road_improved_1782498762847.jpg';
// @ts-ignore
import smartCity from '../assets/images/smart_city_india_1782499431498.jpg';

export default function LiveBackground() {
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollPercent(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger initial calculation
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate opacities for the three stages
  // Stage 1: Neglected Road (active at scrollPercent 0, fades out by 0.35)
  // Stage 2: Improved Road (fades in from 0.15, peaks at 0.50, fades out by 0.8)
  // Stage 3: Thriving Smart City (fades in from 0.55, active to 1.0)
  
  let opacity1 = 0;
  let opacity2 = 0;
  let opacity3 = 0;

  if (scrollPercent <= 0.35) {
    // 0.0 -> 0.35
    opacity1 = 1 - (scrollPercent / 0.35);
    opacity2 = scrollPercent / 0.35;
    opacity3 = 0;
  } else if (scrollPercent <= 0.70) {
    // 0.35 -> 0.70
    opacity1 = 0;
    opacity2 = 1 - ((scrollPercent - 0.35) / 0.35);
    opacity3 = (scrollPercent - 0.35) / 0.35;
  } else {
    // 0.70 -> 1.0
    opacity1 = 0;
    opacity2 = 0;
    opacity3 = 1;
  }

  return (
    <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden bg-[#0B1220]">
      {/* Background Dim Layer to make text completely readable and premium */}
      <div className="absolute inset-0 bg-black/65 z-10 pointer-events-none" />

      {/* Grid Pattern overlay for tech-Apple feel */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] z-15 pointer-events-none" 
      />

      {/* Layer 1: Neglected Road */}
      <div 
        className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-out"
        style={{ opacity: opacity1 }}
      >
        <img 
          src={roadNeglected} 
          alt="Civic Neglect" 
          className="w-full h-full object-cover scale-105 motion-safe:animate-[pulse_8s_infinite_alternate]"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Layer 2: Improved Road */}
      <div 
        className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-out"
        style={{ opacity: opacity2 }}
      >
        <img 
          src={roadImproved} 
          alt="Civic Resolution" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Layer 3: Smart City */}
      <div 
        className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-out"
        style={{ opacity: opacity3 }}
      >
        <img 
          src={smartCity} 
          alt="Smart Community" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Glowing bottom-up ambient gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0B1220] via-[#0B1220]/40 to-transparent z-10 pointer-events-none" />
    </div>
  );
}
