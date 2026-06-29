"use client";

import { CldUploadWidget } from "next-cloudinary";
import { cn } from "@/lib/utils";
import { CameraIcon } from "lucide-react";

export function AvatarUploader({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) {
  return (
    <CldUploadWidget
      uploadPreset={process.env.CLOUDINARY_UPLOAD_PRESET}
      signatureEndpoint="/api/sign-cloudinary-params"
      onSuccess={(result) => {
        if (typeof result.info === "object" && "secure_url" in result.info) {
          onUploadSuccess(result.info.secure_url);
        }
      }}
      options={{
        singleUploadAutoClose: true,
        clientAllowedFormats: ["jpg", "jpeg", "png"],
        resourceType: "image",
        maxFileSize: 128 * 1024, // 128KB
      }}
    >
      {({ open }) => (
        <AvatarBadge
          data-slot="avatar-badge"
          role="button"
          aria-label="Change profile image"
          tabIndex={0}
          onClick={() => open()}
          className="size-6 bg-accent text-primary ring-background inline-flex items-center justify-center rounded-full ring-2 group-hover:scale-150 transition-transform hover:cursor-pointer"
        >
          <CameraIcon className="size-4" />
        </AvatarBadge>
      )}
    </CldUploadWidget>
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full ring-2 select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}