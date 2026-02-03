// Date and time utilities for scheduling

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
]

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${minutes} ${period}`
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

export function getEndTime(startTime: string): string {
  const index = TIME_SLOTS.indexOf(startTime)
  if (index === -1 || index === TIME_SLOTS.length - 1) {
    return startTime
  }
  return TIME_SLOTS[index + 1]
}

export function createTimeSlot(date: Date, time: string) {
  const [hours, minutes] = time.split(':')
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  // Format with timezone suffix for PostgreSQL timestamptz
  const startTimeStr = `${year}-${month}-${day} ${hours}:${minutes}:00+00`
  
  const endMinutes = parseInt(minutes) + 30
  const endHours = endMinutes >= 60 ? parseInt(hours) + 1 : parseInt(hours)
  const finalMinutes = endMinutes >= 60 ? '00' : '30'
  const endHoursStr = String(endHours).padStart(2, '0')
  
  const endTimeStr = `${year}-${month}-${day} ${endHoursStr}:${finalMinutes}:00+00`
  
  return {
    start_time: startTimeStr,
    end_time: endTimeStr
  }
}

export function isConsecutiveSlot(slot1Time: string, slot2Time: string): boolean {
  const index1 = TIME_SLOTS.indexOf(slot1Time)
  const index2 = TIME_SLOTS.indexOf(slot2Time)
  return Math.abs(index1 - index2) === 1
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []
  
  for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
    days.push(new Date(date))
  }
  
  return days
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function getMonthYearString(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
}

export function isWithinNextMonth(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const oneMonthFromNow = new Date(today)
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)
  
  return date >= today && date <= oneMonthFromNow
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Extract time (HH:MM) from any timestamp format
export function extractTime(timestamp: string): string {
  // Handles formats like:
  // "2026-02-22 09:30:00+00"
  // "2026-02-22T09:30:00"
  const match = timestamp.match(/(\d{2}):(\d{2})/)
  if (match) {
    return `${match[1]}:${match[2]}`
  }
  return ''
}

// Extract date prefix (YYYY-MM-DD) from timestamp
export function extractDatePrefix(timestamp: string): string {
  // Handles both "2026-02-22 09:30:00+00" and "2026-02-22T09:30:00"
  const match = timestamp.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) {
    return match[1]
  }
  return ''
}