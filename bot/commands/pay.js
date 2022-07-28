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

    if (authorData.eloCoins < 0){
      this.sendNegativeEloOut(interaction);
      return;
    }

    if (authorData.eloCoins < eloCount){
      this.sendLackEloOut(interaction, {eloCount, authorData});
      return;
    }

    const targetData = UserManager.getUser( targetId );
    const targetUser = interaction.client.users.cache.get( targetId );


    if (targetUser === interaction.user || targetUser.bot){
      this.sendBadUserOut(interaction);
      return;
    }




    authorData.eloCoins -= eloCount;
    UserManager.update( authorData );


    targetData.eloCoins += eloCount;
    UserManager.update( targetData );


    const message = new MessageConstructor({
      title: "Передача ELO валюты",
      description: `${ interaction.user } передаёт ${ eloCount } эло для ${ targetUser }`,
      color: "#4f47bf",
      author: { name: targetUser.username, iconURL: targetUser.avatarURL() }
    });

    interaction.reply(message);
  }

  sendNegativeEloOut(interaction){
    const message = new MessageConstructor({ content: `Невозможно передать отрицательное количество`, ephemeral: true });
    interaction.reply(message);
    return;
  }

  sendLackEloOut(interaction, {eloCount, authorData}){
    const diff = eloCount - authorData.eloCoins;
    const message = new MessageConstructor({ content: `Надо на ${ diff } эло больше. У вас только ${ authorData.eloCoins } ед. валюты`, ephemeral: true });
    interaction.reply(message);
    return;
  }

  sendBadUserOut(interaction){
    const message = new MessageConstructor({ content: `Невозможно применить команду на этого участника`, ephemeral: true });
    interaction.reply(message);
    return;
  }

  static data = {
    name: "pay",
    // Discord SlashCommands
    slash: {
      type: 1,
      description: "Команда для передачи ELO валюты",
      dm_perrmissions: true,
      options: [
        {
          "type": 6,
          "name": "user",
          "description": "Пользователь, кому её передать",
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
