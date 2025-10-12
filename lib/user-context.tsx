"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Profile } from "./supabase";

/**
 * User context type definition.
 * Provides access to the current user's profile and loading state.
 *
 * @interface UserContextType
 * @property {Profile | null} profile - Current user's profile or null if not logged in
 * @property {Function} setProfile - Function to update the profile state
 * @property {boolean} isLoading - Loading state indicator for initial profile fetch
 */
interface UserContextType {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  isLoading: boolean;
}

/**
 * React context for managing user profile state across the application.
 * @constant
 * @type {React.Context<UserContextType | undefined>}
 */
const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Provider component for user context.
 * Manages user profile state and persists it to localStorage.
 * Automatically loads profile from localStorage on mount.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with context
 * @returns {JSX.Element} Provider component wrapping children
 *
 * @example
 * <UserProvider>
 *   <App />
 * </UserProvider>
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

/**
 * Custom hook to access user context.
 * Must be used within a UserProvider component.
 *
 * @hook
 * @function useUser
 * @returns {UserContextType} User context containing profile, setProfile, and isLoading
 * @throws {Error} If used outside of UserProvider
 *
 * @example
 * function MyComponent() {
 *   const { profile, setProfile, isLoading } = useUser();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!profile) return <div>Not logged in</div>;
 *
 *   return <div>Welcome, {profile.name}!</div>;
 * }
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
