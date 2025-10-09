import { ContractTemplate } from "@/types/bridge-execute";
import {
  SUPPORTED_CHAINS,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "@avail-project/nexus-core";

// Import only the needed ABI
import AAVE_ABI from "./abis/aave.json";

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "aave-deposit-base",
    name: "AAVE Deposit (Base)",
    description: "Deposit USDC into AAVE V3 on Base to earn yield",
    icon: "🏦",
    category: "lending",

    // AAVE V3 Pool contract (Base)
    contractAddress: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5", // Base Pool address
    abi: AAVE_ABI,
    functionName: "supply",

    supportedChains: [SUPPORTED_CHAINS.BASE], // Base chain ID: 8453
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

    expectedOutcome: "Earn ~2-4% APY on deposited USDC",
    riskLevel: "low",
    requiresEthValue: false,
  },
];

// Helper function to get templates by chain
export const getTemplatesForChain = (
  chainId: SUPPORTED_CHAINS_IDS,
): ContractTemplate[] => {
  return CONTRACT_TEMPLATES.filter((template) =>
    template.supportedChains.includes(chainId),
  );
};

// Helper function to get templates by token
export const getTemplatesForToken = (
  token: SUPPORTED_TOKENS,
): ContractTemplate[] => {
  return CONTRACT_TEMPLATES.filter((template) =>
    template.supportedTokens.includes(token),
  );
};

// Helper function to get template by id
export const getTemplateById = (id: string): ContractTemplate | null => {
  return CONTRACT_TEMPLATES.find((template) => template.id === id) || null;
};
