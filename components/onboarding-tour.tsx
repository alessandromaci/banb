"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    id: "pagination",
    title: "Multiple Accounts",
    description:
      "You can manage multiple wallets here. Swipe to add a new spending account and link your wallet.",
    targetSelector: '[data-tour="pagination"]',
    position: "bottom",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    description:
      "Your personal AI assistant helps you manage your finances with a simple prompt.",
    targetSelector: '[data-tour="ai-bar"]',
    position: "top",
  },
  {
    id: "profile",
    title: "Profile & Settings",
    description:
      "View and manage your linked wallets, settings, and upgrade options.",
    targetSelector: '[data-tour="profile"]',
    position: "bottom",
  },
  {
    id: "invest",
    title: "Start Investing",
    description:
      "Open an investment account and start earning yield directly from your balance.",
    targetSelector: '[data-tour="invest"]',
    position: "top",
  },
];

export function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Check if user has completed the tour
    const hasCompletedTour = localStorage.getItem("hasCompletedTour");
    if (!hasCompletedTour) {
      // Delay to allow data (balances, etc.) to load before starting tour
      setTimeout(() => {
        setIsActive(true);
      }, 2500);
    }
  }, []);

  // Developer: To reset the tour, run this in console:
  // localStorage.removeItem("hasCompletedTour"); window.location.reload();

  useEffect(() => {
    if (!isActive) return;

    const updateHighlight = () => {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.targetSelector);

      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);

        // Calculate tooltip position
        const tooltipWidth = 280;
        const tooltipHeight = 160; // Increased to prevent content overflow
        const padding = 32; // Increased padding to prevent overlap with highlighted element

        let top = 0;
        let left = 0;

        switch (step.position) {
          case "top":
            top = rect.top - tooltipHeight - padding;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "bottom":
            top = rect.bottom + padding;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - padding;
            break;
          case "right":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + padding;
            break;
        }

        // Keep tooltip within viewport
        const maxLeft = window.innerWidth - tooltipWidth - 16;
        const maxTop = window.innerHeight - tooltipHeight - 16;
        left = Math.max(16, Math.min(left, maxLeft));
        top = Math.max(16, Math.min(top, maxTop));

        setTooltipPosition({ top, left });
      }
    };

    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    return () => window.removeEventListener("resize", updateHighlight);
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem("hasCompletedTour", "true");
    setIsActive(false);
  };

  if (!isActive) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleSkip}
        />

        {/* Spotlight effect */}
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute pointer-events-none"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              boxShadow:
                "0 0 0 4px rgba(123, 76, 255, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)",
              borderRadius: "20px",
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="absolute z-10"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: "280px",
            minHeight: "160px",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-5 relative min-h-full flex flex-col">
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="mb-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-6">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-3">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? "w-6 bg-gradient-to-r from-[#3B1EFF] to-[#7B4CFF]"
                      : "w-1.5 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="flex-1 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                Skip
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#3B1EFF] to-[#7B4CFF] hover:opacity-90 text-white shadow-lg shadow-indigo-500/30"
              >
                {isLastStep ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
