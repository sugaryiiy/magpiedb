import type { DataGridExtractRequest, DataGridExtractResult } from "./dataGridCopyExtractor";

/** Format the standard grid clipboard formats without a backend round trip. */
export function localGridCopy(request: DataGridExtractRequest): DataGridExtractResult | undefined {
  const { extractor, selectedColumnIndexes, columns, rows } = request;
  if (extractor !== "raw" && extractor !== "tsv" && extractor !== "tsv-with-headers") return undefined;
  const options = request.options.dsv;
  const rowSeparator = extractor === "raw" ? "\n" : options.rowSeparator;
  const valueText = (value: unknown) => (value == null ? (extractor === "raw" ? "" : options.nullText) : typeof value === "object" ? JSON.stringify(value) : String(value));
  const format = (value: unknown) => {
    const text = valueText(value);
    if (extractor === "raw") return text;
    const quote = options.quote;
    const shouldQuote = quote && (options.quotePolicy === "always" || (options.quotePolicy === "minimal" && (text.includes("\t") || text.includes(rowSeparator) || /[\r\n]/.test(text) || text.includes(quote))));
    return shouldQuote ? quote + text.split(quote).join(quote + quote) + quote : text;
  };
  const lines = rows.map((row, index) => {
    const values = selectedColumnIndexes.map((column) => row[column]);
    if (extractor !== "raw" && options.includeRowHeader) values.unshift(index + 1);
    return values.map(format).join("\t");
  });
  if (extractor === "tsv-with-headers") {
    const headers = selectedColumnIndexes.map((index) => columns[index]?.displayName ?? "");
    if (options.includeRowHeader) headers.unshift("#");
    lines.unshift(headers.map(format).join("\t"));
  }
  return { text: lines.join(rowSeparator), mimeType: extractor === "raw" ? "text/plain" : "text/tab-separated-values", fileExtension: extractor === "raw" ? "txt" : "tsv", rowCount: rows.length, columnCount: selectedColumnIndexes.length };
}
