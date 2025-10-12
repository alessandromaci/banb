"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Edit, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useUser();

  const handleLogout = () => {
    // Clear profile from context
    setProfile(null);

    // Clear any local storage if needed
    localStorage.removeItem("user_profile");

    // Redirect to landing page
    router.push("/");
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link href="/home">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Profile</h1>
          <div className="w-10" />
        </div>

        {/* Profile Info */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <p className="text-white/60">@{profile.handle}</p>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="p-6">
          <div className="space-y-2">
            <Link href="/profile/view">
              <Button
                variant="ghost"
                className="w-full justify-start h-14 text-white hover:bg-white/10 rounded-xl"
              >
                <User className="h-5 w-5 mr-3" />
                <span className="text-base">View Profile</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              disabled
              className="w-full justify-start h-14 text-white/40 hover:bg-white/10 rounded-xl cursor-not-allowed"
            >
              <Edit className="h-5 w-5 mr-3" />
              <span className="text-base">Edit Profile</span>
              <span className="ml-auto text-xs text-white/30">WIP</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start h-14 text-red-400 hover:bg-red-500/10 rounded-xl"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="text-base">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
