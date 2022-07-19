import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

import './bot/modules/commands/initCommands.js';


const commandsData = globalThis.commands
  .map(command => {
    const { slash, name } = command.constructor.data;
    return { name, ...slash };
  })



const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

try {
  const clientId = (await rest.get( Routes.user() ))
    .id;

  console.info(`----\nStarted refreshing application (/) commands (${ commandsData.length })`);

  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commandsData },
  );

  console.info('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}
