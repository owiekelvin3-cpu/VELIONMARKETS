import { useRef } from "react";
import { Camera, User } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  uploading?: boolean;
  onPick?: (file: File) => void;
  className?: string;
}

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 text-2xl",
};

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  editable,
  uploading,
  onPick,
  className,
}: UserAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || <User className="h-5 w-5" />;

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-emerald/15 ring-2 ring-emerald/25",
          sizes[size],
          editable && "cursor-pointer hover:ring-emerald/50"
        )}
        onClick={editable ? () => inputRef.current?.click() : undefined}
        onKeyDown={editable ? (e) => e.key === "Enter" && inputRef.current?.click() : undefined}
        role={editable ? "button" : undefined}
        tabIndex={editable ? 0 : undefined}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-bold text-emerald">
            {initials}
          </span>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] text-white">
            …
          </div>
        )}
      </div>
      {editable && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick?.(file);
              e.target.value = "";
            }}
          />
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0c] text-emerald shadow-lg">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </>
      )}
    </div>
  );
}
