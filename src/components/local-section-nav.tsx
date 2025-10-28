"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const items = [
  { id: "overview", label: "Overview" },
  { id: "water-quality", label: "Water Quality" },
  { id: "conservation", label: "Conservation" },
  { id: "operators", label: "Operators" },
  { id: "verify", label: "Verify" },
];

export function LocalSectionNav() {
  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    const handler = () => setActive(window.location.hash.replace("#", "") || "overview");
    handler();
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return (
    <nav className="sticky top-24">
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="px-2 pb-2 pt-1 text-sm font-medium text-neutral-500">Sections</div>
        <div className="border-b border-neutral-200 mb-2" />
        <ul className="space-y-1">
          {items.map((it) => {
            const href = `#${it.id}`;
            const isActive = active === it.id;
            return (
              <li key={it.id}>
                <Link
                  href={href}
                  className={[
                    "block rounded-md px-3 py-2 text-sm transition",
                    isActive ? "bg-neutral-100 font-semibold" : "hover:bg-neutral-50"
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}