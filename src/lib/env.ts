import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Prisma
  DATABASE_URL: z.string().min(1, "Database URL is required"),

  // Bot
  TOKEN: z.string().min(1, "Token is required"),
  CLIENT_ID: z.string().min(1, "Client ID is required"),
  BOT_PREFIX: z.string().default('!'),

  // Roles
  MODERATOR_ROLE_ID: z.string().min(1, "Moderator role ID is required"),
  TEAM_LEADER_ROLE_ID: z.string().min(1, "Team leader role ID is required"),
  MENTOR_ROLE_ID: z.string().min(1, "Mentor role ID is required"),
})

export const ENV = envSchema.parse(process.env);