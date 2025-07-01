import MessageCommand from '../../templates/MessageCommand';

export default new MessageCommand({
    name: 'ping',
    description: 'ping the bot',
    async execute(message) {
        await message.reply('Pong !');
    }
});
