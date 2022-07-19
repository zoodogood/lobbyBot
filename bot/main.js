import 'dotenv/config';
import { Client, Intents } from 'discord.js';

const client = new Client({ intents: new Intents(32767) });
globalThis.events.emit("bot/clientAvailable", client);

const database = globalThis.app.database;

await import( './modules/events/initEvents.js' );
await import( './modules/commands/initCommands.js' );




export default client;
client.login(process.env.TOKEN);
