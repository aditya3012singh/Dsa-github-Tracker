import { Github, Code, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto bg-bg-glass backdrop-blur-md border-t border-border px-8 py-12">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center md:justify-start gap-2 font-bold font-outfit">
            <Code size={20} className="text-primary" />
            <span>Overall Tracker</span>
          </div>
          <p className="text-text-dim text-sm">© 2026 High-Performance Coding Analytics</p>
        </div>
        
        <div className="order-first md:order-none">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center gap-2 text-text-dim hover:text-primary transition-colors text-sm no-underline"
          >
            <Github size={18} />
            <span>GitHub Source</span>
          </a>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2 text-text-dim text-sm">
          <div className="flex items-center gap-2">
            <span>made with</span>
            <Heart size={16} className="text-error fill-error" />
            <span>by Aditya singh</span>
          </div>
          <a 
            href="https://linkedin.com/in/aditya-singh-8b8045345/" 
            target="_blank" 
            rel="noreferrer"
            className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 hover:bg-primary hover:text-white transition-all no-underline font-bold"
          >
            LinkedIn Profile
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
