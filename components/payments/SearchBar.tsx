"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export function SearchBar({ placeholder = "Search", value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="pl-12 bg-[#3A3650] border-0 text-white placeholder:text-white/60 h-14 rounded-2xl focus-visible:ring-1 focus-visible:ring-white/20"
      />
    </div>
  )
}
