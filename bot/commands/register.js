import BaseCommand from '../modules/commands/BaseCommand.js';

import UserManager from '@managers/UserManager';

import DiscordUtil from '@bot/discord-util';
const {MessageConstructor} = DiscordUtil;

class Command extends BaseCommand {
  constructor() {
    super();
  }



  run(interaction){
    const nickname = interaction.options.get("nickname")?.value;
    const tagId    = interaction.options.get("tag_id")?.value;

    const userData = UserManager.getUser( interaction.user );

    const messages = [];

    if (nickname){
      userData.nickname = nickname;
      messages.push("Успешно установили Никнейм");
    }

    if (tagId){
      userData.tagId = tagId;
      messages.push("Успешно установили Айди");
    }

    if (!messages.length){
      messages.push("Вы ничего не указали");
    }


    UserManager.update(userData);
    interaction.reply({ content: messages.join("\n"), ephemeral: true });
  }

  static data = {
    name: "register",
    // Discord SlashCommands
    slash: {
      type: 1,
      description: "Регистрирует Никнейм и Тэг пользователя",
      dm_perrmissions: true,
      options: [
        {
          type: 3,
          name: "nickname",
          description: "Игровое имя"
        },
        {
          type: 3,
          name: "tag_id",
          description: "Идентификатор"
        }
      ]
    }
  };

}


export { Command };
