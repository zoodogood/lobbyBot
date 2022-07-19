class QueryBuilder {
  #database
  constructor(database){
    this.#database = database;
  }

  createProxy(queries){
    let target = {...queries};
    const get = (_, prop) => {

      if (prop === "execute")
        return this.getExecutor(target);


      if (!(prop in target))
        return undefined;

      target = target[prop];
      return proxy();
    };

    const apply = (_, context, args) => {
      target = target.apply(context, args);
      return proxy();
    }

    const proxy = () => new Proxy(() => {}, {get, apply});
    return proxy();
  }


  getExecutor(query){
    if (typeof query !== "string")
      throw new TypeError("A getExecutor must be used with string-SQL Query");

    return this.#execute.bind(this, query);
  }


  #execute(query){
    return this.#database.execute(query);
  }
}

export default QueryBuilder;
