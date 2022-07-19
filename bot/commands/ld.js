import BaseCommand from '../modules/commands/BaseCommand.js';

import UserManager from '@managers/UserManager';
import GuildManager from '@managers/GuildManager';

import DiscordUtil from '@bot/discord-util';
const {MessageConstructor, ComponentsSimplify} = DiscordUtil;

class Command extends BaseCommand {
  constructor() {
    super();
  }


  run(interaction){
    const message = this.createMessage({interaction, page: 0, sortBy: "eloCoins"});
    interaction.reply(message);
  }

  buttonBack([...rest], interaction){
    const {page: currentPage, sortBy} = this.parseInformation( interaction.message );
    const page = currentPage - 1;

    const message = this.createMessage({interaction, page, sortBy});
    this.replaceContent(interaction, message);
  }

  buttonNext([...rest], interaction){
    const {page: currentPage, sortBy} = this.parseInformation( interaction.message );
    const page = currentPage + 1;

    const message = this.createMessage({interaction, page, sortBy});
    this.replaceContent(interaction, message);
  }

  buttonSortBy([...rest], interaction){
    const {page} = this.parseInformation( interaction.message );

    const sortBy = interaction.values.at(0);

    const message = this.createMessage({interaction, page, sortBy});
    this.replaceContent(interaction, message);
  }

  replaceContent(interaction, message){
    interaction.update(message);
  }

  createMessage({interaction, page, sortBy}){
    const allLeaders = this.getLeadersFields({interaction, sortBy});

    const usersFields = this.getLeaderPage({leaders: allLeaders, page});
    const pagesCount  = this.getPagesCount({leaders: allLeaders});


    const fields = usersFields;

    const author = { name: `Leaderboard by · ${ sortBy }`, iconURL: interaction.guild.iconURL() };
    const footer = pagesCount > 1 ? {text: `Страница: ${ page + 1 }/${ pagesCount }`} : null;

    const components = [
      [
        {type: "BUTTON", label: "Назад", style: 1, customId: "command.lb.buttonBack",  disabled: page === 0},
        {type: "BUTTON", label: "Впёред", style: 1, customId: "command.lb.buttonNext", disabled: page === (pagesCount - 1)}
      ],
      [
        {type: "SELECT_MENU", customId: "command.lb.buttonSortBy", options: this.getOptionsSortBy()},
      ]
    ];

    const message = new MessageConstructor({
      author,
      color: "#53b24e",
      fields,
      footer,
      components
    });
    return message;
  }


  getLeadersFields({interaction, sortBy}){
    const membersCache = interaction.guild.members.cache;

    const getUserData = UserManager.getUser.bind( UserManager );

    const usersData = membersCache.map(getUserData);

    usersData.sort((a, b) => b[sortBy] - a[sortBy]);

    const toField = (userData, arrayIndex) => {
      const {eloCoins, mmr, messages} = userData;
      const name = `${ arrayIndex + 1 }.`;

      const member = membersCache.get(userData.id);
      const info = `ELO ${ eloCoins },  ${ mmr }ед. рейтинга,\nсообщений: ${ messages }`;
      const value = `${ member }\n${ info }`;

      return { name, value };
    }


    return usersData.map(toField);
  }


  getLeaderPage({leaders, page = 0}){
    const indexFrom = this.PAGE_CELLS_LIMIT * page;
    return leaders.slice(indexFrom, indexFrom + this.PAGE_CELLS_LIMIT);
  }


  getPagesCount({leaders}){
    return Math.ceil( leaders.length / this.PAGE_CELLS_LIMIT );
  }

  // Leaderboard
  static data = {
    name: "lb",
    // Discord SlashCommands
    slash: {
      type: 1,
      description: "Выводит топ по выбранной категории",
      dm_perrmissions: true,
      default_member_permissions: 8
    }
  };

  PAGE_CELLS_LIMIT = 7;

  getOptionsSortBy(){
    return [
      { label: "ELO", value: "eloCoins", default: true },
      { label: "MMR", value: "mmr" },
      { label: "MESSAGES", value: "messages" }
    ];
  }

  parseInformation(message){
    const embed = message.embeds.at(0);

    const pageBase = embed.footer?.text
      .match(/\d+(?=\/\d+$)/).at(0);

    const page = (pageBase ?? 1) - 1;

    const sortBy = embed.author.name
      .match(/(?<=· )\w+/).at(0);

    return {page, sortBy};
  }
}


export { Command };
