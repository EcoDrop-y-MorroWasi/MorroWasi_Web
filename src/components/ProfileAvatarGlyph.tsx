import { findAvatar } from "../data/avatarShop";
import { getAvatarThumbnail } from "../utils/avatarSkinPainter";
import { shopAvatarIdFrom } from "../utils/profileAvatar";

interface ProfileAvatarGlyphProps {
  value: string;
  imgClassName?: string;
}

export default function ProfileAvatarGlyph({ value, imgClassName }: ProfileAvatarGlyphProps) {
  const shopId = shopAvatarIdFrom(value);
  const shopAvatar = shopId ? findAvatar(shopId) : undefined;
  if (shopAvatar) {
    return (
      <img
        src={getAvatarThumbnail(shopAvatar)}
        alt=""
        aria-hidden="true"
        className={imgClassName ?? "h-9 w-9 object-contain"}
        style={{ imageRendering: "pixelated" }}
      />
    );
  }
  return <span aria-hidden="true">{value}</span>;
}
