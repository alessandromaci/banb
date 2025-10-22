"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  showPrefix?: boolean;
}

export function SearchBar({
  placeholder = "Search",
  value,
  onChange,
  showPrefix = false,
}: SearchBarProps) {
  return (
    <div className="relative">
      {showPrefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 font-medium pointer-events-none">
          To:
        </span>
      )}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`${
          showPrefix ? "pl-12" : "pl-4"
        } bg-[#3A3650] border-0 text-white placeholder:text-white/60 h-14 rounded-2xl focus-visible:ring-1 focus-visible:ring-white/20`}
      />
    </div>
  );
}
