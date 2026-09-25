export function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function currencyToNumber(value: string): number {
  const clean = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3},)/g, "")
    .replace(",", ".");
  const parsed = parseFloat(clean);
  return Number.isNaN(parsed) ? 0 : parsed;
}
