import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname( fileURLToPath(import.meta.url) );

import FileSystem from 'fs';

import { VM } from 'vm2';
import Util from '@global/util';


function isTranslateFile(path){
  const INDICATOR = /.+?\.ini$/;
  return INDICATOR.test( path );
}

function disassemblePath(path){
  const baseLength = LocalesStructure.FOLDER.split("/").length;
  path = path.split("/").slice(baseLength);
  path[path.length - 1] = path.at(-1).replace(".ini", "");
  return path;
}




class LocalesStructure {

  constructor(){
    this.categories = {};
    this.filesPaths = this.#searchFiles()
      .filter(isTranslateFile);

    this.#setLocales();
  }

  #searchFiles(){
    const basePath = this.constructor.FOLDER;

    const files = [];
    const queue = [basePath];

    const readDirectory = (path) => {
      const directoryFiles = FileSystem.readdirSync(`${ __dirname }/${ path }`)
        .map(name => `${ path }/${ name }`);

      for (const file of directoryFiles){
        const receiver = FileSystem.lstatSync(`${ __dirname }/${ file }`).isDirectory()
          ? queue : files;

        receiver.push(file);
      }
    }

    while (queue.length)
      readDirectory( queue.shift() );

    return files;
  }

  #setLocales(){
    const structure = {};

    const locales = this.filesPaths.map(path => new LocaleContent(path));
    locales.forEach(({path, lines}) => {
      path = disassemblePath(path);

      let currentPosition = structure;
      for (const property of path)
        currentPosition = currentPosition[ property ] ||= {};

      for (const line of lines)
        currentPosition[ line.key ] = { type: line.type, value: line.value };

    });

    this.locales = structure;
  }

  api(){
    return new I18nAPI(this.locales);
  }


  static FOLDER = "./languages";
}





class LocaleContent {
  constructor(path){
    this.path = path;
    this.plainText = this.#readFile();

    this.lines = this.#parse(this.plainText);
  }


  #readFile(){
    return FileSystem.readFileSync(`${ __dirname }/${ this.path }`, "utf-8");
  }


  #parse(plainText){
    const commentRegex = /(?:^|\n)\/\/.+/g;
    plainText = plainText.replaceAll(commentRegex, "");

    const lineRegex = this.constructor.getLineRegex();
    const matched = [...plainText.matchAll(lineRegex)];


    const lines = matched.map(([full, key, separator, value]) => {
      const line = {};
      line.key   = key;
      line.value = value;
      line.type  = separator.length - 1; // variants =, =*, =**
      return line;
    });

    return lines;
  }


  static getLineRegex(){
    const separator = "=\\*?\\*?";
    const key       = "[a-zA-Z_$]+";
    const content   = "(?:.|\\n|\\r)+?";
    const end       = `(?=(?:\\s|\\n|\\r)*(?:${ key }\\s*${ separator }|$))`;

    const plain = `(?:\\n|\\s)*(${ key })\\s*(${ separator })\\s*\\n?(${ content })${ end }`;
    return new RegExp(plain, "g");
  }
}





class I18nAPI {
  constructor(structure){
    this.structure = structure;
    this.locale = this.constructor.defaultLocale;
  }

  lineResolver(way, selectLocale){
    if (!(way instanceof Array))
      throw new TypeError("Way must be Array");

    selectLocale ||= this.constructor.defaultLocale;

    let current = this.structure[ selectLocale ];
    for (const point of way)
      current = current?.[ point ];

    if (current === undefined)
      return selectLocale !== this.constructor.defaultLocale ?
        this.lineResolver(way, null) :
        null;

    if (!this.isEnd(current))
      throw new Error("incomplete way");

    return this.#resolveLine.bind(this, current);
  }

  isLocaleExits(locale){
    if (typeof locale !== "string")
      throw new TypeError("expected locale name");

    return locale in this.structure;
  }


  // line: {type: <0-2>, value: <string>}
  #resolveLine(line, ...args){
    let value = line.value;
    switch (line.type) {
      case 1:
        value = value.replaceAll(/(?<!\\)\{\{.+?\}\}/g, () => args.shift());
        break;

      case 2:
        const vm = new VM({ sandbox: {Util, args} });
        value = vm.run(`\`${ value }\``);
        break;
    }
    return value;
  }


  isEnd(point){
    return "value" in point && "type" in point;
  }

  static defaultLocale = "ru";
}




export default LocalesStructure;
