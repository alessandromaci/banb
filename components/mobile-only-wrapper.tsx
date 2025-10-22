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

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg
              className="mx-auto h-24 w-24 text-white/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="font-sans text-3xl font-bold mb-4">
            Mobile View Required
          </h1>
          <p className="font-sans text-lg text-white/80 mb-2">
            This app is designed for mobile devices.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
