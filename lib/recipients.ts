import { supabase, type Recipient, type Profile } from "./supabase";

// Re-export types for convenience
export type { Recipient, Profile };

/**
 * Get all recipients (friends list) for a profile
 * Profile-centric: Gets recipients linked to this profile
 */
export async function getRecipientsByProfile(
  profileId: string
): Promise<Recipient[]> {
  const { data, error } = await supabase
    .from("recipients")
    .select("*")
    .eq("profile_id", profileId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch recipients: ${error.message}`);
  }

  return data || [];
}

/**
 * Get recipient by ID
 */
export async function getRecipient(
  recipientId: string
): Promise<Recipient | null> {
  const { data, error } = await supabase
    .from("recipients")
    .select("*")
    .eq("id", recipientId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get recipient: ${error.message}`);
  }

  return data;
}

/**
 * Create a new recipient (add to friends list)
 */
export async function createRecipient(data: {
  profile_id: string;
  name: string;
  profile_id_link?: string; // If recipient is an app user
  external_address?: string; // If recipient is external wallet
  status?: "active" | "inactive";
}): Promise<Recipient> {
  const recipientData: {
    profile_id: string;
    name: string;
    status: "active" | "inactive";
    profile_id_link?: string;
    external_address?: string;
  } = {
    profile_id: data.profile_id, // Owner of this recipient entry
    name: data.name,
    status: data.status || "active",
  };

  // Either link to a profile or external address, not both
  if (data.profile_id_link) {
    recipientData.profile_id_link = data.profile_id_link;
  } else if (data.external_address) {
    recipientData.external_address = data.external_address;
  }

  const { data: recipient, error } = await supabase
    .from("recipients")
    .insert(recipientData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create recipient: ${error.message}`);
  }

  return recipient;
}

/**
 * Update recipient
 */
export async function updateRecipient(
  recipientId: string,
  updates: Partial<Recipient>
): Promise<Recipient> {
  const { data, error } = await supabase
    .from("recipients")
    .update(updates)
    .eq("id", recipientId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update recipient: ${error.message}`);
  }

  return data;
}

/**
 * Delete recipient (remove from friends list)
 */
export async function deleteRecipient(recipientId: string): Promise<void> {
  const { error } = await supabase
    .from("recipients")
    .delete()
    .eq("id", recipientId);

  if (error) {
    throw new Error(`Failed to delete recipient: ${error.message}`);
  }
}

/**
 * Search recipients by name, handle, or address
 */
export async function searchRecipients(
  profileId: string,
  searchTerm: string
): Promise<Recipient[]> {
  // First, search in recipients table
  const { data: recipientsData, error: recipientsError } = await supabase
    .from("recipients")
    .select("*")
    .eq("profile_id", profileId)
    .or(`name.ilike.%${searchTerm}%,external_address.ilike.%${searchTerm}%`)
    .order("name", { ascending: true });

  if (recipientsError) {
    throw new Error(`Failed to search recipients: ${recipientsError.message}`);
  }

  // Then, search in profiles table for handles and names
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, handle")
    .or(`name.ilike.%${searchTerm}%,handle.ilike.%${searchTerm}%`)
    .neq("status", "inactive");

  if (profilesError) {
    throw new Error(`Failed to search profiles: ${profilesError.message}`);
  }

  // Find recipients that link to matching profiles
  const { data: linkedRecipients, error: linkedError } = await supabase
    .from("recipients")
    .select("*")
    .eq("profile_id", profileId)
    .in("profile_id_link", profilesData?.map((p) => p.id) || []);

  if (linkedError) {
    throw new Error(
      `Failed to search linked recipients: ${linkedError.message}`
    );
  }

  // Combine and deduplicate results
  const allRecipients = [
    ...(recipientsData || []),
    ...(linkedRecipients || []),
  ];
  const uniqueRecipients = allRecipients.filter(
    (recipient, index, self) =>
      index === self.findIndex((r) => r.id === recipient.id)
  );

  return uniqueRecipients;
}

/**
 * Search for profiles that match the search term but aren't in recipients yet
 * This helps users discover new people to add to their recipients list
 */
export async function searchAvailableProfiles(
  profileId: string,
  searchTerm: string
): Promise<Profile[]> {
  // Get current recipient profile IDs to exclude them
  const { data: recipientsData } = await supabase
    .from("recipients")
    .select("profile_id_link")
    .eq("profile_id", profileId)
    .not("profile_id_link", "is", null);

  const existingProfileIds =
    recipientsData?.map((r) => r.profile_id_link) || [];

  // Search profiles that match the term but aren't already recipients
  let query = supabase
    .from("profiles")
    .select("*")
    .or(`name.ilike.%${searchTerm}%,handle.ilike.%${searchTerm}%`)
    .neq("status", "inactive")
    .neq("id", profileId); // Don't include the user themselves

  // Exclude existing profile IDs if any
  if (existingProfileIds.length > 0) {
    query = query.not("id", "in", `(${existingProfileIds.join(",")})`);
  }

  const { data: profilesData, error } = await query.limit(3); // Limit to 3 results

  if (error) {
    throw new Error(`Failed to search available profiles: ${error.message}`);
  }

  return profilesData || [];
}

/**
 * Add a profile as a recipient
 */
export async function addRecipient(
  profileId: string,
  recipientProfileId: string
): Promise<Recipient> {
  // First, get the recipient's profile details
  const { data: recipientProfile, error: profileError } = await supabase
    .from("profiles")
    .select("name, handle")
    .eq("id", recipientProfileId)
    .single();

  if (profileError) {
    throw new Error(`Failed to get recipient profile: ${profileError.message}`);
  }

  console.log("📝 Profile ID:", profileId);
  console.log("👤 Recipient Profile ID:", recipientProfileId);

  const { data, error } = await supabase
    .from("recipients")
    .insert({
      profile_id: profileId,
      profile_id_link: recipientProfileId,
      name: recipientProfile.name, // Use the actual name from the profile
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("RLS Error details:", error);
    throw new Error(`Failed to add recipient: ${error.message}`);
  }

  return data;
}
