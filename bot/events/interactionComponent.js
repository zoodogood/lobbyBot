import BaseEvent from '../modules/events/BaseEvent.js';
import MethodsExecuter from '@global/methods-executer';

class Event extends BaseEvent {
  constructor(){
    super(globalThis.app.client, "interactionCreate");
  }

  checkCondition(interaction){
    return interaction.isMessageComponent() || interaction.isModalSubmit();
  }

  async run(interaction){
    const id = interaction.customId;
    try
    {
      await new MethodsExecuter().execute(id, interaction);
    }
    catch (err)
    {
      console.error(err);
      interaction.reply({ content: err.message, ephemeral: true });
    }
  }
}

export { Event };
