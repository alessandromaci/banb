"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Send } from "lucide-react";

export default function CardsPage() {
  const router = useRouter();
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const walletLogos = [
    { name: "Farcaster", logo: "/farcaster-logo.svg" },
    { name: "Phantom", logo: "/phantom-logo.png" },
    { name: "MetaMask", logo: "/metamask-logo.svg" },
    { name: "TrustWallet", logo: "/trust-wallet-logo.png" },
  ];

  return (
    <div className="h-screen bg-[#0E0E0F] text-white overflow-hidden flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-8 flex-shrink-0">
          <h1 className="text-xl font-medium pl-2">Cards</h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.push("/home")}
            className="h-10 w-10 rounded-full text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="relative px-6 py-8 flex flex-col items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              {walletLogos.map((wallet, index) => {
                const angle =
                  (rotation + (index * 360) / walletLogos.length) *
                  (Math.PI / 180);
                const radius = 140;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <div
                    key={wallet.name}
                    className="absolute transition-all duration-50 ease-linear"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                      opacity: 0.3 + Math.abs(Math.sin(angle)) * 0.3,
                    }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl p-2">
                      <Image
                        src={wallet.logo}
                        alt={wallet.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative z-10 mb-12">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-white/5 blur-3xl opacity-30 scale-110" />

              {/* Card */}
              <div
                className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0E0E0F] rounded-2xl p-8 aspect-[1.6/1] w-80 shadow-2xl border border-white/10"
                style={{
                  transform: "perspective(1000px) rotateY(-5deg) rotateX(5deg)",
                }}
              >
                {/* Subtle sheen overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none" />

                <div className="flex flex-col justify-between h-full relative z-10">
                  <div className="flex items-start justify-between">
                    {/* Chip */}
                    <div className="w-12 h-10 mt-6 rounded-md bg-gradient-to-br from-black to-gray-900 opacity-80" />
                    {/* BANB Logo */}
                    <Image
                      src="/banb-logo-white.svg"
                      alt="Banb Logo"
                      width={48}
                      height={48}
                    />
                  </div>
                  <div className="flex items-right">
                    {/* Mastercard Logo */}
                    <div className="flex gap-[-8px]">
                      <div className="w-8 h-8 rounded-full bg-[#EB001B]" />
                      <div className="w-8 h-8 rounded-full bg-[#F79E1B] -ml-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-6 relative z-10 max-w-md mx-auto pb-8">
              <h2 className="text-3xl font-medium text-white leading-tight">
                Get Your Card. Every Wallet. Full Control.
              </h2>
              <p className="text-base text-white/70 leading-relaxed">
                Connect any wallet. Keep full custody. Spend your crypto
                anywhere.
              </p>
              <p className="text-base text-white/70 leading-relaxed">
                Start with your virtual card immediately. Physical card ships
                while you're already spending.
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Button at Bottom */}
        <div className="px-6 pb-6 flex-shrink-0">
          <Button
            onClick={() => window.open("https://t.me/alessandromaci", "_blank")}
            className="w-full h-14 rounded-full bg-white hover:bg-white/90 text-black font-medium text-base transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Join Waitlist
          </Button>
        </div>
      </div>
    </div>
  );
}
