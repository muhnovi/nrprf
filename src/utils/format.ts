import { formatUnits } from 'viem'

export const formatAndRoundBalance = (
  balance: bigint | string,
  decimals: number | string = 18,
  precision: number = 4,
) => {
  if (!balance) return '0'

  const formattedBalance = formatUnits(BigInt(balance), Number(decimals))
  const roundedBalance = Number(formattedBalance).toFixed(precision)
  return roundedBalance
}

export const formatEthBalance = (balance: bigint | string) => {
  if (!balance) return '0'

  const formattedBalance = formatUnits(BigInt(balance), 18)
  const numValue = Number(formattedBalance)

  // Smart decimal places based on amount size
  if (numValue >= 1) {
    // For amounts >= 1 ETH, show 4 decimal places
    return numValue.toFixed(4)
  } else if (numValue >= 0.001) {
    // For amounts >= 0.001 ETH, show 6 decimal places
    return numValue.toFixed(6)
  } else if (numValue > 0) {
    // For very small amounts, show up to 8 decimal places but remove trailing zeros
    return numValue.toFixed(8).replace(/\.?0+$/, '')
  }

  return '0'
}

export const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) return '0'

  const absNum = Math.abs(num)

  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B'
  }
  if (absNum >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M'
  }

  if (absNum < 1) {
    return num.toPrecision(4)
  }

  return num.toLocaleString('en-US', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  })
}
