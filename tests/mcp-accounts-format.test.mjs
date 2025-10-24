/**
 * MCP get_accounts formatting tests (spec-level)
 * Ensures masking and currency formatting expectations are met.
 */

import assert from 'node:assert/strict';

function formatAccounts(accounts) {
  return (accounts || []).map((acc) => ({
    id: acc.id,
    name: acc.name,
    type: acc.type,
    address: acc.address ? `${acc.address.slice(0, 6)}...${acc.address.slice(-4)}` : "",
    network: acc.network,
    balance: `$${parseFloat(acc.balance || "0").toFixed(2)}`,
    is_primary: !!acc.is_primary,
    status: acc.status,
  }));
}

export async function testGetAccountsMaskingAndFormatting() {
  const input = [
    {
      id: 'a1',
      name: 'Main Account',
      type: 'spending',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      network: 'base',
      balance: '123.4567',
      is_primary: true,
      status: 'active',
    },
    {
      id: 'a2',
      name: 'Vault',
      type: 'investment',
      address: '0x8ba1f109551bD432803012645Hac136c22C57592',
      network: 'base',
      balance: null,
      is_primary: false,
      status: 'inactive',
    },
  ];

  const out = formatAccounts(input);

  assert.equal(out.length, 2);

  // First account
  assert.equal(out[0].id, 'a1');
  assert.equal(out[0].name, 'Main Account');
  assert.equal(out[0].type, 'spending');
  assert.equal(out[0].address.startsWith('0x742d3'), true);
  assert.equal(out[0].address.endsWith('0bEb'), true);
  assert.equal(out[0].address.includes('...'), true);
  assert.equal(out[0].network, 'base');
  assert.equal(out[0].balance, '$123.46');
  assert.equal(out[0].is_primary, true);
  assert.equal(out[0].status, 'active');

  // Second account
  assert.equal(out[1].id, 'a2');
  assert.equal(out[1].name, 'Vault');
  assert.equal(out[1].type, 'investment');
  assert.equal(out[1].address.startsWith('0x8ba1'), true);
  assert.equal(out[1].address.endsWith('7592'), true);
  assert.equal(out[1].address.includes('...'), true);
  assert.equal(out[1].network, 'base');
  assert.equal(out[1].balance, '$0.00');
  assert.equal(out[1].is_primary, false);
  assert.equal(out[1].status, 'inactive');
}
