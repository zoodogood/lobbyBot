import BaseCommand from '../modules/commands/BaseCommand.js';

import UserManager from '@managers/UserManager';

import DiscordUtil from '@bot/discord-util';
const {MessageConstructor} = DiscordUtil;

import Util from '@global/util';

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

    const rankContent     = `🔥 **Ранг:** ${ rankTitle } (рейтинг ${ userData.mmr })`;
    const eloContent      = `🧪 **ELO:** ${ Util.ending(userData.eloCoins, "поинт", "ов", "", "а") }`;
    const messagesContent = `📨 Сообщений: ${ userData.messages }`;


    const message = new MessageConstructor({
      author: {
        name:    userUser.username,
        iconURL: userUser.avatarURL()
      },
      description: `${ rankContent }\n${ eloContent }\n\n${ messagesContent }`,
      footer: {text: "Аккаунт создан:"},
      fields,
      timestamp: userUser.createdAt
    });
    interaction.reply(message);
  }

  getFields(userData){

    const FIELDS_DATA = [
      {
        id: "Identifier",
        condition: ({nickname, tagId}) => nickname || tagId,
        getField: ({nickname, tagId}) => {
          const name = "**Идентификаторы игрока:**";
          const value = [
            nickname ? `Никнейм: ${ nickname }` : "",
            tagId    ? `Тэг: ${ tagId }`        : ""

          ].join("\n");

          return {name, value};
        }
      },

      {
        id: "Winrate",
        condition: () => true,
        getField: ({matchCount, matchWons, matchLoses}) => {
          const percentage = Math.floor((matchWons / matchCount) * 100);

          const name = `**Винрейт: ${ percentage ? `${ percentage }%` : "N/A" }**`;
          const value = `Игр: ${ matchCount }\nПобед: ${ matchWons }\nПоражений: ${ matchLoses }`;

          return {name, value};
        }
      },
    ]

    const fields = FIELDS_DATA
      .filter(data => data.condition(userData))
      .map(data => data.getField(userData));


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
