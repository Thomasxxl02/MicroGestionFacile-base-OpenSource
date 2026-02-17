import { z } from 'zod';

export const ExpenseSchema = z.object({
  id: z.string(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  vatAmount: z.number().optional(),
  category: z.string(),
  supplierId: z.string().optional(),
  status: z.enum(['validated', 'cancelled']).default('validated'),
  reversalOf: z.string().optional(), // ID of the entry being reversed
  createdAt: z.string(),
});

export type Expense = z.infer<typeof ExpenseSchema>;
