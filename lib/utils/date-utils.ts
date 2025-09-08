/**
 * Date manipulation and formatting utilities for GameGen platform
 * Comprehensive date operations with timezone handling and game-specific features
 */

// Types for date utilities
export type DateInput = string | number | Date;
export type TimeUnit =
  | "milliseconds"
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "months"
  | "years";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeDifference {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

// Date creation and parsing
export const createDate = (input?: DateInput): Date => {
  if (!input) return new Date();
  if (input instanceof Date) return new Date(input.getTime());

  return new Date(input);
};

export const parseDate = (dateString: string, format?: string): Date | null => {
  try {
    // Handle ISO strings
    if (dateString.includes("T") || dateString.includes("Z")) {
      return new Date(dateString);
    }

    // Handle common formats
    if (format === "YYYY-MM-DD") {
      const [year, month, day] = dateString.split("-").map(Number);

      return new Date(year, month - 1, day);
    }

    if (format === "MM/DD/YYYY") {
      const [month, day, year] = dateString.split("/").map(Number);

      return new Date(year, month - 1, day);
    }

    // Fallback to native parsing
    const parsed = new Date(dateString);

    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// Date validation
export const isValid = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isToday = (date: DateInput): boolean => {
  const d = createDate(date);
  const today = new Date();

  return d.toDateString() === today.toDateString();
};

export const isYesterday = (date: DateInput): boolean => {
  const d = createDate(date);
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  return d.toDateString() === yesterday.toDateString();
};

export const isTomorrow = (date: DateInput): boolean => {
  const d = createDate(date);
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  return d.toDateString() === tomorrow.toDateString();
};

export const isWeekend = (date: DateInput): boolean => {
  const d = createDate(date);
  const day = d.getDay();

  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

export const isPast = (date: DateInput): boolean => {
  return createDate(date).getTime() < Date.now();
};

export const isFuture = (date: DateInput): boolean => {
  return createDate(date).getTime() > Date.now();
};

// Date comparison
export const isAfter = (date1: DateInput, date2: DateInput): boolean => {
  return createDate(date1).getTime() > createDate(date2).getTime();
};

export const isBefore = (date1: DateInput, date2: DateInput): boolean => {
  return createDate(date1).getTime() < createDate(date2).getTime();
};

export const isSame = (
  date1: DateInput,
  date2: DateInput,
  unit: TimeUnit = "milliseconds",
): boolean => {
  const d1 = createDate(date1);
  const d2 = createDate(date2);

  switch (unit) {
    case "years":
      return d1.getFullYear() === d2.getFullYear();
    case "months":
      return (
        d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
      );
    case "days":
      return d1.toDateString() === d2.toDateString();
    case "hours":
      return (
        Math.floor(d1.getTime() / (1000 * 60 * 60)) ===
        Math.floor(d2.getTime() / (1000 * 60 * 60))
      );
    case "minutes":
      return (
        Math.floor(d1.getTime() / (1000 * 60)) ===
        Math.floor(d2.getTime() / (1000 * 60))
      );
    case "seconds":
      return (
        Math.floor(d1.getTime() / 1000) === Math.floor(d2.getTime() / 1000)
      );
    default:
      return d1.getTime() === d2.getTime();
  }
};

export const isBetween = (
  date: DateInput,
  start: DateInput,
  end: DateInput,
  inclusive = true,
): boolean => {
  const d = createDate(date).getTime();
  const s = createDate(start).getTime();
  const e = createDate(end).getTime();

  return inclusive ? d >= s && d <= e : d > s && d < e;
};

// Date arithmetic
export const addTime = (
  date: DateInput,
  amount: number,
  unit: TimeUnit,
): Date => {
  const d = createDate(date);

  switch (unit) {
    case "milliseconds":
      return new Date(d.getTime() + amount);
    case "seconds":
      return new Date(d.getTime() + amount * 1000);
    case "minutes":
      return new Date(d.getTime() + amount * 1000 * 60);
    case "hours":
      return new Date(d.getTime() + amount * 1000 * 60 * 60);
    case "days":
      d.setDate(d.getDate() + amount);

      return d;
    case "weeks":
      d.setDate(d.getDate() + amount * 7);

      return d;
    case "months":
      d.setMonth(d.getMonth() + amount);

      return d;
    case "years":
      d.setFullYear(d.getFullYear() + amount);

      return d;
    default:
      return d;
  }
};

export const subtractTime = (
  date: DateInput,
  amount: number,
  unit: TimeUnit,
): Date => {
  return addTime(date, -amount, unit);
};

export const startOfDay = (date: DateInput): Date => {
  const d = createDate(date);

  d.setHours(0, 0, 0, 0);

  return d;
};

export const endOfDay = (date: DateInput): Date => {
  const d = createDate(date);

  d.setHours(23, 59, 59, 999);

  return d;
};

export const startOfWeek = (date: DateInput, firstDayOfWeek = 0): Date => {
  const d = createDate(date);
  const day = d.getDay();
  const diff = (day + 7 - firstDayOfWeek) % 7;

  d.setDate(d.getDate() - diff);

  return startOfDay(d);
};

export const endOfWeek = (date: DateInput, firstDayOfWeek = 0): Date => {
  const d = startOfWeek(date, firstDayOfWeek);

  d.setDate(d.getDate() + 6);

  return endOfDay(d);
};

export const startOfMonth = (date: DateInput): Date => {
  const d = createDate(date);

  d.setDate(1);

  return startOfDay(d);
};

export const endOfMonth = (date: DateInput): Date => {
  const d = createDate(date);

  d.setMonth(d.getMonth() + 1, 0);

  return endOfDay(d);
};

export const startOfYear = (date: DateInput): Date => {
  const d = createDate(date);

  d.setMonth(0, 1);

  return startOfDay(d);
};

export const endOfYear = (date: DateInput): Date => {
  const d = createDate(date);

  d.setMonth(11, 31);

  return endOfDay(d);
};

// Date difference calculations
export const differenceInMilliseconds = (
  date1: DateInput,
  date2: DateInput,
): number => {
  return createDate(date1).getTime() - createDate(date2).getTime();
};

export const differenceInSeconds = (
  date1: DateInput,
  date2: DateInput,
): number => {
  return Math.floor(differenceInMilliseconds(date1, date2) / 1000);
};

export const differenceInMinutes = (
  date1: DateInput,
  date2: DateInput,
): number => {
  return Math.floor(differenceInSeconds(date1, date2) / 60);
};

export const differenceInHours = (
  date1: DateInput,
  date2: DateInput,
): number => {
  return Math.floor(differenceInMinutes(date1, date2) / 60);
};

export const differenceInDays = (
  date1: DateInput,
  date2: DateInput,
): number => {
  const d1 = startOfDay(date1);
  const d2 = startOfDay(date2);

  return Math.floor(differenceInHours(d1, d2) / 24);
};

export const differenceInWeeks = (
  date1: DateInput,
  date2: DateInput,
): number => {
  return Math.floor(differenceInDays(date1, date2) / 7);
};

export const getTimeDifference = (
  date1: DateInput,
  date2: DateInput,
): TimeDifference => {
  const diffMs = Math.abs(differenceInMilliseconds(date1, date2));

  const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30),
  );
  const days = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24),
  );
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  const milliseconds = diffMs % 1000;

  return { years, months, days, hours, minutes, seconds, milliseconds };
};

