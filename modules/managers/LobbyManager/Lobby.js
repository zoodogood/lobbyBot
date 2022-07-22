import EventsEmitter from 'events';
import LobbyGame from './LobbyGame.js';

function resolveId(data){
  if (typeof data === "object")
    return data.id ?? null;

  return data;
}


/**
@events:
fill
enter
leave
delete

gameStart
gameEnd

updateDescription
*/

class Lobby extends EventsEmitter {
  constructor(name, {playersCount = 6, authorId: userResolable, guildId: guildResolable, description, mode}){
    super();

    this.name = name;
    this.players = [];
    this.players.cells = playersCount;

    this.authorId = resolveId(userResolable);
    this.guildId  = resolveId(guildResolable);

    this.description = description;
    this.mode = mode;

    this.createdTimestamp = Date.now();
  }

  enterPlayer(userResolable){
    const id = resolveId(userResolable);


    if (this.players.includes(id))
      throw new Error("LOBBY_USER_ALREADY_ENTER");

    if (this.players.length >= this.players.cells)
      throw new Error("LOBBY_CELLS_ARE_FILL");

    this.players.push(id);
    this.emit("enter", id);

    this.#checkFilling();
  }

  leavePlayer(userResolable){
    const id = resolveId(userResolable);

    if (!this.players.includes(id))
      throw new Error("LOBBY_USER_NOT_ENTER");

    const index = this.players.indexOf(id);

    this.players.splice(index, 1);
    this.emit("leave", id);
  }

  delete(){
    this.emit("delete");
    for (const key in this._events)
      this.removeAllListeners(key);


  }

  setDescription(description){
    this.description = description;
    this.emit("updateDescription", description);
  }

  setMode(mode){
    this.mode = mode;
    this.emit("updateGameMode", mode);
  }


  #checkFilling(){
    if (this.players.length >= this.players.cells)
      this.emit("fill");
  }

  createGame(){
    this.game = new LobbyGame();
    return this.game;
  }
}

export default Lobby;
