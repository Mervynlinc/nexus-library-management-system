"use client"

import { useRef } from "react"
import { Camera, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const MAX_PHOTO_BYTES = 2 * 1024 * 1024

interface AuthorPhotoUploadProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
  id?: string
}

export function AuthorPhotoUpload({
  value,
  onChange,
  disabled,
  error,
  id,
}: AuthorPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "error",
        title: "Invalid file",
        description: "Choose an image file (PNG, JPG, or similar).",
      })
      return
    }

    if (file.size > MAX_PHOTO_BYTES) {
      toast({
        variant: "error",
        title: "Photo too large",
        description: "Keep the photo under 2 MB.",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onChange(typeof reader.result === "string" ? reader.result : "")
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border bg-muted/50 text-text-secondary",
          error ? "border-danger" : "border-border"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Author photo preview"
            className="size-full object-cover"
          />
        ) : (
          <Camera className="size-5" />
        )}
      </span>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ""
        }}
        className="sr-only"
      />

      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <Upload />
            Upload photo
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange("")}
            >
              <Trash2 />
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-text-secondary">PNG or JPG, up to 2 MB.</p>
      </div>
    </div>
  )
}
