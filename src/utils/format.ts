export function formatString(str: string, ...args: any[]): string {
  let i = 0;
  return str.replace(/{}/g, () => {
    return typeof args[i] !== "undefined" ? args[i++] : "";
  });
}
