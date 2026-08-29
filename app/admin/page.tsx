import { ShowcaseManager } from "@/components/features/admin/showcase-manager";

export const metadata = { title: "Admin — Showcase Manager" };

export default function AdminPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Showcase Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Curate before &amp; after examples that appear on the home page.
        </p>
      </div>
      <ShowcaseManager />
    </div>
  );
}
