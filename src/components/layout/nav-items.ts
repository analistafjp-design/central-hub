import { LayoutDashboard, Server, Users, Wallet, BellRing, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Servidores", href: "/servidores", icon: Server },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Alertas", href: "/alertas", icon: BellRing },
  { label: "Financeiro", href: "/financeiro", icon: Wallet },
];

export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS;
