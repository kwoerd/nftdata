import { useEffect, useState } from "react";

// Fetch NFTs directly from Insight API
export function useCollectionNFTs() {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNFTs() {
      try {
        setLoading(true);
        const response = await fetch(
          `https://8453.insight.thirdweb.com/v1/nfts/${process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS}?chain=8453&limit=20`,
          {
            headers: {
              "X-Client-Id": process.env.NEXT_PUBLIC_CLIENT_ID!,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch NFTs: ${response.status}`);
        }
        
        const json = await response.json();
        setNfts(json.data ?? []);
      } catch (err) {
        console.error("Error fetching NFTs:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch NFTs");
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, []);

  return { nfts, loading, error };
}
