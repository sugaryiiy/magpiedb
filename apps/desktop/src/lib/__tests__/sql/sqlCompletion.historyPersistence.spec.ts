import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Selection history used to live only in a module-level Map: restarting the
// app forgot every learned ranking. It now round-trips through localStorage
// (the same store dialog sizes already use), loaded lazily and fail-soft so
// a corrupt store can never break the completion popup.
function memoryStorage(seed?: string) {
  let value: string | null = seed ?? null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
    removeItem: () => {
      value = null;
    },
    read: () => value,
  };
}

async function freshModule() {
  vi.resetModules();
  return import("@/lib/sql/sqlCompletion");
}

describe("SQL completion history persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("writes selections to storage on every accepted item", async () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    const { recordCompletionSelection } = await freshModule();
    recordCompletionSelection("COUNT", "function");
    recordCompletionSelection("COUNT", "function");
    recordCompletionSelection("company", "column");
    expect(JSON.parse(storage.read()!)).toEqual([
      ["function:COUNT", 2],
      ["column:company", 1],
    ]);
  });

  it("restores the ranking after a reload from stored counts", async () => {
    const storage = memoryStorage(JSON.stringify([["function:COUNT", 3]]));
    vi.stubGlobal("localStorage", storage);
    const { buildSqlCompletionItems } = await freshModule();
    const tables = [
      { name: "customers", type: "table" as const },
      { name: "companies", type: "table" as const },
      { name: "orders", type: "table" as const },
    ];
    const columnsByTable = new Map([
      [
        "customers",
        [
          { name: "company", table: "customers" },
          { name: "country", table: "customers" },
          { name: "id", table: "customers" },
        ],
      ],
    ]);
    const items = buildSqlCompletionItems("SELECT co FROM customers", 9, { tables, columnsByTable, databaseType: "mysql" });
    expect(items[0]).toMatchObject({ label: "COUNT", type: "function" });
  });

  it("ignores corrupt or wrong-shaped storage instead of failing", async () => {
    const storage = memoryStorage("{not json");
    vi.stubGlobal("localStorage", storage);
    const { buildSqlCompletionItems, recordCompletionSelection } = await freshModule();
    expect(() => recordCompletionSelection("COUNT", "function")).not.toThrow();
    const items = buildSqlCompletionItems("SELECT * FROM co", 16, {
      tables: [{ name: "counters", type: "table" as const }],
      columnsByTable: new Map(),
      databaseType: "mysql",
    });
    expect(items.length).toBeGreaterThan(0);
    // The fresh selection was still recorded in memory and persisted.
    expect(JSON.parse(storage.read()!)).toEqual([["function:COUNT", 1]]);
  });

  it("trims an oversized stored history back to the 512 cap", async () => {
    const seeded = Array.from({ length: 600 }, (_, i) => [`column:col_${i}`, 1]);
    const storage = memoryStorage(JSON.stringify(seeded));
    vi.stubGlobal("localStorage", storage);
    const { recordCompletionSelection } = await freshModule();
    recordCompletionSelection("fresh", "column");
    const stored = JSON.parse(storage.read()!) as unknown[];
    expect(stored.length).toBe(512);
    expect(stored[stored.length - 1]).toEqual(["column:fresh", 1]);
  });
});
