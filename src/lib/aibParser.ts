import crypto from "crypto";
import { isTransferDescription, matchCategory } from "./categorize";

export type ParsedTransaction = {
  date: string;
  description: string;
  amount: number;
  currency: string;
  raw: string;
  confidence: number;
  isTransfer: boolean;
  categoryName?: string | null;
  extra?: string[];
  hash: string;
};

export type ParseResult = {
  transactions: ParsedTransaction[];
  statementStart?: string;
  statementEnd?: string;
  warnings: string[];
};

const DATE_REGEX = /^(\d{2}\/\d{2}\/\d{2,4})/;
const AMOUNT_REGEX = /(-?\d{1,3}(?:,\d{3})*\.\d{2})/g;

function parseAmount(raw: string) {
  return Number.parseFloat(raw.replace(/,/g, ""));
}

function parseDate(raw: string) {
  const [day, month, yearRaw] = raw.split("/");
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year}-${month}-${day}`;
}

function extractStatementPeriod(text: string) {
  const periodRegex = /(\d{2}\/\d{2}\/\d{2,4})\s*(?:to|-)\s*(\d{2}\/\d{2}\/\d{2,4})/i;
  const match = text.match(periodRegex);
  if (!match) return {};
  return {
    statementStart: parseDate(match[1]),
    statementEnd: parseDate(match[2])
  };
}

function createHash(date: string, description: string, amount: number, accountId = "", currency = "EUR") {
  const input = `${date}|${description}|${amount.toFixed(2)}|${accountId}|${currency}`;
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function parseAibStatementText(text: string, accountNames: string[] = []) : ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];
  let current: ParsedTransaction | null = null;
  let lastBalance: number | null = null;

  for (const line of lines) {
    const dateMatch = line.match(DATE_REGEX);
    if (dateMatch) {
      if (current) {
        transactions.push(current);
      }

      const amounts = Array.from(line.matchAll(AMOUNT_REGEX)).map((match) => parseAmount(match[1]));
      const date = parseDate(dateMatch[1]);
      let description = line.replace(DATE_REGEX, "").trim();

      let amount = 0;
      let confidence = 0.5;

      if (amounts.length >= 2) {
        const balance = amounts[amounts.length - 1];
        const first = amounts[0];
        const second = amounts.length === 3 ? amounts[1] : null;

        if (amounts.length === 3) {
          const debit = first;
          const credit = second ?? 0;
          amount = debit !== 0 ? -Math.abs(debit) : Math.abs(credit);
          confidence = 0.8;
          description = description.replace(balance.toFixed(2), "").replace(credit.toFixed(2), "").replace(debit.toFixed(2), "").trim();
        } else {
          if (lastBalance !== null) {
            const delta = balance - lastBalance;
            if (Math.abs(delta - Math.abs(first)) < 0.02) {
              amount = Math.abs(first);
              confidence = 0.75;
            } else if (Math.abs(delta + Math.abs(first)) < 0.02) {
              amount = -Math.abs(first);
              confidence = 0.75;
            } else {
              amount = description.match(/\bCR\b|\bCREDIT\b/i) ? Math.abs(first) : -Math.abs(first);
              confidence = 0.5;
            }
          } else {
            amount = description.match(/\bCR\b|\bCREDIT\b/i) ? Math.abs(first) : -Math.abs(first);
            confidence = 0.5;
          }
          description = description.replace(balance.toFixed(2), "").replace(first.toFixed(2), "").trim();
        }

        lastBalance = balance;
      } else {
        warnings.push(`Could not parse amounts for line: ${line}`);
        amount = 0;
        confidence = 0.2;
      }

      const categoryName = matchCategory(description);
      const isTransfer = isTransferDescription(description, accountNames);

      current = {
        date,
        description,
        amount,
        currency: "EUR",
        raw: line,
        confidence,
        isTransfer,
        categoryName,
        extra: [],
        hash: createHash(date, description, amount)
      };
    } else if (current) {
      current.extra?.push(line);
      current.description = `${current.description} ${line}`.trim();
      current.confidence = Math.max(0.35, current.confidence - 0.1);
    }
  }

  if (current) {
    transactions.push(current);
  }

  const period = extractStatementPeriod(text);

  if (transactions.length === 0) {
    warnings.push("No transactions were detected. Check PDF quality or formatting.");
  }

  return {
    transactions,
    warnings,
    statementStart: period.statementStart,
    statementEnd: period.statementEnd
  };
}

export function computeHash(date: string, description: string, amount: number, accountId: string, currency: string) {
  return createHash(date, description, amount, accountId, currency);
}
