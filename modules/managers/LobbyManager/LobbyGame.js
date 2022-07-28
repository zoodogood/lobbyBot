import GuildManager from '@managers/GuildManager';
import ModesManager from '@managers/ModesManager';

import DiscordUtil from '@bot/discord-util';
const {MessageConstructor} = DiscordUtil;

class LobbyGame {
  constructor(mode){
    this.mode = mode;
  }

  createTeams(teams){
    return this.teams = teams;
  }

  assignData(data){
    Object.assign(this, data);
  }

  start(){
    this.started = true;
    this.startedTimestamp = Date.now();
  }

  get modeInfo(){
    return ModesManager.list.get(this.mode);
  }

  showResultsTable({interaction, table}){
    const guildData = GuildManager.getGuild(interaction.guild);

    const channelId = guildData.rankStatsChannelId;

    if (!channelId){
      return;
    }

    const channelsCache = interaction.client.channels.cache;
    const channel = channelsCache.get(channelId);

    const description = Object.entries(table)
      .map(([userId, {past, fresh, pastRank, freshRank}]) => {
        let rankChunk = "";
        if (pastRank !== freshRank){
          const toString = (rank) => rank ? `<@&${ rank }>` : "N/A";
          rankChunk = `**Ранг:** ${ toString(pastRank) } => ${ toString(freshRank) }`;
        }

        const mmr = `**Очки:** ${ past } ${ fresh > past ? "+" : "-" } ${ Math.abs(fresh - past) } = ${ fresh }`;

        return `<@${ userId }> ${ mmr } ${ rankChunk }`;
      })
      .join("\n");

    const message = new MessageConstructor({
      description
    });
    channel.send(message);
  }
}

export default LobbyGame;
