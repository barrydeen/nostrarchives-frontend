"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radio,
  User,
  MessageCircle,
  List,
  Rss,
  Search,
  BarChart3,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  LogIn,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { nip19 } from "nostr-tools";

const navItems = [
  { href: "/profile", label: "My Profile", icon: User, requiresAuth: true },
  { href: "/messages", label: "Messages", icon: MessageCircle, requiresAuth: true },
  { href: "/lists", label: "Lists", icon: List, requiresAuth: true },
  { href: "/feed", label: "Feeds", icon: Rss, requiresAuth: false },
  { href: "/explore", label: "Search", icon: Search, requiresAuth: false },
  { href: "/analytics", label: "Analytics", icon: BarChart3, requiresAuth: false },
  { href: "/notifications", label: "Notifications", icon: Bell, requiresAuth: true },
];

export { navItems };

function NavLink({
  href,
  label,
  icon: Icon,
  requiresAuth,
  collapsed,
  active,
  authed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth: boolean;
  collapsed: boolean;
  active: boolean;
  authed: boolean;
}) {
  const dimmed = requiresAuth && !authed;

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`
        group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
        ${active
          ? "bg-neon-pink/10 text-neon-pink border-l-2 border-neon-pink -ml-px"
          : "text-white/50 hover:bg-white/5 hover:text-white/80"
        }
        ${dimmed && !active ? "opacity-50" : ""}
        ${collapsed ? "justify-center px-0" : ""}
      `}
    >
      <Icon className={`size-5 shrink-0 ${active ? "text-neon-pink" : ""}`} />
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
    </Link>
  );
}

function UserSection({ collapsed }: { collapsed: boolean }) {
  const { pubkey, profile, loading, login, logout } = useAuth();

  if (loading) return null;

  if (!pubkey) {
    return (
      <button
        onClick={async () => {
          try {
            await login();
          } catch {
            // Login failed silently
          }
        }}
        title={collapsed ? "Login with Nostr extension" : undefined}
        className={`
          flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
          text-white/60 transition hover:bg-white/5 hover:text-white
          ${collapsed ? "justify-center px-0" : "w-full"}
        `}
      >
        <LogIn className="size-5 shrink-0" />
        {!collapsed && <span>Login</span>}
      </button>
    );
  }

  const npub = nip19.npubEncode(pubkey);
  const shortNpub = `${npub.slice(0, 8)}…${npub.slice(-4)}`;
  const displayName = profile?.display_name || profile?.name || shortNpub;

  return (
    <div className="space-y-1">
      <Link
        href={`/profiles/${pubkey}`}
        title={collapsed ? displayName : undefined}
        className={`
          flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition
          hover:bg-white/5
          ${collapsed ? "justify-center px-0" : ""}
        `}
      >
        {profile?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.picture}
            alt=""
            className="size-7 shrink-0 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/30 to-neon-blue/30 ring-1 ring-white/10">
            <User className="size-3.5 text-white/60" />
          </span>
        )}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="truncate text-[11px] text-white/30">{shortNpub}</p>
          </div>
        )}
      </Link>
      <button
        onClick={logout}
        title={collapsed ? "Logout" : undefined}
        className={`
          flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm
          text-white/40 transition hover:bg-white/5 hover:text-white/70
          ${collapsed ? "justify-center px-0 w-full" : "w-full"}
        `}
      >
        <LogOut className="size-4 shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>
    </div>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { pubkey } = useAuth();

  function isActive(href: string) {
    if (href === "/profile") {
      return pathname === "/profile" || (!!pubkey && pathname === `/profiles/${pubkey}`);
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={`
        hidden md:flex flex-col sticky top-0 h-screen
        border-r border-white/5 bg-background/80 backdrop-blur-xl
        transition-all duration-200 overflow-y-auto overflow-x-hidden
        ${collapsed ? "w-16" : "w-60"}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-4 ${collapsed ? "justify-center px-2" : ""}`}>
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="rounded-lg bg-gradient-to-tr from-neon-pink/30 via-neon-blue/40 to-neon-green/30 p-1.5 shadow-glow">
            <Radio className="size-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-wide text-white whitespace-nowrap">
              Nostr Archives
            </span>
          )}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className={`
          flex items-center gap-2 px-4 py-1.5 text-white/30 transition hover:text-white/60
          ${collapsed ? "justify-center px-2" : ""}
        `}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronsRight className="size-4" />
        ) : (
          <>
            <ChevronsLeft className="size-4" />
            <span className="text-xs">Collapse</span>
          </>
        )}
      </button>

      {/* Nav links */}
      <nav className={`mt-4 flex flex-col gap-0.5 ${collapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            collapsed={collapsed}
            active={isActive(item.href)}
            authed={!!pubkey}
          />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User section */}
      <div className={`border-t border-white/5 py-3 ${collapsed ? "px-2" : "px-3"}`}>
        <UserSection collapsed={collapsed} />
      </div>
    </aside>
  );
}
