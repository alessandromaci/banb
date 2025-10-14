import {
  supabase,
  type Recipient,
  type Profile,
  type BankDetails,
} from "./supabase";

// Re-export types for convenience
export type { Recipient, Profile };

/**
 * Retrieves all recipients (friends list) for a specific profile.
 * Returns recipients sorted alphabetically by name.
 *
 * @async
 * @function getRecipientsByProfile
 * @param {string} profileId - The UUID of the profile to fetch recipients for
 * @returns {Promise<Recipient[]>} Array of recipient objects sorted by name
 * @throws {Error} If the database query fails
 *
 * @example
 * const friends = await getRecipientsByProfile('user-uuid-123');
 * console.log(`User has ${friends.length} friends`);
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
 * Retrieves a single recipient by their ID.
 *
 * @async
 * @function getRecipient
 * @param {string} recipientId - UUID of the recipient to retrieve
 * @returns {Promise<Recipient | null>} The recipient object or null if not found
 * @throws {Error} If the database query fails (excluding not found errors)
 *
 * @example
 * const recipient = await getRecipient('recipient-uuid-123');
 * if (recipient) console.log(`Found: ${recipient.name}`);
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
 * Creates a new recipient entry (adds to friends list).
 * A recipient can be either an internal app user (via profile_id_link)
 * or an external wallet address (via external_address).
 *
 * @async
 * @function createRecipient
 * @param {Object} data - Recipient data
 * @param {string} data.profile_id - UUID of the profile that owns this recipient
 * @param {string} data.name - Display name for the recipient
 * @param {string} [data.profile_id_link] - UUID linking to another profile if recipient is an app user
 * @param {string} [data.external_address] - External wallet address if recipient is not an app user
 * @param {"active" | "inactive"} [data.status="active"] - Recipient status (default: "active")
 * @returns {Promise<Recipient>} The created recipient object
 * @throws {Error} If the database insert fails
 *
 * @example
 * // Add internal app user as recipient
 * const friend = await createRecipient({
 *   profile_id: 'my-uuid',
 *   name: 'Alice',
 *   profile_id_link: 'alice-uuid'
 * });
 *
 * @example
 * // Add external wallet as recipient
 * const external = await createRecipient({
 *   profile_id: 'my-uuid',
 *   name: 'Bob',
 *   external_address: '0x123...'
 * });

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
 * Updates an existing recipient's information.
 *
 * @async
 * @function updateRecipient
 * @param {string} recipientId - UUID of the recipient to update
 * @param {Partial<Recipient>} updates - Object containing fields to update
 * @returns {Promise<Recipient>} The updated recipient object
 * @throws {Error} If the database update fails
 *
 * @example
 * await updateRecipient('recipient-uuid', { name: 'New Name', status: 'inactive' });
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
 * Deletes a recipient from the database (removes from friends list).
 *
 * @async
 * @function deleteRecipient
 * @param {string} recipientId - UUID of the recipient to delete
 * @returns {Promise<void>}
 * @throws {Error} If the database delete fails
 *
 * @example
 * await deleteRecipient('recipient-uuid-123');
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
 * Searches recipients by name or external address using case-insensitive matching.
 *
 * @async
 * @function searchRecipients
 * @param {string} profileId - UUID of the profile whose recipients to search
 * @param {string} searchTerm - Search term to match against name or external_address
 * @returns {Promise<Recipient[]>} Array of matching recipients sorted by name
 * @throws {Error} If the database query fails
 *
 * @example
 * const results = await searchRecipients('user-uuid', 'alice');
 * // Returns recipients with 'alice' in name or address
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
 * Add a profile as a recipient using the secure API route
 */
export async function addRecipient(
  profileId: string,
  recipientProfileId: string
): Promise<Recipient> {
  const response = await fetch("/api/recipients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      profile_id: profileId,
      recipient_profile_id: recipientProfileId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add recipient");
  }

  const data = await response.json();
  return data.recipient;
}

/**
 * Create a bank recipient directly in the database
 */
export async function createBankRecipient(recipientData: {
  profile_id: string;
  name: string;
  recipient_type: "bank";
  bank_details: BankDetails;
  status: "active";
}): Promise<Recipient> {
  const { data, error } = await supabase
    .from("recipients")
    .insert({
      profile_id: recipientData.profile_id,
      name: recipientData.name,
      recipient_type: recipientData.recipient_type,
      bank_details: recipientData.bank_details,
      status: recipientData.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create bank recipient: ${error.message}`);
  }

  return data;
}

/**
 * Get recipient by ID (alias for getRecipient)
 */
export async function getRecipientById(
  recipientId: string
): Promise<Recipient | null> {
  return getRecipient(recipientId);
}
