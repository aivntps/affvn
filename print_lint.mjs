import fs from 'fs';

const report = JSON.parse(fs.readFileSync('lint_final.json', 'utf8'));

for (const file of report) {
  if (file.errorCount > 0 || file.warningCount > 0) {
    console.log(`\n📄 ${file.filePath}`);
    const sourceLines = file.source ? file.source.split('\n') : fs.readFileSync(file.filePath, 'utf8').split('\n');
    for (const msg of file.messages) {
      console.log(`[L${msg.line}] ${msg.message}`);
      console.log(`   ${sourceLines[msg.line - 1].trim()}`);
    }
  }
}
