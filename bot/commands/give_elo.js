import BaseCommand from '../modules/commands/BaseCommand.js';

import DiscordUtil from '@bot/discord-util';
const { MessageConstructor } = DiscordUtil;

import UserManager from '@managers/UserManager';

class Command extends BaseCommand {
  constructor() {
    super();
  }

  async run(interaction){

    const [targetId, eloCount] = interaction.options.data
      .map(option => option.value);

    const authorData = UserManager.getUser( interaction.user );


    const targetData = UserManager.getUser( targetId );
    const targetUser = interaction.client.users.cache.get( targetId );


    if (targetUser.bot){
      this.sendBadUserOut(interaction);
      return;
    }

    targetData.eloCoins += eloCount;
    UserManager.update( targetData );


    const message = new MessageConstructor({
      title: "Выдача поинтов",
      description: `${ interaction.user } выдал ${ eloCount } ELO для ${ targetUser }`,
      color: "#4f47bf",
      author: { name: targetUser.username, iconURL: targetUser.avatarURL() }
    });

    interaction.reply(message);
  }


  sendBadUserOut(interaction){
    const message = new MessageConstructor({ content: `Невозможно применить команду на этого участника`, ephemeral: true });
    interaction.reply(message);
    return;
  }

  static data = {
    name: "give_elo",
    // Discord SlashCommands
    slash: {
      type: 1,
      description: "Команда для выдачи ELO валюты",
      dm_perrmissions: true,
      default_member_permissions: 8,
      options: [
        {
          "type": 6,
          "name": "user",
          "description": "Пользователь, кому её выдать",
          "required": true
        },
        {
          "type": 4,
          "name": "elo_count",
          "description": "Количество валюты",
          "required": true
        }
      ]
    }
  };

}


export { Command };
