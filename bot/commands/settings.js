import BaseCommand from '../modules/commands/BaseCommand.js';

import { Modal } from "discord.js";
import DiscordUtil from '@bot/discord-util';

import Util from "@global/util";
const {MessageConstructor, ComponentsSimplify} = DiscordUtil;

import GuildManager from '@managers/GuildManager';


class Command extends BaseCommand {
  constructor() {
    super();
  }

  run(interaction){
    const message = this.createMessage({interaction});
    interaction.reply(message);
  }

  createMessage({interaction}){
    let { rankRoles, rankStatsChannelId } = GuildManager.getGuild( interaction.guild );

    if (!rankRoles)
      rankRoles = [];

    const author = {name: interaction.guild.name, iconURL: interaction.guild.iconURL()};

    const message = new MessageConstructor({
      author,
      title: "Настройки Бота",
      color: "#7e1503",
      fields: [
        { name: "Ранговые Роли", value: `(${ Util.ending(rankRoles.length, "рол", "ей", "ь", "и") })`, inline: true },
        { name: "Канал для отправки результатов рангов", value: `<#${ rankStatsChannelId }>`, inline: true }

      ],
      components: [
        { style: 2, type: 2, customId: `command.settings.rankRoles.run`, label: "Просмотреть ранговые роли" },
        { style: 2, type: 2, customId: `command.settings.modalSetRankStatsChannel`, label: "Установить канал для рангов" }

      ]
    });

    return message;
  }


  rankRoles([methodName, ...rest], interaction){
    const rankRoles = new RankRolesUI();
    return rankRoles[methodName](rest, interaction);
  }


  modalSetRankStatsChannel([...rest], interaction){
    const components = new ComponentsSimplify().simplify({
      style: 1,
      type: "TEXT_INPUT",
      placeholder: "<#994913375626743838>",
      customId: `command.settings.input.setRankStatsChannel`,
      label: "Канал"
    });


    const modal = new Modal({ customId: "command.settings.setRankStatsChannel", title: "Установите канал", components });
    interaction.showModal(modal);
  }



  async setRankStatsChannel([...rest], interaction){
    const value = interaction.fields.getField("command.settings.input.setRankStatsChannel").value;
    const channelId = value.match(/\d{17,19}/)?.[0];

    if (!channelId){
      const message = new MessageConstructor({ content: "Не удалось определить айди канала в переданном тексте", ephemeral: true });
      interaction.reply(message);
      return;
    }

    const isChannelExists = interaction.client.channels.cache.has(channelId);

    if (!isChannelExists){
      const message = new MessageConstructor({ content: `Не удалось получить объект канала с ID ${ channelId }`, ephemeral: true });
      interaction.reply(message);
      return;
    }

    const guild = interaction.guild;
    const guildData = GuildManager.getGuild(guild);

    guildData.rankStatsChannelId = channelId;
    await GuildManager.update( guildData );

    const message = new MessageConstructor({ content: `Успешно обновлено ✅`, ephemeral: true });
    interaction.reply(message);
  }

  static data = {
    name: "settings",
    // Discord SlashCommands
    slash: {
      type: 1,
      description: "Параметры бота",
      dm_perrmissions: true,
      default_member_permissions: 8,
      options: []
    }
  };


}

class RankRolesUI {

  run([...rest], interaction){
    const message = this.createMessage({interaction});
    interaction.reply(message);
  }


  replaceContent({interaction, comment}){
    const message = this.createMessage({interaction});

    if (comment)
      message.content = `${ comment }`;

    interaction.update(message);
  }


  createMessage({interaction}){
    const guildData = GuildManager.getGuild( interaction.guild.id );
    const rolesData = (guildData.rankRoles ?? [])
      .map(data => data.split(":"))
      .sort(([_1, a], [_2, b]) => a - b);

    const toField = ([roleId, mmrThreshloder], i) => {
      const name = `**${ i + 1 }**.`;
      const SPACE = "⠀";

      const value = `<@&${ roleId }> (${ mmrThreshloder });${ SPACE.repeat(4) }`;

      return { name, value, inline: true }
    };

    const fields = rolesData.length ?
      rolesData.map(toField) :
      [{ name: "Нет ни одной роли.", value: "Следует добавить!"}];

    const message = new MessageConstructor({
      ephemeral: true,
      fields,
      color: "#010101",
      components: [
        [
          {
            type: "BUTTON",
            customId: "command.settings.rankRoles.modalEdit",
            style: 2,
            label: "Отредактировать или удалить",
            disabled: !rolesData.length
          },
          {
            type: "BUTTON",
            customId: "command.settings.rankRoles.modalCreate",
            style: 2,
            label: "Добавить",
          }
        ],
        [{
            type: "BUTTON",
            customId: "command.settings.rankRoles.removeAll",
            style: 4,
            label: "Удалить всё!",
            disabled: !rolesData.length
        }]
      ]
    });

    return message;
  }


  modalEdit([...rest], interaction){
    const guildData = GuildManager.getGuild( interaction.guild.id );
    const rolesData = (guildData.rankRoles ?? [])
      .map(data => data.split(":"))
      .sort(([_1, a], [_2, b]) => a - b);


    const components = new ComponentsSimplify().simplify({
      style: 2,
      type: "TEXT_INPUT",
      value: rolesData.length ?
        rolesData.map(([roleId, mmrThreshloder]) => `${ roleId }:${ mmrThreshloder }`).join("  ") :
        "Здесь пусто, укажите данные в формате <айди роли>:<ммр>, например, так: `984687102472122368:0  994913375626743838:100`",

      customId: `command.settings.rankRole.rawData`,
      label: "Айди роли : рейтинг для её получения"
    });

    const modal = new Modal({ customId: "command.settings.rankRoles.edit", title: "Отредактируйте список ролей", components });
    interaction.showModal(modal);
  }


