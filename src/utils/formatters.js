export function formatCurrency(amount, currency = 'GH₵') {
  const num = Number(amount || 0);
  return `${currency} ${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

