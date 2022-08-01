import BaseCommand from '../modules/commands/BaseCommand.js';

import DiscordUtil from '@bot/discord-util';
const { MessageConstructor } = DiscordUtil;

import Util from '@global/util';

import UserManager from '@managers/UserManager';

class Command extends BaseCommand {
  constructor() {
    super();
  }

  async run(interaction){

    const [targetRaw, eloCount] = interaction.options.data
      .map(option => option.value);

    const authorData  = UserManager.getUser( interaction.user );
    const getUserData = UserManager.getUser.bind(UserManager);


    const usersId = this.resolveUsersId(targetRaw, interaction.guild);

    if (usersId.length === 0){
      sendBadCountOut();
      return;
    }

    usersId
      .map(getUserData)
      .forEach(data => {
        data.eloCoins += eloCount;
        UserManager.update( data );
      });

    const targetDescription = this.getTargetsDescription(usersId);

    const actionDescription = eloCount > 0 ?
      `выдал ${ eloCount } ELO для` :
      `снял ${ -eloCount } ELO у`;


    const message = new MessageConstructor({
      title: "Изменение количества поинтов",
      description: `${ interaction.user } ${ actionDescription } ${ targetDescription }`,
      color: "#4f47bf",
      author: { name: interaction.user.username, iconURL: interaction.user.avatarURL() }
    });

    interaction.reply(message);
  }

  getTargetsDescription(usersId){
    const count = Util.ending( usersId.length, "пользовател", "ей", "я", "ей" );

    const list = usersId.map(id => `<@${ id }>`)
      .join(", ");

    return `${ count }: ${ list }`;
  }

  resolveUsersId(raw, guild){
    const usersId = raw.match(/(?<=<@!?)\d{17,20}(?=\>)/g) ?? [];
    const rolesId = raw.match(/(?<=<@&)\d{17,20}(?=\>)/g)  ?? [];


    const rolesCache = guild.roles.cache;

    const toMembers = (roleId) => rolesCache.get(roleId).members
      .map(member => member.id);


    usersId.push(
      ...rolesId
        .map(toMembers)
        .reduce((acc, members) => acc.concat(members), [])
    );

    return usersId;
  }


  sendBadUserOut(interaction){
    const message = new MessageConstructor({ content: `Не получено ни одного участника. Отмена`, ephemeral: true });
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
          "type": 3,
          "name": "users",
          "description": "Пользователь, кому её выдать",
          "required": true,
          "min_length": 17
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
