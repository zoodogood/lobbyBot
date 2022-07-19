import BaseCommand from '../modules/commands/BaseCommand.js';

import LobbyManager from '@managers/lobby';

import DiscordUtil from '@bot/discord-util';
const {MessageConstructor} = DiscordUtil;

class Command extends BaseCommand {
  constructor() {
    super();
  }

  run(interaction){
    const i18n = this.i18n.bind(this, interaction.locale);
    const lobbies = LobbyManager.lobbies;

    const fields = lobbies
      .map(lobby => ({
        name: `Имя: "${ lobby.name }"`,
        value: `игроков: ${ lobby.players.length }/${ lobby.players.cells }`,
        inline: true
      }));

    const embed = {
      author: { name: "Список лобби", iconURL: interaction.guild.iconURL() },
      fields,
      footer: { text: `Всего лобби: ${ lobbies.size }` },
      color: "#d7427e"
    };
    const message = new MessageConstructor(embed);
    interaction.reply(message);
  }

  static data = {
    name: "lobbies",
    // Discord SlashCommands
    slash: {
      type: 1,
      description: "Отображает список",
      dm_perrmissions: true,
      default_member_permissions: 8,
      options: []
    }
  };



}


export { Command };
