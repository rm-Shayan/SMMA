export function formatCurrency(
  amount: number,
  currency: string = "USD",
  maximumFractionDigits: number = 2
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(maximumFractionDigits)}`;
  }
}

export function formatCredits(credits: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: credits > 100000 ? "compact" : "standard",
  }).format(credits);
}
