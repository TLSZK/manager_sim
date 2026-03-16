import React from 'react';
import { User } from 'lucide-react';

interface ProfileIconProps {
  name?: string | null;
  className?: string;
}

const ProfileIcon: React.FC<ProfileIconProps> = ({ name, className = "" }) => {
  if (!name) {
    return (
      <div className={`bg-blue-600 flex items-center justify-center text-white font-bold ring-2 ring-slate-700 shadow-lg shrink-0 ${className}`}>
        <User size={className.includes('w-8') ? 16 : 24} />
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-slate-700 shrink-0 ${className}`}>
      {name.substring(0, 2).toUpperCase()}
    </div>
  );
};

export default ProfileIcon;