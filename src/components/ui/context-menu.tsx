"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ContextMenuProps {
  children: React.ReactNode;
  menu: React.ReactNode;
}

interface ContextMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface ContextMenuContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ContextMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  destructive?: boolean;
}

interface ContextMenuSeparatorProps {
  className?: string;
}

const ContextMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
}>({
  open: false,
  setOpen: () => {},
  position: { x: 0, y: 0 },
  setPosition: () => {},
});

export function ContextMenu({ children, menu }: ContextMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
      setOpen(true);
    },
    []
  );

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      setPosition({ x: touch.clientX, y: touch.clientY });
      setOpen(true);
    }, 500);
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  return (
    <ContextMenuContext.Provider value={{ open, setOpen, position, setPosition }}>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {children}
        {open && menu}
      </div>
    </ContextMenuContext.Provider>
  );
}

export function ContextMenuContent({
  children,
  className,
}: ContextMenuContentProps) {
  const { position, setOpen } = React.useContext(ContextMenuContext);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);

  // Adjust position to keep menu in viewport
  React.useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      setAdjustedPosition({ x, y });
    }
  }, [position]);

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 min-w-[160px] rounded-lg border bg-popover p-1 shadow-lg",
        className
      )}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onClick={() => setOpen(false)}
    >
      {children}
    </div>
  );
}

export function ContextMenuItem({
  children,
  className,
  onClick,
  destructive,
}: ContextMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
        destructive && "text-red-500 hover:text-red-600",
        className
      )}
    >
      {children}
    </button>
  );
}

export function ContextMenuSeparator({ className }: ContextMenuSeparatorProps) {
  return <div className={cn("my-1 h-px bg-border", className)} />;
}

// Submenu components
interface ContextMenuSubProps {
  children: React.ReactNode;
}

interface ContextMenuSubTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface ContextMenuSubContentProps {
  children: React.ReactNode;
  className?: string;
}

const ContextMenuSubContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function ContextMenuSub({ children }: ContextMenuSubProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <ContextMenuSubContext.Provider value={{ open, setOpen }}>
      <div
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </div>
    </ContextMenuSubContext.Provider>
  );
}

export function ContextMenuSubTrigger({
  children,
  className,
}: ContextMenuSubTriggerProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-2">{children}</div>
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  );
}

export function ContextMenuSubContent({
  children,
  className,
}: ContextMenuSubContentProps) {
  const { open } = React.useContext(ContextMenuSubContext);
  const { setOpen: setParentOpen } = React.useContext(ContextMenuContext);

  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute left-full top-0 ml-1 min-w-[140px] rounded-lg border bg-popover p-1 shadow-lg",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        setParentOpen(false);
      }}
    >
      {children}
    </div>
  );
}
