/**
 * AI MCP fallback Italian intent detection tests (spec-level)
 * Validates that Italian keywords would trigger corresponding sections.
 */

import assert from 'node:assert/strict';

function detectItalianIntents(message) {
  const lowerMessage = message.toLowerCase();
  const itTransazioni = lowerMessage.includes("transazioni") || lowerMessage.includes("storico");
  const itConti = lowerMessage.includes("conti") || lowerMessage.includes("account") || lowerMessage.includes("collegati");
  const itSaldi = lowerMessage.includes("saldo") || lowerMessage.includes("ammontare") || lowerMessage.includes("disponibile");
  const itInvestimenti = lowerMessage.includes("investimenti") || lowerMessage.includes("investimento") || lowerMessage.includes("tipologie");
  return { itTransazioni, itConti, itSaldi, itInvestimenti };
}

export async function testItalianCombinedRequestDetection() {
  const msg = "gli dovremmo dare la lista delle transazioni che il profilo ha effettuato via banb, la lista degli account collegati al profilo, l'ammontare di quanto ciascun account ha, e la tipologia di investimenti a disposizione";
  const flags = detectItalianIntents(msg);
  assert.equal(flags.itTransazioni, true);
  assert.equal(flags.itConti, true);
  assert.equal(flags.itSaldi, true);
  assert.equal(flags.itInvestimenti, true);
}

export async function testPartialIntentDetection() {
  const msg = "Mostra il saldo e i conti collegati";
  const flags = detectItalianIntents(msg);
  assert.equal(flags.itTransazioni, false);
  assert.equal(flags.itConti, true);
  assert.equal(flags.itSaldi, true);
  assert.equal(flags.itInvestimenti, false);
}
