import BaseEvent from '../modules/events/BaseEvent.js';

import UserManager from '@managers/UserManager';

class Event extends BaseEvent {
  constructor(){
    super(globalThis.app.client, "messageCreate");
  }


  async run(message){
    const authorData = UserManager.getUser(message.author);
    authorData.messages++;

    if (!( authorData.messages % 10 )){
      UserManager.update( authorData );
    }

  }
}

export { Event };
