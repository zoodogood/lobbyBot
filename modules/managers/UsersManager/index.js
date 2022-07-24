import { Collection } from '@discordjs/collection';
import User from './User.js';

import MethodsExecuter from '@global/methods-executer';
import database from '@database/database';

function resolveUser(user){
  if (typeof user === "object")
    return user.id ?? null;

  return user;
}

class UsersManager {
  static createUser(...options){
    const user = this._initUser(...options);
    user.messages = 0;

    DatabaseUserAPI.insertUser(user);

    return user;
  }


  static _initUser(...options){
    const user = new User(...options);

    const usersList = this.users;

    usersList.set(user.id, user);

    return user;
  }


  static getUser(userResolable){
    const id = resolveUser(userResolable);
    if (!this.users.has(id)){
      this.createUser(id, {});
    }

    return this.users.get(id);
  }

  static async restoreFromDatabase(){
    const data = await DatabaseUserAPI.getAllUsers();

    const toUser = (userData) => {
      const user = this._initUser(userData.id, userData);
      return user;
    };

    data
      .map(toUser)
      .forEach(user => this.users.set(user.id, user));

  }

  static update(userResolable){
    const id = resolveUser(userResolable);
    const userData = this.users.get(id);
    if (!userData)
      return;

    DatabaseUserAPI.updateUser(userData);
  }





  static users = new Collection();
}



class DatabaseUserAPI {

  static async insertUser(user){
    const response = await database
      .from("users")
      .insert([{
        id: user.id
      }]);

    return response;
  }


  static async getAllUsers(){
    const {data, error} = await database
      .from("users")
      .select();

    if (error)
      throw error;


    return data;
  }


  static async updateUser(user){

    const response = await database
      .from("users")
      .update(user)
      .match({ id: user.id });


  }


  static async deleteUser(user){
    const response = await database
      .from("users")
      .delete()
      .match({ id: user.id });
  }
}

export default UsersManager;
