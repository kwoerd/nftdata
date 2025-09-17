"use client";

import { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useAuctionDataForNFT } from "@/app/hooks/useAuctionData";
import { useBidDataForAuction } from "@/app/hooks/useBidData";
import { Footer } from "@/components/Footer";
import Link from "next/link";

interface NFTDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NFTDetailsPage({ params }: NFTDetailsPageProps) {
  const [nft, setNft] = useState<unknown>(null);
  const [collectionStats, setCollectionStats] = useState<{ 
    tokenCount?: number;
    ownerCount?: number;
    mintCount?: number;
    totalQuantity?: number;
  } | null>(null);
  const [transfers, setTransfers] = useState<Array<{
    from_address: string;
    to_address: string;
    block_timestamp: string;
    block_number: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Unwrap params with React.use() for Next.js 15 compatibility
  const { id } = use(params);
  
  // Get auction data for this specific NFT
  const { auction } = useAuctionDataForNFT(id);
  
  // Get bid data for this auction
  const { bidCount, highestBid } = useBidDataForAuction(auction?.id || "");

  // Fetch live NFT data from Insight
  useEffect(() => {
    async function fetchNft() {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching NFT for token ID:", id);
        console.log("Collection Address:", process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS);
        
        // Use the individual NFT endpoint - this works correctly!
        const url = `https://8453.insight.thirdweb.com/v1/nfts/${process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS}/${id}?chain=8453`;
        console.log("NFT Fetch URL:", url);
        
        const res = await fetch(url, {
          headers: {
            "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
          },
        });
        
        console.log("NFT Response status:", res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("NFT fetch failed:", res.status, errorText);
          throw new Error(`Failed to fetch NFT: ${res.status} - ${errorText}`);
        }
        
        const data = await res.json();
        console.log("NFT Data received:", data);
        // The API returns data in a 'data' array, so we need to get the first item
        if (data.data && data.data.length > 0) {
          setNft(data.data[0]);
        } else {
          setNft(data); // Fallback if data structure is different
        }
      } catch (err) {
        console.error("Error fetching NFT:", err);
        setError(`Error loading NFT: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
    fetchNft();
  }, [id]);

  // Fetch collection stats
  useEffect(() => {
    async function fetchCollectionStats() {
      try {
        console.log("Fetching collection stats for token ID:", id);
        
        // Use the collections endpoint with stats for the NFT collection
        const res = await fetch(
          `https://8453.insight.thirdweb.com/v1/nfts/collections/${process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS}?chain=8453&include_stats=true`,
          {
            headers: {
              "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
            },
          }
        );
        
        console.log("Collection stats response status:", res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log("Collection stats data:", data);
          
          // The API returns data in a 'data' array, get the first collection
          if (data.data && data.data.length > 0 && data.data[0].stats) {
            const stats = data.data[0].stats;
            setCollectionStats({
              ownerCount: stats.owner_count || 0,
              mintCount: stats.mint_count || 0,
              tokenCount: stats.token_count || 0,
              totalQuantity: stats.total_quantity || 0
            });
          } else {
            console.log("No stats found in collection data");
            setCollectionStats(null);
          }
        } else {
          console.log("Collection stats API failed:", res.status);
          setCollectionStats(null);
        }
      } catch (err) {
        console.error("Error fetching collection stats:", err);
        setCollectionStats(null);
      }
    }
    fetchCollectionStats();
  }, [id]);

  // Fetch NFT transfers (sales/ownership changes) for this specific token
  useEffect(() => {
    async function fetchTransfers() {
      try {
        console.log("Fetching transfers for token ID:", id, "with type", typeof id);
        
        // Check if token ID is valid (greater than 0)
        const tokenId = parseInt(id);
        if (isNaN(tokenId) || tokenId <= 0) {
          console.log("Invalid token ID, skipping transfers fetch");
          setTransfers([]);
          return;
        }
        
        // Get transfers for this specific NFT token
        const res = await fetch(
          `https://8453.insight.thirdweb.com/v1/nfts/transfers?chain=8453&contract_addresses=${process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS}&token_ids=${tokenId}&sort_order=desc&limit=10`,
          {
            headers: {
              "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
            },
          }
        );
        
        console.log("Transfers response status:", res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log("Transfers data:", data);
          setTransfers(data.data || []);
        } else {
          console.log("No transfers found for token ID:", tokenId);
          setTransfers([]);
        }
      } catch (err) {
        console.error("Error fetching transfers:", err);
        setTransfers([]);
      }
    }
    fetchTransfers();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">NFT not found</div>
      </div>
    );
  }

