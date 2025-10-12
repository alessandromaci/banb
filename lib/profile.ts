import { supabase, type Profile } from "./supabase";

export interface CreateProfileData {
  name: string;
  wallet_address: string;
}

/**
 * Generate a random alphanumeric string with pattern: number, letter, number
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
 * Generate a unique handle from name
 * Format: {first3letters}{3randomchars}banb
 * Example: "John Doe" -> "joh7x2banb"
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
 * Create a new user profile
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
 * Update profile name
 */
export async function updateProfileName(
  profileId: string,
  name: string
): Promise<Profile> {
  console.log(
    "[updateProfileName] Starting update for profile:",
    profileId,
    "with name:",
    name
  );

  // Update the name
  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", profileId)
    .select()
    .single();

  console.log("[updateProfileName] Update result:", {
    updatedProfile,
    updateError,
  });

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`);
  }

  if (!updatedProfile) {
    throw new Error("Profile not found or update failed");
  }

  return updatedProfile;
}

/**
 * Soft delete profile by setting status to inactive
 * This preserves data integrity and transaction history
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
 * Get profile by wallet address
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
 * Get profile by ID
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
