// Abstract class for creating commands.
export default abstract class BaseCommand {
    name: string
    description: string
    execute: (...args: any) => any

    constructor(options: {
        name: string
        description: string
        execute: (...args: any) => Promise<void> | void
    }) {
        this.name = options.name
        this.description = options.description
        this.execute = options.execute
    }
}