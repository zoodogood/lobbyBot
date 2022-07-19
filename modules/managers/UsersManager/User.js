




class User {
  constructor(id, {messages = 0, eloCoins = 50, mmr = 100}){
    this.id = id;
    this.eloCoins = eloCoins;
    this.mmr = mmr;
    this.messages = messages;
  }
}

export default User;
