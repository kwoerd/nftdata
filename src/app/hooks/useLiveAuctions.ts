import { useEffect, useState } from "react";

/** Auction + NFT data type: adjust fields as needed for your contract */
export type AuctionListing = {
  auctionId: string;
  tokenId: string;
  endTime: number;
  currentBid: string;
  nftImg: string;
  nftName: string;
};

export function useLiveAuctions(): AuctionListing[] {
  const [listings, setListings] = useState<
    AuctionListing[]
  >([]);
  useEffect(() => {
    async function fetchAuctions() {
      // Fetch auction events via Insight (replace as needed for your contract/event ABI)
      const url =
        `https://8453.insight.thirdweb.com/v1/${process.env.NEXT_PUBLIC_CLIENT_ID}/events` +
        `?chain=8453` +
        `&contract_addresses=${process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS}` +
        `&event_signatures=AuctionCreated(address,uint256,address,uint256,uint256,uint256,uint256,address,uint64)` +
        `&sort_order=desc&limit=100`;
      const res = await fetch(url);
      const json = await res.json();
      // (Basic example): filter active auctions & fetch NFT image/name via Insight
      const now = Math.floor(Date.now() / 1000);
      const activeAuctions = json.data.filter(
        (e: unknown) => {
          const eventData = e as { data: { endTime?: string | number } };
          return Number(eventData.data.endTime) > now;
        }
      );
      const items = await Promise.all(
        activeAuctions.map(async (e: unknown) => {
          const eventData = e as {
            data: {
              auctionId?: string;
              tokenId?: string;
              endTime?: string | number;
              currentBid?: string;
            };
            topics: string[];
          };
          const tokenId = eventData.data.tokenId ?? eventData.topics[2];
          const nft = await fetch(
            `https://8453.insight.thirdweb.com/v1/nft/${process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS}/${tokenId}`,
          ).then((r) => r.json());
          return {
            auctionId: eventData.data.auctionId || "",
            tokenId,
            endTime: Number(eventData.data.endTime) || 0,
            currentBid: eventData.data.currentBid || "0",
            nftImg: nft?.image || "",
            nftName: nft?.name || "",
          };
        }),
      );
      setListings(items);
    }
    fetchAuctions();
  }, []);
  return listings;
}
