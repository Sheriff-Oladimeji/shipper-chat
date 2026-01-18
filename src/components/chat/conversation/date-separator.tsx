"use client";

import { format, isToday, isYesterday } from "date-fns";

interface DateSeparatorProps {
  date: Date | string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const d = new Date(date);
  let label: string;

  if (isToday(d)) {
    label = "Today";
  } else if (isYesterday(d)) {
    label = "Yesterday";
  } else {
    label = format(d, "MMMM d, yyyy");
  }

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-muted px-3 py-1 rounded-full">
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
