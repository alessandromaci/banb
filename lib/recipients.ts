import { supabase, type Recipient } from "./supabase";

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
 */
export async function searchRecipients(
  profileId: string,
  searchTerm: string
): Promise<Recipient[]> {
  const { data, error } = await supabase
    .from("recipients")
    .select("*")
    .eq("profile_id", profileId)
    .or(`name.ilike.%${searchTerm}%,external_address.ilike.%${searchTerm}%`)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to search recipients: ${error.message}`);
  }

  return data || [];
}
