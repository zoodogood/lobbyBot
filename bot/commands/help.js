import BaseCommand from '../modules/commands/BaseCommand.js';

import DiscordUtil from '@bot/discord-util';

const {MessageConstructor} = DiscordUtil;


class Command extends BaseCommand {
  constructor() {
    super();
  }

  run(interaction){
    const description = globalThis.commands
      .map(command => `/${ command.name } — ${ command.constructor.data.slash.description }.`)
      .join("\n\n");


    const message = new MessageConstructor({
      content: "r-r-r",
      description,
      title: "red",
      components: {style: 1, type: 2, customId: "command.help.Test", label: "typein" }
    });
    return interaction.reply(message);
  }

  Test([...rest], interaction){
    interaction.reply({content: interaction.user.username + "   lang " + interaction.locale, ephemeral: true });
  }

  static data = {
    name: "help",
    slash: {
      description: "Have fun!"
    }
  }
}


export { Command };
