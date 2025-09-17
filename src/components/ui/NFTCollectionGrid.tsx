import { Card } from "@/components/ui/card";
import { useCollectionNFTs } from "@/app/hooks/useCollectionNFTs";

// Grid UI component for raw collection NFTs
export default function NFTCollectionGrid() {
  const { nfts, loading, error } = useCollectionNFTs();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-64 h-64 bg-neutral-800 rounded-[4px] animate-pulse" />
            <div className="mt-3 h-4 bg-neutral-800 rounded w-24 animate-pulse" />
            <div className="mt-1 h-3 bg-neutral-800 rounded w-16 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Error loading NFTs: {error}</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-400">No NFTs found in collection</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {nfts.map((nft) => (
        <div
          key={nft.token_id}
          className="flex flex-col items-center hover:opacity-90 transition-opacity"
        >
          <img
            src={
              nft.extra_metadata?.image_url ?? nft.image_url
            }
            alt={nft.name}
            className="w-64 h-64 object-contain rounded-[4px]"
            onError={(e) => {
              // Fallback for broken images
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666'%3ENo Image%3C/text%3E%3C/svg%3E";
            }}
          />
          <div className="mt-3 font-semibold text-neutral-100 text-center">
            {nft.name || `#${nft.token_id}`}
          </div>
        </div>
      ))}
    </div>
  );
}
