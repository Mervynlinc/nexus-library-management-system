require('dotenv').config({path: require('node:path').join(__dirname, '../.env')});
const fs = require('node:fs');
const path = require('node:path');
const {pool, withTransaction} = require('./pool');
withTransaction(async client => {
  await client.query(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
  await client.query(fs.readFileSync(path.join(__dirname,'management.sql'),'utf8'));
}).then(()=>console.info('Database schema ready')).catch(err=>{console.error('Database initialization failed:',err.message);process.exitCode=1}).finally(()=>pool.end());
