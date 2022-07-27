import FileSystem from 'fs';
import { Collection } from '@discordjs/collection';

class Modes {
  static async initModes(){
    const __dirname = `${ process.cwd() }`;
    const path = `${ __dirname }/modules/managers/ModesManager/gameModes`;

    const files = FileSystem.readdirSync(path)
      .filter(name => /^[a-z].+?\.js/.test(name));

    const modes = new Collection();


    for (const fileName of files){
      const { Mode } = await import(`file://${ path }/${ fileName }`);
      const name = Mode.button.value;

      modes.set(name, Mode);
    }

    this.list = modes;
  }
}


export default Modes;
