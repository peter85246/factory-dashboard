import React from "react";

export const SideNavItem = ({ icon: Icon, text, active, onClick }) => (
  <div
    className={`flex items-center space-x-2 px-4 py-3 cursor-pointer transition-all
      ${
        active
          ? "bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-400 border-r-2 border-cyan-400"
          : "text-gray-400 hover:bg-gray-800/50"
      }`}
    onClick={onClick}
  >
    <Icon size={20} className={active ? "text-cyan-400" : "text-gray-400"} />
    <span>{text}</span>
  </div>
);
