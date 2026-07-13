import { Home, Layers3, MoreHorizontal, PackageOpen, Wheat, type LucideIcon } from 'lucide-react';

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Navegacion principal operativa (mobile bottom + desktop header). */
export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/lotes', label: 'Lotes', icon: Layers3 },
  { href: '/inventario', label: 'Inventario', icon: PackageOpen },
  { href: '/consumo', label: 'Consumo', icon: Wheat },
  { href: '/mas', label: 'Mas', icon: MoreHorizontal },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
