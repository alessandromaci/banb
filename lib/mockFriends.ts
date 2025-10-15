/**
 * @fileoverview Mock friend data for development and testing.
 * Provides sample friend objects for UI prototyping.
 */

/**
 * Friend object structure for mock data.
 * 
 * @interface Friend
 * @property {number} id - Unique identifier
 * @property {string} name - Friend's display name
 * @property {string} username - Friend's username with @ prefix
 * @property {string} currency - Preferred currency (e.g., "EUR", "USD")
 * @property {string} [avatar] - Optional avatar image URL
 * @property {string} initials - Initials for avatar fallback
 * @property {string} color - Hex color for avatar background
 */
export interface Friend {
  id: number;
  name: string;
  username: string;
  currency: string;
  avatar?: string;
  initials: string;
  color: string;
}

/**
 * Mock friend data for development and testing.
 * Contains sample friends with various currencies and avatar colors.
 * 
 * @constant {Friend[]}
 */
export const friends: Friend[] = [
  {
    id: 1,
    name: "Alessandro",
    username: "@alerex",
    currency: "EUR",
    initials: "A",
    color: "#6B7280",
  },
  {
    id: 2,
    name: "Nik",
    username: "@nik",
    currency: "EUR",
    initials: "N",
    color: "#8B5CF6",
  },
  {
    id: 3,
    name: "Maxi",
    username: "@maxieth",
    currency: "EUR",
    initials: "M",
    color: "#D97706",
  },
];
