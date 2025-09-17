"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
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
    <main className="bg-[#222] min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Navigation */}
        <div className="mb-8">
          <Navigation currentView={currentView} onViewChange={setCurrentView} />
        </div>

        {/* Content */}
        {currentView === "events" ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-100">Recent Events</h2>
                <p className="mt-1 text-sm text-neutral-300">Latest contract events</p>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="rounded-lg border border-neutral-700 p-2 text-neutral-200 hover:bg-neutral-800 disabled:opacity-60"
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
          <div className="custom-scrollbar h-[440px] overflow-y-auto px-4 py-5">
            {data.map((event, idx) => (
              <div
                key={`${event.transaction_hash}-${idx}`}
                className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-3"
              >
                {/* Row 1: title + right meta */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-semibold text-neutral-100">
                    {short(event.topics?.[0])}
                  </h3>
                  <div className="text-right">
                    <p className="text-xs text-neutral-400">{fmt(event.block_timestamp)}</p>
                    <a
                      className="mt-1 inline-block text-xs text-blue-400 hover:text-blue-300"
                      href={`https://etherscan.io/tx/${event.transaction_hash}`}
                      target="_blank" rel="noopener noreferrer"
                    >
                      View on Etherscan
                    </a>
                  </div>
                </div>

                {/* Row 2: details */}
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-neutral-300">
                    Contract:{" "}
                    <span className="font-mono text-neutral-200">{event.address}</span>
                  </p>
                  <p className="text-sm text-neutral-300">
                    Log Index:{" "}
                    <span className="font-mono text-neutral-200">#{event.log_index}</span>
                  </p>
                  <p className="break-all text-sm text-neutral-300">
                    Data:{" "}
                    <span className="font-mono text-neutral-200">{event.data}</span>
                  </p>
                </div>

                {/* Row 3: chips (optional, like the reference) */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                    Block #{event.block_number}
                  </span>
                  <span className="rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                    Param #1: {event.topics?.[1] ? "0x…" + event.topics[1].slice(-6) : "—"}
                  </span>
                  <span className="rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                    Param #2: {event.topics?.[2] ? "0x…" + event.topics[2].slice(-6) : "—"}
                  </span>
                  <span className="rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                    Param #3: {event.topics?.[3] ? "0x…" + event.topics[3].slice(-6) : "—"}
                  </span>
                </div>
              </div>
            ))}

            {data.length === 0 && (
              <p className="px-2 py-8 text-center text-sm text-neutral-400">
                No events found.
              </p>
            )}
          </div>
        </div>
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-100">NFT Collection</h2>
              <p className="mt-1 text-sm text-neutral-300">Browse NFTs from the collection</p>
            </div>
            <NFTCollectionGrid />
          </div>
        )}
      </div>
    </main>
  );
}
