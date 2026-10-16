export function formatCurrency(value) {
  const safeValue = Number(value) || 0
  const formatted = safeValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return `RWF ${formatted}`
}
