import React from "react";

export const TimelineBar = () => (
  <div className="p-2 border-t border-gray-800">
    <div className="flex">
      {Array.from({ length: 24 }, (_, i) => (
        <div key={i} className="flex-1 text-center text-xs text-gray-500">
          {i.toString().padStart(2, "0")}:00
        </div>
      ))}
    </div>
  </div>
);
