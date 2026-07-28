export type ParsedCategoryRow = {
  name: string;
  budgetAmount: number;
  lineNumber: number;
};

export type CategoryImportAction = "create" | "update" | "unchanged";

export type CategoryImportPreviewRow = {
  name: string;
  budgetAmount: number;
  lineNumber: number;
  action: CategoryImportAction;
  categoryId?: string;
  currentBudget?: number;
  excluded?: boolean;
  warning?: string;
};

const HEADER_KEYWORDS = new Set([
  "category",
  "categories",
  "name",
  "budget",
  "amount",
  "pkr",
  "rs",
  "rupees",
]);

function parseAmount(raw: string) {
  const normalized = raw.replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid amount "${raw}"`);
  }
  return value;
}

function splitColumns(line: string) {
  if (line.includes("\t")) {
    return line.split("\t").map((part) => part.trim());
  }

  if (line.includes(",")) {
    return line.split(",").map((part) => part.trim());
  }

  const spaced = line.match(/^(.+?)\s+([\d,.\s₨RsPKRpkrrs-]+)$/i);
  if (spaced) {
    return [spaced[1].trim(), spaced[2].trim()];
  }

  return [line.trim()];
}

function looksLikeHeader(columns: string[]) {
  if (columns.length === 0) return false;

  const normalized = columns.map((column) => column.trim().toLowerCase());
  const hits = normalized.filter((column) => HEADER_KEYWORDS.has(column)).length;

  if (columns.length >= 2 && hits >= 1) {
    return true;
  }

  return normalized.every((column) => HEADER_KEYWORDS.has(column));
}

export function parseCategoryPaste(text: string): ParsedCategoryRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("Paste at least one category row");
  }

  let startIndex = 0;
  const firstColumns = splitColumns(lines[0]);
  if (looksLikeHeader(firstColumns)) {
    startIndex = 1;
  }

  const rows: ParsedCategoryRow[] = [];
  const seenNames = new Set<string>();

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    const columns = splitColumns(line);

    if (columns.length < 2) {
      throw new Error(
        `Line ${index + 1}: use "Category<TAB>Budget" or "Category, Budget"`,
      );
    }

    const name = columns[0].trim();
    if (!name) {
      throw new Error(`Line ${index + 1}: category name is required`);
    }

    const normalizedName = name.toLowerCase();
    if (seenNames.has(normalizedName)) {
      throw new Error(`Line ${index + 1}: duplicate category "${name}"`);
    }
    seenNames.add(normalizedName);

    rows.push({
      name,
      budgetAmount: parseAmount(columns[1]),
      lineNumber: index + 1,
    });
  }

  if (rows.length === 0) {
    throw new Error("No category rows found");
  }

  return rows;
}

export function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase();
}

export function buildCategoryImportPreview(
  parsedRows: ParsedCategoryRow[],
  existingCategories: Array<{
    id: string;
    name: string;
    budgetAmount: number;
    excluded: boolean;
  }>,
): CategoryImportPreviewRow[] {
  const existingByName = new Map(
    existingCategories.map((category) => [
      normalizeCategoryName(category.name),
      category,
    ]),
  );

  return parsedRows.map((row) => {
    const match = existingByName.get(normalizeCategoryName(row.name));

    if (!match) {
      return {
        ...row,
        action: "create" as const,
      };
    }

    if (match.excluded || match.budgetAmount !== row.budgetAmount) {
      return {
        ...row,
        action: "update" as const,
        categoryId: match.id,
        currentBudget: match.budgetAmount,
        excluded: match.excluded,
      };
    }

    return {
      ...row,
      action: "unchanged" as const,
      categoryId: match.id,
      currentBudget: match.budgetAmount,
      excluded: match.excluded,
    };
  });
}
