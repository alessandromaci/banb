"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";

interface InsightCard {
  id: string;
  text: string;
  action: () => void;
  imageUrl: string;
}

function InsightCard({ card }: { card: InsightCard }) {
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
