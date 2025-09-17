import { createThirdwebClient } from "thirdweb";
import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";

// Initialize Thirdweb client
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
});

// Get marketplace contract
export const marketplaceContract = getContract({
  client,
  address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!,
  chain: base,
});

// Get NFT collection contract
export const nftContract = getContract({
  client,
  address: process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!,
  chain: base,
});
