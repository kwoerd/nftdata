import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AuctionGridCardProps {
  nft: {
    token_id: string;
    name: string;
    image_url?: string;
    extra_metadata?: {
      image_url?: string;
      rank?: number;
      rarity_percent?: number;
      rarity_tier?: string;
    };
  };
  auction: {
    endsAt: number;
    bidCount: number;
    currentBid: string;
  };
}

export function AuctionGridCard({ nft, auction }: AuctionGridCardProps) {
  const endDate = new Date(Number(auction.endsAt) * 1000).toLocaleString();
  
  return (
    <Card className="flex flex-col items-center p-4 bg-transparent border-neutral-800">
      <Link href={`/nft/${nft.token_id}`}>
        <img
          src={nft.extra_metadata?.image_url ?? nft.image_url}
          alt={nft.name}
          className="w-64 h-64 object-contain rounded-[4px] hover:opacity-90 transition-opacity"
        />
      </Link>
      <div className="mt-3 font-semibold text-white">{nft.name}</div>
      <div className="flex gap-2 text-xs mt-1 text-gray-400">
        <span>Rank #{nft.extra_metadata?.rank || 'N/A'}</span>
        <span>· {nft.extra_metadata?.rarity_percent?.toFixed(2) || 'N/A'}%</span>
        <span className="uppercase">{nft.extra_metadata?.rarity_tier || 'N/A'}</span>
      </div>
      <div className="text-xs mt-2 flex gap-2 text-gray-300">
        <span>Ends: {endDate}</span>
        <span>· Bids: {auction.bidCount}</span>
        <span>· Current: {auction.currentBid} ETH</span>
      </div>
      <form className="flex gap-2 mt-4">
        <input 
          type="number" 
          step="any" 
          min="0" 
          className="px-2 py-1 w-20 rounded bg-neutral-800 text-neutral-100 border border-neutral-700" 
          placeholder="Bid (ETH)" 
          name="bid" 
        />
        <Button size="sm" variant="outline" type="submit">
          Place Bid
        </Button>
        <Button size="sm" className="bg-pink-500 hover:bg-pink-600 ml-2" type="button">
          Buy Now
        </Button>
      </form>
    </Card>
  );
}
