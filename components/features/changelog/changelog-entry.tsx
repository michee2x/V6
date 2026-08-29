import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ChangelogEntry as ChangelogEntryType } from "@/lib/changelog/data";
import { cn } from "@/lib/utils";

interface ChangelogEntryProps {
  entry: ChangelogEntryType;
}

export function ChangelogEntry({ entry }: ChangelogEntryProps) {
  const { id, title, date, tag, body } = entry;

  // Format date to "Month DD, YYYY"
  const formattedDate = format(new Date(date), "MMMM d, yyyy");

  const tagStyles = {
    new: "bg-emerald-500/15 text-emerald-500",
    improved: "bg-blue-500/15 text-blue-500",
    fixed: "bg-orange-500/15 text-orange-500",
  };

  return (
    <article
      id={id}
      className="group py-6 sm:py-8 border-b border-border last:border-b-0"
    >
      <div className="flex items-center gap-3 mb-2">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
            tagStyles[tag]
          )}
        >
          {tag}
        </span>
        <time dateTime={date} className="text-sm text-muted-foreground">
          {formattedDate}
        </time>
      </div>
      <h2 className="text-lg sm:text-xl font-semibold mb-2 scroll-m-20">
        <Link
          href={`#${id}`}
          className="text-foreground hover:text-primary transition-colors decoration-transparent underline-offset-4 hover:underline hover:decoration-primary"
        >
          {title}
        </Link>
      </h2>
      <div className="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {body}
      </div>
    </article>
  );
}
