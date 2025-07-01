// Template for creating event handlers.
export default class Event {
    name: string
    once: boolean
    execute: (...args: any) => any

    constructor(options: {
        name: string
        once?: boolean
        execute: (...args: any) => any
    }) {
        this.name = options.name
        this.once = options.once ?? false
        this.execute = options.execute
    }
}