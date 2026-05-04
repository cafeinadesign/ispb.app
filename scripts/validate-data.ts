import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OwnershipMapping } from '../src/types.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'data', 'ownership-curated.json');

const validConfidence = new Set(['high', 'medium', 'low']);
const validStatus = new Set(['confirmed', 'draft', 'rejected']);
const validRelationship = new Set([
  'brand_operator',
  'parent_company',
  'payment_institution',
  'banking_as_a_service',
  'partnership',
]);

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertNullableDigits(value: unknown, label: string, length: number) {
  if (value !== null && (typeof value !== 'string' || !new RegExp(`^\\d{${length}}$`).test(value))) {
    throw new Error(`${label} must be null or ${length} digits`);
  }
}

function validateMapping(value: unknown, index: number): OwnershipMapping {
  if (!value || typeof value !== 'object') throw new Error(`mapping ${index} must be an object`);
  const item = value as Record<string, unknown>;

  assertString(item.brand, `mapping ${index}.brand`);
  assertString(item.operator, `mapping ${index}.operator`);
  assertString(item.relatedInstitutionName, `mapping ${index}.relatedInstitutionName`);
  assertString(item.notes, `mapping ${index}.notes`);
  assertNullableDigits(item.ispb, `mapping ${index}.ispb`, 8);
  assertNullableDigits(item.cnpj, `mapping ${index}.cnpj`, 14);

  if (item.parentCompany !== undefined) assertString(item.parentCompany, `mapping ${index}.parentCompany`);
  if (!validRelationship.has(String(item.relationshipType))) throw new Error(`mapping ${index}.relationshipType is invalid`);
  if (!validConfidence.has(String(item.confidence))) throw new Error(`mapping ${index}.confidence is invalid`);
  if (!validStatus.has(String(item.reviewStatus))) throw new Error(`mapping ${index}.reviewStatus is invalid`);

  if (!Array.isArray(item.sources) || item.sources.length === 0) {
    throw new Error(`mapping ${index}.sources must contain at least one source`);
  }
  item.sources.forEach((source, sourceIndex) => {
    if (!source || typeof source !== 'object') throw new Error(`mapping ${index}.sources.${sourceIndex} must be an object`);
    const s = source as Record<string, unknown>;
    assertString(s.title, `mapping ${index}.sources.${sourceIndex}.title`);
    assertString(s.url, `mapping ${index}.sources.${sourceIndex}.url`);
    try {
      const url = new URL(s.url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid protocol');
    } catch {
      throw new Error(`mapping ${index}.sources.${sourceIndex}.url must be a valid URL`);
    }
  });

  return item as unknown as OwnershipMapping;
}

const raw = await readFile(filePath, 'utf8');
const parsed: unknown = JSON.parse(raw);
if (!Array.isArray(parsed)) throw new Error('ownership-curated.json must be an array');
parsed.map(validateMapping);
console.log(`Validated ${parsed.length} ownership mappings.`);
