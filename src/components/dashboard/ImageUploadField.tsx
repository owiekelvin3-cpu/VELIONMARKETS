import { useRef, useState } from "react";
import { Upload, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface ImageUploadFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value: File | null;
  onChange: (file: File | null) => void;
}

export function ImageUploadField({
  id,
  label,
  required,
  value,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    if (!file) {
      setPreview(null);
      onChange(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  return (
    <div>
      <Label htmlFor={id} className="text-sm text-foreground">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </Label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        required={required && !value}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {preview ? (
        <div className="relative mt-2 overflow-hidden rounded-xl border border-border">
          <img src={preview} alt="" className="h-28 w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              handleFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mt-2 flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl",
            "border border-dashed border-border bg-secondary/50 text-muted transition-colors",
            "hover:border-border hover:bg-secondary/70 hover:text-foreground"
          )}
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs">Tap to upload</span>
        </button>
      )}
    </div>
  );
}
