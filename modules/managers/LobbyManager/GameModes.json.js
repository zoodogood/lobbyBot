const GAME_MODES = {

  twoCapitans: {
    button: {
      label: "Два капитана",
      value: "twoCapitans",
      description: "Случайным образом выбираются двое. Собирают команду"
    },
    onStart: function({lobby, interaction}){
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


    },
    onEnd: function({lobby, interaction}){

    }
  }


}

export { GAME_MODES };
