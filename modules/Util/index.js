class Util {

  static beautifulPercent(percent){
    const isMinus = Math.sign(percent) === -1;
    if (isMinus)
      percent *= -1;

    const result = (entire, float = null) => `${ isMinus ? "-" : "" }${ entire }${ float ? `.${ float }` : "" }%`;

    const [entire, floatRemainder] = String(percent).split(".");
    const THRESHOLDER = 4;

    if (entire.length >= THRESHOLDER)
      return result(entire);

    if (floatRemainder === undefined)
      return result(entire);

    const index = entire === "0" ? [...floatRemainder].findIndex(digit => digit !== "0") : 0;

    const cutZeros = (string) => {
      while (string.at(-1) === "0")
        string = string.slice(0, -1);

      return string;
    }
    const float = cutZeros(
      floatRemainder.slice(0, index + THRESHOLDER - entire.length)
    );

    return result(entire, float);
  }




  static ending(quantity = 0, base, multiple, alone, double, options = {}) {
    if ( isNaN(quantity) )
      return NaN;


    const numbers = quantity % (quantity % 100 > 20 ? 20 : 10);

    const end = (numbers >= 5 || numbers === 0) ?
      multiple :
      (numbers > 1) ? double : alone;

    const word = base + end;
    options.unite ||= (quantity, word) => `${ quantity } ${ word }`;
    const input = options.unite(quantity, word);
    return input;
  };
}

export default Util;
