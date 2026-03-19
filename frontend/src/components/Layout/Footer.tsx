import { Github, Code, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto bg-black backdrop-blur-md border-t border-border px-8 py-8">
      <div className="max-w-[1400px] mx-auto justify-center items-center gap-8 text-center md:text-left">

        <div className="flex flex-col items-center  gap-2 text-text-dim text-sm">
          <div className="flex items-center gap-2">
            <span>made with</span>
            <Heart size={16} className="text-error fill-error" />
            <a 
            href="https://linkedin.com/in/aditya-singh-8b8045345/" 
            target="_blank" 
            rel="noreferrer"
            className="text-[14px] text-primary px-2 py-0.5  hover: hover:text-white transition-all font-bold"
          >
            Aditya singh
          </a>
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
