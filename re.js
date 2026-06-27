const nconf  = require('nconf');
const readline  = require('readline');
const { argv0, stdin, stdout, exit  } = require('node:process');
const { open, readFile } = require('node:fs/promises');
const { delimiter } = require('path');

const _SELF_NAME=argv0;




function usage(){
    console.log("Usage: <command> | "+_SELF_NAME+" -e <regexp patter> > [file|stdout]")
    console.log(_SELF_NAME+" -e <regexp patter> -f inputfile [> outfile | <stdout> ]")
}

function output(R){
   
    let tpl = "`"+nconf.get('outTpl')+"`";
    const str=eval(tpl)
    console.log(str);
    return str;
}

function process_stdin(re){
    return new Promise((resolve, reject)=>{
        const results=[];
        try{
            const ifRL = readline.createInterface({
                    input: stdin,
                    output: stdout,
                    terminal: false
            });

            ifRL.on('line', (li)=>{
                //console.log(li);
                const res=re.exec(li); 
            
                if(res!=null){
                    output(res);
                    results.push(res);
                }
            });    

            ifRL.once('close', ()=>{
                resolve(results);
            });
        }catch(err){
            resolve(results);
            reject(err);
        }
    });

}

async function process_file(re, infile){
    infile=infile.toString();
    const infh = await open(infile);
    const results=[];
    for await (const line of infh.readLines()) {
        const res=re.exec(line);
        if(typeof res!= 'string'){
            results.push(res);
            output(res);
        }
    }
}

module.exports=async function(){
    nconf.argv();
    //console.dir(nconf, {depth:10});
    if(nconf.get('h') || nconf.get('help')){
        usage();
        exit(1);
    }

    if(!nconf.get('e')){
        console.error("REGEXP Pattern expected.  -e <patter>: ")
        usage();
        exit(0);
    }

   
    const restr = nconf.get('e');
    const flags = nconf.get('flags')||"";
   
    const RE =new RegExp(restr, flags);
 //  console.dir(RE);
    const src=(nconf.get('f') || nconf.get('file'))||'stdin';  
    if(src=='stdin'){
      //  console.log("process stdin");
        await process_stdin(RE);
    }else{
        //console.log('process file '+src)
        await process_file(RE, src)
    }
 //   console.dir(nconf, {depth: 10});
}