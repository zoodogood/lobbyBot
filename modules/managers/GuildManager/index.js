import { Collection } from '@discordjs/collection';
import Guild from './Guild.js';

import MethodsExecuter from '@global/methods-executer';
import database from '@database/database';

function resolveId(guild){
  if (typeof guild === "object")
    return guild.id ?? null;

  return guild;
}

class GuildsManager {
  static createGuild(...options){
    const guild = this._initGuild(...options);

    DatabaseGuildAPI.insertGuild(guild);

    return guild;
  }


  static _initGuild(...options){
    const guild = new Guild(...options);

    const guildsList = this.guilds;

    guildsList.set(guild.id, guild);

    return guild;
  }


  static getGuild(guildResolable){
    const id = resolveId(guildResolable);
    if (!this.guilds.has(id)){
      this.createGuild(id, {});
    }

    return this.guilds.get(id);
  }

  static async restoreFromDatabase(){
    const data = await DatabaseGuildAPI.getAllGuilds();

    const toGuild = (guildData) => {
      const guild = this._initGuild(guildData.id, guildData);
      return guild;
    };

    data
      .map(toGuild)
      .forEach(guild => this.guilds.set(guild.id, guild));

  }

  static async update(guildResolable){
    const id = resolveId(guildResolable);
    const guildData = this.guilds.get(id);
    if (!guildData)
      return;

    await DatabaseGuildAPI.updateGuild(guildData);
  }





  static guilds = new Collection();
}



class DatabaseGuildAPI {

  static async insertGuild(guild){
    const response = await database
      .from("guilds")
      .insert([{
        id:  guild.id
      }]);

    return response;
  }


  static async getAllGuilds(){
    const {data, error} = await database
      .from("guilds")
      .select();

    if (error)
      throw error;


    return data;
  }


  static async updateGuild(guild){

    const response = await database
      .from("guilds")
      .update(guild)
      .match({ id: guild.id });


  }


  static async deleteGuild(guild){
    const response = await database
      .from("guilds")
      .delete()
      .match({ id: guild.id });
  }
}

export default GuildsManager;
