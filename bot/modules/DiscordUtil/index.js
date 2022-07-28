import {MessageEmbed, MessageActionRow} from 'discord.js';


function isDefaultEmbed(embed){

  const DEFAULT_PROPERTIES = {
    title: null,
    author: null,
    thumbnail: null,
    description: null,
    fields: [],
    image: null,
    footer: null,
    timestamp: Number.NaN,
    video: null
  }


  // in isDefaultEmbed context is a good compare
  const isEqualDefault = (key) => String(embed[key]) === String(DEFAULT_PROPERTIES[key]);

  const isEveryPropertyDefault = Object.keys(DEFAULT_PROPERTIES)
    .every(isEqualDefault);

  return isEveryPropertyDefault;
}


class MessageConstructor {
  constructor({
    content,
    title, url, author, thumbnail, description, color, fields, image, video, footer, timestamp,
    ephemeral, fetchReply,
    components, reactions, webhook,

  }){
    thumbnail &&= { url: trumbnail };
    image     &&= { url: image };

    color ||= "RANDOM";

    const embed = new MessageEmbed({
      title, url, author, thumbnail,
      description, color, fields,
      image, video, footer, timestamp
    });

    if (!isDefaultEmbed(embed)){
      this.embeds = [embed];
    }

    this.components = components ? new ComponentsSimplify().simplify(components) : null;


    this.content    = content;
    this.ephemeral  = ephemeral;
    this.fetchReply = fetchReply;
  }
}



class ComponentsSimplify {
  simplify(data){

    if (data instanceof Array && data.length === 0)
      return [];

    const isComponent  = (component) => "type" in component;
    const isActionRow  = (component) => component instanceof Array && isComponent(component.at(0)) || component instanceof MessageActionRow;
    const isComponents = (component) => component.length && isActionRow(component.at(0));

    const argumentType = [
      isComponent(data),
      isActionRow(data),
      isComponents(data)
    ].findIndex(Boolean);

    if (argumentType === -1)
      throw new TypeError("expected component");

    const inArray = (component) => [component];
    const arrayToActionRow = (componentsArray) => {
      if (componentsArray.type === "ACTION_ROW")
        return componentsArray;

      return { type: "ACTION_ROW", components: componentsArray };
    }
    const actionRowInArray = (actionRow) => [actionRow];


    if (argumentType <= 0)
      data = inArray(data);

    if (argumentType <= 1)
      data = actionRowInArray(data)

    data = data.map(arrayToActionRow);
    return data;
  }
}

export default {
  MessageConstructor,
  ComponentsSimplify,
  isDefaultEmbed
};
