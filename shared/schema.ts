import { z } from "zod";

// Trade Schema
export const insertTradeSchema = z.object({
  tradeDate: z.string(),
  stockName: z.string(),
  quantity: z.number(),
  entryPrice: z.string(),
  exitPrice: z.string().nullable().optional(),
  stopLoss: z.string().nullable().optional(),
  targetPrice: z.string().nullable().optional(),
  profitLoss: z.string().nullable().optional(),
  isTradeTaken: z.boolean().default(false),
  setupFollowed: z.boolean().default(false),
  whichSetup: z.string().nullable().optional(),
  emotion: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  psychologyReflections: z.string().nullable().optional(),
  screenshotLink: z.string().nullable().optional(),
});

export const tradeSchema = insertTradeSchema.extend({
  id: z.number(),
  createdAt: z.date(),
});

// Strategy Schema
export const insertStrategySchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  screenshotUrl: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  status: z.enum(["active", "testing", "deprecated"]).default("active"),
});

export const strategySchema = insertStrategySchema.extend({
  id: z.number(),
  createdAt: z.date(),
});

// Psychology Entry Schema
export const insertPsychologyEntrySchema = z.object({
  entryDate: z.string(),
  monthlyPnL: z.string().nullable().optional(),
  bestTradeId: z.number().nullable().optional(),
  worstTradeId: z.number().nullable().optional(),
  mentalReflections: z.string().nullable().optional(),
  improvementAreas: z.string().nullable().optional(),
});

export const psychologyEntrySchema = insertPsychologyEntrySchema.extend({
  id: z.number(),
  createdAt: z.date(),
});

// Settings Schema
export const insertSettingsSchema = z.object({
  googleSheetId: z.string().nullable().optional(),
  googleScriptUrl: z.string().nullable().optional(),
});

export const settingsSchema = insertSettingsSchema.extend({
  id: z.number(),
  updatedAt: z.date(),
});

// Types
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = z.infer<typeof tradeSchema>;

export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Strategy = z.infer<typeof strategySchema>;

export type InsertPsychologyEntry = z.infer<typeof insertPsychologyEntrySchema>;
export type PsychologyEntry = z.infer<typeof psychologyEntrySchema>;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = z.infer<typeof settingsSchema>;