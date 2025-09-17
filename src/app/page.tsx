"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import NFTCollectionGrid from "@/components/ui/NFTCollectionGrid";

interface Event {
  address: string;
  block_hash: string;
  block_number: number;
  block_timestamp: number; // seconds from Insight
  chain_id: number;
  data: string;
  topics: string[];
  transaction_hash: string;
  transaction_index: number;
  log_index: number;
}

export default function Home() {
  const [data, setData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"events" | "nft">("events");

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(
        `https://8453.insight.thirdweb.com/v1/${process.env.NEXT_PUBLIC_CLIENT_ID}/events?chain=8453&sort_by=block_number&sort_order=desc&limit=10`
      );
      const json = await res.json();
      setData(json.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const fmt = (ts: number) => new Date(ts * 1000).toLocaleString();
  const short = (hex?: string) =>
    hex ? (hex.startsWith("0x") ? hex.slice(0, 10) : hex.slice(0, 8)) : "—";

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Navigation */}
        <div className="mb-8">
          <Navigation currentView={currentView} onViewChange={setCurrentView} />
        </div>

        {/* Content */}
        {currentView === "events" ? (
          <div className="rounded-sm border bg-card shadow-sm relative">
            {loading && (
              <div className="absolute top-0 left-0 right-0 z-10">
                <Progress value={33} className="h-1" />
              </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-medium text-foreground">Recent Events</h2>
                <p className="mt-1 text-sm text-muted-foreground">Latest contract events</p>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="rounded-sm border p-2 text-muted-foreground hover:bg-muted disabled:opacity-60"
                title="Refresh"
              >
                <svg
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                >
                  <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    d="M4 4v5h.6M20 13a8 8 0 10-7.4 7.9M15 3v5h5" />
                </svg>
              </button>
            </div>

          {/* Scroll area */}
          <ScrollArea className="h-[440px] px-4 py-5">
            {data.map((event, idx) => (
              <div
                key={`${event.transaction_hash}-${idx}`}
                className="mb-4 rounded-sm border bg-card px-4 py-3"
              >
                {/* Row 1: title + right meta */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-medium text-foreground">
                    {short(event.topics?.[0])}
                  </h3>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{fmt(event.block_timestamp)}</p>
                    <a
                      className="mt-1 inline-block text-xs text-muted-foreground hover:text-foreground"
                      href={`https://etherscan.io/tx/${event.transaction_hash}`}
                      target="_blank" rel="noopener noreferrer"
                    >
                      View on Etherscan
                    </a>
                  </div>
                </div>

                {/* Row 2: details */}
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Contract:{" "}
                    <span className="font-mono text-foreground">{event.address}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Log Index:{" "}
                    <span className="font-mono text-foreground">#{event.log_index}</span>
                  </p>
                  <p className="break-all text-sm text-muted-foreground">
                    Data:{" "}
                    <span className="font-mono text-foreground">{event.data}</span>
                  </p>
                </div>

                {/* Row 3: chips (optional, like the reference) */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Block #{event.block_number}
                  </span>
                  <span className="rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Param #1: {event.topics?.[1] ? "0x…" + event.topics[1].slice(-6) : "—"}
                  </span>
                  <span className="rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Param #2: {event.topics?.[2] ? "0x…" + event.topics[2].slice(-6) : "—"}
                  </span>
                  <span className="rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Param #3: {event.topics?.[3] ? "0x…" + event.topics[3].slice(-6) : "—"}
                  </span>
                </div>
              </div>
            ))}

            {data.length === 0 && (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                No events found.
              </p>
            )}
          </ScrollArea>
        </div>
        ) : (
          <div className="rounded-sm border bg-card shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-foreground">NFT Collection</h2>
              <p className="mt-1 text-sm text-muted-foreground">Browse NFTs from the collection</p>
            </div>
            <NFTCollectionGrid />
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
