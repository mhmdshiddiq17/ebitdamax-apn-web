"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { title: "Profil", href: "/settings/profile" },
  { title: "Keamanan", href: "/settings/security" },
  { title: "Tampilan", href: "/settings/appearance" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2" aria-label="Navigasi pengaturan">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(buttonVariants({ variant: pathname === item.href ? "default" : "ghost", size: "sm" }))}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
