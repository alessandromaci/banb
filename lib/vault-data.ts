/**
 * Vault data configuration for investment information pages.
 * This file contains all vault-specific data that can be easily updated.
 */

export interface VaultData {
  id: string;
  name: string;
  description: string;
  vault_address: string;
  apr: number;
  type: "morpho_vault" | "savings_account";
  totalDeposits: number;
  liquidity: number;
  apy: number;
  strategy: Array<{
    market: string;
    exposure: string;
    allocation: string;
  }>;
  risks: {
    curatorTVL: string;
    owner: string;
    timelock: string;
    deploymentDate: string;
    curator: string;
    version: string;
    disclosure: string;
  };
}

/**
 * Vault data configuration for all available investment vaults.
 * Update this data to reflect current vault information.
 */
export const VAULT_DATA: VaultData[] = [
  {
    id: "morpho-vault-1",
    name: "Spark USDC Vault",
    description:
      "Spark blue-chip USDC vault. Lending against the lowest risk crypto and real-world assets (RWAs). Curated by SparkDAO which allocates billions in assets across all of DeFi.",
    vault_address: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
    apr: 6.55,
    type: "morpho_vault",
    totalDeposits: 1250000000, // $1.25B
    liquidity: 650710000, // $650.71M
    apy: 6.55,
    strategy: [
      { market: "USDC Lending", exposure: "45%", allocation: "$292.82M" },
      { market: "ETH Collateral", exposure: "30%", allocation: "$195.21M" },
      { market: "BTC Collateral", exposure: "15%", allocation: "$97.61M" },
      { market: "RWA Assets", exposure: "10%", allocation: "$65.07M" },
    ],
    risks: {
      curatorTVL: "$650.71M",
      owner: "0xF93B...F579",
      timelock: "1D / No Address",
      deploymentDate: "2024-12-30",
      curator: "No Address",
      version: "v1.1",
      disclosure: "Curator has not submitted a Disclosure.",
    },
  },
  {
    id: "morpho-vault-2",
    name: "Steakhouse USDC Vault",
    description:
      "The Steakhouse USDC vault aims to optimize yields by lending USDC against blue chip crypto and real world asset (RWA) collateral markets, depending on market conditions.",
    vault_address: "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183",
    apr: 5.59,
    type: "morpho_vault",
    totalDeposits: 850000000, // $850M
    liquidity: 420000000, // $420M
    apy: 5.59,
    strategy: [
      { market: "USDC Lending", exposure: "50%", allocation: "$210.00M" },
      { market: "ETH Collateral", exposure: "25%", allocation: "$105.00M" },
      { market: "BTC Collateral", exposure: "15%", allocation: "$63.00M" },
      { market: "RWA Assets", exposure: "10%", allocation: "$42.00M" },
    ],
    risks: {
      curatorTVL: "$420.00M",
      owner: "0x8A25...39AB",
      timelock: "7D / Guardian Active",
      deploymentDate: "2024-11-15",
      curator: "Steakhouse Labs",
      version: "v1.1",
      disclosure: "Full risk disclosure available from Steakhouse Labs.",
    },
  },
  {
    id: "morpho-vault-3",
    name: "Seamless USDC Vault",
    description:
      "The Seamless USDC Vault curated by Gauntlet is intended to optimize risk-adjusted yield across high-demand collateral markets on Base.",
    vault_address: "0x616a4E1db48e22028f6bbf20444Cd3b8e3273738",
    apr: 6.99,
    type: "morpho_vault",
    totalDeposits: 950000000, // $950M
    liquidity: 580000000, // $580M
    apy: 6.99,
    strategy: [
      { market: "USDC Lending", exposure: "40%", allocation: "$232.00M" },
      { market: "ETH Collateral", exposure: "35%", allocation: "$203.00M" },
      { market: "BTC Collateral", exposure: "20%", allocation: "$116.00M" },
      { market: "RWA Assets", exposure: "5%", allocation: "$29.00M" },
    ],
    risks: {
      curatorTVL: "$580.00M",
      owner: "0x9B47...2C8D",
      timelock: "3D / Guardian Active",
      deploymentDate: "2024-10-20",
      curator: "Gauntlet",
      version: "v1.1",
      disclosure: "Comprehensive risk assessment by Gauntlet available.",
    },
  },
];

/**
 * Get vault data by vault address.
 *
 * @param {string} vaultAddress - The vault contract address
 * @returns {VaultData | undefined} Vault data or undefined if not found
 */
export function getVaultData(vaultAddress: string): VaultData | undefined {
  return VAULT_DATA.find(
    (vault) => vault.vault_address.toLowerCase() === vaultAddress.toLowerCase()
  );
}

/**
 * Get all vault data.
 *
 * @returns {VaultData[]} Array of all vault data
 */
export function getAllVaultData(): VaultData[] {
  return VAULT_DATA;
}
