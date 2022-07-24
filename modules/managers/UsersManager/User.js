




class User {
  constructor(id, {messages = 0, eloCoins = 50, mmr = 100, matchWons = null, matchLoses = null, matchCount = null}){
    this.id = id;
    this.eloCoins = eloCoins;
    this.mmr = mmr;
    this.messages = messages;

    this.matchCount = matchCount;
    this.matchWons  = matchWons;
    this.matchLoses = matchLoses;
  }
}

export default User;
