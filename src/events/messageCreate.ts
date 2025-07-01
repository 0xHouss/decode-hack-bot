import { Events, Message } from 'discord.js';
import { bot } from '..';
import config from '../lib/config';
import Event from '../templates/Event';

export default new Event({
    name: Events.MessageCreate,
    async execute(message: Message) {
        // filters out bots and non-prefixed messages
        if (!message.content.startsWith(config.BOT_PREFIX) || message.author.bot)
            return

        try {
            // Extract arguments correctly, handling quoted strings
            let matches = message.content
                .slice(config.BOT_PREFIX.length)
                .trim()
                .match(/(?:[^\s"]+|"[^"]*")+/g) || [];

            // Remove quotes from quoted arguments
            const args = matches.map(arg => arg.replace(/^"(.*)"$/, '$1'));

            const commandName = args.shift()?.toLowerCase()

            if (!commandName) return

            const command = bot.messageCommands.get(commandName)

            if (!command) return

            await command.execute(message, args)
        } catch (error) {
            console.error("There was an error while executing this command:", error)

            await message.reply('There was an error while executing this command !')
        }
    }
})