
const fs = require('fs');
let file = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/8b219a72-89e3-4767-b18e-afb126bbb8a2/task.md';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('- [/] **ActivityHistory.tsx**: Fix Tambah Aktivitas Modal not opening properly', '- [x] **ActivityHistory.tsx**: Fix Tambah Aktivitas Modal not opening properly');
fs.writeFileSync(file, content);
console.log('Task updated');

