import BaseEvent from '../modules/events/BaseEvent.js';

class Event extends BaseEvent {
  constructor(){
    super(globalThis.app.client, "ready");
  }


  async run(interaction){
    // console.clear();

    const timeSlice = process.uptime();
    const data = this.constructor.getDisplayData();
    console.info(this.constructor.COLORS.green, `${ "\n".repeat(4) }Launched in ${ timeSlice * 1000 }ms:`);

    console.table({bot: data.bot});

    console.info(this.constructor.COLORS.green, "────────");
    console.info( "\n".repeat(4) );
  }

  static getDisplayData(){
    const client = globalThis.app.client;
    
    return {
      bot: {
        id:       Number( client.user.id ),
        guilds:   client.guilds.cache.size,
        commands: globalThis.commands.size,
        events:   globalThis.eventsList.size
      }
    }
  }

  static COLORS = {
    green: "\x1b[32m%s\x1b[0m"
  }
}

export { Event };
