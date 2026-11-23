const { spawn } = require('node:child_process');
const path = require('node:path');
const root=path.join(__dirname,'..');
const children=[spawn(process.execPath,['--watch','server/index.js'],{cwd:root,stdio:'inherit'}),spawn(process.execPath,['node_modules/next/dist/bin/next','dev'],{cwd:root,stdio:'inherit'})];
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill();process.exitCode=code;}
for(const child of children){child.on('exit',code=>stop(code||0));child.on('error',err=>{console.error(err.message);stop(1)})}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
