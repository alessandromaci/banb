"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, LogOut, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { updateProfileName, deleteProfile } from "@/lib/profile";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveName = async () => {
    if (!profile || !editedName.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedProfile = await updateProfileName(profile.id, editedName);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteProfile(profile.id);

      // Clear profile from context
      setProfile(null);

      // Clear any local storage
      localStorage.removeItem("user_profile");

      // Redirect to landing page
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

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
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-10 bg-white/5 border-white/10 text-white"
                  placeholder="Enter your name"
                />
              ) : (
                <>
                  <h2 className="text-xl font-semibold">{profile.name}</h2>
                  <p className="text-white/60">@{profile.handle}</p>
                </>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <Button
                onClick={handleSaveName}
                disabled={isSaving || !editedName.trim()}
                className="flex-1 h-10 bg-white text-black hover:bg-white/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setEditedName(profile.name);
                  setError(null);
                }}
                variant="ghost"
                className="flex-1 h-10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Menu Options */}
        <div className="p-6">
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditing(!isEditing);
                setEditedName(profile.name);
                setError(null);
              }}
              disabled={isEditing}
              className="w-full justify-start h-14 text-white hover:bg-white/10 rounded-xl"
            >
              <Edit className="h-5 w-5 mr-3" />
              <span className="text-base">Edit Profile</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start h-14 text-white hover:bg-white/10 rounded-xl"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="text-base">Logout</span>
            </Button>

            {!showDeleteConfirm ? (
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full justify-start h-14 text-red-400 hover:bg-red-500/10 rounded-xl"
              >
                <Trash2 className="h-5 w-5 mr-3" />
                <span className="text-base">Delete Account</span>
              </Button>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
                <p className="text-sm text-white">
                  Are you sure? This will permanently delete your account and
                  all data.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 h-10 bg-red-500 text-white hover:bg-red-600"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      "Yes, Delete"
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setError(null);
                    }}
                    variant="ghost"
                    disabled={isDeleting}
                    className="flex-1 h-10 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
