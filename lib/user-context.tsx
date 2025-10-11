"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Profile } from "./supabase";

interface UserContextType {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from localStorage on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem("banb_profile");
    if (storedProfile) {
      try {
        setProfileState(JSON.parse(storedProfile));
      } catch (error) {
        console.error("Failed to parse stored profile:", error);
        localStorage.removeItem("banb_profile");
      }
    }
    setIsLoading(false);
  }, []);

  // Save profile to localStorage whenever it changes
  const setProfile = (newProfile: Profile | null) => {
    setProfileState(newProfile);
    if (newProfile) {
      localStorage.setItem("banb_profile", JSON.stringify(newProfile));
    } else {
      localStorage.removeItem("banb_profile");
    }
  };

  return (
    <UserContext.Provider value={{ profile, setProfile, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
