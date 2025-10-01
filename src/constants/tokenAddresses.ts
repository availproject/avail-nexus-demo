import {
  SUPPORTED_TOKENS,
  SUPPORTED_CHAINS_IDS,
} from "@avail-project/nexus-core";

type TokenAddressMap = {
  [key in SUPPORTED_TOKENS]?: string;
};

type ChainAddressMap = {
  [key in SUPPORTED_CHAINS_IDS]?: TokenAddressMap;
};

const tokenAddresses: ChainAddressMap = {
  8453: {
    // Base
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
};

type ProtocolContracts = {
  [key: string]: {
    [key in SUPPORTED_CHAINS_IDS]?: { [key: string]: string };
  };
};

export const protocolContracts: ProtocolContracts = {
  aave: {
    8453: {
      // Base
      POOL: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    },
  },
};

export const getTokenAddress = (
  token: SUPPORTED_TOKENS,
  chainId: SUPPORTED_CHAINS_IDS,
): string | undefined => {
  if (token === "ETH") {
    return undefined;
  }
  return tokenAddresses[chainId]?.[token];
};

export const getTokenDecimals = (token: SUPPORTED_TOKENS): number => {
  switch (token) {
    case "ETH":
      return 18;
    case "USDC":
    case "USDT":
      return 6;
    default:
      return 18; // Default to 18 decimals for unknown tokens
  }
};
