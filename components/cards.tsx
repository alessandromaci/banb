"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CardsPage() {
  const router = useRouter();
  const [currentCard, setCurrentCard] = useState(0);

  const cards = [
    {
      type: "Mastercard",
      gradient: "from-emerald-600 to-teal-700",
      number: "**** **** **** 4829",
    },
    {
      type: "Visa",
      gradient: "from-blue-600 to-indigo-700",
      number: "**** **** **** 7234",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 font-sans">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-full text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold font-sans">Cards</h1>
          <div className="w-10" />
        </div>

        {/* Card Carousel */}
        <div className="px-6 py-12">
          <div className="relative">
            {/* Card */}
            <div
              className={`bg-gradient-to-br ${cards[currentCard].gradient} rounded-3xl p-8 aspect-[1.6/1] shadow-2xl`}
            >
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <div className="text-2xl font-bold">BANB</div>
                  <div className="text-sm opacity-80">
                    {cards[currentCard].type}
                  </div>
                </div>
                <div>
                  <div className="text-xl tracking-wider mb-4">
                    {cards[currentCard].number}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs opacity-70">Card Holder</div>
                      <div className="text-sm font-medium">John Doe</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-70">Expires</div>
                      <div className="text-sm font-medium">12/27</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            {cards.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setCurrentCard((prev) =>
                      prev === 0 ? cards.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setCurrentCard((prev) =>
                      prev === cards.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCard(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentCard ? "w-8 bg-white" : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="px-6 py-8 text-center">
          <h2 className="text-3xl font-bold mb-3 font-sans">
            Cards — coming soon
          </h2>
          <p className="text-white/60 text-lg font-medium font-sans">
            Virtual and physical cards for expenses and rewards.
          </p>
        </div>
      </div>
    </div>
  );
}
