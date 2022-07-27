import BaseCommand from '../modules/commands/BaseCommand.js';

import UserManager from '@managers/UserManager';

import DiscordUtil from '@bot/discord-util';
const {MessageConstructor} = DiscordUtil;


class Command extends BaseCommand {
  constructor() {
    super();
  }


  run(interaction){
    const userId = interaction.options.get("user")?.value ?? interaction.user.id;
    const userData = UserManager.getUser(userId);

    const userUser = interaction.client.users.cache.get(userId);

    const highestRankRoleId = userData.getRank(interaction)?.roleId;

    const rankTitle = highestRankRoleId ?
      `<@&${ highestRankRoleId }>` :
      "Отсуствует.";

    const fields = this.getFields(userData);


    const message = new MessageConstructor({
      author: {
        name:    userUser.username,
        iconURL: userUser.avatarURL()
      },
      description: `**Ранг:** ${ rankTitle } (рейтинг ${ userData.mmr })\n**ELO поинты:** ${ userData.eloCoins }\n\nСообщений: ${ userData.messages }`,
      footer: {text: "Аккаунт создан:"},
      fields,
      timestamp: userUser.createdAt
    });
    interaction.reply(message);
  }

  getFields(userData){
    const fields = [];

    const {nickname, tagId} = userData;
    if (nickname || tagId){
      const name = "Идентификаторы игрока:";
      const value = [
        nickname ? `Никнейм: ${ nickname }` : "",
        tagId    ? `Тэг: ${ tagId }`        : ""

      ].join("\n");

      fields.push({name, value});
    }

    return fields;
  }

  static data = {
    name: "user",
    // Discord SlashCommands
    slash: {
      type: 1,
      description: "Отображает информацию о пользователе",
      dm_perrmissions: true,
      options: [{
        type: 6,
        name: "user",
        description: "Просматриваемый пользователь"
      }]
    }
  };

}


export { Command };
