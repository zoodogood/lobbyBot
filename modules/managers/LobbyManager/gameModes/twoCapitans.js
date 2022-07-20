
class Mode {
  static BUTTON = {
    label: "Два капитана",
    value: "twoCapitans",
    description: "Случайным образом выбираются двое. Собирают команду"
  }

  static async onStart({game, interaction}){
    const client = interaction.client;

    const game = lobby.createGame();

    const freePlayersList = [...lobby.players];

    const spliceRandom = (array) => {
      const index = Math.floor(Math.random() * array.length);
      return array.splice(index, 1);
    }

    const TEAMS_COUNT = 2;
    game.teams = [...new Array(TEAMS_COUNT)]
      .map(() => ({ leader: spliceRandom(freePlayersList) }));

    const message = await interaction.channel.send();
  }

  static onEnd({game, interaction}){

  }
}


export { Mode };