  edit([...rest], interaction){
    const guildData = GuildManager.getGuild( interaction.guild );

    const rawData = interaction.fields.getField("command.settings.rankRole.rawData").value;
    const rawArray = rawData.match(/\d+:\d+/g);

    if (rawArray === null){
      this.throwOut({customText: `Взаимодействие привело бы к полной очистке данных. Отменено.\nИспользуйте кнопку "Удалить всё", если действительно хотите удалить все ранги.`, interaction});
      return;
    }

    const oldList = (guildData.rankRoles ?? [])
      .map(raw => raw.split(":"));

    const newList = rawArray
      .map(raw => raw.split(":"));


    guildData.rankRoles = rawArray;
    GuildManager.update(guildData);

    const createComment = () => {
      const changesList = {
        deleted: 0,
        updated: 0,
        created: 0,
        strange: null
      }

      const isDeleted = ([roleId, mmr]) => {
        const result = newList.every(([compareRoleId]) => compareRoleId !== roleId);

        if (result)
          changesList.deleted++;

        return result;
      }

      const isUpdated = ([roleId, mmr]) => {
        const result = oldList.some(([compareRoleId, compareMmr]) => compareRoleId === roleId && compareMmr !== mmr);

        if (result)
          changesList.updated++;

        return result;
      }

      const isCreated = ([roleId, mmr]) => {
        const result = oldList.every(([compareRoleId]) => compareRoleId !== roleId);

        if (result)
          changesList.created++;

        return result;
      }



      oldList
        .forEach(isDeleted);

      newList
        .forEach(isUpdated);

      newList
        .forEach(isCreated);

      const strange = rawData.replaceAll(/\d+:\d+/g, "").trim();
      changesList.strange = strange || null;

      const PHRASES = {
        deleted: (count) => `Удалено: ${ count }`,
        updated: (count) => `Обновлено: ${ count }`,
        created: (count) => `Создано: ${ count }`,
        strange: (content) => `Cтранный контент: ${ content }`
      }

      const commentInfo = Object
        .entries(changesList)
        .filter(([key, value]) => value)
        .map(([key, value]) => PHRASES[key](value))
        .join("\n");

      const comment = commentInfo ? `>>> После взаимодействия:\n${ commentInfo }` : "";
      return comment;
    }



    const comment = createComment();
    this.replaceContent({interaction, comment});
  }

  modalCreate([...rest], interaction){
    const components = new ComponentsSimplify().simplify([
      [{
        style: 1,
        type: "TEXT_INPUT",
        placeholder: "<@&994913375626743838>",
        customId: `command.settings.rankRoles.roleId`,
        label: "Роль или её айди",
        required: true,
        minLength: 17,
        maxLength: 24
      }],
      [{
        style: 1,
        type: "TEXT_INPUT",
        customId: `command.settings.rankRoles.rankMmr`,
        placeholder: "100",
        label: "Минимальный рейтинг",
        required: true,
        maxLength: 10
      }]
    ]);


    const modal = new Modal({ customId: "command.settings.rankRoles.create", title: "Создание новой роли", components });
    interaction.showModal(modal);
  }

  create([...rest], interaction){

    const roleIdField =  interaction.fields.getField("command.settings.rankRoles.roleId").value;
    const mmrField =     interaction.fields.getField("command.settings.rankRoles.rankMmr").value;

    const roleId = roleIdField.match(/\d{17,19}/)?.[0];

    if (!roleId){
      this.throwOut({code: "NULL_ROLE_IN_TEXT", interaction});
      return;
    }

    const mmr = mmrField.match(/\d+/)?.[0];

    if (!mmr){
      this.throwOut({customText: "Некорректно указан рейтинг", interaction});
      return;
    }

    const role = interaction.guild.roles.cache.get(roleId);
    if (!role){
      this.throwOut({code: "NOT_ROLE_IN_GUILD", interaction});
      return;
    }



    const guildData = GuildManager.getGuild( interaction.guild );

    if (guildData.rankRoles === null){
      guildData.rankRoles = [];
    }

    const { rankRoles } = guildData;

    rankRoles.push(`${ roleId }:${ mmr }`);

    GuildManager.update(guildData);

    const comment = `> ${ role } успешно добавлена. Пороговое значение рейтинга: ${ mmr }`;
    this.replaceContent({interaction, comment});
  }

  removeAll([...rest], interaction){
    const guildData = GuildManager.getGuild( interaction.guild );
    guildData.rankRoles = [];

    GuildManager.update(guildData);

    const comment = `> Все ранги были удалены`;
    this.replaceContent({interaction, comment});
  }


  throwOut({code, customText, interaction}){
    const CODES = {
      EMPTY_FIELD: "Одно или несколько полей пусты!",
      NULL_ROLE_IN_TEXT: "Не удалось определить роль в полученном тексте",
      NOT_ROLE_IN_GUILD: "На сервере не найдено роли с таким ID"
    }

    const content = customText ?? CODES[ code ];
    interaction.reply({ ephemeral: true, content });
  }

}


export { Command };
