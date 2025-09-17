import { Card } from "@/components/ui/card";
import { useLiveAuctions } from "@/app/hooks/useLiveAuctions";

export default function NFTAuctionGrid() {
  const listings = useLiveAuctions();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {listings.map((item) => (
        <Card
          key={item.auctionId}
          className="p-4 flex flex-col items-center"
        >
          <img
            src={item.nftImg}
            alt={item.nftName}
            className="mb-3 w-40 h-40 object-cover rounded"
          />
          <div className="font-semibold">
            {item.nftName}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Token #{item.tokenId}
          </div>
          <div className="mt-2 text-lg font-bold">
            {item.currentBid} ETH
          </div>
          <div className="mt-1 text-xs">
            Ends:{" "}
            {new Date(
              Number(item.endTime) * 1000,
            ).toLocaleString()}
          </div>
        </Card>
      ))}
    </div>
  );
}
