import { Avatar as AvatarPrimitive } from "radix-ui"
import { AvatarUploader } from "./button-upload-avatar-cloudinary";
import { user_createOrUpdateAvatarUrl } from "@/lib/actions/user-account";


export default function AvatarWithCloudinaryUploader({
  name,
  profileImageUrl,
}: {
  name: string;
  profileImageUrl?: string | null;  
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className="group relative flex size-25 shrink-0 rounded-full select-none"
    >
      <AvatarPrimitive.Image
        data-slot="avatar-image"
        src={profileImageUrl || undefined} alt={name || "Something went wrong"}
        className="aspect-square size-full rounded-full"
      />
      <AvatarPrimitive.Fallback
        data-slot="avatar-fallback"
        className="bg-muted text-muted-foreground flex size-full items-center justify-center rounded-full text-sm"
      >
        {name}
      </AvatarPrimitive.Fallback>
      <AvatarUploader onUploadSuccess={user_createOrUpdateAvatarUrl} />
    </AvatarPrimitive.Root>
  );
}