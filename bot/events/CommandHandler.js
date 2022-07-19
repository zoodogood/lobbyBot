import BaseEvent from '../modules/events/BaseEvent.js';

class Event extends BaseEvent {
  constructor(){
    super(globalThis.app.client, "interactionCreate");
  }

  checkCondition(interaction){
    return interaction.isCommand();
  }

  async run(interaction){
    const command = globalThis.commands.get(interaction.commandName);

    try
    {
      if (!command)
        throw new Error("UNKNOW_COMMAND");

      await command.run(interaction);
    }
    catch (err)
    {
      console.error(err);
      interaction.reply({ content: err.message, ephemeral: true });
    }


  }
}

export { Event };
