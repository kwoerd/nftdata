import { useEffect, useState } from "react";

export interface BidData {
  auctionId: string;
  bidder: string;
  bidAmount: string;
  timestamp: number;
}

export function useBidData() {
  const [bids, setBids] = useState<BidData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBidData() {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching bid data...");
        
        // Fetch bid events from marketplace
        const bidEventsUrl = `https://8453.insight.thirdweb.com/v1/${process.env.NEXT_PUBLIC_CLIENT_ID}/events?chain=8453&contract_addresses=${process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS}&event_signatures=BidPlaced(address,uint256,address,uint256,uint256)&sort_order=desc&limit=1000`;
        
        const bidRes = await fetch(bidEventsUrl, {
          headers: {
            "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
          },
        });

        if (!bidRes.ok) {
          throw new Error(`Failed to fetch bid events: ${bidRes.status}`);
        }

        const bidData = await bidRes.json();
        console.log("Bid events:", bidData);

        // Process bid data
        const processedBids = bidData.data.map((event: unknown) => {
          const eventData = event as {
            data: {
              auctionId?: string;
              bidder?: string;
              bidAmount?: string;
              amount?: string;
            };
            topics: string[];
            block_timestamp?: number;
          };
          return {
            auctionId: eventData.data.auctionId || eventData.topics[1],
            bidder: eventData.data.bidder || eventData.topics[2],
            bidAmount: eventData.data.bidAmount || eventData.data.amount || "0",
            timestamp: eventData.block_timestamp || 0
          };
        });

        console.log("Processed bids:", processedBids);
        setBids(processedBids);
      } catch (err) {
        console.error("Error fetching bid data:", err);
        setError(`Error loading bid data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }

    fetchBidData();
  }, []);

  return { bids, loading, error };
}

// Hook to get bid data for a specific auction
export function useBidDataForAuction(auctionId: string) {
  const { bids, loading, error } = useBidData();
  
  const auctionBids = bids.filter(bid => bid.auctionId === auctionId);
  const bidCount = auctionBids.length;
  const highestBid = auctionBids.reduce((highest, bid) => {
    const bidAmount = Number(bid.bidAmount);
    const currentHighest = Number(highest.bidAmount);
    return bidAmount > currentHighest ? bid : highest;
  }, auctionBids[0] || { bidAmount: "0", bidder: "" });
  
  return { 
    bids: auctionBids,
    bidCount,
    highestBid,
    loading, 
    error 
  };
}
