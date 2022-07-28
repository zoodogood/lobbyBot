import 'dotenv/config';
import database from '@database/database';

import LocalesStructure from '@global/locales';

import EventsEmitter from 'events';
globalThis.events = new EventsEmitter();

process.on('unhandledRejection', (reason, promise) => {
  console.info("OOPS N1");
  console.log(reason);
});

class App {

  async load(){
    const modules = ["initDatabase", "initLocales", "initModes", "initClient"];
    for (const initName of modules){
      console.time(initName);
      await this[initName]();

      console.timeEnd(initName);
    }
  }

  async initDatabase(){
    const { default: LobbyManager } = await import('@managers/lobby');
    LobbyManager.restoreFromDatabase();

    const { default: UserManager } = await import('@managers/UserManager');
    UserManager.restoreFromDatabase();

    const { default: GuildManager } = await import('@managers/GuildManager');
    GuildManager.restoreFromDatabase();
  }

  async initClient(){
    globalThis.events.on("bot/clientAvailable", client => {
      this.client = client;
    });
    await import('./bot/main.js');
  }

  async initLocales(){
    globalThis.i18n = new LocalesStructure();
  }

  async initModes(){
    const { default: ModesManager } = await import('@managers/ModesManager');
    await ModesManager.initModes();

  }
}

globalThis.app = new App();
app.load();
