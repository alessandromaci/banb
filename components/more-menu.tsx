"use client";

import { Button } from "@/components/ui/button";
import { X, DollarSign, Compass, Palette, TrendingUp } from "lucide-react";

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCurrencyToggle: () => void;
  onExploreBaseScan: () => void;
  onThemeToggle: () => void;
  onAddInvestmentAccount: () => void;
  currency?: string;
  theme?: string;
}

export function MoreMenu({
  isOpen,
  onClose,
  onCurrencyToggle,
  onExploreBaseScan,
  onThemeToggle,
  onAddInvestmentAccount,
  currency = "USD",
  theme = "dark",
}: MoreMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Menu */}
      <div
        className="absolute bottom-0 left-0 right-0 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto max-w-md bg-[#1A0F3D]/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">More</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-10 w-10 rounded-full text-white hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <button
              onClick={() => {
                onCurrencyToggle();
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-colors text-left"
            >
              <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <div className="text-white font-medium">
                  Display Currency: {currency}
                </div>
                <div className="text-white/60 text-sm">
                  Toggle between USD and EUR
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onExploreBaseScan();
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-colors text-left"
            >
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Compass className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="text-white font-medium">
                  Explore on BaseScan
                </div>
                <div className="text-white/60 text-sm">
                  View your address on blockchain explorer
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onThemeToggle();
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-colors text-left"
            >
              <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Palette className="h-6 w-6 text-pink-400" />
              </div>
              <div>
                <div className="text-white font-medium">
                  Change Theme: {theme === "dark" ? "Light" : "Dark"}
                </div>
                <div className="text-white/60 text-sm">
                  Customize your experience
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onAddInvestmentAccount();
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-colors text-left"
            >
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-white font-medium">
                  Add Investment Account
                </div>
                <div className="text-white/60 text-sm">
                  Start investing today
                </div>
              </div>
            </button>
          </div>

          {/* Bottom Spacer */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
