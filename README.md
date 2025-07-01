# Discord.js TypeScript Template

A **discord.js TypeScript template** to quickly kickstart the development of your Discord bot.

## 🚀 Features

- Uses **TypeScript** for better development experience and type safety.
- Supports both **slash commands** and **message commands**.
- Implements a **modular command and event handler** structure.
- Uses **zod** for configuration validation.
- Automatically **registers slash commands** on startup.

## 📦 Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/0xHouss/discord-ts-template.git
   cd discord-ts-template
   ```

2. Install dependencies using **pnpm** (or `npm i` if using npm):

   ```sh
   pnpm i
   ```

3. Create a `config.json` file by copying the example:

   ```sh
   cp config.example.json config.json
   ```

4. Fill in the required bot config inside `config.json`.

## 🏃 Running the Bot

### Development Mode

For hot-reloading during development:

```sh
pnpm dev
```

### Production Mode

To build and run the bot:

```sh
pnpm start
```

## ⚙️ Commands & Events

### Message Command Example (`src/commands/message/ping.ts`)

```ts
import MessageCommand from '../../templates/MessageCommand';

export default new MessageCommand({
    name: 'ping',
    description: 'Ping the bot',
    async execute(message) {
        await message.reply('Pong!');
    }
});
```

### Slash Command Example (`src/commands/slash/ping.ts`)

```ts
import { SlashCommandBuilder } from 'discord.js';
import SlashCommand from '../../templates/SlashCommand';

export default new SlashCommand({
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping the bot'),
    async execute(interaction) {
        await interaction.reply('Pong!');
    }
});
```

### Event Example

```ts
import { Events, Message } from 'discord.js';
import { bot } from '..';
import config from '../lib/config';
import Event from '../templates/Event';

export default new Event({
    name: Events.ClientReady,
    async execute() {
        console.log("Logged in !");
    }
});
```

## 🔧 Configuration (`config.json`)

```json
{
    "TOKEN": "your bot token",
    "CLIENT_ID": "your bot client id",
    "BOT_PREFIX": "!"
}
```

Replace placeholders with your actual **Discord bot token** and **client ID**.

## 🛠 Dependencies

- [discord.js](https://discord.js.org) (`^14.17.3`)
- [zod](https://github.com/colinhacks/zod) (`^3.24.1`)
- TypeScript (`^5.7.3`)
- `ts-node`, `nodemon`, `rimraf` (for development)

## 📜 License

This project is licensed under the **ISC License**.

## 🤝 Contributing

Feel free to open **issues** or **pull requests** to improve this template.

---

Enjoy coding your Discord bot! 🚀