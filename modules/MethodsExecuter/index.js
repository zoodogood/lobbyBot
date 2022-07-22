/***
  @useExample
  new MethodsExecuter().execute("command.help.onMainButton", ...args);
  it's apply globalThis.commands.get("help").onMainButton.apply(<this>, [...rest], args);
*/
import LobbyManager from '@managers/lobby';

class MethodsExecuter {
  execute(expression, ...args){
    const  [type, identify, method, ...rest] = expression.split( this.constructor.SEPARATOR );

    const component = this.constructor.supportedComponents[type];
    if (!component)
      return null;
      
    const list = typeof component.list === "function" ?
      component.list(this) : component.list;

    const target = component.getTarget(list, identify);
    return this.#executer(target, method, rest, ...args);
  }

  #executer(target, method, rest, ...args){
    if (!( method in target))
      throw new Error(`${ target.constructor.name }, ${ method } is undefined`);

    return target[ method ].call(target, rest, ...args);
  }


  static supportedComponents = {
    "command": {
      list: () => globalThis.commands,
      getTarget: (list, identify) => list.get(identify)
    },
    "event": {
      list: () => globalThis.eventsList,
      getTarget: (list, identify) => list.get(identify)
    },
    "lobbies": {
      list: () => LobbyManager.lobbies,
      getTarget: (list, identify) => list.get(identify)
    }
    // "site": {
    //   list: globalThis.site.botAPI,
    //   getTarget: (list, identify) => null // in developing
    // }
  };

  static SEPARATOR = ".";
}

export default MethodsExecuter;
