const fs = require('fs');
const readline = require('readline');

async function inspectLine(lineNum, colNum) {
  const fileStream = fs.createReadStream('discord-assets/assets/web.d4c7976eccf337f1.js');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let current = 1;
  for await (const line of rl) {
    if (current === lineNum) {
      const start = Math.max(0, colNum - 250);
      const snippet = line.substring(start, colNum + 250);
      console.log('=== Line ' + lineNum + ' around col ' + colNum + ' ===');
      console.log(snippet);
      return;
    }
    current++;
  }
}

async function run() {
  await inspectLine(158, 30835);
  await inspectLine(124, 45865);
  await inspectLine(59, 113262);
}
run();
