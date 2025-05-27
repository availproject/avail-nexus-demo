import { SUPPORTED_CHAINS } from "avail-nexus-sdk";
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  avalanche,
  linea,
  Chain,
  scroll,
} from "viem/chains";
export const INITIAL_CHAIN = SUPPORTED_CHAINS.ETHEREUM;

export const chainIcons: Record<number, string> = {
  [SUPPORTED_CHAINS.ETHEREUM]:
    "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  [SUPPORTED_CHAINS.BASE]:
    "https://raw.githubusercontent.com/base/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg",
  [SUPPORTED_CHAINS.ARBITRUM]:
    "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  [SUPPORTED_CHAINS.OPTIMISM]:
    "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  [SUPPORTED_CHAINS.POLYGON]:
    "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  [SUPPORTED_CHAINS.AVALANCHE]:
    "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  [SUPPORTED_CHAINS.LINEA]:
    "https://assets.coingecko.com/asset_platforms/images/135/small/linea.jpeg?1706606705",
  [SUPPORTED_CHAINS.SCROLL]:
    "https://assets.coingecko.com/coins/images/50571/standard/scroll.jpg?1728376125",
} as const;

export const chainData: Record<number, Chain> = {
  [SUPPORTED_CHAINS.ETHEREUM]: mainnet,
  [SUPPORTED_CHAINS.BASE]: base,
  [SUPPORTED_CHAINS.ARBITRUM]: arbitrum,
  [SUPPORTED_CHAINS.OPTIMISM]: optimism,
  [SUPPORTED_CHAINS.POLYGON]: polygon,
  [SUPPORTED_CHAINS.AVALANCHE]: avalanche,
  [SUPPORTED_CHAINS.LINEA]: linea,
  [SUPPORTED_CHAINS.SCROLL]: scroll,
} as const;

export const AVAILABLE_TOKENS = [
  {
    symbol: "ETH",
    icon: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628",
  },
  {
    symbol: "USDT",
    icon: "https://coin-images.coingecko.com/coins/images/35023/large/USDT.png",
  },
  {
    symbol: "USDC",
    icon: "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
  },
];
