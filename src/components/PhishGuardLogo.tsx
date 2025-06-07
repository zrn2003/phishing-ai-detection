import { ShieldCheck } from 'lucide-react';
import type React from 'react';

interface PhishGuardLogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

const PhishGuardLogo: React.FC<PhishGuardLogoProps> = ({ className, iconSize = 28, textSize = "text-2xl" }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ShieldCheck size={iconSize} className="text-primary" />
      <span className={`font-headline font-semibold ${textSize} text-primary`}>PhishGuard</span>
    </div>
  );
};

export default PhishGuardLogo;
