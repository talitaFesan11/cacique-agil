/**
 * Utilitários matemáticos e temporais puros para datas e prazos do Gantt e Calendário.
 */

export function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

export function toIsoDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]!;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function diffDays(start: Date, end: Date): number {
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
}

export function getDaysBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = startOfDay(start);
  const finish = startOfDay(end);

  while (current <= finish) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }
  return dates;
}

export function getDurationDays(
  startDate: string | Date | null | undefined,
  dueDate: string | Date | null | undefined,
  isMilestone = false,
): number {
  if (isMilestone) return 0;
  if (!startDate && !dueDate) return 1;
  const start = parseDate(startDate);
  const end = parseDate(dueDate);
  if (!start && end) return 1;
  if (start && !end) return 1;
  if (start && end) {
    const diff = diffDays(start, end);
    return Math.max(1, diff + 1); // Ex: do dia 10 ao dia 10 = 1 dia
  }
  return 1;
}
