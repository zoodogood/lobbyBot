



class Guild {
  constructor(id, {rankRoles = null, rankStatsChannelId = null}){
    this.id = id;
    
    this.rankRoles = rankRoles;
    this.rankStatsChannelId = rankStatsChannelId;
  }
}

export default Guild;
