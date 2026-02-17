import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
  timestamp: z.number(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
