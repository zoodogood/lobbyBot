import BaseCommand from '../modules/commands/BaseCommand.js';
import LobbyManager from '@managers/lobby';

import { Modal } from "discord.js";

import DiscordUtil from '@bot/discord-util';
const {MessageConstructor, ComponentsSimplify} = DiscordUtil;

import MethodExecuter from '@global/methods-executer';


class Command extends BaseCommand {
  constructor() {
    super();
  }

  async run(interaction){
    const i18n = this.i18n.bind(this, interaction.locale);
    const id = interaction.options.get("lobby_id").value;
    const lobby = LobbyManager.lobbies.get(id);

    if (!lobby){
      interaction.reply({ content: i18n("LOBBY_NOT_FOUND"), ephemeral: true });
      return;
    }

    await new LobbyInfo(lobby, i18n)
      .displayInteraction(interaction);
  }


  enterPlayer([id, ...rest], interaction){
    const i18n = this.i18n.bind(this, interaction.locale);
    const lobby = LobbyManager.lobbies.get(id);

    if (!lobby)
      throw new Error("LOBBY_NOT_FOUND");

    lobby.enterPlayer(interaction.user.id);

    const content = `${ lobby.players.length } / ${ lobby.players.cells }`;
    interaction.reply({ content, ephemeral: true });
  }

  leavePlayer([id, ...rest], interaction){
    const i18n = this.i18n.bind(this, interaction.locale);
    const lobby = LobbyManager.lobbies.get(id);

    if (!lobby)
      throw new Error("LOBBY_NOT_FOUND");

    lobby.leavePlayer(interaction.user.id);

    const content = `Успешно`;
    interaction.reply({ content, ephemeral: true });
  }

  deleteLobby([id, ...rest], interaction){
    const lobby = LobbyManager.lobbies.get(id);

    if (!lobby)
      throw new Error("LOBBY_NOT_FOUND");

    lobby.delete();

    const content = `Лобби \`${ id }\` было удалено.`;
    interaction.reply({ content });
  }


  dissolvePlayers([id, ...rest], interaction){
    const lobby = LobbyManager.lobbies.get(id);

    const length = lobby.players.length;

    lobby.players.forEach(id => lobby.leavePlayer(id));

    const content = `Участники распущены (${ length })`;
    interaction.reply({ content, ephemeral: true });
  }


  takeButtons(lobbyId, interaction){
    const lobby = LobbyManager.lobbies.get(lobbyId);

    const BUTTONS = [
      {
        description: "Начинает игру. Только когда лобби заполнено!",
        condition: ({user, member}) => !lobby.game?.started
          && lobby.authorId === user.id
          && lobby.players.length === lobby.players.cells,

        button: { style: 3, type: 2, customId: `command.lobby.modalSelectMode.${ lobby.name }`, label: `Начать!` }
      },
      {
        description: "Заканчивает игру. Если команд несколько, позволяет указать победившую.",
        condition: ({user, member}) => lobby.game?.started &&
          (lobby.authorId === user.id || member.permissions.has("MANAGE_GUILD")),

        button: { style: 2, type: 2, customId: `event.lobbyEvents.onGameEnd.${ lobby.name }`, label: `Завершить матч!` }
      },
      {
        description: "Создатель лобби или модераторы сервера с правом \"Управление сервером\" могут удалить лобби.",
        condition: ({user, member}) => lobby.authorId === user.id || member.permissions.has("MANAGE_GUILD"),
        button: { style: 4, type: 2, customId: `command.lobby.deleteLobby.${ lobby.name }`, label: "Удалить!" }
      },
      {
        description: "Установите описание для этого лобби.",
        condition: ({user, member}) => lobby.authorId === user.id || member.permissions.has("MANAGE_GUILD"),
        button: { style: 2, type: 2, customId: `command.lobby.modalSetDescription.${ lobby.name }`, label: "Описание", emoji: "📗" }
      },
      {
        description: "Доступно, если вы находитесь в этом лобби.",
        condition: ({user}) => lobby.players.includes(user.id),
        button: { style: 2, type: 2, customId: `command.lobby.leavePlayer.${ lobby.name }`, label: "Покинуть лобби", emoji: "🚪" }
      },
      {
        description: "Все пользователи принудительно покинут это лобби.",
        condition: ({user, member}) => lobby.authorId === user.id || member.permissions.has("MANAGE_GUILD"),
        button: { style: 2, type: 2, customId: `command.lobby.dissolvePlayers.${ lobby.name }`, label: `Очистить список игроков` }
      }
    ]

    const buttons = BUTTONS
      .filter(buttonData => buttonData.condition(interaction))
      .map(buttonData => buttonData.button);

    const components = buttons.length <= 5 ?
      buttons :
      [ buttons.slice(0, 5), buttons.slice(5) ];


    const description = BUTTONS.map(buttonData => `• ${ buttonData.button.label }${ buttonData.button.emoji ? ` ${ buttonData.button.emoji }` : "" } — ${ buttonData.description }`).join("\n\n");
    const message = new MessageConstructor({
      title: "Список взаимодействий:",
      color: "#46d808",
      description,
      ephemeral: true,
      components
    });

    return message;
  }

  showButtons([id, ...rest], interaction){
    const message = this.takeButtons(id, interaction);
    interaction.reply(message);
  }


