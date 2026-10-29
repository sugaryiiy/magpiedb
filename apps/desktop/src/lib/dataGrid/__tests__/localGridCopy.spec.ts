import { afterEach, describe, expect, it, vi } from "vitest";
import { extractDataGridSelection } from "@/lib/backend/http";
import { localGridCopy } from "../localGridCopy";
import { DEFAULT_DATA_GRID_EXTRACTOR_OPTIONS, type DataGridExtractRequest } from "../dataGridCopyExtractor";

const request: DataGridExtractRequest = {
  version: 1,
  extractor: "tsv",
  columns: [
    { displayName: "a", sourceIndex: 0 },
    { displayName: "b", sourceIndex: 1 },
  ],
  selectedColumnIndexes: [1, 0],
  rows: [
    ["a\tb", 1],
    [null, "line\nnext"],
  ],
  selectionKind: "cells",
  options: DEFAULT_DATA_GRID_EXTRACTOR_OPTIONS,
};

afterEach(() => vi.unstubAllGlobals());

describe("localGridCopy", () => {
  it("copies through the backend adapter without requesting the unmigrated endpoint", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("unmigrated endpoint"));
    vi.stubGlobal("fetch", fetch);
    expect(await extractDataGridSelection(request)).toMatchObject({ text: '1\t"a\tb"\n"line\nnext"\t', rowCount: 2, columnCount: 2 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("copies a single cell including empty values", () => {
    expect(localGridCopy({ ...request, extractor: "raw", selectedColumnIndexes: [0], rows: [[null]] })?.text).toBe("");
    expect(localGridCopy({ ...request, extractor: "raw", selectedColumnIndexes: [0], rows: [["hello"]] })?.text).toBe("hello");
  });
  it("copies a selected rectangle in display order and escapes embedded delimiters", () => {
    expect(localGridCopy(request)?.text).toBe('1\t"a\tb"\n"line\nnext"\t');
    expect(localGridCopy({ ...request, extractor: "tsv-with-headers" })?.text).toBe('b\ta\n1\t"a\tb"\n"line\nnext"\t');
  });
});
