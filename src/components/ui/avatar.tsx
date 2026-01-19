"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-20 w-20",
};

const statusSizeClasses = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
  xl: "h-4 w-4",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-xl",
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
          <span className={cn(
            "flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/80 to-primary font-medium text-white",
            textSizeClasses[size]
          )}>
            {initials}
          </span>
        )}
      </div>
      {showOnlineStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full border-2 border-white",
            statusSizeClasses[size],
            isOnline ? "bg-primary" : "bg-gray-400"
          )}
        />
      )}
    </div>
  );
}
