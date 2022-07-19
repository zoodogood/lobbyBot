class BaseEvent {
  #callback;
  #eventTarget;
  #eventName;

  constructor(target, eventName, {once = false} = {}){
    let handlerType = once ? "once" : "on";

    this.#eventTarget = target;
    this.#eventName = eventName;
    this.#callback = this.beforeRun.bind(this);
    target[handlerType](eventName, this.#callback);
  }

  beforeRun(...args){

    if (this.checkCondition?.(...args) === false)
      return;

    this.run(...args);
  }

  remove(){
    this.#eventTarget.removeListener(this.eventName, this.#callback);
  }
}

export default BaseEvent;
