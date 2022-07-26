
import GuildManager from '@managers/GuildManager';



class User {
  constructor(id, {
    messages = 0, eloCoins = 50, mmr = 100, matchWons = 0, matchLoses = 0, matchCount = 0,
    nickname = null, tagId = null

  }){
    this.id = id;

    this.eloCoins = eloCoins;
    this.mmr      = mmr;
    this.messages = messages;

    this.nickname = nickname;
    this.tagId    = tagId;

    this.matchCount = matchCount;
    this.matchWons  = matchWons;
    this.matchLoses = matchLoses;
  }

  getRank({guild}){
    const { rankRoles } = GuildManager.getGuild(guild);
    const { mmr: userMmr } = this;

    if (rankRoles === null)
      return null;

    const heighstRole = rankRoles
      .map(data => data.split(":"))
      .filter(([roleId, mmr]) => userMmr >= mmr)
      .reduce((acc, [roleId, mmr]) => mmr > acc.mmr ? ({roleId, mmr}) : acc, {mmr: 0});

    return heighstRole;
  }
}

export default User;
