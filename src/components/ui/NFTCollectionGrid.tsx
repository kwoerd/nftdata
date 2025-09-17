import { useCollectionNFTs } from "@/app/hooks/useCollectionNFTs";
import { useAuctionData } from "@/app/hooks/useAuctionData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";

// Grid UI component for raw collection NFTs with real auction data
export default function NFTCollectionGrid() {
  const { nfts, loading, error } = useCollectionNFTs();
  const { auctions } = useAuctionData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-64 h-64 bg-muted rounded-sm animate-pulse" />
            <div className="mt-3 h-4 bg-muted rounded-sm w-24 animate-pulse" />
            <div className="mt-1 h-3 bg-muted rounded-sm w-16 animate-pulse" />
          </div>
        ))}
      </div>
    );
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

  // Helper function to get auction data for an NFT
  const getAuctionForNFT = (tokenId: string) => {
    return auctions.find(auction => auction.tokenId === tokenId);
  };

  // Helper function to format price
  const formatPrice = (price: string) => {
    const numPrice = Number(price);
    if (numPrice === 0) return "No bids";
    return `${(numPrice / 1e18).toFixed(4)} ETH`;
  };

  // Helper function to format time remaining
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

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {nfts.map((nft) => {
          const nftData = nft as { token_id: string; name?: string; image_url?: string; extra_metadata?: { image_url?: string; rank?: number; rarity_percent?: number; rarity_tier?: string } };
          const auction = getAuctionForNFT(nftData.token_id);
          const hasAuction = auction && auction.status === "CREATED";
          
          return (
            <Card key={nftData.token_id} className="flex flex-col items-center p-4">
              <Link href={`/nft/${nftData.token_id}`}>
                <img
                  src={nftData.extra_metadata?.image_url ?? nftData.image_url}
                  alt={`${nftData.name} NFT image`}
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    // Fallback for broken images
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </Link>
              
              <div className="mt-3 font-medium text-center">
                {nftData.name || `#${nftData.token_id}`}
              </div>
              
              <div className="mt-1 flex gap-2 text-xs justify-center text-muted-foreground">
                <span>Rank #{nftData.extra_metadata?.rank || 'N/A'}</span>
                <span>· {nftData.extra_metadata?.rarity_percent?.toFixed(2) || 'N/A'}%</span>
                <span className="uppercase">{nftData.extra_metadata?.rarity_tier || 'N/A'}</span>
              </div>
              
              {hasAuction ? (
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
                Token #{nftData.token_id}
              </div>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
