"use client";

interface TypingIndicatorProps {
  names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const text =
    names.length === 1
      ? `${names[0]} is typing...`
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex space-x-1">
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
      </div>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}
