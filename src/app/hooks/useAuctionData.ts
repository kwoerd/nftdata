import { useEffect, useState, useCallback } from "react";

export interface AuctionData {
  id: string;
  assetContractAddress: string;
  tokenId: string;
  seller: string;
  currencyContractAddress: string;
  buyoutPrice: string;
  currentBid: string;
  minimumBidPrice: string;
  startTimeInSeconds: number;
  endTimeInSeconds: number;
  status: "CREATED" | "COMPLETED" | "CANCELLED";
  nftData: {
    name: string;
    image_url: string;
    extra_metadata?: {
      image_url?: string;
      rank?: number;
      rarity_percent?: number;
      rarity_tier?: string;
    };
  };
}

// Cache for auction data to prevent redundant API calls
let auctionCache: { data: AuctionData[]; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export function useAuctionData() {
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuctionData = useCallback(async () => {
    // Check cache first
    if (auctionCache && Date.now() - auctionCache.timestamp < CACHE_DURATION) {
      setAuctions(auctionCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching auction data from Insight API...");
      
      // Fetch auction events from marketplace using Insight API
      const auctionEventsUrl = `https://8453.insight.thirdweb.com/v1/${process.env.NEXT_PUBLIC_CLIENT_ID}/events?chain=8453&contract_addresses=${process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS}&event_signatures=AuctionCreated(address,uint256,address,uint256,uint256,uint256,uint256,address,uint64)&sort_order=desc&limit=20`;
      
      const [auctionRes, bidRes] = await Promise.all([
        fetch(auctionEventsUrl, {
          headers: {
            "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
          },
        }),
        fetch(`https://8453.insight.thirdweb.com/v1/${process.env.NEXT_PUBLIC_CLIENT_ID}/events?chain=8453&contract_addresses=${process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS}&event_signatures=BidPlaced(address,uint256,address,uint256,uint256)&sort_order=desc&limit=100`, {
          headers: {
            "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
          },
        })
      ]);

      if (!auctionRes.ok) {
        throw new Error(`Failed to fetch auction events: ${auctionRes.status}`);
      }

      const [auctionData, bidData] = await Promise.all([
        auctionRes.json(),
        bidRes.ok ? bidRes.json() : { data: [] }
      ]);

      // Process auction data more efficiently
      const now = Math.floor(Date.now() / 1000);
      const processedAuctions = await Promise.all(
        auctionData.data.slice(0, 10).map(async (event: unknown) => {
          try {
            const eventData = event as {
              data: {
                auctionId?: string;
                tokenId?: string;
                nftContract?: string;
                seller?: string;
                startingPrice?: string;
                buyNowPrice?: string;
                endTime?: string;
              };
              topics: string[];
            };
            
            const tokenId = eventData.data.tokenId || eventData.topics[2];
            const auctionId = eventData.data.auctionId || eventData.topics[1];
            
            // Find highest bid for this auction
            const auctionBids = bidData.data.filter((bid: unknown) => {
              const bidEvent = bid as { data: { auctionId?: string }; topics: string[] };
              return bidEvent.data.auctionId === auctionId || bidEvent.topics[1] === auctionId;
            });
            
            const highestBid = auctionBids.reduce((highest: unknown, bid: unknown) => {
              const bidEvent = bid as { data: { bidAmount?: string; amount?: string } };
              const highestEvent = highest as { data: { bidAmount?: string; amount?: string } };
              const bidAmount = Number(bidEvent.data.bidAmount || bidEvent.data.amount || 0);
              const currentHighest = Number(highestEvent.data.bidAmount || highestEvent.data.amount || 0);
              return bidAmount > currentHighest ? bid : highest;
            }, auctionBids[0] || null);

            // Only fetch NFT data if we don't have it cached
            let nftData = null;
            try {
              const nftRes = await fetch(
                `https://8453.insight.thirdweb.com/v1/nfts/${process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS}/${tokenId}?chain=8453`,
                {
                  headers: {
                    "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
                  },
                }
              );
              if (nftRes.ok) {
                const nftJson = await nftRes.json();
                nftData = nftJson.data?.[0] || nftJson;
              }
            } catch (err) {
              console.warn(`Failed to fetch NFT data for token ${tokenId}:`, err);
            }

            const endTime = Number(eventData.data.endTime || 0);
            const isActive = endTime > now;

            return {
              id: auctionId,
              assetContractAddress: eventData.data.nftContract || process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS,
              tokenId: tokenId,
              seller: eventData.data.seller || eventData.topics[3],
              currencyContractAddress: "0x0000000000000000000000000000000000000000", // ETH
              buyoutPrice: eventData.data.buyNowPrice || "0",
              currentBid: highestBid ? (highestBid as { data: { bidAmount?: string; amount?: string } }).data.bidAmount || (highestBid as { data: { bidAmount?: string; amount?: string } }).data.amount || "0" : eventData.data.startingPrice || "0",
              minimumBidPrice: eventData.data.startingPrice || "0",
              startTimeInSeconds: now,
              endTimeInSeconds: endTime,
              status: isActive ? "CREATED" : "COMPLETED",
              nftData: nftData ? {
                name: nftData.name || `NFT #${tokenId}`,
                image_url: nftData.extra_metadata?.image_url || nftData.image_url || "",
                extra_metadata: {
                  image_url: nftData.extra_metadata?.image_url || nftData.image_url,
                  rank: nftData.extra_metadata?.rank,
                  rarity_percent: nftData.extra_metadata?.rarity_percent,
                  rarity_tier: nftData.extra_metadata?.rarity_tier,
                }
              } : {
                name: `NFT #${tokenId}`,
                image_url: "",
                extra_metadata: {}
              }
            };
          } catch (err) {
            console.error("Error processing auction:", err);
            return null;
          }
        })
      );

      // Filter out null results and active auctions only
      const validAuctions = processedAuctions.filter((auction): auction is AuctionData => 
        auction !== null && auction.status === "CREATED" && auction.nftData
      );

      // Cache the results
      auctionCache = { data: validAuctions, timestamp: Date.now() };
      
      console.log("Processed auctions:", validAuctions);
      setAuctions(validAuctions);
    } catch (err) {
      console.error("Error fetching auction data:", err);
      setError(`Error loading auction data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctionData();
  }, [fetchAuctionData]);

  return { auctions, loading, error };
}

// Hook to get auction data for a specific NFT
export function useAuctionDataForNFT(tokenId: string) {
  const { auctions, loading, error } = useAuctionData();
  
  const auctionForNFT = auctions.find(auction => auction.tokenId === tokenId);
  
  return { 
    auction: auctionForNFT, 
    loading, 
    error 
  };
}
