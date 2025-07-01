import { Client, Collection, REST, RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import Event from '../templates/Event';
import MessageCommand from '../templates/MessageCommand';
import SlashCommand from '../templates/SlashCommand';
import config from './config';

export default class Bot {
    public slashCommands = new Collection<string, SlashCommand>();
    public messageCommands = new Collection<string, MessageCommand>();
    public events = new Collection<string, Event>();
    private slashCommandsArray: RESTPostAPIApplicationCommandsJSONBody[] = [];

    constructor(public readonly client: Client) {
        this.client.login(config.TOKEN);

        this.client.on('warn', console.log);
        this.client.on('error', console.error);

        this.client.once("ready", async () => {
            console.log(`Logged in as ${client.user?.tag} !`);

            // Import all events, slash commands and message commands
            await Promise.all([
                this.importEvents(),
                this.importSlashCommands(),
                this.importMessageCommands(),
            ])

            await this.registerCommands();
        });
    }

    private async importEvents() {
        const eventsDir = path.join(__dirname, '../events');

        const eventFiles = readdirSync(eventsDir);
        eventFiles.filter(file => file.endsWith('.ts'));

        await Promise.all(eventFiles.map(async file => {
            const filePath = path.join(eventsDir, file);
            const event = await import(filePath);
            const currentEvent = event.default as Event;

            this.events.set(currentEvent.name, currentEvent);

            if (currentEvent.once)
                this.client.once(currentEvent.name, currentEvent.execute);
            else
                this.client.on(currentEvent.name, currentEvent.execute);
        }))
    }

    private async importSlashCommands() {
        const commandsDir = path.join(__dirname, '../commands/slash');

        const commandFiles = readdirSync(commandsDir);
        commandFiles.filter(file => file.endsWith('.ts'));

        await Promise.all(commandFiles.map(async file => {
            const filePath = path.join(commandsDir, file);
            const command = await import(filePath);
            const currentCommand = command.default as SlashCommand;

            this.slashCommands.set(currentCommand.data.name, currentCommand);
            console.log(`Loaded slash command: ${currentCommand.data.name}`);

            const commandData = currentCommand.data.toJSON();
            this.slashCommandsArray.push(commandData);
        }))
    }

    private async importMessageCommands() {
        const commandsDir = path.join(__dirname, '../commands/message');

        const commandFiles = readdirSync(commandsDir);
        commandFiles.filter(file => file.endsWith('.ts'));

        await Promise.all(commandFiles.map(async file => {
            const filePath = path.join(commandsDir, file);
            const command = await import(filePath);
            const currentCommand = command.default as MessageCommand;

            this.messageCommands.set(currentCommand.name, currentCommand);
            console.log(`Loaded message command: ${currentCommand.name}`);
        }))
    }

    private async registerCommands() {
        const rest = new REST({ version: '10' }).setToken(config.TOKEN);

        try {
            await rest.put(
                Routes.applicationCommands(config.CLIENT_ID),
                { body: this.slashCommandsArray }
            );

            console.log('Successfully registered application (/) commands !');
        } catch (error) {
            console.error(error);
        }
    }
}
