
import Modes from '@managers/ModesManager';


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
    return Modes.list.get(this.mode);
  }
}

export default LobbyGame;
