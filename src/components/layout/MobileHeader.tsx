"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, Menu, X, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { navItems } from "@/components/layout/Sidebar";
import { nip19 } from "nostr-tools";

export function MobileHeader({
  menuOpen,
  onToggleMenu,
}: {
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  const pathname = usePathname();
  const { pubkey, profile, loading, login, logout } = useAuth();

  function isActive(href: string) {
    if (href === "/profile") {
      return pathname === "/profile" || (!!pubkey && pathname === `/profiles/${pubkey}`);
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  const npub = pubkey ? nip19.npubEncode(pubkey) : null;
  const shortNpub = npub ? `${npub.slice(0, 8)}…${npub.slice(-4)}` : null;
  const displayName = profile?.display_name || profile?.name || shortNpub;

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-background/80 px-4 py-2.5 backdrop-blur-xl md:hidden">
        <button
          onClick={onToggleMenu}
          className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-tr from-neon-pink/30 via-neon-blue/40 to-neon-green/30 p-1.5 shadow-glow">
            <Radio className="size-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">
            Nostr Archives
          </span>
        </Link>

        {/* Auth button (compact) */}
        {!loading && (
          pubkey ? (
            <Link
              href={`/profiles/${pubkey}`}
              className="rounded-full p-0.5"
            >
              {profile?.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.picture}
                  alt=""
                  className="size-7 rounded-full object-cover ring-1 ring-white/10"
                />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/30 to-neon-blue/30 ring-1 ring-white/10">
                  <User className="size-3.5 text-white/60" />
                </span>
              )}
            </Link>
          ) : (
            <button
              onClick={async () => {
                try { await login(); } catch { /* */ }
              }}
              className="rounded-full bg-white/5 p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Login with Nostr extension"
            >
              <LogIn className="size-4" />
            </button>
          )
        )}
        {loading && <div className="size-7" />}
      </header>

      {/* Slide-out drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={onToggleMenu}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-background/95 backdrop-blur-xl md:hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4">
              <Link href="/" onClick={onToggleMenu} className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-tr from-neon-pink/30 via-neon-blue/40 to-neon-green/30 p-1.5 shadow-glow">
                  <Radio className="size-4 text-white" />
                </div>
                <span className="text-sm font-semibold tracking-wide text-white">
                  Nostr Archives
                </span>
              </Link>
              <button
                onClick={onToggleMenu}
                className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-0.5 px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const dimmed = item.requiresAuth && !pubkey;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onToggleMenu}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                      ${active
                        ? "bg-neon-pink/10 text-neon-pink"
                        : "text-white/50 hover:bg-white/5 hover:text-white/80"
                      }
                      ${dimmed && !active ? "opacity-50" : ""}
                    `}
                  >
                    <Icon className={`size-5 shrink-0 ${active ? "text-neon-pink" : ""}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex-1" />

            {/* User section */}
            <div className="border-t border-white/5 px-3 py-3">
              {!loading && pubkey ? (
                <div className="space-y-1">
                  <Link
                    href={`/profiles/${pubkey}`}
                    onClick={onToggleMenu}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white/5"
                  >
                    {profile?.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.picture}
                        alt=""
                        className="size-7 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/30 to-neon-blue/30 ring-1 ring-white/10">
                        <User className="size-3.5 text-white/60" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{displayName}</p>
                      <p className="truncate text-[11px] text-white/30">{shortNpub}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => { logout(); onToggleMenu(); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-white/40 transition hover:bg-white/5 hover:text-white/70"
                  >
                    <LogOut className="size-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : !loading ? (
                <button
                  onClick={async () => {
                    try { await login(); onToggleMenu(); } catch { /* */ }
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  <LogIn className="size-5" />
                  <span>Login</span>
                </button>
              ) : null}
            </div>
          </div>
        </>
      )}
    </>
  );
}
