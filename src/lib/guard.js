/**
 * Guard custody logic.
 *
 * Alternating weekly: custody switches every Tuesday (default).
 * A "guard week" runs Tuesday → Monday.
 */

/**
 * Get the start of the guard week for a given date.
 * Guard week starts on switchDay (0=Sun, 1=Mon, 2=Tue...).
 */
function getGuardWeekStart(date, switchDay = 2) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = (day - switchDay + 7) % 7
  d.setDate(d.getDate() - diff)
  return d
}

/**
 * Returns 'mother' | 'father' for any given date based on the guard pattern.
 *
 * @param {Date|string} date - The date to check
 * @param {object} pattern - { switch_day, reference_date, reference_guardian }
 * @returns {'mother'|'father'|null}
 */
export function getGuardForDate(date, pattern) {
  if (!pattern) return null

  const { switch_day = 2, reference_date, reference_guardian = 'mother' } = pattern

  const refWeekStart = getGuardWeekStart(new Date(reference_date), switch_day)
  const targetWeekStart = getGuardWeekStart(new Date(date), switch_day)

  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
  const weeksDiff = Math.round((targetWeekStart - refWeekStart) / MS_PER_WEEK)

  const isReferenceWeek = weeksDiff % 2 === 0

  if (isReferenceWeek) return reference_guardian
  return reference_guardian === 'mother' ? 'father' : 'mother'
}

/**
 * Get all guard periods (weeks) for a given month, including swaps applied.
 * Returns array of { start, end, guardian } objects.
 */
export function getGuardPeriodsForMonth(year, month, pattern, swaps = []) {
  if (!pattern) return []

  const periods = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Get the guard week start that covers the first day of the month
  let current = getGuardWeekStart(firstDay, pattern.switch_day ?? 2)

  while (current <= lastDay) {
    const weekEnd = new Date(current)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const guardian = getGuardForDate(current, pattern)

    // Apply accepted swaps
    const effectiveGuardian = getSwappedGuardian(current, guardian, swaps)

    periods.push({
      start: new Date(current),
      end: weekEnd,
      guardian: effectiveGuardian,
    })

    current = new Date(current)
    current.setDate(current.getDate() + 7)
  }

  return periods
}

function getSwappedGuardian(weekStart, originalGuardian, swaps) {
  const weekStartTime = weekStart.getTime()
  const swap = swaps.find(s => {
    if (s.status !== 'accepted') return false
    const swapDate = new Date(s.requested_date)
    const swapWeekStart = getGuardWeekStart(swapDate, 2)
    return swapWeekStart.getTime() === weekStartTime
  })
  if (!swap) return originalGuardian
  return originalGuardian === 'mother' ? 'father' : 'mother'
}

/**
 * Get guardian for a specific date, respecting swaps.
 */
export function getGuardForDateWithSwaps(date, pattern, swaps = []) {
  const baseGuardian = getGuardForDate(date, pattern)
  if (!baseGuardian) return null

  const weekStart = getGuardWeekStart(new Date(date), pattern.switch_day ?? 2)
  return getSwappedGuardian(weekStart, baseGuardian, swaps)
}

export const GUARDIAN_LABELS = {
  mother: 'Mamãe',
  father: 'Papai',
}

export const GUARDIAN_COLORS = {
  mother: { bg: 'bg-mom', light: 'bg-mom-light', text: 'text-mom-dark', hex: '#3b82f6', lightHex: '#dbeafe' },
  father: { bg: 'bg-dad', light: 'bg-dad-light', text: 'text-dad-dark', hex: '#10b981', lightHex: '#d1fae5' },
}
