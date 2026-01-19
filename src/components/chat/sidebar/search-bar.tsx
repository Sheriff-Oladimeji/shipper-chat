"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Filter, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterType = "all" | "archived" | "read" | "unread";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  filter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Chats" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
];

export function SearchBar({ value, onChange, filter = "all", onFilterChange }: SearchBarProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    if (showFilterMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showFilterMenu]);

  const handleFilterSelect = (filterValue: FilterType) => {
    onFilterChange?.(filterValue);
    setShowFilterMenu(false);
  };

  const isFiltered = filter !== "all";

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9 bg-muted/50 border-0"
          />
        </div>
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            className={cn("shrink-0", isFiltered && "text-primary")}
            onClick={() => setShowFilterMenu(!showFilterMenu)}
          >
            <Filter className="h-4 w-4" />
          </Button>

          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border bg-card shadow-lg">
              <div className="py-1">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect(option.value)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span>{option.label}</span>
                    {filter === option.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
