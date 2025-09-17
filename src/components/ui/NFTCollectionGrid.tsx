import { useCollectionNFTs } from "@/app/hooks/useCollectionNFTs";
import { useAuctionData, AuctionData } from "@/app/hooks/useAuctionData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { memo, useMemo } from "react";

interface NFTData {
  token_id: string;
  name?: string;
  image_url?: string;
  extra_metadata?: {
    image_url?: string;
    rank?: number;
    rarity_percent?: number;
    rarity_tier?: string;
  };
}

// Memoized helper functions to prevent recreation on every render
const formatPrice = (price: string) => {
  const numPrice = Number(price);
  if (numPrice === 0) return "No bids";
  return `${(numPrice / 1e18).toFixed(4)} ETH`;
};

const formatTimeRemaining = (endTime: number) => {
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTime - now;
  if (remaining <= 0) return "Ended";
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Memoized NFT card component
const NFTCard = memo(({ nft, auctions }: { nft: NFTData; auctions: AuctionData[] }) => {
  const auction = useMemo(() => 
    auctions.find(auction => auction.tokenId === nft.token_id),
    [auctions, nft.token_id]
  );
  
  const hasAuction = auction && auction.status === "CREATED";

  return (
    <Card className="flex flex-col items-center p-4">
      <Link href={`/nft/${nft.token_id}`}>
        <img
          src={nft.extra_metadata?.image_url ?? nft.image_url}
          alt={`${nft.name} NFT image`}
          className="w-64 h-64 object-contain"
          onError={(e) => {
            // Fallback for broken images
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666'%3ENo Image%3C/text%3E%3C/svg%3E";
          }}
        />
      </Link>
      
      <div className="mt-3 font-medium text-center">
        {nft.name || `#${nft.token_id}`}
      </div>
      
      <div className="mt-1 flex gap-2 text-xs justify-center text-muted-foreground">
        <span>Rank #{nft.extra_metadata?.rank || 'N/A'}</span>
        <span>· {nft.extra_metadata?.rarity_percent?.toFixed(2) || 'N/A'}%</span>
        <span className="uppercase">{nft.extra_metadata?.rarity_tier || 'N/A'}</span>
      </div>
      
      {hasAuction && auction ? (
        <div className="mt-3 w-full space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Starting Price:</span>
            <span className="font-medium">{formatPrice(auction.minimumBidPrice)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Current Bid:</span>
            <span className="font-medium">{formatPrice(auction.currentBid)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Ends in:</span>
            <span className="font-medium text-orange-500">
              {formatTimeRemaining(auction.endTimeInSeconds)}
            </span>
          </div>
          
          {auction.buyoutPrice && Number(auction.buyoutPrice) > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Buy Now:</span>
              <span className="font-medium text-green-500">
                {formatPrice(auction.buyoutPrice)}
              </span>
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1">
              Place Bid
            </Button>
            {auction.buyoutPrice && Number(auction.buyoutPrice) > 0 && (
              <Button size="sm" className="flex-1">
                Buy Now
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 text-center">
          <Badge variant="outline" className="rounded-sm">
            Not for sale
          </Badge>
        </div>
      )}
      
      <div className="mt-2 text-xs text-muted-foreground">
        Token #{nft.token_id}
      </div>
    </Card>
  );
});

NFTCard.displayName = "NFTCard";

// Grid UI component for raw collection NFTs with real auction data
export default function NFTCollectionGrid() {
  const { nfts, loading, error } = useCollectionNFTs();
  const { auctions } = useAuctionData();

  // Memoize the loading skeleton
  const loadingSkeleton = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-64 h-64 bg-muted rounded-sm animate-pulse" />
          <div className="mt-3 h-4 bg-muted rounded-sm w-24 animate-pulse" />
          <div className="mt-1 h-3 bg-muted rounded-sm w-16 animate-pulse" />
        </div>
      ))}
    </div>
  ), []);

  if (loading) {
    return loadingSkeleton;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading NFTs: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (nfts.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No NFTs found in collection
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <NFTCard key={(nft as NFTData).token_id} nft={nft as NFTData} auctions={auctions} />
        ))}
      </div>
    </TooltipProvider>
  );
}
