export function makeChoicesBlock(labels: string[]): string {
  const lines = ['Reply:'];
  
  labels.forEach((label, idx) => {
    const n = idx + 1;
    const txt = (label || `Option ${n}`).trim();
    lines.push(`${n} - ${txt}`);
  });
  
  return lines.join('\n');
}

export function replaceOrAppendChoices(message: string, choicesBlock: string): string {
  const re = /\n?\n?Reply:\n(?:.*\n?)*/m;
  
  if (re.test(message)) {
    return message.replace(re, `\n\n${choicesBlock}`);
  }
  
  const trimmed = message.trimEnd();
  return `${trimmed}\n\n${choicesBlock}`.trimEnd();
}
