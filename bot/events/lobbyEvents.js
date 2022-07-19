import LobbyManager from '@managers/lobby';

import DiscordUtil from '@bot/discord-util';
const {MessageConstructor} = DiscordUtil;

class Event {

  onGameStart([id, ...rest], interaction){
    console.log(interaction);
  }

  onGameEnd([id, ...rest], interaction){

  }

  onEnter([id, ...rest]){
    const lobby = LobbyManager.lobbies.get(id);
    const usersCollection = globalThis.app.client.users.cache;

    const author = usersCollection.get(lobby.authorId);

    const fillDescription = `Обязательно проверьте готовность участников прежде чем начинать матч.`;
    const isFill = lobby.players.length === lobby.players.cells;

    const cells = `${ lobby.players.length }/${ lobby.players.cells }`;

    const description = `К лобби "${ lobby.name }" присоединился новый участник.\n${ cells }\n\n${ isFill ? fillDescription : "" }`;

    const message = new MessageConstructor({
      description
    });

    author.send(message);
  }

  onFill([id, ...rest]){
    const lobby = LobbyManager.lobbies.get(id);
    const usersCollection = globalThis.app.client.users.cache;

    lobby.players.forEach(id => {
      const message = new MessageConstructor({
        title: "Лобби к которому Вы ранее присоединялись заполнено",
        description: `Перейдите на сервер, чтобы подтвердить вашу готовность. Игра начнется как только создатель лобби или модераторы сервера запустят матч.\n**Имя лобби:** "${ lobby.name }"`
      });

      usersCollection.get( id )
        .send(message);
    })
  }

}

export { Event };
