import { Landmark, Shield, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export default function Footer() {
  const links = {
    platform: [
      { name: 'Core Engine', href: '#features' },
      { name: 'Priority Queue', href: '#features' },
      { name: 'Live Dispatches', href: '#interactive-demo' },
      { name: 'Developer API', href: '#home' },
    ],
    governance: [
      { name: 'Municipal Portal', href: '#home' },
      { name: 'Ward Scorecards', href: '#transparency' },
      { name: 'Data Ledgers', href: '#transparency' },
      { name: 'Citizen Charters', href: '#how-it-works' },
    ],
    company: [
      { name: 'About Us', href: '#home' },
      { name: 'Contact Desk', href: '#contact' },
      { name: 'Press & Media', href: '#home' },
      { name: 'Privacy Policy', href: '#home' },
    ]
  };

  return (
    <footer className="bg-transparent border-t border-white/5 pt-16 pb-8 text-xs text-gray-500 relative overflow-hidden">
      
      {/* Visual background lines */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
        
        {/* Brand Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] p-[1px] flex items-center justify-center">
              <div className="w-full h-full rounded-[7px] bg-[#0B1220] flex items-center justify-center">
                <span className="text-sm font-black bg-gradient-to-r from-[#14B8A6] to-[#22C55E] bg-clip-text text-transparent">
                  Q
                </span>
              </div>
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              CivicQ
            </span>
          </div>
          <p className="text-gray-400 max-w-sm leading-relaxed">
            CivicQ is a state-of-the-art civic intelligence protocol empowering citizens and local authorities to rebuild Indian urban spaces with computational precision.
          </p>
          <div className="flex items-center gap-3 mt-2 text-gray-400">
            <a href="#home" className="p-2 rounded-lg bg-white/3 hover:bg-white/8 hover:text-white transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#home" className="p-2 rounded-lg bg-white/3 hover:bg-white/8 hover:text-white transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#home" className="p-2 rounded-lg bg-white/3 hover:bg-white/8 hover:text-white transition-colors">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold uppercase tracking-wider font-mono text-[10px]">
            Platform
          </h4>
          <div className="flex flex-col gap-2">
            {links.platform.map((link) => (
              <a key={link.name} href={link.href} className="hover:text-white transition-colors duration-200">
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold uppercase tracking-wider font-mono text-[10px]">
            Governance
          </h4>
          <div className="flex flex-col gap-2">
            {links.governance.map((link) => (
              <a key={link.name} href={link.href} className="hover:text-white transition-colors duration-200">
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Links Column 3 */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold uppercase tracking-wider font-mono text-[10px]">
            Company
          </h4>
          <div className="flex flex-col gap-2">
            {links.company.map((link) => (
              <a key={link.name} href={link.href} className="hover:text-white transition-colors duration-200">
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Mission Column */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <h4 className="text-white font-bold uppercase tracking-wider font-mono text-[10px]">
            Active Zones
          </h4>
          <div className="flex flex-col gap-2 text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] shrink-0" />
              <span>Bengaluru Ward 12</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
              <span>Noida Sector 4</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
              <span>Mumbai Ward G/S</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Legal bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span>&copy; {new Date().getFullYear()} CivicQ Technologies Private Limited. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <span>Built with</span>
          <Heart className="w-3.5 h-3.5 text-[#14B8A6]" />
          <span>for smarter communities in India.</span>
        </div>
      </div>

    </footer>
  );
}
