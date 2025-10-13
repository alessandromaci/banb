"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RecipientAvatar } from "@/components/ui/recipient-avatar";
import {
  getRecipientsByProfile,
  searchRecipients,
  searchAvailableProfiles,
  addRecipient,
  type Recipient,
  type Profile,
} from "@/lib/recipients";
import { getProfile } from "@/lib/profile";
import { useUser } from "@/lib/user-context";

interface RecipientWithProfile extends Recipient {
  linkedProfile?: Profile;
}

interface AvailableProfile extends Profile {
  isAvailable?: boolean; // Flag to indicate this is a suggested profile to add
}

interface FriendListProps {
  searchTerm?: string;
}

export function FriendList({ searchTerm = "" }: FriendListProps) {
  const router = useRouter();
  const { profile } = useUser();
  const [recipients, setRecipients] = useState<RecipientWithProfile[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<
    AvailableProfile[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Fetch recipients and their linked profiles
  useEffect(() => {
    const fetchRecipients = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        const recipientsData = await getRecipientsByProfile(profile.id);

        // For each recipient, fetch the linked profile if it exists
        const recipientsWithProfiles = await Promise.all(
          recipientsData.map(async (recipient) => {
            let linkedProfile: Profile | undefined;
            if (recipient.profile_id_link) {
              try {
                const profile = await getProfile(recipient.profile_id_link);
                linkedProfile = profile ?? undefined;
              } catch (error) {
                console.error("Failed to fetch linked profile:", error);
              }
            }
            return { ...recipient, linkedProfile };
          })
        );

        setRecipients(recipientsWithProfiles);
      } catch (error) {
        console.error("Failed to fetch recipients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipients();
  }, [profile?.id]);

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (!profile?.id) return;

      try {
        if (searchTerm.trim()) {
          // Search both recipients and available profiles
          const [searchResults, availableResults] = await Promise.all([
            searchRecipients(profile.id, searchTerm),
            searchAvailableProfiles(profile.id, searchTerm),
          ]);

          // Fetch linked profiles for search results
          const searchResultsWithProfiles = await Promise.all(
            searchResults.map(async (recipient) => {
              let linkedProfile: Profile | undefined;
              if (recipient.profile_id_link) {
                try {
                  const profile = await getProfile(recipient.profile_id_link);
                  linkedProfile = profile ?? undefined;
                } catch (error) {
                  console.error("Failed to fetch linked profile:", error);
                }
              }
              return { ...recipient, linkedProfile };
            })
          );

          setRecipients(searchResultsWithProfiles);
          setAvailableProfiles(
            availableResults.map((profile) => ({
              ...profile,
              isAvailable: true,
            }))
          );
        } else {
          // If no search term, fetch all recipients and clear available profiles
          const recipientsData = await getRecipientsByProfile(profile.id);
          const recipientsWithProfiles = await Promise.all(
            recipientsData.map(async (recipient) => {
              let linkedProfile: Profile | undefined;
              if (recipient.profile_id_link) {
                try {
                  const profile = await getProfile(recipient.profile_id_link);
                  linkedProfile = profile ?? undefined;
                } catch (error) {
                  console.error("Failed to fetch linked profile:", error);
                }
              }
              return { ...recipient, linkedProfile };
            })
          );
          setRecipients(recipientsWithProfiles);
          setAvailableProfiles([]);
        }
      } catch (error) {
        console.error("Failed to search recipients:", error);
      }
    };

    const timeoutId = setTimeout(performSearch, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchTerm, profile?.id]);

  const getDisplayName = (recipient: RecipientWithProfile) => {
    if (recipient.linkedProfile) {
      return recipient.linkedProfile.name;
    }
    return recipient.name;
  };

  const getDisplayHandle = (recipient: RecipientWithProfile) => {
    if (recipient.linkedProfile) {
      return `@${recipient.linkedProfile.handle}`;
    }
    if (recipient.external_address) {
      return `${recipient.external_address.slice(
        0,
        6
      )}...${recipient.external_address.slice(-4)}`;
    }
    return "";
  };

  const getInitials = (recipient: RecipientWithProfile) => {
    const name = getDisplayName(recipient);
    return name
      .split(" ")
      .map((word: string) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (recipient: RecipientWithProfile) => {
    // Generate consistent color based on recipient ID
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
    ];
    const index = recipient.id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleAddRecipient = async (recipientProfile: AvailableProfile) => {
    if (!profile?.id || !recipientProfile?.id) return;

    try {
      // Add the profile as a recipient (current user's profile ID, recipient's profile ID)
      const newRecipient = await addRecipient(profile.id, recipientProfile.id);

      // Navigate to payment page with the new recipient
      router.push(`/payments/recipient/${newRecipient.id}/amount`);
    } catch (error) {
      console.error("Failed to add recipient:", error);
      // You could add a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="space-y-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-full flex items-center gap-3 p-3 rounded-2xl"
          >
            <div className="h-12 w-12 rounded-full bg-white/10 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const allResults = [...recipients, ...availableProfiles];
  const hasResults = allResults.length > 0;

  return (
    <div className="space-y-4">
      {!hasResults ? (
        <div className="text-center py-8 text-white/60">
          <p>No recipients found</p>
          {searchTerm && (
            <p className="text-sm mt-2">Try a different search term</p>
          )}
        </div>
      ) : (
        <>
          {/* Friends Section */}
          {recipients.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Friends ({recipients.length})
              </h3>
              <div className="space-y-1">
                {recipients.map((recipient) => (
                  <button
                    key={recipient.id}
                    onClick={() =>
                      router.push(`/payments/recipient/${recipient.id}/amount`)
                    }
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors"
                  >
                    <RecipientAvatar
                      name={getDisplayName(recipient)}
                      recipientType={recipient.recipient_type || "crypto"}
                      size="md"
                      showBadge={true}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">
                        {getDisplayName(recipient)}
                      </div>
                      <div className="text-sm text-white/60">
                        {getDisplayHandle(recipient)}
                      </div>
                    </div>
                    <div className="h-5 w-5 rounded-full border-2 border-white/20 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white/80" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Others Section */}
          {availableProfiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Others ({availableProfiles.length})
              </h3>
              <div className="space-y-1">
                {availableProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleAddRecipient(profile)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors border border-white/10"
                  >
                    <Avatar className="h-12 w-12 border-2 border-white/10">
                      <AvatarFallback
                        style={{
                          backgroundColor: getAvatarColor({
                            id: profile.id,
                          } as RecipientWithProfile),
                        }}
                        className="text-white font-medium"
                      >
                        {profile.name
                          .split(" ")
                          .map((word: string) => word.charAt(0))
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">
                        {profile.name}
                      </div>
                      <div className="text-sm text-white/60">
                        @{profile.handle}
                      </div>
                    </div>
                    <div className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                      Add
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
