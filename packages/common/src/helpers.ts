/**
 * converts to lowercase kebabcase
 * @param str 
 * @returns 
 */
export const kebabCase = (str: string) => {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z0-9]*|\b)|[A-Z]?[a-z0-9]*|[A-Z]|[0-9]+/g)
    .filter(Boolean)
    .map((x) => x.toLowerCase())
    .join("-");
};
