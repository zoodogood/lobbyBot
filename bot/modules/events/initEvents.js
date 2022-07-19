import fileSystem from 'fs';
import { Collection } from '@discordjs/collection';

class EventsLoader {

  async update(){
    const __dirname = `${ process.cwd() }`;
    globalThis.eventsList = new Collection();

    const files = fileSystem.readdirSync(`${ __dirname }/bot/events/`)
      .filter(name => /^[a-zA-Z].+?\.js/.test(name));

    for (const fileName of files) {
      const { Event } = await import(`file://${ __dirname }/bot/events/${ fileName }`);
      const event = new Event();

      const name = fileName.slice(0, -3);
      globalThis.eventsList.set(name, event);
    }

    return;
  }
}

await new EventsLoader().update();
