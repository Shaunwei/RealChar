export function handleCommand(text) {
  const args = text.substring(1).split(' ');
  return args;
}
