import { createFileRoute, Link } from "@tanstack/react-router";

import { RelocationReport } from "@/components/relocation/RelocationReport";
import { mockRelocationReport } from "@/lib/relocation/mockRelocationReport";

export const Route = createFileRoute("/relocation/demo")({
  head: () => ({
    meta: [
      { title: "Relocation Offer Comparison — sample report" },
      {
        name: "description",
        content:
          "A sample relocation offer comparison: taxes, cost of living, break-even salary, monthly surplus change and payback period.",
      },
      { property: "og:title", content: "Relocation Offer Comparison — sample report" },
      {
        property: "og:description",
        content:
          "Sample report comparing two cities after every tax layer, with break-even salary and payback period.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RelocationDemo,
});

function RelocationDemo() {
  return (
    <main className="min-h-screen bg-background px-6 py-14 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[17px] font-semibold tracking-tight text-ink">
            Relocation Offer Comparison
          </span>
          <Link
            to="/relocation"
            className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
          >
            Run your own numbers
          </Link>
        </div>
        <p className="mt-6 text-sm font-semibold text-forest">Sample report</p>
        <div className="mt-6">
          <RelocationReport data={mockRelocationReport} />
        </div>
      </div>
    </main>
  );
}
