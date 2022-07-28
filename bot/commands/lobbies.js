import BaseCommand from '../modules/commands/BaseCommand.js';

import LobbyManager from '@managers/lobby';
import MethodExecuter from '@global/methods-executer';

import DiscordUtil from '@bot/discord-util';
const {MessageConstructor, ComponentsSimplify} = DiscordUtil;

class Command extends BaseCommand {
  constructor() {
    super();
  }

  run(interaction){
    const message = this.createMessage({interaction, page: 0});
    interaction.reply(message);
  }

  replaceContent(interaction, message){
    interaction.update(message);
  }

  getLobbies(){
    return [...LobbyManager.lobbies.values()];
  }

  getLobbiesPage(lobbies, page){
    const indexFrom = this.PAGE_CELLS_LIMIT * page;
    return lobbies.slice(indexFrom, indexFrom + this.PAGE_CELLS_LIMIT);
  }

  lobbiesToFields(lobbies){
    const fields = lobbies
      .map(lobby => ({
        name: `"${ lobby.name }"`,
        value: `игроков: ${ lobby.players.length }/${ lobby.players.cells },\nоснователь <@${ lobby.authorId }>`,
      }));

    return fields;
  }


  createMessage({interaction, page}){
    const lobbies = this.getLobbies(interaction);
    const fields = this.lobbiesToFields(
      this.getLobbiesPage(lobbies, page)
    );

    const components = this.createComponents({interaction, page, lobbies});

    const pagesCount = this.calculatePages(lobbies);

    const embed = {
      author: { name: "Список лобби", iconURL: interaction.guild.iconURL() },
      fields,
      footer: { text: `Страница ${ page + 1 }/${ pagesCount }` },
      color: "#d7427e",
      components
    };
    const message = new MessageConstructor(embed);
    return message;
  }

  createComponents({interaction, page, lobbies}){
    const pagesCount = this.calculatePages(lobbies);

    const selectOptions = this.getLobbiesPage(lobbies, page)
      .map(lobby => ({
        label: lobby.name,
        value: lobby.name
      }));

    const components = [
      [
        { type: "BUTTON", label: "Предыдущая страница", style: 1, customId: "command.lobbies.buttonBack",  disabled: page === 0 },
        { type: "BUTTON", label: "Следующая страница",  style: 1, customId: "command.lobbies.buttonNext",  disabled: page === (pagesCount - 1) }
      ],
      [
        { type: "SELECT_MENU", customId: "command.lobbies.buttonExecuteLobby", options: selectOptions, placeholder: "Вызвать лобби" }
      ]
    ];

    return components;
  }

  calculatePages(lobbies){
    return Math.ceil(lobbies.length / this.PAGE_CELLS_LIMIT);
  }

  buttonBack([...rest], interaction){
    const {page: currentPage} = this.parseInformation( interaction.message );
    const page = currentPage - 1;

    const message = this.createMessage({interaction, page});
    this.replaceContent(interaction, message);
  }

  buttonNext([...rest], interaction){
    const {page: currentPage} = this.parseInformation( interaction.message );
    const page = currentPage + 1;

    const message = this.createMessage({interaction, page});
    this.replaceContent(interaction, message);
  }

  buttonExecuteLobby([...rest], interaction){
    const name = interaction.values.at(0);
    const lobby = LobbyManager.lobbies.get(name);

    const i18n = this.i18n.bind(this, interaction.locale);

    console.log(lobby);

    new MethodExecuter().execute("command.lobby.displayLobby", {interaction, i18n, lobby});
  }

  parseInformation(message){
    const embed = message.embeds.at(0);

    const pageBase = embed.footer?.text
      .match(/\d+(?=\/\d+$)/).at(0);

    const page = (pageBase ?? 1) - 1;

    return {page};
  }

  PAGE_CELLS_LIMIT = 7;

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
