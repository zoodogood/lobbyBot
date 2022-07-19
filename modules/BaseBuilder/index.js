/**
@useExample
SimpleBuilder extends BaseBuilder
You must set BUILDER_METHODS in enclosing class!

const proxied = new SimpleBuilder().build(data);
*/

class BuilderContext {
  constructor(data){
    this.data = data;
    this.state = 0;
  }

  get stateAPI(){
    const api = {
      set:    (state) => this.state = state,
      add:    (state) => this.state |= state,
      remove: (state) => this.state ^= state,
      has:    (state) => (this.state & state) === state
    }
    return api;
  }

  complete(value){
    this.completeValue = value;
  }
}



class BaseBuilder {
  build(...args){
    const context = new this.constructor.BuilderContext(...args);

    const state = this.constructor.BUILDER_STATES._DEFAULT ?? 0;
    context.stateAPI.set( state );

    return this.#proxy(context);
  }


  #proxy(context){
    const boop = () => {};
    const traps = Object.fromEntries(
      this.constructor.TRAPS
      .map(this.#proxyHandler.bind(this, context))
    );

    const proxy = new Proxy(boop, traps);
    return proxy;
  }

  #proxyHandler(context, key){
    const methods = [ ...this.constructor.BUILDER_METHODS ]
      .filter(({type}) => type === key);

    const callback = (...args) => {
      methods.filter(method => context.stateAPI.has(method.state ?? 0))
        .forEach(method => method.callback.apply(context, args));
        

      return ("completeValue" in context) ?
        context.completeValue :
        this.#proxy(context);
    };
    return [key, callback];
  }


  // { <key>: <bit> }
  // @example {USER: 1, MODERATOR: 2, ADMIN: 4, ALL: 7}
  static BUILDER_STATES = {
    _DEFAULT: 0
  };


  // { type: "get", callback: <proxyTrap>, state?: <bit> }
  static BUILDER_METHODS = [];



  static TRAPS = ["get", "set", "has", "apply", "construct", "deleteProperty", "defineProperty", "ownKeys", "getOwnPropertyDescriptor", "preventExtensions"];

  static BuilderContext = BuilderContext;
}






export default BaseBuilder;
