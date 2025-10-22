/**
 * @fileoverview Profile management functions for user account operations.
 * Handles profile creation, updates, deletion, and retrieval with unique handle generation.
 */

import { supabase, type Profile } from "./supabase";

/**
 * Data required to create a new profile.
 *
 * @interface CreateProfileData
 * @property {string} name - User's display name
 * @property {string} wallet_address - Ethereum wallet address
 */
export interface CreateProfileData {
  name: string;
  wallet_address: string;
}

/**
 * Generates a random alphanumeric string with pattern: number, letter, number.
 * Used internally for creating unique handle suffixes.
 *
 * @private
 * @param {number} length - Length of string to generate (should be multiple of 3)
 * @returns {string} Random string following n-l-n pattern
 *
 * @example
 * ```typescript
 * generateRandomString(3) // => "7x2" (number, letter, number)
 * generateRandomString(6) // => "3a5b8c" (repeating pattern)
 * ```
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
 * Format: {first3letters}{3randomchars}banb
 * Attempts up to 10 times to find a unique handle.
 *
 * @private
 * @async
 * @param {string} name - User's name to generate handle from
 * @returns {Promise<string>} Unique handle in format "abc7x2banb"
 * @throws {Error} If unique handle cannot be generated after 10 attempts
 *
 * @example
 * ```typescript
 * await generateHandle("John Doe")     // => "joh7x2banb"
 * await generateHandle("Alice")        // => "ali3k9banb"
 * await generateHandle("Bo")           // => "box4m1banb" (padded with 'x')
 * ```
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
 * Creates a new user profile with auto-generated unique handle.
 * Wallet address is stored in lowercase for consistency.
 *
 * @async
 * @param {CreateProfileData} data - Profile creation data
 * @returns {Promise<Profile>} Created profile object
 * @throws {Error} If wallet is already registered
 * @throws {Error} If name is already taken (handle collision)
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const profile = await createProfile({
 *   name: "John Doe",
 *   wallet_address: "0x1234..."
 * });
 * console.log(profile.handle); // => "joh7x2banb"
 * ```
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
 * Note: Handle is not regenerated when name changes.
 *
 * @async
 * @param {string} profileId - UUID of the profile to update
 * @param {string} name - New display name
 * @returns {Promise<Profile>} Updated profile object
 * @throws {Error} If profile not found
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const updated = await updateProfileName(
 *   "550e8400-e29b-41d4-a716-446655440000",
 *   "Jane Smith"
 * );
 * ```
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
 * Soft deletes a profile by setting status to inactive.
 * This preserves data integrity and transaction history.
 * Profile will be excluded from queries that filter by active status.
 *
 * @async
 * @param {string} profileId - UUID of the profile to deactivate
 * @returns {Promise<void>}
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * await deleteProfile("550e8400-e29b-41d4-a716-446655440000");
 * // Profile is now inactive but data remains in database
 * ```
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
 * Retrieves a profile by wallet address (primary wallet only).
 * Wallet address is converted to lowercase for case-insensitive matching.
 * Only returns active profiles (excludes inactive).
 *
 * @async
 * @param {string} wallet_address - Ethereum wallet address
 * @returns {Promise<Profile | null>} Profile if found, null otherwise
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const profile = await getProfileByWallet("0x1234...");
 * if (profile) {
 *   console.log(`Found: ${profile.name}`);
 * } else {
 *   console.log("No profile found for this wallet");
 * }
 * ```
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
 * Retrieves a profile by ANY wallet address (primary or linked account).
 * First checks the primary wallet in profiles table, then checks all linked accounts.
 * This enables multi-wallet authentication where users can log in with any of their wallets.
 *
 * @async
 * @param {string} wallet_address - Ethereum wallet address
 * @returns {Promise<Profile | null>} Profile if found, null otherwise
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * // User has profile with 0x1 as primary, and 0x2 as a linked account
 * const profile1 = await getProfileByAnyWallet("0x1"); // ✅ Found via primary wallet
 * const profile2 = await getProfileByAnyWallet("0x2"); // ✅ Found via linked account
 * // Both return the same profile
 * ```
 */
export async function getProfileByAnyWallet(
  wallet_address: string
): Promise<Profile | null> {
  const normalizedAddress = wallet_address.toLowerCase();

  // 1. First, check if it's a primary wallet
  const primaryProfile = await getProfileByWallet(normalizedAddress);
  if (primaryProfile) {
    console.log("🔑 Found profile via primary wallet");
    return primaryProfile;
  }

  // 2. If not found, check if it's a linked account wallet
  console.log("🔍 Not primary wallet, checking linked accounts...");
  const { data: account, error } = await supabase
    .from("accounts")
    .select("profile_id")
    .eq("address", normalizedAddress)
    .eq("status", "active")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      console.log("❌ No account found for this wallet");
      return null; // Not found
    }
    throw new Error(`Failed to check accounts: ${error.message}`);
  }

  // 3. If account found, get the profile
  if (account?.profile_id) {
    console.log("🔗 Found account, fetching profile...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", account.profile_id)
      .neq("status", "inactive")
      .single();

    if (profileError) {
      throw new Error(`Failed to get profile: ${profileError.message}`);
    }

    console.log("✅ Found profile via linked account");
    return profile;
  }

  return null;
}

/**
 * Retrieves a profile by its UUID.
 * Only returns active profiles (excludes inactive).
 *
 * @async
 * @param {string} id - Profile UUID
 * @returns {Promise<Profile | null>} Profile if found, null otherwise
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const profile = await getProfile("550e8400-e29b-41d4-a716-446655440000");
 * if (profile) {
 *   console.log(`Profile: ${profile.name} (@${profile.handle})`);
 * }
 * ```
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
