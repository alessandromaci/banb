import { supabase, type Profile } from "./supabase";

/**
 * Data required to create a new user profile.
 *
 * @interface CreateProfileData
 * @property {string} name - User's display name
 * @property {string} wallet_address - Blockchain wallet address
 */
export interface CreateProfileData {
  name: string;
  wallet_address: string;
}

/**
 * Generates a random alphanumeric string following the pattern: number, letter, number.
 * Used internally for creating unique handles.
 *
 * @private
 * @function generateRandomString
 * @param {number} length - Length of the string to generate
 * @returns {string} Random string following the n-l-n pattern
 *
 * @example
 * generateRandomString(3) // Returns: "7x2" or "3a9"
 */
function generateRandomString(length: number): string {
  const numbers = "0123456789";
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let result = "";

  for (let i = 0; i < length; i++) {
    // Pattern: number, letter, number
    if (i % 3 === 0) {
      // First position: number
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    } else if (i % 3 === 1) {
      // Second position: letter
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    } else {
      // Third position: number
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
  }
  return result;
}

/**
 * Generates a unique handle from a user's name.
 * Attempts up to 10 times to create a unique handle by checking against the database.
 *
 * Handle format: {first3letters}{3randomchars}banb
 *
 * @private
 * @async
 * @function generateHandle
 * @param {string} name - User's name to generate handle from
 * @returns {Promise<string>} Unique handle string
 * @throws {Error} If unable to generate unique handle after 10 attempts
 *
 * @example
 * await generateHandle("John Doe") // Returns: "joh7x2banb"
 * await generateHandle("Alice") // Returns: "ali3a9banb"
 */
async function generateHandle(name: string): Promise<string> {
  // Get first 3 letters (lowercase, no spaces)
  const prefix = name
    .toLowerCase()
    .replace(/\s+/g, "")
    .substring(0, 3)
    .padEnd(3, "x"); // Pad with 'x' if name is less than 3 chars

  // Try to generate a unique handle (max 10 attempts)
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomPart = generateRandomString(3);
    const handle = `${prefix}${randomPart}banb`;

    // Check if handle already exists in active profiles
    const { data, error } = await supabase
      .from("profiles")
      .select("handle")
      .eq("handle", handle)
      .neq("status", "inactive") // Exclude inactive profiles
      .single();

    // If no data found (error code PGRST116), handle is unique
    if (error?.code === "PGRST116") {
      return handle;
    }

    // If other error, throw it
    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to check handle uniqueness: ${error.message}`);
    }

    // If data exists, try again with new random chars
  }

  // If we couldn't generate unique handle after 10 attempts, throw error
  throw new Error("Could not generate unique handle. Please try again.");
}

/**
 * Creates a new user profile in the database.
 * Automatically generates a unique handle and initializes balance to 0.
 *
 * @async
 * @function createProfile
 * @param {CreateProfileData} data - Profile creation data
 * @param {string} data.name - User's display name
 * @param {string} data.wallet_address - Blockchain wallet address
 * @returns {Promise<Profile>} The created profile object
 * @throws {Error} If wallet is already registered, name is taken, or database insert fails
 *
 * @example
 * const profile = await createProfile({
 *   name: 'John Doe',
 *   wallet_address: '0x123abc...'
 * });
 */
export async function createProfile(data: CreateProfileData): Promise<Profile> {
  // Generate a unique handle
  const handle = await generateHandle(data.name);

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      name: data.name,
      handle: handle,
      wallet_address: data.wallet_address.toLowerCase(),
    })
    .select()
    .single();

  if (error) {
    // Check for unique constraint violations
    if (error.code === "23505") {
      if (error.message.includes("wallet_address")) {
        throw new Error("This wallet is already registered");
      }
      if (error.message.includes("handle")) {
        throw new Error("This name is already taken. Please choose another.");
      }
    }
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return profile;
}

/**
 * Updates a profile's display name.
 *
 * @async
 * @function updateProfileName
 * @param {string} profileId - UUID of the profile to update
 * @param {string} name - New display name
 * @returns {Promise<Profile>} The updated profile object
 * @throws {Error} If the database update fails
 *
 * @example
 * const updated = await updateProfileName('user-uuid', 'Jane Smith');
 */
export async function updateProfileName(
  profileId: string,
  name: string
): Promise<Profile> {

  // Update the name
  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", profileId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`);
  }

  if (!updatedProfile) {
    throw new Error("Profile not found or update failed");
  }

  return updatedProfile;
}

/**
 * Soft Delete by by setting profile status to inactive.
 * This preserves data integrity and transaction history.
 *
 * @async
 * @function deleteProfile
 * @param {string} profileId - UUID of the profile to delete
 * @returns {Promise<void>}
 * @throws {Error} If the database delete fails
 *
 * @example
 * await deleteProfile('user-uuid-123');
 */
export async function deleteProfile(profileId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ status: "inactive" })
    .eq("id", profileId);

  if (error) {
    throw new Error(`Failed to deactivate profile: ${error.message}`);
  }
}

/**
 * Retrieves a profile by wallet address.
 * Wallet address comparison is case-insensitive.
 *
 * @async
 * @function getProfileByWallet
 * @param {string} wallet_address - Blockchain wallet address to search for
 * @returns {Promise<Profile | null>} The profile object or null if not found
 * @throws {Error} If the database query fails (excluding not found errors)
 *
 * @example
 * const profile = await getProfileByWallet('0x123abc...');
 * if (profile) console.log(`Found user: ${profile.name}`);
 */
export async function getProfileByWallet(
  wallet_address: string
): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", wallet_address.toLowerCase())
    .neq("status", "inactive") // Exclude inactive profiles
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get profile: ${error.message}`);
  }

  return profile;
}

/**
 * Retrieves a profile by its unique ID.
 *
 * @async
 * @function getProfile
 * @param {string} id - UUID of the profile to retrieve
 * @returns {Promise<Profile | null>} The profile object or null if not found
 * @throws {Error} If the database query fails (excluding not found errors)
 *
 * @example
 * const profile = await getProfile('user-uuid-123');
 */
export async function getProfile(id: string): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .neq("status", "inactive") // Exclude inactive profiles
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get profile: ${error.message}`);
  }

  return profile;
}

/**
 * Updates a profile's account balance.
 *
 * @async
 * @function updateBalance
 * @param {string} id - UUID of the profile to update
 * @param {string} balance - New balance as string (e.g., "100.50")
 * @returns {Promise<Profile>} The updated profile object
 * @throws {Error} If the database update fails
 *
 * @example
 * const updated = await updateBalance('user-uuid', '1250.75');
 */
export async function updateBalance(
  id: string,
  balance: string
): Promise<Profile> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ balance })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update balance: ${error.message}`);
  }

  return profile;
}
