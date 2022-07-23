import BaseCommand from '../modules/commands/BaseCommand.js';
import DiscordUtil from '@bot/discord-util';

import LobbyManager from '@managers/lobby';

const {MessageConstructor} = DiscordUtil;

class Command extends BaseCommand {
  constructor() {
    super();
  }

  run(interaction){
    const i18n = this.i18n.bind(this, interaction.locale);

    const id            = interaction.options.get("lobby_id").value;
    const playersCount  = interaction.options.get("players_count")?.value || 6;

    this.checkAvailable({ interaction, playersCount, id });

    const {user, guild} = interaction;

    const lobby = LobbyManager.createLobby(id, {playersCount, authorId: user, guildId: guild});

    const message = new MessageConstructor({
      title: i18n("createdTitle"),
      color: this.constructor.EMBED_COLOR,
      description: i18n("createdDescription", lobby.name, playersCount)
    });

    interaction.reply(message);
  }

  checkAvailable({interaction, playersCount, id}){
    const messages = [];

    if (id.includes("."))
      messages.push(`В имени присутствуют недопустимые символы: "."`);

    if (id.length > 30)
      messages.push(`Длина имени не должна привышать 30 символов`);

    if (playersCount > 200)
      messages.push(`Максимальное количество игроков: 200`);

    if (playersCount < 1)
      messages.push(`Минимальное количество игроков: 1`);


    if (messages.length){
      const content = messages.join("\n");
      this.throwOut({interaction, customText: content});
    }
  }

  throwOut({interaction, customText}){
    const message = new MessageConstructor({
      content: customText,
      ephemeral: true
    });
    interaction.reply(message);
  }


  static data = {
    name: "create",
    slash: {
      description: "Создать лобби",
      options: [
        {
          type: 3,
          name: "lobby_id",
          description: "Создать лобби с именем...",
          required: true
        },
        {
          type: 4,
          name: "players_count",
          description: "Количество ячеек игроков"
        }
      ]
    }
  };

  static EMBED_COLOR = "#603dca";
}


export { Command };
