"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Library, Search, LogOut, Sparkles } from "lucide-react";

interface NavProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function AppNav({ profile }: { profile: NavProfile }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initials = (profile.display_name || profile.username)
    .split(/[\s_]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <header className="border-b sticky top-0 z-10 bg-background/80 backdrop-blur">
      <div className="container mx-auto max-w-5xl flex items-center justify-between p-3 md:p-4">
        <Link href="/" className="font-bold text-lg tracking-tight flex items-center gap-1.5">
          <Sparkles className="size-4 text-primary" />
          GeekStack
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/search" active={pathname.startsWith("/search")} icon={<Search className="size-4" />} label="Rechercher" />
          <NavLink href="/library" active={pathname.startsWith("/library")} icon={<Library className="size-4" />} label="Bibliothèque" />

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-2 outline-none">
              <Avatar className="size-8 cursor-pointer">
                {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.username} />}
                <AvatarFallback>{initials || "?"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>@{profile.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
        active ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/50 text-muted-foreground"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
