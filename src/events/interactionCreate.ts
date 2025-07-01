import { Events, Interaction } from 'discord.js';
import { bot } from '..';
import Event from '../templates/Event';

export default new Event({
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (interaction.isChatInputCommand()) {
            try {
                const command = bot.slashCommands.get(interaction.commandName)

                if (!command) return

                await command.execute(interaction)
            } catch (error) {
                console.error("There was an error while executing this command:", error)

                await interaction.reply({
                    content: 'There was an error while executing this command !',
                    ephemeral: true
                })
            }
        }
    }
})
