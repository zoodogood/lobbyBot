import EventsEmitter from 'events';
import QueryBuilder from '@database/query-builder';

class BaseCommand extends EventsEmitter {
  constructor(){
    super();
  }

  async update(){
    const __dirname = process.cwd();
    const {Command} = await import(`file://${ __dirname }/bot/commands/${ this.name }.js`);
    const command = new Command();
    globalThis.commands.set(this.name, command);
  }

  get name(){
    return this.constructor.data.name;
  }

  get query(){
    const queries = this.constructor.DATABASE_QUERIES;
    const database = globalThis.app.database;

    const queryProxy = new QueryBuilder(database.pool).createProxy(queries);
    return queryProxy;
  }

  i18n(locale, key, ...args){
    const resolver = globalThis.i18n.api().lineResolver(["commands", this.name, key], locale);
    if (resolver === null)
      return undefined;

    return resolver(...args);
  }
}


export default BaseCommand;
