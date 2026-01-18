"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const statusSizeClasses = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
};

export function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  showOnlineStatus = false,
  isOnline = false,
  className,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);

  const initials = fallback
    ? fallback
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className={cn("relative inline-block", className)} {...props}>
      <div
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-muted",
          sizeClasses[size]
        )}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-400 to-green-600 text-xs font-medium text-white">
            {initials}
          </span>
        )}
      </div>
      {showOnlineStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full border-2 border-white",
            statusSizeClasses[size],
            isOnline ? "bg-green-500" : "bg-gray-400"
          )}
        />
      )}
    </div>
  );
}