  modalSetDescription([id, ...rest], interaction){
    const lobby = LobbyManager.lobbies.get(id);
    const value = lobby.description ?? null;

    const components = new ComponentsSimplify().simplify({
      type: "TEXT_INPUT",
      value,
      style: 2,
      placeholder: "Введите текст",
      customId: `command.lobby.setDescription.input`,
      label: "Описание",
      required: true
    });


    const modal = new Modal({ customId: `command.lobby.setDescription.${ id }`, title: "Описание лобби", components });
    interaction.showModal(modal);
  }

  setDescription([id, ...rest], interaction){
    const value = interaction.fields.getField("command.lobby.setDescription.input").value;

    const lobby = LobbyManager.lobbies.get(id);
    lobby.setDescription(value);
    LobbyManager.update(lobby);


    interaction.reply({ ephemeral: true, content: "Успешно" });
  }


  modalSelectMode([id, ...rest], interaction){

    const OPTIONS = [
      {
        label: "Два капитана",
        value: "twoCapitans",
        description: "Случайным образом выбираются двое. Собирают команду"
      }
    ];

    const components = new ComponentsSimplify().simplify({
      type: "SELECT_MENU",
      placeholder: "Бездействовать",
      customId: `command.lobby.selectMode.input`,
      label: "Режим игры",
      options: OPTIONS,
      minValues: 0
    });


    const modal = new Modal({ customId: `command.lobby.selectMode.${ id }`, title: "Выберите режим игры", components });
    interaction.showModal(modal);
  }

  async selectMode([id, ...rest], interaction){
    const lobby = LobbyManager.lobbies.get(id);

    const [mode] = interaction.fields.getField("command.lobby.selectMode.input").value;

    await new MethodExecuter().execute(`event.lobbyEvents.onGameStart.${ lobby.name }`, {mode, interaction});

    const message = this.takeButtons(id, interaction);
    interaction.update(message);
  }

  static data = {
    name: "lobby",
    slash: {
      type: 1,
      description: "Отображает лобби",
      dm_perrmissions: true,
      default_member_permissions: 8,
      options: [
        {
          "type": 3,
          "name": "lobby_id",
          "description": "Имя лобби",
          "required": true
        }
      ]
    }
  };

  static EMBED_COLOR = "#2c2f33";
}

class LobbyInfo {
  #syncMessage

  constructor(lobby, i18n){
    this.lobby = lobby;
    this.i18n  = i18n;

    this.#setHandlers();
    this.#setDestroyTimeout();
  }

  #setDestroyTimeout(){
    const TIMEOUT_MS = 900_000;
    setTimeout(() => this.#removeHandlers(), TIMEOUT_MS);
  }

  #handle
  #setHandlers(){
    this.#handle = true;

    this.handlers = {
      "enter": this.#enterHandler.bind(this),
      "leave": this.#leaveHandler.bind(this),
      "delete": this.#deleteHandler.bind(this),

      "updateDescription": this.updateMessage.bind(this)
    }

    Object.entries(this.handlers)
      .forEach(([eventName, func]) => this.lobby.on(eventName, func));
  }

  #removeHandlers(){
    this.handle = false;
    Object.entries(this.handlers)
      .forEach(([eventName, func]) => this.lobby.removeListener(eventName, func));

    this.updateMessage();
  }

  async #deleteHandler(){
    this.updateMessage();
  }

  async #enterHandler(userId){
    this.updateMessage();
  }

  async #leaveHandler(userId){
    this.updateMessage();
  }

  async updateMessage(){
    const client = globalThis.app.client;
    const {messageId, channelId} = this.#syncMessage;

    const channel = client.channels.cache.get( channelId );
    const message = await channel.messages.fetch( messageId );
    message.edit( this.toMessage() );
  }

  async displayInteraction(interaction){
    const message = this.toMessage();
    const response = await interaction.reply(message);

    this.#syncMessage = {
      messageId: response.id,
      channelId: response.channel.id
    };
  }



  toMessage(){
    const i18n = this.i18n;
    const lobby = this.lobby;

    if (lobby.deleted)
      return this._toMessageIfDeleted();

    const cells = `${ lobby.players.length } / ${ lobby.players.cells }`;
    const footerText = `${ this.#handle ? i18n("dataBeUpgrade") : i18n("dataNotBeUpgrade") }. ${ i18n("createdAt") }`;

    const description = lobby.description ?? i18n("defaultLobbyDescription");
    const fields = [
      {name: "Слоты", value: cells, inline: true},
      {name: "Основал", value: `<@${ lobby.authorId }>`, inline: true}
    ];


    return new MessageConstructor({
      title: `Просмотр "${ lobby.name }":`,
      description,
      fields,
      footer: {text: footerText},
      color: Command.EMBED_COLOR,
      components: [
        { style: 3, type: 2, customId: `command.lobby.enterPlayer.${ lobby.name }`, label: "Войти в лобби!" },
        { style: 2, type: 2, customId: `command.lobby.showButtons.${ lobby.name }`, label: "Посмотреть другие взаимодействия", emoji: "🔧" }

      ],
      fetchReply: true,
      timestamp: lobby.createdTimestamp

    });
  }


  _toMessageIfDeleted(){
    const lobby = this.lobby;

    if (!lobby.deleted)
      return this.toMessage();

    const time = `<t:${ Math.floor(Date.now() / 1000) }>`;

    return new MessageConstructor({
      title: `Просмотр "${ lobby.name }":`,
      description: `Это лобби было удалено.\nДата удаления: ${ time }`,
      color: Command.EMBED_COLOR,
      fetchReply: true,
      timestamp: lobby.createdTimestamp

    });
  }
}


export { Command };
