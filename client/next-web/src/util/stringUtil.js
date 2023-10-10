export function handleCommand(text) {
  const command = {};
  const arr = text.split(' ');
  command.action = arr[0].substring(1);
  command.options = {};
  for (let i = 1; i < arr.length; i++) {
    const option = arr[i].split(':');
    command.options[option[0]] = option[1];
  }
  return command;
}
