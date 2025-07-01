import { SlashCommandBuilder } from 'discord.js';
import SlashCommand from '../../templates/SlashCommand';

export default new SlashCommand({
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('ping the bot'),
    async execute(interaction) {
        await interaction.reply('Pong !');
    }
});
