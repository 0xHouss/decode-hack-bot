import type { Message } from 'discord.js'
import BaseCommand from './BaseCommand'

// Abstract class for creating message commands.
export default class MessageCommand extends BaseCommand {
    aliases: string[]
    override execute: (message: Message, args: string[]) => any

    constructor(options: {
        name: string
        description: string
        aliases?: string[]
        execute: (message: Message, args: string[]) => any
    }) {
        super(options)
        this.execute = options.execute
        this.aliases = options.aliases ?? []
    }
}