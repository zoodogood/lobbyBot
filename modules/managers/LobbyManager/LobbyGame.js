import FileSystem from 'fs';
import { Collection } from '@discordjs/collection';

async function initModes(){
  const __dirname = `${ process.cwd() }`;
  const path = `${ __dirname }/modules/managers/LobbyManager/gameModes`;

  const files = FileSystem.readdirSync(path)
    .filter(name => /^[a-z].+?\.js/.test(name));

  const modes = new Collection();


  for (const fileName of files){
    const { Mode } = await import(`file://${ path }/${ fileName }`);
    const name = Mode.button.value;

    modes.set(name, Mode);
  }
  return modes;
}

const modesList = await initModes();


class LobbyGame {
  constructor(){

  }

  createTeams(teams){
    return this.teams = teams;
  }

  assignData(data){
    Object.assign(this, data);
  }

  static modesList = modesList;
}

export default LobbyGame;
