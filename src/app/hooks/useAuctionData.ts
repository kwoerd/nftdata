import { useEffect, useState } from "react";
import { getAllListings } from "thirdweb/extensions/marketplace";
import { marketplaceContract } from "@/lib/thirdweb";

export interface AuctionData {
  id: string;
  assetContractAddress: string;
  tokenId: string;
  seller: string;
  currencyContractAddress: string;
  buyoutPrice: string;
  buyoutBidAmount: string;
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

export function useAuctionData() {
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuctionData() {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching auction data using Thirdweb SDK...");
        
        // Use Thirdweb SDK to get all marketplace listings
        const listings = await getAllListings({ contract: marketplaceContract });
        console.log("Marketplace listings:", listings);

        // Process listings to get auction data
        const processedAuctions = await Promise.all(
          listings.map(async (listing: unknown) => {
            try {
              const listingData = listing as {
                id: string;
                assetContractAddress: string;
                tokenId: string;
                seller: string;
                currencyContractAddress: string;
                buyoutPrice?: string;
                buyoutBidAmount?: string;
                minimumBidPrice?: string;
                startTimeInSeconds?: number;
                endTimeInSeconds?: number;
                status?: string;
              };
              
              // Fetch NFT metadata
              let nftData = null;
              try {
                const nftRes = await fetch(
                  `https://8453.insight.thirdweb.com/v1/nfts/${process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS}/${listingData.tokenId}?chain=8453`,
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
                console.warn(`Failed to fetch NFT data for token ${listingData.tokenId}:`, err);
              }

              return {
                id: listingData.id,
                assetContractAddress: listingData.assetContractAddress,
                tokenId: listingData.tokenId,
                seller: listingData.seller,
                currencyContractAddress: listingData.currencyContractAddress,
                buyoutPrice: listingData.buyoutPrice || "0",
                buyoutBidAmount: listingData.buyoutBidAmount || "0",
                minimumBidPrice: listingData.minimumBidPrice || "0",
                startTimeInSeconds: listingData.startTimeInSeconds || 0,
                endTimeInSeconds: listingData.endTimeInSeconds || 0,
                status: (listingData.status as "CREATED" | "COMPLETED" | "CANCELLED") || "CREATED",
                nftData: nftData
              };
            } catch (err) {
              console.error("Error processing listing:", err);
              return null;
            }
          })
        );

        // Filter out null results and active auctions only
        const validAuctions = processedAuctions.filter((auction): auction is AuctionData => 
          auction !== null && auction.status === "CREATED" && auction.nftData
        );

        console.log("Processed auctions:", validAuctions);
        setAuctions(validAuctions);
      } catch (err) {
        console.error("Error fetching auction data:", err);
        setError(`Error loading auction data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }

    fetchAuctionData();
  }, []);

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
