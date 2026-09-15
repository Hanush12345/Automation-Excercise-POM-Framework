/** Converts "Rs. 500" -> 500. Throws on unparseable input so failures surface as assertions, not NaN. */
export function toAmount(priceText: string | null): number {
  if (!priceText) throw new Error('Cannot parse an empty price string.');
  const match = priceText.replace(/,/g, '').match(/\d+(\.\d+)?/);
  if (!match) throw new Error(`No numeric value found in price string: "${priceText}"`);
  return Number(match[0]);
}

export function expectedLineTotal(unitPrice: string, quantity: number): number {
  return toAmount(unitPrice) * quantity;
}