  // Helper functions for auction data
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

  const endDate = auction?.endTimeInSeconds 
    ? new Date(Number(auction.endTimeInSeconds) * 1000).toLocaleString()
    : null;
  
  const currentBid = auction?.currentBid || auction?.minimumBidPrice;
  const startingPrice = auction?.minimumBidPrice;
  const buyNowPrice = auction?.buyoutPrice;
  const isActive = auction?.status === "CREATED";

  // Type the NFT data properly
  const nftData = nft as {
    name?: string;
    image_url?: string;
    token_id?: string;
    extra_metadata?: {
      image_url?: string;
      rank?: number;
      rarity_percent?: number;
      rarity_tier?: string;
      card_number?: string;
      collection_number?: string;
      edition?: string;
      series?: string;
      rarity_score?: string;
      artist?: string;
      platform?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    };
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background py-10">
        <div className="mx-auto max-w-6xl px-4">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/?view=nft">NFT Collection</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{nftData.name || `NFT #${id}`}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card className="p-8">
          <div className="flex gap-10 flex-col md:flex-row">
            <img 
              src={nftData.extra_metadata?.image_url ?? nftData.image_url} 
              alt={`${nftData.name || 'NFT'} image`}
              className="w-96 h-96 object-contain"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='384' height='384' viewBox='0 0 384 384'%3E%3Crect width='384' height='384' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666'%3ENo Image%3C/text%3E%3C/svg%3E";
              }}
            />
            <div className="flex-1">
              <h1 className="text-2xl font-medium">{nftData.name}</h1>
              
              {/* Rarity badges */}
              <div className="flex gap-2 mt-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="rounded-sm">
                      Rank #{nftData.extra_metadata?.rank || 'N/A'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>NFT rank within the collection</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="rounded-sm">
                      {nftData.extra_metadata?.rarity_percent?.toFixed(2) || 'N/A'}%
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rarity percentage compared to other NFTs</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="rounded-sm uppercase">
                      {nftData.extra_metadata?.rarity_tier || 'N/A'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rarity tier classification</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Pricing Cards */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2 font-normal">Starting Price</div>
                  <div className="text-xl font-medium">
                    {isActive ? formatPrice(startingPrice || "0") : "N/A"}
                  </div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2 font-normal">Current Bid</div>
                  <div className="text-xl font-medium">
                    {isActive ? formatPrice(currentBid || "0") : "N/A"}
                  </div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2 font-normal">Buy Now Price</div>
                  <div className="text-xl font-medium">
                    {isActive && buyNowPrice ? formatPrice(buyNowPrice) : "N/A"}
                  </div>
                </Card>
              </div>

              {/* Details Card */}
              <Card className="mt-6 p-6">
                <h3 className="text-lg font-medium mb-5">Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground font-normal">NFT Number</div>
                    <div className="font-normal">{nftData.extra_metadata?.card_number || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-normal">Token ID</div>
                    <div className="font-normal">{nftData.token_id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-normal">Collection</div>
                    <div className="font-normal">{nftData.extra_metadata?.collection_number || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-normal">Edition</div>
                    <div className="font-normal">{nftData.extra_metadata?.edition || 'N/A'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground font-normal">Series</div>
                    <div className="font-normal">{nftData.extra_metadata?.series || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-normal">Rarity Tier</div>
                    <div className="font-normal">{nftData.extra_metadata?.rarity_tier || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-normal">Rarity Score</div>
                    <div className="font-normal">{nftData.extra_metadata?.rarity_score || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-normal">Rank</div>
                    <div className="font-normal">{nftData.extra_metadata?.rank ? `#${nftData.extra_metadata.rank} of ${collectionStats?.tokenCount || 'N/A'}` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-normal">Rarity Percentage</div>
                    <div className="font-normal">{nftData.extra_metadata?.rarity_percent ? `${nftData.extra_metadata.rarity_percent}%` : 'N/A'}</div>
                  </div>
                </div>
              </Card>

              <Separator className="my-6" />

              {/* Creator Info */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground font-normal">Artist</div>
                  <div className="font-normal">{nftData.extra_metadata?.artist || 'N/A'}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground font-normal">Platform</div>
                  <div className="font-normal">{nftData.extra_metadata?.platform || 'N/A'}</div>
                </Card>
              </div>

              <Separator className="my-6" />

              {/* Tabs for Traits and History */}
              <Tabs defaultValue="traits" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="traits">Traits</TabsTrigger>
                  <TabsTrigger value="history">Ownership History</TabsTrigger>
                </TabsList>
                <TabsContent value="traits" className="mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {(nft as { extra_metadata?: { attributes?: unknown[] } })?.extra_metadata?.attributes?.map((attr: unknown) => {
                      const attrData = attr as { trait_type: string; value: string };
                      return (
                        <Card key={attrData.trait_type} className="p-3">
                          <div className="text-muted-foreground font-normal text-xs">{attrData.trait_type}</div>
                          <div className="font-normal text-xs">{attrData.value}</div>
                        </Card>
                      );
                    }) || (
                      <div className="text-muted-foreground text-sm">No traits available</div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  {transfers.length > 0 ? (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                      {transfers.map((transfer, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-normal">
                                {transfer.from_address === "0x0000000000000000000000000000000000000000" 
                                  ? "Minted" 
                                  : `Transferred from ${transfer.from_address.slice(0, 6)}...${transfer.from_address.slice(-4)}`}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                To: {transfer.to_address.slice(0, 6)}...{transfer.to_address.slice(-4)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-muted-foreground text-xs">
                                {new Date(transfer.block_timestamp).toLocaleDateString()}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Block #{transfer.block_number}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-muted-foreground text-sm">No transfer history available</div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Auction Status */}
              <Card className="mt-6 p-4">
                <div className="text-sm text-muted-foreground">Auction Status:</div>
                <div className="font-medium">
                  {isActive ? "Active" : "No active auction"}
                </div>
                {isActive && (
                  <>
                    <div className="text-sm text-muted-foreground mt-1">Auction Ends:</div>
                    <div className="font-medium">{endDate}</div>
                    <div className="text-sm text-muted-foreground mt-1">Time Remaining:</div>
                    <div className="font-medium text-orange-500">
                      {auction ? formatTimeRemaining(auction.endTimeInSeconds) : "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Bids Placed:</div>
                    <div className="font-medium">{bidCount}</div>
                  </>
                )}
              </Card>

              {/* Bidding Interface */}
              {isActive && (
                <Card className="mt-4 p-4">
                  <h3 className="text-lg font-medium mb-4">Place Your Bid</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="bid-amount" className="sr-only">Bid Amount</Label>
                      <Input
                        id="bid-amount"
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="font-medium">ETH</div>
                    <Button variant="secondary">
                      PLACE BID
                    </Button>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="mb-2">{bidCount} bids placed</Badge>
                    <div>Minimum bid: {formatPrice(startingPrice || "0")}</div>
                    {auction?.seller && (
                      <div className="mt-1">Seller: {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}</div>
                    )}
                    {highestBid?.bidder && (
                      <div className="mt-1">Highest bidder: {highestBid.bidder.slice(0, 6)}...{highestBid.bidder.slice(-4)}</div>
                    )}
                  </div>
                </Card>
              )}

              {/* Buy Now Section */}
              {isActive && buyNowPrice && (
                <Card className="mt-4 p-4">
                  <div className="text-sm text-muted-foreground">Buy Now Price: {formatPrice(buyNowPrice)}</div>
                  <Button variant="secondary" className="mt-2">
                    BUY NOW
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </Card>
        </div>
        <Footer />
      </div>
    </TooltipProvider>
  );
}
