/**
 * @fileoverview User context provider for managing authenticated user state.
 * Provides global access to the current user's profile with localStorage persistence.
 */

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Profile } from "./supabase";

/**
 * Shape of the user context value.
 * 
 * @interface UserContextType
 * @property {Profile | null} profile - Current user's profile or null if not logged in
 * @property {function} setProfile - Function to update the profile and persist to localStorage
 * @property {boolean} isLoading - True while loading profile from localStorage on mount
 */
interface UserContextType {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Provider component that manages user profile state with localStorage persistence.
 * Automatically loads profile from localStorage on mount and syncs changes.
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components that can access user context
 * 
 * @example
 * ```tsx
 * <UserProvider>
 *   <App />
 * </UserProvider>
 * ```
 */
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

  /**
   * Updates the profile state and persists to localStorage.
   * Removes from localStorage if profile is null (logout).
   * 
   * @param {Profile | null} newProfile - New profile to set or null to clear
   */
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

/**
 * Hook to access the user context.
 * Must be used within a UserProvider component.
 * 
 * @returns {UserContextType} User context value with profile, setProfile, and isLoading
 * @throws {Error} If used outside of UserProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { profile, setProfile, isLoading } = useUser();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!profile) return <div>Not logged in</div>;
 *   
 *   return <div>Hello, {profile.name}!</div>;
 * }
 * ```
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
