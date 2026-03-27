import React from "react";

export function LoadingBars({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-[2px] overflow-hidden ${className}`}>
       <div className="h-[2px] w-full bg-current rounded-full" style={{ animation: "toggle-sideways 0.8s infinite ease-in-out alternate" }}></div>
       <div className="h-[2px] w-full bg-current rounded-full opacity-70" style={{ animation: "toggle-sideways 0.8s infinite ease-in-out alternate-reverse" }}></div>
       <div className="h-[2px] w-full bg-current rounded-full opacity-40" style={{ animation: "toggle-sideways 0.8s infinite ease-in-out alternate" }}></div>
    </div>
  );
}
