export type CategoryRule = {
  keywords: string[];
  category: string;
  group?: string;
};

export const CATEGORY_RULES: CategoryRule[] = [
  { keywords: ["TESCO", "LIDL", "ALDI"], category: "Groceries" },
  { keywords: ["BORD GAIS", "ELECTRIC", "EIR", "GAS"], category: "Utilities" },
  { keywords: ["EFLOW", "TOLL"], category: "Transport" },
  { keywords: ["AMAZON"], category: "Shopping" },
  { keywords: ["DELIVEROO", "JUST EAT", "UBER EATS"], category: "Dining" },
  { keywords: ["VHI", "MED", "PHARM"], category: "Medical" },
  { keywords: ["PET", "VET"], category: "Pet" },
  { keywords: ["CRECHE", "NURSERY"], category: "Baby" },
  { keywords: ["NETFLIX", "SPOTIFY", "DISNEY", "APPLE"], category: "Subscriptions" },
  { keywords: ["FEE", "CHG", "CHARGE"], category: "Fees" }
];

export const TRANSFER_KEYWORDS = ["MOBI", "SAVINGS", "TRANSFER", "INT ACC", "INTERNAL"];

export function matchCategory(description: string): string | null {
  const upper = description.toUpperCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => upper.includes(keyword))) {
      return rule.category;
    }
  }
  return null;
}

export function isTransferDescription(description: string, accountNames: string[]) {
  const upper = description.toUpperCase();
  if (TRANSFER_KEYWORDS.some((keyword) => upper.includes(keyword))) {
    return true;
  }
  return accountNames.some((name) => upper.includes(name.toUpperCase()));
}
