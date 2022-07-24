import { Collection } from '@discordjs/collection';
import Lobby from './Lobby.js';

import MethodsExecuter from '@global/methods-executer';
import database from '@database/database';


class LobbyManager {
  static createLobby(...options){
    const lobby = this._initLobby(...options);

    DatabaseLobbyAPI.insertLobby(lobby);

    return lobby;
  }


  static _initLobby(...options){
    const lobby = new Lobby(...options);

    const lobbiesList = this.lobbies;
    if (lobbiesList.has(lobby.name))
      this.#uniqueNameProtocol(lobby);

    lobbiesList.set(lobby.name, lobby);
    this.#setLobbyHandlers(lobby);

    return lobby;
  }

  static update(lobby){
    DatabaseLobbyAPI.updateLobby(lobby);
  }

  static #deleteHandle(lobby){
    lobby.deleted = true;

    this.lobbies.delete(lobby.name);
    DatabaseLobbyAPI.deleteLobby(lobby);
  }

  static #setLobbyHandlers(lobby){
    lobby.on("enter", () => {
      LobbyManager.update(lobby);
      new MethodsExecuter().execute(`event.lobbyEvents.onEnter.${ lobby.name }`);
    });

    lobby.on("leave", () => LobbyManager.update(lobby));

    lobby.on("fill", () => new MethodsExecuter().execute(`event.lobbyEvents.onFill.${ lobby.name }`));

    lobby.on("delete", () => this.#deleteHandle(lobby));
  };


  static async restoreFromDatabase(){
    const data = await DatabaseLobbyAPI.getAllLobbies();

    const toLobby = ({name, authorId, guildId, players, createdTimestamp, game, description}) => {
      const lobby = this._initLobby(name, {authorId, guildId, description});

      if (lobby.game){
        const data = JSON.parse(lobby.game);
        lobby.createGame(data.mode);
        lobby.game.assignData(data);
      }

      lobby.players = players;
      lobby.createdTimestamp = createdTimestamp;
      return lobby;
    };

    data
      .map(toLobby)
      .forEach(lobby => this.lobbies.set(lobby.name, lobby));
  }



  // executed when created 2 lobby with the same names
  static #uniqueNameProtocol(lobby){
    const lobbiesList = this.lobbies;
    let currentName = lobby.name;

    if (!/.+?~(?:\d+)$/.test(currentName))
      currentName += "-0";

    while ( lobbiesList.has(currentName) )
      currentName = currentName.replace(/-(\d+)$/, (full, count) => `-${ +count + 1 }`);

    lobby.name = currentName;
  }

  static lobbies = new Collection();
}



class DatabaseLobbyAPI {

  static async insertLobby(lobby){
    const response = await database
      .from("lobbies")
      .insert([{
        name: lobby.name,
        authorId: lobby.authorId,
        guildId:  lobby.guildId,
        createdTimestamp: lobby.createdTimestamp,
        players: JSON.stringify(lobby.players),
        playersCells: lobby.players.cells
      }]);

    return response;
  }


  static async getAllLobbies(){
    const {data, error} = await database
      .from("lobbies")
      .select();

    if (error)
      throw error;

    data.forEach(lobbyData => {
      const players = JSON.parse(lobbyData.players);

      players.cells = lobbyData.playersCells;

      lobbyData.players = players;
    })


    return data;
  }

  static async updateLobby(lobby){
    const data = {
      name: lobby.name,
      authorId: lobby.authorId,
      guildId:  lobby.guildId,
      createdTimestamp: lobby.createdTimestamp,
      players: JSON.stringify(lobby.players),
      playersCells: lobby.players.cells,
      description: lobby.description,
      mode: lobby.mode,
      game: JSON.stringify(lobby.game)
    };

    const response = await database
      .from("lobbies")
      .update(data)
      .match({ name: lobby.name });
  }



  static async deleteLobby(lobby){
    const response = await database
      .from("lobbies")
      .delete()
      .match({ name: lobby.name });
  }
}


export default LobbyManager;