// Date formatting (extends the format-utils)
export const formatRelativeTime = (
  date: DateInput,
  baseDate?: DateInput,
): string => {
  const d = createDate(date);
  const base = baseDate ? createDate(baseDate) : new Date();
  const diffMs = d.getTime() - base.getTime();
  const diffMins = Math.floor(Math.abs(diffMs) / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (Math.abs(diffMs) < 1000 * 60) return "Just now";

  const isPast = diffMs < 0;
  const suffix = isPast ? "ago" : "from now";

  if (diffMins < 60) return `${diffMins}m ${suffix}`;
  if (diffHours < 24) return `${diffHours}h ${suffix}`;
  if (diffDays < 7) return `${diffDays}d ${suffix}`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ${suffix}`;

  return d.toLocaleDateString();
};

export const formatDurationFromMs = (ms: number): string => {
  if (ms < 0) return "0s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;

  return `${seconds}s`;
};

export const formatTimeOfDay = (date: DateInput): string => {
  const d = createDate(date);

  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatDateRange = (start: DateInput, end: DateInput): string => {
  const startDate = createDate(start);
  const endDate = createDate(end);

  if (isSame(startDate, endDate, "days")) {
    return startDate.toLocaleDateString();
  }

  if (isSame(startDate, endDate, "years")) {
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }

  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
};

// Game-specific date utilities
export const formatGameSessionDuration = (
  startTime: DateInput,
  endTime?: DateInput,
): string => {
  const start = createDate(startTime);
  const end = endTime ? createDate(endTime) : new Date();
  const duration = end.getTime() - start.getTime();

  return formatDurationFromMs(duration);
};

export const calculateGameStreakDays = (gameSessions: DateInput[]): number => {
  if (gameSessions.length === 0) return 0;

  const sortedDates = gameSessions
    .map(createDate)
    .sort((a, b) => b.getTime() - a.getTime())
    .map((date) => startOfDay(date).getTime());

  const uniqueDates = Array.from(new Set(sortedDates));

  let streak = 0;
  let currentDate = startOfDay(new Date()).getTime();

  for (const sessionDate of uniqueDates) {
    if (sessionDate === currentDate) {
      streak++;
      currentDate = subtractTime(currentDate, 1, "days").getTime();
    } else if (sessionDate === currentDate + 24 * 60 * 60 * 1000) {
      // Allow for yesterday if today wasn't played yet
      streak++;
      currentDate = subtractTime(currentDate, 1, "days").getTime();
    } else {
      break;
    }
  }

  return streak;
};

export const getNextMilestone = (
  createdDate: DateInput,
): { date: Date; days: number; label: string } => {
  const created = startOfDay(createdDate);
  const now = startOfDay(new Date());
  const daysActive = differenceInDays(now, created);

  const milestones = [
    { days: 7, label: "1 Week" },
    { days: 30, label: "1 Month" },
    { days: 90, label: "3 Months" },
    { days: 180, label: "6 Months" },
    { days: 365, label: "1 Year" },
  ];

  for (const milestone of milestones) {
    if (daysActive < milestone.days) {
      const targetDate = addTime(created, milestone.days, "days");

      return {
        date: targetDate,
        days: milestone.days - daysActive,
        label: milestone.label,
      };
    }
  }

  // If all milestones passed, next is years
  const yearsActive = Math.floor(daysActive / 365);
  const nextYearDays = (yearsActive + 1) * 365;
  const targetDate = addTime(created, nextYearDays, "days");

  return {
    date: targetDate,
    days: nextYearDays - daysActive,
    label: `${yearsActive + 1} Years`,
  };
};

// Timezone utilities
export const getTimezoneOffset = (date?: DateInput): number => {
  return createDate(date).getTimezoneOffset();
};

export const toUTC = (date: DateInput): Date => {
  const d = createDate(date);

  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
};

export const fromUTC = (date: DateInput): Date => {
  const d = createDate(date);

  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

// Calendar utilities
export const getCalendarDays = (
  date: DateInput,
  firstDayOfWeek = 0,
): Date[] => {
  const start = startOfWeek(startOfMonth(date), firstDayOfWeek);
  const end = endOfWeek(endOfMonth(date), firstDayOfWeek);

  const days: Date[] = [];
  let current = new Date(start);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

export const getWeekdays = (
  locale = "en-US",
  format: "long" | "short" | "narrow" = "short",
): string[] => {
  const date = new Date(2021, 0, 3); // A Sunday
  const weekdays: string[] = [];

  for (let i = 0; i < 7; i++) {
    weekdays.push(date.toLocaleDateString(locale, { weekday: format }));
    date.setDate(date.getDate() + 1);
  }

  return weekdays;
};

export const getMonthNames = (
  locale = "en-US",
  format: "long" | "short" | "narrow" = "long",
): string[] => {
  const months: string[] = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(2021, i, 1);

    months.push(date.toLocaleDateString(locale, { month: format }));
  }

  return months;
};
