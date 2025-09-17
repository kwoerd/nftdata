import { useEffect, useState, useCallback } from "react";

interface NFTData {
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
}

interface CollectionStats {
  tokenCount?: number;
  ownerCount?: number;
  mintCount?: number;
  totalQuantity?: number;
}

interface Transfer {
  from_address: string;
  to_address: string;
  block_timestamp: string;
  block_number: number;
}

// Cache for NFT data to prevent redundant API calls
const nftCache = new Map<string, { data: NFTData; timestamp: number }>();
const collectionStatsCache = new Map<string, { data: CollectionStats; timestamp: number }>();
const transfersCache = new Map<string, { data: Transfer[]; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

export function useNFTData(tokenId: string) {
  const [nft, setNft] = useState<NFTData | null>(null);
  const [collectionStats, setCollectionStats] = useState<CollectionStats | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedNFT = nftCache.get(tokenId);
      if (cachedNFT && Date.now() - cachedNFT.timestamp < CACHE_DURATION) {
        setNft(cachedNFT.data);
        setLoading(false);
        return;
      }

      console.log("Fetching NFT for token ID:", tokenId);
      
      const url = `https://8453.insight.thirdweb.com/v1/nfts/${process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS}/${tokenId}?chain=8453`;
      
      const res = await fetch(url, {
        headers: {
          "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch NFT: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      const nftData = data.data?.[0] || data;
      
      // Cache the result
      nftCache.set(tokenId, { data: nftData, timestamp: Date.now() });
      setNft(nftData);
    } catch (err) {
      console.error("Error fetching NFT:", err);
      setError(`Error loading NFT: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  const fetchCollectionStats = useCallback(async () => {
    try {
      // Check cache first
      const cachedStats = collectionStatsCache.get("collection");
      if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_DURATION) {
        setCollectionStats(cachedStats.data);
        return;
      }

      const res = await fetch(
        `https://8453.insight.thirdweb.com/v1/nfts/collections/${process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS}?chain=8453&include_stats=true`,
        {
          headers: {
            "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0 && data.data[0].stats) {
          const stats = data.data[0].stats;
          const collectionStatsData = {
            ownerCount: stats.owner_count || 0,
            mintCount: stats.mint_count || 0,
            tokenCount: stats.token_count || 0,
            totalQuantity: stats.total_quantity || 0
          };
          
          // Cache the result
          collectionStatsCache.set("collection", { data: collectionStatsData, timestamp: Date.now() });
          setCollectionStats(collectionStatsData);
        }
      }
    } catch (err) {
      console.error("Error fetching collection stats:", err);
    }
  }, []);

  const fetchTransfers = useCallback(async () => {
    try {
      const tokenIdNum = parseInt(tokenId);
      if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
        setTransfers([]);
        return;
      }

      // Check cache first
      const cachedTransfers = transfersCache.get(tokenId);
      if (cachedTransfers && Date.now() - cachedTransfers.timestamp < CACHE_DURATION) {
        setTransfers(cachedTransfers.data);
        return;
      }

      const res = await fetch(
        `https://8453.insight.thirdweb.com/v1/nfts/transfers?chain=8453&contract_addresses=${process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS}&token_ids=${tokenIdNum}&sort_order=desc&limit=10`,
        {
          headers: {
            "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const transfersData = data.data || [];
        
        // Cache the result
        transfersCache.set(tokenId, { data: transfersData, timestamp: Date.now() });
        setTransfers(transfersData);
      }
    } catch (err) {
      console.error("Error fetching transfers:", err);
    }
  }, [tokenId]);

  useEffect(() => {
    fetchNFTData();
  }, [fetchNFTData]);

  useEffect(() => {
    fetchCollectionStats();
  }, [fetchCollectionStats]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  return { nft, collectionStats, transfers, loading, error };
}
