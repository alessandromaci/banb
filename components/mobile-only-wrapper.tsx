"use client";

import { useEffect, useState } from "react";

export function MobileOnlyWrapper({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Always allow viewing, but constrain to mobile-like layout on desktop
  return (
    <div className="min-h-screen bg-black">
      {!isMobile ? (
        // Desktop: Center the mobile app in a phone-like container
        <div className="flex items-start justify-center min-h-screen p-8">
          <div className="w-full max-w-md bg-black border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative">
              {/* Phone-like notch/status bar */}
              <div className="h-6 bg-black flex items-center justify-center">
                <div className="w-20 h-1 bg-gray-700 rounded-full"></div>
              </div>
              {/* App content */}
              <div className="relative">
                {children}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Mobile: Full screen
        children
      )}
    </div>
  );
}
