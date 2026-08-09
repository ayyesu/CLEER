import { z } from 'zod';
import type {
  CleanupCategory,
  DeletionMode,
  EntryKind,
  Platform,
  RiskTier,
} from './types';

export const platformSchema = z.enum(['win32', 'darwin', 'linux']) as z.ZodType<Platform>;

export const riskTierSchema = z.enum(['safe', 'caution', 'dangerous']) as z.ZodType<RiskTier>;

export const cleanupCategorySchema = z.enum([
  'temp',
  'cache',
  'log',
  'dev-cache',
  'dev-artifact',
  'duplicate',
  'old-download',
  'package-manager',
  'orphaned-app',
  'recycle-bin',
]) as z.ZodType<CleanupCategory>;

export const entryKindSchema = z.enum(['file', 'directory', 'symlink']) as z.ZodType<EntryKind>;

export const deletionModeSchema = z.enum(['trash', 'permanent']) as z.ZodType<DeletionMode>;

export const scanEntrySchema = z.object({
  path: z.string().min(1),
  sizeBytes: z.number().nonnegative(),
  kind: entryKindSchema,
  category: cleanupCategorySchema,
  lastAccessed: z.date().optional(),
  lastModified: z.date().optional(),
  ownerApp: z.string().optional(),
  isDuplicateOf: z.string().optional(),
});

export const scanOptionsSchema = z.object({
  categories: z.array(cleanupCategorySchema).min(1),
  targetPaths: z.array(z.string().min(1)).min(1),
  maxDepth: z.number().positive().optional(),
  minSizeBytes: z.number().nonnegative().optional(),
});

export const deletionOptionsSchema = z.object({
  mode: deletionModeSchema,
});

export const ruleDefinitionSchema = z.object({
  id: z.string().min(1),
  category: cleanupCategorySchema,
  platforms: z.array(platformSchema).min(1),
  paths: z.array(z.string().min(1)).min(1),
  riskTier: riskTierSchema,
  regenerable: z.boolean(),
  description: z.string().min(1),
});
