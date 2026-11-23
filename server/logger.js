function write(level,message,details={}) {
  const line=JSON.stringify({timestamp:new Date().toISOString(),level,message,...details})+'\n';
  (level==='error'?process.stderr:process.stdout).write(line);
}
module.exports={info:(message,details)=>write('info',message,details),error:(message,details)=>write('error',message,details)};
