import DiscordUtil from '@bot/discord-util';
const {MessageConstructor} = DiscordUtil;

import UserManager from '@managers/UserManager';
import GuildManager from '@managers/GuildManager';

const EmojiColors = ["🟣", "🔵"];

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
    // LobbyManager.update(lobby);
  }

  static async onEnd({lobby, interaction}){
    const summarize = new Summarize({lobby, interaction});
    const winners = await summarize.takeWinners({interaction});

    if (!winners)
      return;

    const table = summarize.assignRanks({interaction, winners});


    summarize.sendResults({interaction, winners});
    summarize.sendAudits({interaction, table});
    lobby.game = null;
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
        time: 60_000
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

      this.#handleComponent({componentInteraction, teamIndex, freePlayers});

      if (componentInteraction.result === false){
        continue;
      }

      teamIndex++;
      teamIndex %= this.#TEAMS_COUNT;
    }


    if (this.lobby.game === null)
      return;

    const displayEnd = async () => {
      const messageContent = this.createMessage({chosesNow: teamIndex, freePlayers, type: "SUCESS_END"});
      await sendMessage(messageContent);
    }
    displayEnd();

  }

  #handleComponent({componentInteraction, teamIndex, freePlayers}){
    const lobby = this.lobby;

    const teams = lobby.game.teams;
    const leader = teams.at(teamIndex).leader;

    const userId = componentInteraction.values.at(0);

    if (componentInteraction.user.id !== leader){
      componentInteraction.reply({ content: `Сейчас выбор может сделать только <@${ leader }>`, ephemeral: true });
      componentInteraction.result = false;
      return;
    }

    teams.at(teamIndex).members.push(userId);
    freePlayers.splice( freePlayers.indexOf(userId), 1 );

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


    const fields = teams
      .map((team, index) => {
        const name = `${ EmojiColors.at(index) } Команда #${ index + 1 }`;

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

    if (!componentOptions.length){
      componentOptions.push({label: "Выбрано", value: "null"});
    }


    const message = new MessageConstructor({
      title: TYPES_CONTENT[type].content,
      description: TYPES_CONTENT[type].getDescription(),
      fields,
      components: {
        placeholder: "Выбрать",
        type: 3,
        customId: "_ignore.mode.twoCapitans.choseMember",
        maxValues: 1,
        options: componentOptions,
        disabled: type !== "GOING_ON"
      }
    });

    return message;
  }
}

class Summarize {
  constructor({lobby, interaction}){
    this.lobby = lobby;
    this.interaction = interaction;
  }

  averageMmrOfAll(users){
    return users.reduce((acc, user) => acc + user.mmr, 0) / users.length;
  }

  async takeWinners({interaction}){

    const teams = this.lobby.game.teams;

    const whenComponent = async (message) => {
      return new Promise(resolvePromise => {
        const collectorOptions = {
          time: 15_000
        }
        const collector = message.createMessageComponentCollector(collectorOptions);

        const onCollect = (interaction) => {
          const member = interaction.member;
          const hasPermissions = this.lobby.authorId === member.id || member.permissions.has("MANAGE_GUILD");
          if (!hasPermissions){
            interaction.reply({content: "Вы не можете указать команду победителей", ephemeral: true});
            return;
          }

          interaction.reply({ content: "Успешно", ephemeral: true });
          resolvePromise(interaction);
        };

        collector.on("collect", onCollect);
        collector.on("end", () => resolvePromise(null));
      })
    }



    const componentOptions = teams
      .map((team, index) => {
        const emoji = EmojiColors.at(index);
        const label = `Команда #${ index + 1 }`;
        const value = index.toString();

        return {emoji, label, value};
      });


    const message = new MessageConstructor({
      fetchReply: true,
      description: "Выберите победившую команду",
      components: {
        placeholder: "Выбрать команду",
        type: 3,
        customId: "_ignore.mode.twoCapitans.choseWinners",
        maxValues: 1,
        options: componentOptions,
      }
    });

    const responce = await interaction.reply(message);

    const {values: [value]} = await whenComponent(responce) ?? {values: []};

    responce.delete();

    if (!value)
      return null;

    return {winnersIndex: value};
  }

  async sendResults({interaction, winners}){
    const message = new MessageConstructor({
      description: `Победила команда #${ winners.winnersIndex + 1 }.`,
      footer: { text: `Игра длилась ${ Date.now() - lobby.game.startedTimestamp }мс` }
    });
    interaction.channel.send(message);
  }

  sendAudits({interaction, table}){
    const guildData = GuildManager.getGuild(interaction.guild);

    const channelId = guildData.rankStatsChannelId;

    if (!channelId){
      return;
    }

    const channelsCache = interaction.client.channels.cache;
    const channel = channelsCache.get(channelId);

    const message = new MessageConstructor({
      description: JSON.stringify(table);
    });
    channel.send(message);
  }

  assignRanks({interaction, winners}){
    const lobby = this.lobby;
    const teams = lobby.game.teams;

    const teamToUsers = (team) => [team.leader, ...team.members]
      .map(userId => UserManager.getUser(userId));


    teams.forEach(calculateAverageMmr);

    const losesTeams = teams.filter((team, index)   => index !== winners.winnersIndex);
    const winnersTeams = teams.filter((team, index) => index === winners.winnersIndex);

    losesTeams.forEach(team => {
      const users = teamToUsers(team);
      users.forEach(user => ++user.matchCount && ++user.matchLoses);
    });

    winnersTeams.forEach(team => {
      const users = teamToUsers(team);
      users.forEach(user => ++user.matchCount && ++user.matchWons);
    });


    const calculateMmr = (team, user) => {
      const DEFAULT = 20;
      const leaderCoeffient = user.id === team.leader ? 1.05 : 1;
      const isWinnerCoefficient = winnersTeams.includes(team) ? 1 : -0.9;

      const averageAll  = this.averageMmrOfAll( teams.reduce((acc, team) => acc.concat( teamToUsers(team) ), []) );
      const averageTeam = this.averageMmrOfAll( teamToUsers(team) );

      const difference = averageAll - team.averageMmr;

      return Math.round(
        (DEFAULT + difference / 30) * leaderCoeffient * isWinnerCoefficient
      );
    };

    // id: {past, fresh};
    const table = {};

    teams.forEach(team => {
      const users = teamToUsers(team);

      for (const user of users){

        const tableCell = table[user.id] = {};
        tableCell.past ||= user.mmr;
        tableCell.pastRank ||= user.getRank(interaction)?.roleId;

        user.mmr += calculateMmr(user, team);

        tableCell.fresh = user.mmr;
        tableCell.freshRank ||= user.getRank(interaction)?.roleId;
      }

    });


    return table;
  }
}


export { Mode };
