import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert";
import { parseAibStatementText } from "../src/lib/aibParser";

const text = readFileSync(new URL("./fixtures/aib-sample.txt", import.meta.url), "utf-8");

test("parses AIB-style statement text", () => {
  const result = parseAibStatementText(text, ["AIB Current", "Savings"]);

  assert.strictEqual(result.transactions.length, 5);
  const first = result.transactions[0];
  assert.strictEqual(first.description.includes("TESCO"), true);
  assert.strictEqual(first.amount < 0, true);

  const salary = result.transactions[1];
  assert.strictEqual(salary.amount > 0, true);

  const transfer = result.transactions[3];
  assert.strictEqual(transfer.isTransfer, true);

  assert.strictEqual(result.statementStart, "2024-01-01");
  assert.strictEqual(result.statementEnd, "2024-01-31");
});
