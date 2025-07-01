import { readFileSync } from 'fs';
import { z } from 'zod';

const configFile = JSON.parse(readFileSync("config.json", 'utf-8'));

const configSchema = z.object({
    // Bot
    TOKEN: z.string(),
    CLIENT_ID: z.string(),
    BOT_PREFIX: z.string(),
})

export default configSchema.parse(configFile)