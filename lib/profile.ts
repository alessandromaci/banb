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
 * Get a preview of what the handle will look like (for UI display)
 * This doesn't check uniqueness, just shows the format
 */
export function getHandlePreview(name: string): string {
  if (!name || name.trim().length === 0) {
    return "xxx1234.banb";
  }

  const prefix = name
    .toLowerCase()
    .replace(/\s+/g, "")
    .substring(0, 3)
    .padEnd(3, "x");

  return `${prefix}${generateRandomString(3)}banb`;
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

    // Check if handle already exists in database
    const { data, error } = await supabase
      .from("profiles")
      .select("handle")
      .eq("handle", handle)
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
      balance: "0", // Initialize with 0 balance
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
 * Get profile by wallet address
 */
export async function getProfileByWallet(
  wallet_address: string
): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", wallet_address.toLowerCase())
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
 * Update profile balance
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
