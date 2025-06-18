import { ContractTemplate } from "@/types/bridge-execute";
import {
  SUPPORTED_CHAINS,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "avail-nexus-sdk";

// Import ABIs
import AAVE_ABI from "./abis/aave.json";
import LIDO_ABI from "./abis/lido.json";
import COMPOUND_ABI from "./abis/compound.json";

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "aave-deposit",
    name: "AAVE Deposit",
    description: "Deposit USDC into AAVE lending protocol to earn yield",
    icon: "🏦",
    category: "lending",

    // AAVE V3 Pool contract (Ethereum mainnet)
    contractAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    abi: AAVE_ABI,
    functionName: "supply",

    supportedChains: [SUPPORTED_CHAINS.ETHEREUM, SUPPORTED_CHAINS.POLYGON],
    supportedTokens: ["USDC"],

    inputFields: [
      {
        name: "referralCode",
        type: "select",
        label: "Referral Code",
        description: "Optional referral code for AAVE rewards",
        required: false,
        options: [
          { label: "None", value: "0" },
          { label: "Default", value: "0" },
        ],
      },
    ],

    expectedOutcome: "Earn ~3-5% APY on deposited USDC",
    riskLevel: "low",
    requiresEthValue: false,
  },

  {
    id: "lido-stake",
    name: "Lido ETH Staking",
    description: "Stake ETH with Lido to earn staking rewards",
    icon: "🔥",
    category: "staking",

    // Lido stETH contract (Ethereum mainnet)
    contractAddress: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    abi: LIDO_ABI,
    functionName: "submit",

    supportedChains: [SUPPORTED_CHAINS.ETHEREUM],
    supportedTokens: ["ETH"],

    inputFields: [
      {
        name: "referral",
        type: "address",
        label: "Referral Address",
        description: "Optional referral address for Lido rewards",
        placeholder: "0x...",
        required: false,
      },
    ],

    expectedOutcome: "Earn ~4% APR ETH staking rewards",
    riskLevel: "low",
    requiresEthValue: true,
  },

  {
    id: "compound-supply",
    name: "Compound Supply",
    description: "Supply USDC to Compound protocol for lending rewards",
    icon: "📈",
    category: "lending",

    // Compound cUSDC contract (Ethereum mainnet)
    contractAddress: "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
    abi: COMPOUND_ABI,
    functionName: "mint",

    supportedChains: [SUPPORTED_CHAINS.ETHEREUM],
    supportedTokens: ["USDC"],

    inputFields: [],

    expectedOutcome: "Earn ~2-4% APY plus COMP rewards",
    riskLevel: "low",
    requiresEthValue: false,
  },
];

// Helper function to get templates by chain
export const getTemplatesForChain = (
  chainId: SUPPORTED_CHAINS_IDS
): ContractTemplate[] => {
  return CONTRACT_TEMPLATES.filter((template) =>
    template.supportedChains.includes(chainId)
  );
};

// Helper function to get templates by token
export const getTemplatesForToken = (
  token: SUPPORTED_TOKENS
): ContractTemplate[] => {
  return CONTRACT_TEMPLATES.filter((template) =>
    template.supportedTokens.includes(token)
  );
};

// Helper function to get template by id
export const getTemplateById = (id: string): ContractTemplate | null => {
  return CONTRACT_TEMPLATES.find((template) => template.id === id) || null;
};
