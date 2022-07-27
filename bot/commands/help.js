import BaseCommand from '../modules/commands/BaseCommand.js';

import DiscordUtil from '@bot/discord-util';

import { Modal, Permissions } from 'discord.js';



const {MessageConstructor, ComponentsSimplify} = DiscordUtil;


class Command extends BaseCommand {
  constructor() {
    super();
  }

  run(interaction){
    const commandsData = globalThis.commands
      .map(command => command.constructor.data);

    const toStringCommand = (commandData) => `\`/${ commandData.name }\``;

    const getPermissions  = (commandData) => new Permissions(
      BigInt(commandData.slash.default_member_permissions ?? 0)
    );

    // https://discordapi.com/permissions.html#27678220350
    const MODERATOR_PERMISSIONS = 27678220350n;

    const description = commands
      .map(command => `\`/${ command.name }\` — ${ command.constructor.data.slash.description }.`)
      .join("\n\n");

    const commandsForUsers = commandsData.filter(commandData => !getPermissions(commandData).any(MODERATOR_PERMISSIONS))
      .map(toStringCommand);

    const commandsForModerators = commandsData.filter(commandData => getPermissions(commandData).any(MODERATOR_PERMISSIONS))
      .map(toStringCommand);

    const fields = [
      { name: "Команды для пользователей:", value: commandsForUsers.join(" ") },
      { name: "Команды для администрации:", value: commandsForModerators.join(" ") }
    ];


    const message = new MessageConstructor({
      ephemeral: true,
      description,
      fields,
      title: "Простенький /help",
      components: { style: 2, type: 2, customId: "command.help.modalReportProblem", label: "Сообщить о проблеме" }
    });
    return interaction.reply(message);
  }

  modalReportProblem([...rest], interaction){
    const components = new ComponentsSimplify().simplify({
      style: 2,
      type: "TEXT_INPUT",
      placeholder: "Опишите подробности здесь..",
      customId: `command.help.input.reportProblem`,
      label: "Описание",
      required: true,
      maxLength: 800
    });


    const modal = new Modal({ customId: "command.help.reportProblem", title: "Отправить отчёт", components });
    interaction.showModal(modal);
  }

  async reportProblem([...rest], interaction){
    const value = interaction.fields.getField("command.help.input.reportProblem").value;
    const user = interaction.user

    const message = new MessageConstructor({
      title: "Отчёт пользователя",
      description: `**Содержимое:**\n${ value }`,
      author: { name: user.username, iconURL: user.avatarURL() },
      timestamp: Date.now()
    });

    const ownerId = process.env.ownerId;

    await interaction.client.users.cache.get( ownerId )
      .send(message);

    interaction.reply({ ...message, ephemeral: true });
  }

  static data = {
    name: "help",
    slash: {
      description: "Have fun!"
    }
  }
}


export { Command };
