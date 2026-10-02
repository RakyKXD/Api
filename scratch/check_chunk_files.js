const fs = require('fs');
const files = [
  '443159.c70c88b8f99ab5e0.js',
  '82721.aa4435832fded1d9.js',
  '674832.1a8db735174558aa.js',
  '549091.e68bd082df20c76f.js',
  '692513.675380ef5b6ae6a5.js',
  '209114.07b846d975ff9e51.js',
  '70798.f9c82bb68fec3500.js',
  '377476.5ecef3e4a3f10fc0.js',
];
for (const f of files) {
  console.log(f, fs.existsSync('public/assets/' + f));
}
