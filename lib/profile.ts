import { supabase, type Profile } from "./supabase";

export interface CreateProfileData {
  name: string;
  wallet_address: string;
}

/**
 * Generate a unique handle from name
 * Format: {name}.banb (lowercase, no spaces)
 */
function generateHandle(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, "")}.banb`;
}

/**
 * Create a new user profile
 */
export async function createProfile(data: CreateProfileData): Promise<Profile> {
  const handle = generateHandle(data.name);

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
