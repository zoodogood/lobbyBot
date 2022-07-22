import fileSystem from 'fs';
import { Collection } from '@discordjs/collection';

class CommandsLoader {

  async update(){
    const __dirname = `${ process.cwd() }`;
    globalThis.commands = new Collection();
    
    const files = fileSystem.readdirSync(`${ __dirname }/bot/commands/`)
      .filter(name => /^[a-z].+?\.js/.test(name));

    for (const name of files) {
      const { Command } = await import(`file://${ __dirname }/bot/commands/${ name }`);
      const command = new Command();

      globalThis.commands.set(command.name, command);
    }

    return;
  }
}

await new CommandsLoader().update();
