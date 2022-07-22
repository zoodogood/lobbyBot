import DiscordUtil from '@bot/discord-util';
const {MessageConstructor} = DiscordUtil;

class Mode {
  static button = {
    label: "Два капитана",
    value: "twoCapitans",
    description: "Случайным образом выбираются двое. Собирают команду"
  }

  static async onStart({lobby, interaction}){
    const teamAssemler = new AssembleTeam({lobby, interaction});
    await teamAssemler.createTeam();

    // if interrupted
    if (lobby.game === null)
      return;

    lobby.game.start();


  }

  static onEnd({lobby, interaction}){

  }

}

class AssembleTeam {
  constructor({lobby, interaction}){
    this.lobby = lobby;
    this.interaction = interaction;
  }

  #TEAMS_COUNT = 2;

  async createTeam(){
    const freePlayersList = [...this.lobby.players];
    const team = this.initTeam(freePlayersList);

    await this.chosesPlayers(freePlayersList);


  }

  initTeam(freePlayersList){
    const {lobby, interaction} = this;

    const client = interaction.client;
    const game = lobby.game;


    const spliceRandom = (array) => {
      const index = Math.floor(Math.random() * array.length);
      return array.splice(index, 1).at(0);
    }

    const teams = [...new Array( this.#TEAMS_COUNT )]
      .map(() => ({ leader: spliceRandom(freePlayersList), members: [] }));

    game.createTeams(teams);
    return teams;


  }


  async chosesPlayers(freePlayers){

    const sendMessage = async (messageContent) => {
      if (!sendMessage.target){
        const responce = await this.interaction.channel.send(messageContent);
        sendMessage.target = responce;
        return responce;
      }

      const responce = sendMessage.target.edit(messageContent);
      return responce;
    };

    const whenComponent = async (message) => {
      const collectorOptions = {
        filter: (interaction) => true,
        time: 15_000
      }
      const componentInteraction = await message.awaitMessageComponent(collectorOptions)
        .catch(() => {});

      return componentInteraction;
    }


    let teamIndex = 0;
    while (freePlayers.length){

      const messageContent = this.createMessage({chosesNow: teamIndex, freePlayers, type: "GOING_ON"});

      await sendMessage(messageContent);
      const componentInteraction = await whenComponent(sendMessage.target);

      if (!componentInteraction){
        const message = this.createMessage({chosesNow: teamIndex, freePlayers, type: "INTERRUPTED"});
        sendMessage(message);

        this.lobby.game = null;
        break;
      }

      this.#handleComponent(componentInteraction, teamIndex);

      if (componentInteraction.result === false){
        continue;
      }

      teamIndex %= this.#TEAMS_COUNT;
    }


    if (this.lobby.game === null)
      return;

    const displayEnd = () => {
      const message = this.createMessage({chosesNow: teamIndex, freePlayers, type: "SUCESS_END"});
      await sendMessage(messageContent);
    }
    displayEnd();

  }

  #handleComponent(componentInteraction, teamIndex){
    const lobby = this.lobby;

    const teams = lobby.game.teams;
    const leader = teams.at(teamIndex).leader;

    const userId = componentInteraction.values.at(0);

    if (componentInteraction.user.id !== leader){
      componentInteraction.reply({ content: `Сейчас выбор может сделать только <@${ leader }>`, ephemeral: true });
      return false;
    }

    teams.at(teamIndex).members.push(userId);

    componentInteraction.reply({ content: `<@${ userId }> присоединился к команде #${ teamIndex + 1 }`, ephemeral: true });
  }



  createMessage({chosesNow, freePlayers, type}){
    const lobby = this.lobby;
    const teams = this.lobby.game.teams;

    const TYPES_CONTENT = {
      GOING_ON: {
        content: "Происходит формирование команд",
        getDescription: () => `<@${ teams[chosesNow].leader }>, используйте меню выбора, чтобы добавить одного участника в свою команду. Выбор происходит поочередно между лидерами\n\nОсталось игроков: ${ freePlayers.length }`
      },
      INTERRUPTED: {
        content: "Создание команд прервано",
        getDescription: () => "Время вышло."
      },
      SUCESS_END: {
        content: "Создание команд завершено",
        getDescription: () => "Обе команды успешно сформированы — свободных игроков нет.\n\nС этого момента игра считается начавшейся.\nМодераторам доступна кнопка по нажатию которой все игроки получат очки рейтинга."
      }
    }

    const colors = ["🟣", "🔵"];

    const fields = teams
      .map((team, index) => {
        const name = `${ colors.at(index) } Команда #${ index + 1 }`;

        const leader = `**Лидер:**\n<@${ team.leader }>`;
        const membersList = team.members.map(userId => `· <@${ userId }>`);
        const membersContent = `**Участники:**\n${ membersList.length ? membersList.join("\n") : "— пусто." }`;

        const value = `${ leader }\n${ membersContent }\n⠀`;

        return {name, value};
      });

    const usersCache = this.interaction.client.users.cache;

    const componentOptions = freePlayers.map((userId) => {
      const label = usersCache.get(userId).username;
      const value = userId;
      return {label, value};
    });

    const message = new MessageConstructor({
      title: TYPES_CONTENT[type].content,
      description: TYPES_CONTENT[type].getDescription(),
      fields,
      components: {
        placeholder: "Выбрать",
        type: 3,
        customId: "_ignore.mode.twoCapitans.choseMember",
        maxValues: 1,
        options:
        componentOptions,
        disabled: type !== "GOING_ON"
      }
    });

    return message;
  }
}


export { Mode };
