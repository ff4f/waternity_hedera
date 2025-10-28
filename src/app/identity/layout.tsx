import { LocalSectionNav } from '@/components/local-section-nav';

export default function ThgIdentityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8">
      {/* Page header (title + subtitle) is rendered by the page itself */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="order-2 lg:order-1">
          {/* Inject the local nav here */}
          <LocalSectionNav />
        </aside>
        <main className="order-1 lg:order-2 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}