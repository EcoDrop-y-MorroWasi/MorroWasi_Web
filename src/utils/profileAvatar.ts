// El emoji de perfil (morrowasi_perfil_v1) también puede apuntar a un avatar
// 3D de la Tienda — se guarda como "shop:<id>" en vez del emoji. Separado de
// ProfileAvatarGlyph.tsx (el componente) para que ese archivo solo exporte el
// componente — mezclar componente + funciones ahí rompía el fast refresh.
const SHOP_PREFIX = "shop:";

export function shopAvatarValue(avatarId: string): string {
  return `${SHOP_PREFIX}${avatarId}`;
}

export function shopAvatarIdFrom(value: string): string | null {
  return value.startsWith(SHOP_PREFIX) ? value.slice(SHOP_PREFIX.length) : null;
}
