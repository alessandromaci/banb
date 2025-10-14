/**
 * @fileoverview Recipient management functions for handling payment recipients.
 * Supports both crypto recipients (app users or external wallets) and bank recipients.
 * Recipients represent a user's "friends list" or saved payment destinations.
 */

import {
  supabase,
  type Recipient,
  type Profile,
  type BankDetails,
} from "./supabase";

// Re-export types for convenience
export type { Recipient, Profile };

/**
 * Retrieves all recipients (friends list) for a profile.
 * Returns recipients ordered alphabetically by name.
 * 
 * @async
 * @param {string} profileId - UUID of the profile owner
 * @returns {Promise<Recipient[]>} Array of recipients, empty if none found
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * const recipients = await getRecipientsByProfile(currentUser.id);
 * console.log(`You have ${recipients.length} saved recipients`);
 * ```
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
 * Retrieves a single recipient by ID.
 * 
 * @async
 * @param {string} recipientId - UUID of the recipient
 * @returns {Promise<Recipient | null>} Recipient if found, null otherwise
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * const recipient = await getRecipient("550e8400-e29b-41d4-a716-446655440000");
 * if (recipient) {
 *   console.log(`Sending to: ${recipient.name}`);
 * }
 * ```
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
 * Retrieves a single recipient by ID.
 * Alias for getRecipient() for backwards compatibility.
 * 
 * @async
 * @param {string} recipientId - UUID of the recipient
 * @returns {Promise<Recipient | null>} Recipient if found, null otherwise
 * @throws {Error} If database operation fails
 */
export async function getRecipientById(
  recipientId: string
): Promise<Recipient | null> {
  return getRecipient(recipientId);
}

/**
 * Creates a new recipient (adds to friends list).
 * Recipient can be either an app user (via profile_id_link) or external wallet.
 * Only one of profile_id_link or external_address should be provided.
 * 
 * @async
 * @param {Object} data - Recipient creation data
 * @param {string} data.profile_id - Owner's profile ID (who is adding this recipient)
 * @param {string} data.name - Display name for the recipient
 * @param {string} [data.profile_id_link] - Profile ID if recipient is an app user
 * @param {string} [data.external_address] - Wallet address if recipient is external
 * @param {"active" | "inactive"} [data.status="active"] - Initial status
 * @returns {Promise<Recipient>} Created recipient object
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * // Add an app user as recipient
 * const friend = await createRecipient({
 *   profile_id: currentUser.id,
 *   name: "Alice",
 *   profile_id_link: "550e8400-e29b-41d4-a716-446655440000"
 * });
 * 
 * // Add external wallet as recipient
 * const external = await createRecipient({
 *   profile_id: currentUser.id,
 *   name: "Bob's Wallet",
 *   external_address: "0x1234..."
 * });
 * ```
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
 * Updates an existing recipient with partial data.
 * Only provided fields will be updated.
 * 
 * @async
 * @param {string} recipientId - UUID of the recipient to update
 * @param {Partial<Recipient>} updates - Fields to update
 * @returns {Promise<Recipient>} Updated recipient object
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * // Update recipient name
 * const updated = await updateRecipient(recipientId, {
 *   name: "Alice Smith"
 * });
 * 
 * // Deactivate recipient
 * await updateRecipient(recipientId, {
 *   status: "inactive"
 * });
 * ```
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
 * Permanently deletes a recipient (removes from friends list).
 * This is a hard delete - consider using updateRecipient to set status="inactive" instead.
 * 
 * @async
 * @param {string} recipientId - UUID of the recipient to delete
 * @returns {Promise<void>}
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * await deleteRecipient("550e8400-e29b-41d4-a716-446655440000");
 * ```
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
 * Searches existing recipients by name, handle, or address.
 * Performs case-insensitive search across recipient names, external addresses,
 * and linked profile handles/names.
 * 
 * @async
 * @param {string} profileId - Owner's profile ID
 * @param {string} searchTerm - Search query string
 * @returns {Promise<Recipient[]>} Matching recipients, deduplicated
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * const results = await searchRecipients(currentUser.id, "alice");
 * // Returns recipients with "alice" in name, handle, or address
 * ```
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
 * Searches for profiles that match the search term but aren't in recipients yet.
 * This helps users discover new people to add to their recipients list.
 * Excludes the current user and existing recipients. Limited to 3 results.
 * 
 * @async
 * @param {string} profileId - Current user's profile ID
 * @param {string} searchTerm - Search query string
 * @returns {Promise<Profile[]>} Available profiles to add, max 3 results
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * const available = await searchAvailableProfiles(currentUser.id, "john");
 * // Returns up to 3 profiles with "john" in name/handle that aren't already recipients
 * ```
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
 * Adds a profile as a recipient using the secure API route.
 * This is the preferred method for adding app users as recipients
 * as it uses server-side validation and proper data fetching.
 * 
 * @async
 * @param {string} profileId - Current user's profile ID
 * @param {string} recipientProfileId - Profile ID of user to add as recipient
 * @returns {Promise<Recipient>} Created recipient object
 * @throws {Error} If API request fails or recipient already exists
 * 
 * @example
 * ```typescript
 * const recipient = await addRecipient(
 *   currentUser.id,
 *   "550e8400-e29b-41d4-a716-446655440000"
 * );
 * console.log(`Added ${recipient.name} to recipients`);
 * ```
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
 * Creates a bank recipient directly in the database.
 * Used for adding bank account recipients with IBAN or routing/account details.
 * 
 * @async
 * @param {Object} recipientData - Bank recipient data
 * @param {string} recipientData.profile_id - Owner's profile ID
 * @param {string} recipientData.name - Display name for the bank account
 * @param {"bank"} recipientData.recipient_type - Must be "bank"
 * @param {BankDetails} recipientData.bank_details - Bank account information
 * @param {"active"} recipientData.status - Must be "active"
 * @returns {Promise<Recipient>} Created bank recipient
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * const bankRecipient = await createBankRecipient({
 *   profile_id: currentUser.id,
 *   name: "My Savings Account",
 *   recipient_type: "bank",
 *   bank_details: {
 *     iban: "GB29NWBK60161331926819",
 *     country: "GB",
 *     currency: "GBP",
 *     bank_name: "NatWest"
 *   },
 *   status: "active"
 * });
 * ```
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
