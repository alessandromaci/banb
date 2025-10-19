"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface InsightCard {
  id: string;
  text: string;
  action: () => void;
  imageUrl?: string;
}

function InsightCard({ card }: { card: InsightCard }) {
  const [showLogo, setShowLogo] = useState(true);

  // Toggle between logo and text for cards without images
  useEffect(() => {
    if (!card.imageUrl) {
      const toggleInterval = setInterval(() => {
        setShowLogo((prev) => !prev);
      }, 4000);
      return () => clearInterval(toggleInterval);
    }
  }, [card.imageUrl]);

  // If card has an image, show only the static image
  if (card.imageUrl) {
    return (
      <Card
        onClick={card.action}
        className="flex-shrink-0 w-[calc(100vw-3rem)] bg-[#2A1F4D]/80 backdrop-blur-sm border-0 rounded-xl shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl snap-center overflow-hidden p-0 leading-none"
      >
        <div className="h-20 w-full flex items-center justify-center relative block">
          <Image src={card.imageUrl} alt="Carousel" width={400} height={150} />
        </div>
      </Card>
    );
  }

  // For text-only cards, show the animation
  return (
    <Card
      onClick={card.action}
      className="flex-shrink-0 w-[calc(100vw-3rem)] bg-[#2A1F4D]/80 backdrop-blur-sm border-0 rounded-xl shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl snap-center overflow-hidden"
    >
      <div className="h-12 px-5 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {showLogo ? (
            <motion.div
              key="logo-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex items-center justify-center"
            >
              <Image
                src="/banb-logo-white.svg"
                alt="BANB Logo"
                width={32}
                height={32}
              />
            </motion.div>
          ) : (
            <motion.div
              key="text-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="text-center"
            >
              <p className="text-white text-sm font-medium leading-relaxed">
                {card.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

export function InsightsCarousel() {
  const router = useRouter();

  const cards: InsightCard[] = [
    {
      id: "welcome",
      text: "welcome",
      action: () => router.push("/deposit"),
      imageUrl: "/carousel.svg",
    },
    {
      id: "fees in usdc",
      text: "fees in usdc",
      action: () => router.push("/payments"),
      imageUrl: "/carousel-2.svg",
    },
    {
      id: "ai",
      text: "ai",
      action: () => router.push("/home"),
      imageUrl: "/carousel-3.svg",
    },
  ];

  return (
    <div className="mb-4 -mx-6">
      <div
        className="flex gap-2 overflow-x-auto px-6 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {cards.map((card) => (
          <InsightCard key={card.id} card={card} />
        ))}
      </div>
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
