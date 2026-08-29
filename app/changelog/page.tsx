import { Metadata } from "next";
import { ChangelogEntry } from "@/components/features/changelog/changelog-entry";
import { changelogData } from "@/lib/changelog/data";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";

export const metadata: Metadata = {
  title: "Changelog",
  description: "New features, improvements, and fixes — with dates.",
};

export default function ChangelogPage() {
  return (
    <main className="relative flex flex-col flex-1 items-center px-4 overflow-x-hidden min-h-screen">
      {/* Background Effect - keep it consistent with the homepage but maybe subtler? */}
      <div className="absolute inset-0 -z-10 opacity-50">
        <GoogleGeminiEffect />
      </div>

      <section className="relative z-10 w-full max-w-2xl flex flex-col pt-24 sm:pt-32 pb-20">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-foreground">
          Changelog
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground pb-8 border-b border-border">
          New features, improvements, and fixes — newest first.
        </p>

        <div className="flex flex-col mt-4">
          {changelogData.length > 0 ? (
            changelogData.map((entry) => (
              <ChangelogEntry key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Nothing here yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
