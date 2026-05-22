export type WalletType = "mobile-wallet" | "bank" | "fintech";

export type WalletCategoryDef = {
  name: string;
  budget?: number;
};

export type WalletProvider = {
  key: string;
  name: string;
  color: string;
  type: WalletType;
  defaultOpening?: number;
  categories?: WalletCategoryDef[];
};

const NAYAPAY_CATEGORIES: WalletCategoryDef[] = [
  { name: "Rent", budget: 28000 },
  { name: "Cylinder", budget: 5000 },
  { name: "Internet", budget: 1700 },
  { name: "Jazz Pkg", budget: 1800 },
  { name: "Doctor Fee", budget: 7000 },
  { name: "Bike Oil", budget: 3000 },
  { name: "Grocery/Meat", budget: 20000 },
  { name: "Donation", budget: 5000 },
  { name: "Zuni's Pocket Money", budget: 10000 },
  { name: "Fruits", budget: 5000 },
  { name: "Investment", budget: 10000 },
  { name: "Egg/Bread", budget: 3000 },
  { name: "Committee", budget: 7000 },
  { name: "Petrol", budget: 10000 },
];

const JAZZCASH_CATEGORIES: WalletCategoryDef[] = [
  { name: "Milk", budget: 5000 },
  { name: "Yogurt", budget: 5000 },
  { name: "Vegetables", budget: 5000 },
];

export const PAKISTANI_WALLET_CATALOG: WalletProvider[] = [
  {
    key: "jazzcash",
    name: "JazzCash",
    color: "#d11111",
    type: "mobile-wallet",
    defaultOpening: 15000,
    categories: JAZZCASH_CATEGORIES,
  },
  {
    key: "easypaisa",
    name: "Easypaisa",
    color: "#00ae42",
    type: "mobile-wallet",
  },
  {
    key: "nayapay",
    name: "NayaPay",
    color: "#ff6b00",
    type: "mobile-wallet",
    defaultOpening: 100000,
    categories: NAYAPAY_CATEGORIES,
  },
  {
    key: "sadapay",
    name: "SadaPay",
    color: "#6c5ce7",
    type: "mobile-wallet",
  },
  {
    key: "upaisa",
    name: "UPaisa",
    color: "#0078ff",
    type: "mobile-wallet",
  },
  {
    key: "keenu",
    name: "Keenu Wallet",
    color: "#1f4e79",
    type: "mobile-wallet",
  },
  {
    key: "finja",
    name: "Finja (OPay)",
    color: "#00a651",
    type: "fintech",
  },
  {
    key: "meezan-bank",
    name: "Meezan Bank",
    color: "#0e5138",
    type: "bank",
    defaultOpening: 25000,
  },
  {
    key: "hbl",
    name: "HBL",
    color: "#008269",
    type: "bank",
  },
  {
    key: "ubl",
    name: "UBL",
    color: "#004692",
    type: "bank",
  },
  {
    key: "mcb",
    name: "MCB Bank",
    color: "#003876",
    type: "bank",
  },
  {
    key: "bank-alfalah",
    name: "Bank Alfalah",
    color: "#e21836",
    type: "bank",
  },
  {
    key: "allied-bank",
    name: "Allied Bank",
    color: "#004b87",
    type: "bank",
  },
  {
    key: "faysal-bank",
    name: "Faysal Bank",
    color: "#0057a0",
    type: "bank",
  },
  {
    key: "bank-al-habib",
    name: "Bank Al Habib",
    color: "#007a33",
    type: "bank",
  },
  {
    key: "askari-bank",
    name: "Askari Bank",
    color: "#0054a6",
    type: "bank",
  },
  {
    key: "js-bank",
    name: "JS Bank",
    color: "#800020",
    type: "bank",
  },
  {
    key: "soneri-bank",
    name: "Soneri Bank",
    color: "#c99700",
    type: "bank",
  },
  {
    key: "standard-chartered-pk",
    name: "Standard Chartered",
    color: "#0473ea",
    type: "bank",
  },
  {
    key: "dubai-islamic-pk",
    name: "Dubai Islamic Bank",
    color: "#006747",
    type: "bank",
  },
  {
    key: "silkbank",
    name: "Silkbank",
    color: "#7b2cbf",
    type: "bank",
  },
  {
    key: "bankislami",
    name: "BankIslami",
    color: "#006a4e",
    type: "bank",
  },
  {
    key: "summit-bank",
    name: "Summit Bank",
    color: "#003366",
    type: "bank",
  },
  {
    key: "habib-metro",
    name: "Habib Metro Bank",
    color: "#005eb8",
    type: "bank",
  },
  {
    key: "nrsp",
    name: "NRSP Bank",
    color: "#2d6a4f",
    type: "bank",
  },
  {
    key: "payoneer",
    name: "Payoneer",
    color: "#ff4800",
    type: "fintech",
  },
  {
    key: "cash",
    name: "Cash",
    color: "#64748b",
    type: "fintech",
  },
];

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  "mobile-wallet": "Mobile Wallets",
  bank: "Banks",
  fintech: "Fintech & Other",
};

export function getWalletProvider(key: string) {
  return PAKISTANI_WALLET_CATALOG.find((provider) => provider.key === key);
}

export function getWalletProvidersByType() {
  const groups: Record<WalletType, WalletProvider[]> = {
    "mobile-wallet": [],
    bank: [],
    fintech: [],
  };

  for (const provider of PAKISTANI_WALLET_CATALOG) {
    groups[provider.type].push(provider);
  }

  return groups;
}
