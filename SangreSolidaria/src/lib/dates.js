export const MIN_ACCOUNT_AGE = 18

export function formatDateInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function parseCalendarDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((value || '').trim())
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  const monthText = String(month).padStart(2, '0')
  const dayText = String(day).padStart(2, '0')
  return `${year}-${monthText}-${dayText}`
}

export function parseBirthDate(value) {
  const iso = parseCalendarDate(value)
  if (!iso) return null

  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date > today) return null
  return iso
}

export function formatIsoDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate || ''))
  if (!match) return ''
  return `${match[3]}/${match[2]}/${match[1]}`
}

export function ageFromIso(isoDate, today = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || '')
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  let age = today.getFullYear() - year
  const monthDelta = today.getMonth() + 1 - month
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < day)) {
    age -= 1
  }
  return age
}

export function meetsMinimumAge(isoDate, minimum = MIN_ACCOUNT_AGE) {
  const age = ageFromIso(isoDate)
  return age != null && age >= minimum
}
