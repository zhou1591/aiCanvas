const fs = require('fs');

let filePath = '';
let newFilePath = '';

// i5ting_toc 改写
filePath = './node_modules/i5ting_toc/index.js';
newFilePath = './node_modules_rewrite/i5ting_toc/index.js';
fs.writeFileSync(filePath, fs.readFileSync(newFilePath, 'utf8'));


// template模板 改写
filePath = './node_modules/i5ting_toc/vendor/template.html';
newFilePath = './node_modules_rewrite/i5ting_toc/vendor/template.html';
fs.writeFileSync(filePath, fs.readFileSync(newFilePath, 'utf8'));

console.log('\x1B[32m%s\x1B[0m', 'i5ting_toc was patched!');


