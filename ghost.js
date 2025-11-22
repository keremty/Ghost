const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

let babelParser, babelTypes, babelGenerator;
try {
  babelParser = require('@babel/parser');
  babelTypes = require('@babel/types');
  babelGenerator = require('@babel/generator').default;
} catch(e) {
  console.log("Babel packages not found. AST-based transformations will be skipped. To enable them, run: npm install @babel/parser @babel/types @babel/generator");
}

const st4rtTs = Date.now();

const f1leArg = process.argv[2];
const safeMode = true; 
if(!f1leArg){
  console.log('Usage: node ghost.js <inputFile.js>');
  process.exit(1);
}
const inF1lePath = path.isAbsolute(f1leArg) ? f1leArg : path.resolve(process.cwd(), f1leArg);
let runC0de = fs.readFileSync(inF1lePath, 'utf8')


class UniqueNameGenerator {
  constructor() {
    this.seed = Date.now() + Math.random() * 1000000;
    this.counter = 0;
    this.charset = this.generateCharset();
    this.usedNames = new Set();
  }
  
  generateCharset() {
    const patterns = [
      () => Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i)).join(''),
      () => Array.from({length: 26}, (_, i) => String.fromCharCode(97 + i)).join(''),
      () => '_$abcdefghijklmnopqrstuvwxyz',
      () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_$'
    ];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)]();
    return pattern.split('').sort(() => Math.random() - 0.5).join('');
  }
  
  hash(str) {
    let h = this.seed;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h = h & h;
    }
    return Math.abs(h);
  }
  
  generate(prefix = '') {
    let name;
    let attempts = 0;
    do {
      const hash = this.hash(prefix + this.counter++ + Math.random());
      const len = 8 + (hash % 8);
      name = '';
      for (let i = 0; i < len; i++) {
        name += this.charset[(hash + i) % this.charset.length];
      }
      if (!/^[a-zA-Z_$]/.test(name)) {
        name = this.charset[hash % 26] + name;
      }
      attempts++;
      if(attempts > 100) {
        this.charset = this.charset.split('').sort(() => Math.random() - 0.5).join('');
        attempts = 0;
      }
    } while (this.usedNames.has(name) || /^(eval|require|console|process|global|module|exports|Buffer|__dirname|__filename)$/.test(name));
    this.usedNames.add(name);
    return name;
  }
}

function inj3ctN01s3(code, { safeInsert = false } = {}) {
  const nameGen = new UniqueNameGenerator();
  const deadCodePatterns = [];
  
  const deadCodeTemplates = [
    () => {
      const funcName = nameGen.generate();
      const paramName = nameGen.generate();
      const varName1 = nameGen.generate();
      const varName2 = nameGen.generate();
      return `
      function ${funcName}(${paramName}){
        if(false){
          const ${varName1}=Array.isArray(${paramName})?${paramName}.length:0;
          const ${varName2}=typeof ${paramName}==='object'?Object.keys(${paramName}).length:0;
          return ${varName1}>${varName2};
        }
        return true;
      }`;
    },
    () => {
      const funcName = nameGen.generate();
      const dataVar = nameGen.generate();
      const hashVar = nameGen.generate();
      const resultVar = nameGen.generate();
      return `
      function ${funcName}(${dataVar}){
        if(Math.random()>1.5){
          let ${hashVar}=0;
          for(let i=0;i<${dataVar}.length;i++){
            ${hashVar}=((${hashVar}<<5)-${hashVar})+${dataVar}.charCodeAt(i);
            ${hashVar}|=0;
          }
          const ${resultVar}=${hashVar}.toString(16);
          return ${resultVar};
        }
        return null;
      }`;
    },
    () => {
      const funcName = nameGen.generate();
      const bufVar = nameGen.generate();
      const sizeVar = nameGen.generate();
      const tempVar = nameGen.generate();
      return `
      function ${funcName}(${sizeVar}){
        if([]===![]){
          const ${bufVar}=new Array(${sizeVar}).fill(0);
          const ${tempVar}=${bufVar}.map((x,i)=>i^0xFF);
          return ${tempVar}.slice(0,${sizeVar});
        }
        return null;
      }`;
    },
    () => {
      const funcName = nameGen.generate();
      const inputVar = nameGen.generate();
      const encodedVar = nameGen.generate();
      const baseVar = nameGen.generate();
      return `
      function ${funcName}(${inputVar}){
        if(typeof null==='object'&&false){
          const ${baseVar}=16+Math.floor(Math.random()*20);
          const ${encodedVar}=${inputVar}.toString(${baseVar});
          return ${encodedVar}.split('').reverse().join('');
        }
        return ${inputVar};
      }`;
    },
    () => {
      const funcName = nameGen.generate();
      const promiseVar = nameGen.generate();
      const resultVar = nameGen.generate();
      const timeoutVar = nameGen.generate();
      return `
      async function ${funcName}(){
        if(0==='0'&&typeof 0==='string'){
          const ${timeoutVar}=Math.floor(Math.random()*1000);
          const ${promiseVar}=new Promise(r=>setTimeout(r,${timeoutVar}));
          await ${promiseVar};
          const ${resultVar}=Date.now()+Math.random();
          return ${resultVar};
        }
        return Promise.resolve(0);
      }`;
    },
    () => {
      const funcName = nameGen.generate();
      const arrVar = nameGen.generate();
      const filteredVar = nameGen.generate();
      const mappedVar = nameGen.generate();
      return `
      function ${funcName}(${arrVar}){
        while(false){
          const ${filteredVar}=${arrVar}.filter(x=>x!==undefined);
          const ${mappedVar}=${filteredVar}.map(x=>x*2);
          return ${mappedVar}.reduce((a,b)=>a+b,0);
        }
        return 0;
      }`;
    },
    () => {
      const funcName = nameGen.generate();
      const strVar = nameGen.generate();
      const charsVar = nameGen.generate();
      const resultVar = nameGen.generate();
      return `
      function ${funcName}(${strVar}){
        if(NaN===NaN&&false){
          const ${charsVar}=${strVar}.split('');
          const ${resultVar}=${charsVar}.map(c=>String.fromCharCode(c.charCodeAt(0)^0xAA));
          return ${resultVar}.join('');
        }
        return ${strVar};
      }`;
    },
    () => {
      const funcName = nameGen.generate();
      const objVar = nameGen.generate();
      const keysVar = nameGen.generate();
      const valuesVar = nameGen.generate();
      return `
      function ${funcName}(${objVar}){
        if(undefined===void 0&&null){
          const ${keysVar}=Object.keys(${objVar});
          const ${valuesVar}=Object.values(${objVar});
          return ${keysVar}.length===${valuesVar}.length;
        }
        return false;
      }`;
    }
  ];
  
  const deadCodeCount = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < deadCodeCount; i++) {
    const template = deadCodeTemplates[Math.floor(Math.random() * deadCodeTemplates.length)];
    deadCodePatterns.push(template());
  }
  
  if (safeInsert) {
    return code + '\n' + deadCodePatterns.join('\n');
  }
  
  const lines = code.split('\n');
  const positions = Array.from({length: deadCodePatterns.length}, () => 
    Math.floor(Math.random() * lines.length)
  ).sort((a, b) => b - a);
  positions.forEach((pos, i) => {
    lines.splice(pos, 0, deadCodePatterns[i]);
  });
  return lines.join('\n');
}

function genJunkC0de() {
  const nameGen = new UniqueNameGenerator();
  const patterns = [];

  for(let i = 0; i < 3; i++) {
    const v1 = nameGen.generate();
    const v2 = nameGen.generate();
    const v3 = nameGen.generate();
    patterns.push(`
      const ${v1}=(x=>x*2+1)(Math.floor(Math.random()*100));
      const ${v2}=(y=>y<<2|y>>2)(${v1});
      const ${v3}=((a,b)=>a^b^a)(${v1},${v2});
    `);
  }
  return patterns.join('\n');
}

function sw4pVar5(code) {
  const nameGen = new UniqueNameGenerator();
  const v1 = nameGen.generate();
  const v2 = nameGen.generate();
  const v3 = nameGen.generate();
  
  const swapCode = `
    let ${v1}=Math.random(),${v2}=Date.now(),${v3}=0;
    for(let i=0;i<5;i++){
      ${v3}=${v1};${v1}=${v2};${v2}=${v3};
      ${v1}^=${v2};${v2}^=${v1};${v1}^=${v2};
    }
  `;
  return swapCode + '\n' + code;
}

function addExprC0mpl3x(code) {
  const nameGen = new UniqueNameGenerator();
  const complexExpressions = [];

  for(let i = 0; i < 4; i++) {
    const varName = nameGen.generate();
    const expr = [
      `(function(x){return x+x-x})(${Math.floor(Math.random()*100)})`,
      `(Math.floor(Math.random()*10)^Math.floor(Math.random()*10))`,
      `(Date.now()&0xFF)|(Date.now()>>8&0xFF)`,
      `[1,2,3].reduce((a,b)=>a+b,0)*0+${Math.floor(Math.random()*10)}`
    ][i % 4];
    complexExpressions.push(`const ${varName}=${expr};`);
  }
  return complexExpressions.join('\n') + '\n' + code;
}

function func1nd1r(code) {
  const nameGen = new UniqueNameGenerator();
  const wrapperName = nameGen.generate();
  const mapName = nameGen.generate();
  
  const indirectCode = `
    const ${mapName}=new Map();
    const ${wrapperName}=(fn,args)=>{
      const key=fn.toString();
      if(!${mapName}.has(key)){${mapName}.set(key,fn);}
      return ${mapName}.get(key)(...args);
    };
  `;
  return indirectCode + '\n' + code;
}

function add0p4qPr3ds(code) {
  const nameGen = new UniqueNameGenerator();
  const predicates = [];

  for(let i = 0; i < 3; i++) {
    const varName = nameGen.generate();
    const checkName = nameGen.generate();
    
    predicates.push(`
      const ${varName}=Math.abs(Math.sin(Date.now()));
      const ${checkName}=(x)=>(x*x>=0)&&(x+1>x)||(x===x);
      if(!${checkName}(${varName})){throw new Error('Invalid state');}
    `);
  }
  return predicates.join('\n') + '\n' + code;
}

function obfNumb5(code) {
  const numberPatterns = [
    (n) => `(${n}^0)`,
    (n) => `(${n}|0)`,
    (n) => `(~~${n})`,
    (n) => `(${n}+0)`,
    (n) => `(${n}-0)`,
    (n) => `(${n}*1)`
  ];
  let out = '';
  let i = 0;
  let state = 'code';
  let tmplDepth = 0;
  const len = code.length;

  function isDigit(ch){ return ch >= '0' && ch <= '9'; }
  function isIdent(ch){ return /[A-Za-z0-9_$]/.test(ch); }

  while (i < len) {
    const ch = code[i];
    const next = i + 1 < len ? code[i+1] : '';

    if (state === 'code') {
      if (ch === '/' && next === '/') { state = 'line'; out += ch; i++; out += next; i++; continue; }
      if (ch === '/' && next === '*') { state = 'block'; out += ch; i++; out += next; i++; continue; }
      if (ch === '\'' || ch === '"') { state = ch === '\'' ? 'squote' : 'dquote'; out += ch; i++; continue; }
      if (ch === '`') { state = 'template'; tmplDepth = 1; out += ch; i++; continue; }
      if (ch === '/' && !isIdent(out[out.length-1] || '') && out[out.length-1] !== ')' ) {
        state = 'regex'; out += ch; i++; continue;
      }
      if (isDigit(ch)) {
        let j = i;
        while (j < len && isDigit(code[j])) j++;
        const before = out[out.length-1] || '';
        const after = code[j] || '';
        const isIsolated = !isIdent(before) && after !== '.' && !isIdent(after);
        if (isIsolated) {
          const num = code.slice(i, j);
          if (parseInt(num) <= 1000 && Math.random() > 0.6) {
            const pattern = numberPatterns[Math.floor(Math.random() * numberPatterns.length)];
            out += pattern(num);
          } else {
            out += num;
          }
          i = j; continue;
        }
      }
      out += ch; i++; continue;
    }
    if (state === 'line') { out += ch; i++; if (ch === '\n') state = 'code'; continue; }
    if (state === 'block') { out += ch; i++; if (ch === '*' && next === '/') { out += next; i++; state = 'code'; } continue; }
    if (state === 'squote') { out += ch; i++; if (ch === '\\') { out += code[i] || ''; i++; } else if (ch === '\'') { state = 'code'; } continue; }
    if (state === 'dquote') { out += ch; i++; if (ch === '\\') { out += code[i] || ''; i++; } else if (ch === '"') { state = 'code'; } continue; }
    if (state === 'template') {
      out += ch; i++;
      if (ch === '\\') { out += code[i] || ''; i++; continue; }
      if (ch === '`') { state = 'code'; tmplDepth = 0; continue; }
      if (ch === '$' && next === '{') { out += next; i++; 
        let exprDepth = 1;
        while (i+1 < len && exprDepth > 0) {
          const c = code[++i];
          out += c;
          const n = code[i+1];
          if (c === '{') exprDepth++;
          else if (c === '}') exprDepth--;
          else if (c === '\\') { out += code[++i] || ''; }
        }
        continue;
      }
      continue;
    }
    if (state === 'regex') { out += ch; i++; if (ch === '\\') { out += code[i] || ''; i++; } else if (ch === '/' ) { state = 'code'; } continue; }
  }
  return out;
}

function m4st3r0bf(code, { safeMode = true } = {}) {
  let result = code;
  try { result = inj3ctN01s3(result, { safeInsert: safeMode }); } catch (e) {}
  try { result = add0p4qPr3ds(result); } catch (e) {}
  try { result = sw4pVar5(result); } catch (e) {}
  try { result = addExprC0mpl3x(result); } catch (e) {}
  try { result = func1nd1r(result); } catch (e) {}
  try { const junkCode = genJunkC0de(); result = junkCode + '\n' + result; } catch (e) {}
  return result;
}

class BaseTransform {
  apply(code) { return code; }
  get name() { return this.constructor.name; }
}
class InjectNoiseTransform extends BaseTransform {
  constructor(safeMode) { super(); this.safeMode = safeMode; }
  apply(code) { return inj3ctN01s3(code, { safeInsert: this.safeMode }); }
}
class OpaquePredicatesTransform extends BaseTransform {
  apply(code) { return add0p4qPr3ds(code); }
}
class SwapVarsTransform extends BaseTransform {
  apply(code) { return sw4pVar5(code); }
}
class AddExprComplexTransform extends BaseTransform {
  apply(code) { return addExprC0mpl3x(code); }
}
class IndirectFuncTransform extends BaseTransform {
  apply(code) { return func1nd1r(code); }
}
class JunkPrefixTransform extends BaseTransform {
  apply(code) {
    try { const junk = genJunkC0de(); return junk + '\n' + code; } catch(e){ return code; }
  }
}

class MasterObfuscator {
  constructor(transforms = []) { this.transforms = transforms; }
  run(code) {
    let out = code;
    for (const t of this.transforms) {
      try { out = t.apply(out); } catch(e) { /*  */ }
    }
    return out;
  }
}

function m4st3r0bfPoly(code, { safeMode = true } = {}) {
  const pipeline = new MasterObfuscator([
    new InjectNoiseTransform(safeMode),
    new OpaquePredicatesTransform(),
    new SwapVarsTransform(),
    new AddExprComplexTransform(),
    new IndirectFuncTransform(),
    new JunkPrefixTransform()
  ]);
  return pipeline.run(code);
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

class AddExprComplexVariantTransform extends AddExprComplexTransform {
  constructor(){
    super();
    this.variant = Math.floor(Math.random()*3); 
  }
  apply(code){
    let out = super.apply(code);
    if(this.variant===1){ out = addExprC0mpl3x(out); }
    else if(this.variant===2){ out = addExprC0mpl3x(addExprC0mpl3x(out)); }
    return out;
  }
}

class JunkPrefixVariantTransform extends JunkPrefixTransform {
  constructor(){ super(); this.repeat = 1 + Math.floor(Math.random()*2); }
  apply(code){
    let out = code;
    for(let i=0;i<this.repeat;i++){ out = super.apply(out); }
    return out;
  }
}

class InjectNoiseVariantTransform extends InjectNoiseTransform {
  constructor(safeMode){ super(safeMode); this.extra = Math.random()>0.5; }
  apply(code){
    let out = super.apply(code);
    if(this.extra){ out = inj3ctN01s3(out,{ safeInsert: this.safeMode }); }
    return out;
  }
}

function buildRandomPipeline(safeMode){
  const base = [
    new InjectNoiseVariantTransform(safeMode),
    new OpaquePredicatesTransform(),
    new SwapVarsTransform(),
    new AddExprComplexVariantTransform(),
    new IndirectFuncTransform(),
    new JunkPrefixVariantTransform()
  ];
  shuffle(base);
  const min = 3;
  const take = min + Math.floor(Math.random()*(base.length-min+1));
  return new MasterObfuscator(base.slice(0,take));
}

function signatureHeader(pipeline){
  const names = pipeline.transforms.map(t=>t.name).join('|');
  const raw = names + '::' + Date.now() + '::' + Math.random();
  const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0,32);
  return `// POLY-SIG:${hash} TRANS:${names}`;
}

function m4st3r0bfPolyDynamic(code,{ safeMode = true } = {}){
  const pipe = buildRandomPipeline(safeMode);
  let out = pipe.run(code);
  const header = signatureHeader(pipe);
  return header + '\n' + out;
}

function hybr1dEnc(text, masterkey, iterations) {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(masterkey, salt, iterations, 32, 'sha512');
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  
  const xorKey = crypto.randomBytes(32);
  const encBuffer = Buffer.from(encrypted, 'base64');
  const xorEncrypted = Buffer.from(encBuffer.map((byte, i) => 
    byte ^ xorKey[i % xorKey.length]
  ));
  
  const baseConversion = xorEncrypted.toString('base64')
    .split('').reverse().join('');
  
  return {
    data: baseConversion,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    xorKey: xorKey.toString('base64')
  };
}

function g3nUn1qD3cr() {
  const nameGen = new UniqueNameGenerator();
  
  const mainFunc = nameGen.generate();
  const dataVar = nameGen.generate();
  const keyVar = nameGen.generate();
  const saltVar = nameGen.generate();
  const ivVar = nameGen.generate();
  const tagVar = nameGen.generate();
  const xorVar = nameGen.generate();
  const layer1 = nameGen.generate();
  const layer2 = nameGen.generate();
  const layer3 = nameGen.generate();
  const tempVar1 = nameGen.generate();
  const tempVar2 = nameGen.generate();
  const loopVar = nameGen.generate();
  const decipherVar = nameGen.generate();
  
  const iterations = 150000 + Math.floor(Math.random() * 50000);
  
  const code = `
function ${mainFunc}(${dataVar},${keyVar},${saltVar},${ivVar},${tagVar},${xorVar}){
const ${layer3}=${dataVar}.split('').reverse().join('');
const ${tempVar1}=Buffer.from(${layer3},'base64');
const ${xorVar}Buffer=Buffer.from(${xorVar},'base64');
const ${layer2}=Buffer.from(${tempVar1}).map((${loopVar},i)=>${loopVar}^${xorVar}Buffer[i%${xorVar}Buffer.length]);
const ${tempVar2}=crypto.pbkdf2Sync(${keyVar},Buffer.from(${saltVar},'base64'),${iterations},32,'sha512');
const ${decipherVar}=crypto.createDecipheriv('aes-256-gcm',${tempVar2},Buffer.from(${ivVar},'base64'));
${decipherVar}.setAuthTag(Buffer.from(${tagVar},'base64'));
let ${layer1}=${decipherVar}.update(${layer2}.toString('base64'),'base64','utf8');
${layer1}+=${decipherVar}.final('utf8');
return ${layer1};
}`;

  return { code, funcName: mainFunc, iterations };
}

function parseToAST(src){
  if(!babelParser) return null;
  try {
    return babelParser.parse(src, { sourceType: 'unambiguous', allowReturnOutsideFunction: true, plugins: ['asyncGenerators','bigInt','classProperties','dynamicImport'] });
  } catch(e){ return null; }
}

function generateCode(ast){
  if(!babelGenerator) return null;
  try { return babelGenerator(ast, { retainLines: false, compact: false }).code; } catch(e){ return null; }
}

function randItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randBool(){ return Math.random()>0.5; }
function randInt(min,max){ return min + Math.floor(Math.random()*(max-min+1)); }

function generateDeadFunctionAST(nameGen){
  const fnName = nameGen.generate();
  const param = nameGen.generate();
  const localA = nameGen.generate();
  const localB = nameGen.generate();
  const localC = nameGen.generate();
  
  const ops = ['+','-','*','^','|','&'];
  const chosenOps = Array.from({length: randInt(2,4)},()=>randItem(ops));
  const comparator = randItem(['>','<','===','!==','>=','<=']);

  let loopStmt;
  if(randBool()) {
    loopStmt = babelTypes.forStatement(
      babelTypes.variableDeclaration('let',[babelTypes.variableDeclarator(babelTypes.identifier(localC), babelTypes.numericLiteral(0))]),
      babelTypes.binaryExpression('<', babelTypes.identifier(localC), babelTypes.numericLiteral(randInt(2,5))),
      babelTypes.updateExpression('++', babelTypes.identifier(localC)),
      babelTypes.blockStatement([
        babelTypes.expressionStatement(
          babelTypes.assignmentExpression('=', babelTypes.identifier(localA),
            chosenOps.reduce((acc,op)=> babelTypes.binaryExpression(op, acc, babelTypes.numericLiteral(randInt(1,9))), babelTypes.identifier(localA))
          )
        )
      ])
    );
  } else {
    loopStmt = babelTypes.whileStatement(
      babelTypes.binaryExpression('<', babelTypes.identifier(localA), babelTypes.numericLiteral(randInt(10,30))),
      babelTypes.blockStatement([
        babelTypes.expressionStatement(
          babelTypes.assignmentExpression('=', babelTypes.identifier(localA),
            babelTypes.binaryExpression('+', babelTypes.identifier(localA), babelTypes.numericLiteral(randInt(1,3)))
          )
        ),
        babelTypes.ifStatement(
          babelTypes.binaryExpression(comparator, babelTypes.identifier(localA), babelTypes.identifier(localB)),
          babelTypes.blockStatement([
            babelTypes.expressionStatement(
              babelTypes.assignmentExpression('=', babelTypes.identifier(localB),
                babelTypes.binaryExpression('+', babelTypes.identifier(localB), babelTypes.numericLiteral(randInt(1,5)))
              )
            )
          ]),
          null
        )
      ])
    );
  }

  const initA = babelTypes.variableDeclaration('let',[babelTypes.variableDeclarator(babelTypes.identifier(localA), babelTypes.numericLiteral(randInt(1,20)))]);
  const initB = babelTypes.variableDeclaration('let',[babelTypes.variableDeclarator(babelTypes.identifier(localB), babelTypes.numericLiteral(randInt(5,50)))]);

  const earlyReturn = babelTypes.ifStatement(
    babelTypes.binaryExpression(comparator, babelTypes.identifier(localA), babelTypes.identifier(localB)),
    babelTypes.blockStatement([
      babelTypes.returnStatement(babelTypes.booleanLiteral(randBool()))
    ]),
    null
  );

  const ret = babelTypes.returnStatement(
    babelTypes.logicalExpression('||',
      babelTypes.binaryExpression(comparator, babelTypes.identifier(localA), babelTypes.identifier(localB)),
      babelTypes.booleanLiteral(randBool())
    )
  );

  return babelTypes.functionDeclaration(
    babelTypes.identifier(fnName),
    [babelTypes.identifier(param)],
    babelTypes.blockStatement([
      initA,
      initB,
      loopStmt,
      earlyReturn,
      ret
    ])
  );
}

function injectDeadCode(ast){
  if(!babelTypes.isFile(ast)) return ast;
  const nameGen = new UniqueNameGenerator();
  const count = randInt(3,6);
  for(let i=0;i<count;i++) {
    ast.program.body.unshift(generateDeadFunctionAST(nameGen));
  }
  return ast;
}


function flattenFunctionSwitch(fn) {
  if (!babelTypes.isFunctionDeclaration(fn) && !babelTypes.isFunctionExpression(fn) && !babelTypes.isArrowFunctionExpression(fn)) return;
  if (!babelTypes.isBlockStatement(fn.body)) return;
  
  const bodyStmts = fn.body.body;
  if (bodyStmts.length < 3) return;

  const nameGen = new UniqueNameGenerator();
  const stateVar = nameGen.generate();
  
  const nodes = bodyStmts.map((stmt, index) => ({
    id: index + 1, 
    stmt: stmt,
    next: index + 1 === bodyStmts.length ? 0 : index + 2
  }));

  const shuffledNodes = [...nodes].sort(() => Math.random() - 0.5);

  const cases = shuffledNodes.map(node => {
    return babelTypes.switchCase(
      babelTypes.numericLiteral(node.id),
      [
        node.stmt,
        babelTypes.expressionStatement(
          babelTypes.assignmentExpression('=', babelTypes.identifier(stateVar), babelTypes.numericLiteral(node.next))
        ),
        babelTypes.breakStatement()
      ]
    );
  });

  const initDecl = babelTypes.variableDeclaration('let', [
    babelTypes.variableDeclarator(babelTypes.identifier(stateVar), babelTypes.numericLiteral(1))
  ]);

  const whileLoop = babelTypes.whileStatement(
    babelTypes.binaryExpression('!==', babelTypes.identifier(stateVar), babelTypes.numericLiteral(0)),
    babelTypes.blockStatement([
      babelTypes.switchStatement(babelTypes.identifier(stateVar), cases)
    ])
  );

  fn.body.body = [initDecl, whileLoop];
}

function controlFlowFlatten(ast){
  babelTypes.traverseFast(ast, node => {
    if(babelTypes.isFunctionDeclaration(node)) flattenFunctionSwitch(node);
  });
  return ast;
}

function dynamicEncrypt(code, key){
  const opsPool = ['reverse','xor','bitshift'];
  const sequence = shuffle([...opsPool]).slice(0, randInt(2,3));
  let buffer = Buffer.from(code, 'utf8');
  let xorKey = crypto.randomBytes(32);
  let shiftVal = randInt(1,7);
  for(const op of sequence){
    if(op==='xor') {
      buffer = Buffer.from(buffer.map((b,i)=> b ^ xorKey[i % xorKey.length]));
    } else if(op==='reverse') {
      buffer = Buffer.from(buffer.reverse());
    } else if(op==='bitshift') {
      buffer = Buffer.from(buffer.map(b=> ((b << shiftVal) | (b >> (8-shiftVal))) & 0xFF));
    }
  }
  const meta = { seq: sequence, xor: xorKey.toString('base64'), shift: shiftVal };
  return { encrypted: buffer.toString('base64'), meta };
}

function generateDynamicDecryptStub(metaVarNames){
  const { dataVar, keyMetaVar, outFnName } = metaVarNames;
  
  const seqAccess = babelTypes.memberExpression(babelTypes.identifier(keyMetaVar), babelTypes.identifier('seq'));
  const xorAccess = babelTypes.memberExpression(babelTypes.identifier(keyMetaVar), babelTypes.identifier('xor'));
  const shiftAccess = babelTypes.memberExpression(babelTypes.identifier(keyMetaVar), babelTypes.identifier('shift'));

  const bufDecl = babelTypes.variableDeclaration('let',[babelTypes.variableDeclarator(
    babelTypes.identifier('buf'),
    babelTypes.callExpression(
      babelTypes.memberExpression(babelTypes.identifier('Buffer'), babelTypes.identifier('from')),
      [babelTypes.identifier(dataVar), babelTypes.stringLiteral('base64')]
    )
  )]);

  const reversedSeqDecl = babelTypes.variableDeclaration('const',[babelTypes.variableDeclarator(
    babelTypes.identifier('_revSeq'),
    babelTypes.callExpression(
      babelTypes.memberExpression(
        babelTypes.callExpression(
          babelTypes.memberExpression(seqAccess, babelTypes.identifier('slice')),
          []
        ),
        babelTypes.identifier('reverse')
      ),
      []
    )
  )]);

  const loop = babelTypes.forOfStatement(
    babelTypes.variableDeclaration('const',[babelTypes.variableDeclarator(babelTypes.identifier('op'))]),
    babelTypes.identifier('_revSeq'),
    babelTypes.blockStatement([
      babelTypes.ifStatement(
        babelTypes.binaryExpression('===', babelTypes.identifier('op'), babelTypes.stringLiteral('xor')),
        babelTypes.blockStatement([
          babelTypes.variableDeclaration('const',[babelTypes.variableDeclarator(
            babelTypes.identifier('xorKey'),
            babelTypes.callExpression(
              babelTypes.memberExpression(babelTypes.identifier('Buffer'), babelTypes.identifier('from')),
              [xorAccess, babelTypes.stringLiteral('base64')]
            )
          )]),
          babelTypes.expressionStatement(
            babelTypes.assignmentExpression('=', babelTypes.identifier('buf'),
              babelTypes.callExpression(
                babelTypes.memberExpression(
                  babelTypes.identifier('Buffer'),
                  babelTypes.identifier('from')
                ),
                [babelTypes.callExpression(
                  babelTypes.memberExpression(
                    babelTypes.callExpression(
                      babelTypes.memberExpression(babelTypes.identifier('Array'), babelTypes.identifier('from')),
                      [babelTypes.identifier('buf')]
                    ),
                    babelTypes.identifier('map')
                  ),
                  [babelTypes.arrowFunctionExpression(
                    [babelTypes.identifier('b'), babelTypes.identifier('i')],
                    babelTypes.binaryExpression('^', babelTypes.identifier('b'),
                      babelTypes.memberExpression(babelTypes.identifier('xorKey'), babelTypes.binaryExpression('%', babelTypes.identifier('i'), babelTypes.memberExpression(babelTypes.identifier('xorKey'), babelTypes.identifier('length'))), true)
                    )
                  )]
                )]
              )
            )
          )
        ]),
        null
      ),
      babelTypes.ifStatement(
        babelTypes.binaryExpression('===', babelTypes.identifier('op'), babelTypes.stringLiteral('reverse')),
        babelTypes.blockStatement([
          babelTypes.expressionStatement(
            babelTypes.assignmentExpression('=', babelTypes.identifier('buf'),
              babelTypes.callExpression(
                babelTypes.memberExpression(babelTypes.identifier('Buffer'), babelTypes.identifier('from')),
                [babelTypes.callExpression(
                  babelTypes.memberExpression(
                    babelTypes.callExpression(
                      babelTypes.memberExpression(babelTypes.identifier('Array'), babelTypes.identifier('from')),
                      [babelTypes.identifier('buf')]
                    ),
                    babelTypes.identifier('reverse')
                  ),
                  []
                )]
              )
            )
          )
        ]), null
      ),
      babelTypes.ifStatement(
        babelTypes.binaryExpression('===', babelTypes.identifier('op'), babelTypes.stringLiteral('bitshift')),
        babelTypes.blockStatement([
          babelTypes.variableDeclaration('const',[babelTypes.variableDeclarator(babelTypes.identifier('sv'), shiftAccess)]),
          babelTypes.expressionStatement(
            babelTypes.assignmentExpression('=', babelTypes.identifier('buf'),
              babelTypes.callExpression(
                babelTypes.memberExpression(babelTypes.identifier('Buffer'), babelTypes.identifier('from')),
                [babelTypes.callExpression(
                  babelTypes.memberExpression(
                    babelTypes.callExpression(
                      babelTypes.memberExpression(babelTypes.identifier('Array'), babelTypes.identifier('from')),
                      [babelTypes.identifier('buf')]
                    ),
                    babelTypes.identifier('map')
                  ),
                  [babelTypes.arrowFunctionExpression(
                    [babelTypes.identifier('b')],
                    babelTypes.binaryExpression('&',
                      babelTypes.binaryExpression('|',
                        babelTypes.parenthesizedExpression(
                          babelTypes.binaryExpression('>>', babelTypes.identifier('b'), babelTypes.identifier('sv'))
                        ),
                        babelTypes.parenthesizedExpression(
                          babelTypes.binaryExpression('<<', babelTypes.identifier('b'), babelTypes.binaryExpression('-', babelTypes.numericLiteral(8), babelTypes.identifier('sv')))
                        )
                      ),
                      babelTypes.numericLiteral(0xFF)
                    )
                  )]
                )]
              )
            )
          )
        ]), null
      )
    ])
  );

  const returnStmt = babelTypes.returnStatement(
    babelTypes.callExpression(
      babelTypes.memberExpression(babelTypes.identifier('buf'), babelTypes.identifier('toString')),
      [babelTypes.stringLiteral('utf8')]
    )
  );

  return babelTypes.functionDeclaration(
    babelTypes.identifier(outFnName),
    [babelTypes.identifier(dataVar), babelTypes.identifier(keyMetaVar)],
    babelTypes.blockStatement([
      bufDecl,
      reversedSeqDecl,
      loop,
      returnStmt
    ])
  );
}

function integrateDynamicDecrypt(ast, encryptedBase64, metaObj){
  const nameGen = new UniqueNameGenerator();
  const dataVar = nameGen.generate();
  const metaVar = nameGen.generate();
  const outFnName = nameGen.generate();
  const decryptFn = generateDynamicDecryptStub({ dataVar, keyMetaVar: metaVar, outFnName });
  ast.program.body.unshift(
    babelTypes.variableDeclaration('const',[babelTypes.variableDeclarator(babelTypes.identifier(dataVar), babelTypes.stringLiteral(encryptedBase64))])
  );
  ast.program.body.unshift(
    babelTypes.variableDeclaration('const',[babelTypes.variableDeclarator(babelTypes.identifier(metaVar), babelTypes.valueToNode(metaObj))])
  );
  ast.program.body.unshift(decryptFn);
  
  const execCall = babelTypes.expressionStatement(
    babelTypes.callExpression(
      babelTypes.newExpression(babelTypes.identifier('Function'), [
        babelTypes.callExpression(babelTypes.identifier(outFnName), [babelTypes.identifier(dataVar), babelTypes.identifier(metaVar)])
      ]), []
    )
  );
  ast.program.body.push(execCall);
  return ast;
}

function metamorphicObfuscate(source){
  const ast = parseToAST(source);
  if(!ast) return source; 
  injectDeadCode(ast);
  controlFlowFlatten(ast);
  
  const key = crypto.randomBytes(32);
  const { encrypted, meta } = dynamicEncrypt(generateCode(ast) || source, key);
  
  const stubAST = babelTypes.file(babelTypes.program([]));
  integrateDynamicDecrypt(stubAST, encrypted, meta);
  const final = generateCode(stubAST) || source;
  return final;
}

const s3cr3t = crypto.randomBytes(64).toString('hex');
const encK3y = crypto.createHash('sha512').update(String(s3cr3t)).digest('hex').substr(0, 32);

try {
  runC0de = metamorphicObfuscate(runC0de);
} catch(eMeta) {
  try {
    runC0de = m4st3r0bfPolyDynamic(runC0de, { safeMode });
  } catch(e1) {
    try { runC0de = m4st3r0bfPoly(runC0de, { safeMode }); }
    catch(e2){ runC0de = m4st3r0bf(runC0de, { safeMode }); }
  }
}
const uniqD3crObj = g3nUn1qD3cr();
const { data, salt, iv, authTag, xorKey } = hybr1dEnc(runC0de, encK3y, uniqD3crObj.iterations);

const n4m3Gen = new UniqueNameGenerator();
const wr4pp3rFn = n4m3Gen.generate();
const d4t4C = n4m3Gen.generate();
const s4ltC = n4m3Gen.generate();
const iVConst = n4m3Gen.generate();
const authC = n4m3Gen.generate();
const x0rC = n4m3Gen.generate();


function strToHex(str) {
  return Buffer.from(str).toString('hex');
}
function fragmentKey(keyString) {
    const chars = keyString.split('').map(c => c.charCodeAt(0));
    const offset = Math.floor(Math.random() * 50) + 10;
    const encoded = chars.map(c => c + offset);
    return { encoded, offset };
}

const fragmentedKeyObj = fragmentKey(encK3y);



const keyArrayName = n4m3Gen.generate();
const offsetName = n4m3Gen.generate();
const tempKeyName = n4m3Gen.generate();

const stubParts = [
  
  `const crypto = require('crypto');`,
  `const Module = require('module');`,
  `const path = require('path');`,
  
  uniqD3crObj.code, 
  
  
  `const ${d4t4C} = "${data}";`,
  `const ${s4ltC} = "${salt}";`,
  `const ${iVConst} = "${iv}";`,
  `const ${authC} = "${authTag}";`,
  `const ${x0rC} = "${xorKey}";`,
  
  
  `const ${keyArrayName} = [${fragmentedKeyObj.encoded.join(',')}];`,
  `const ${offsetName} = ${fragmentedKeyObj.offset};`,
  
  
  `let ${wr4pp3rFn};`,
  `{`,
  `  const ${tempKeyName} = ${keyArrayName}.map(c => String.fromCharCode(c - ${offsetName})).join('');`,
  `  ${wr4pp3rFn} = ${uniqD3crObj.funcName}(${d4t4C}, ${tempKeyName}, ${s4ltC}, ${iVConst}, ${authC}, ${x0rC});`,
  `  ${keyArrayName}.length = 0;`, 
  `}`,
  
  
  'try{',
  '  const __fsDir=(typeof process!=="undefined" && process.pkg)?path.dirname(process.execPath):__dirname;',
  '  const __fsFile=(typeof process!=="undefined" && process.pkg)?path.join(__fsDir, path.basename(__filename)):__filename;',
  '  const __req=(Module.createRequire?Module.createRequire(__fsFile):require);',
  '  const __mod={exports:{}};',
  '  (new Function("require","module","exports","__filename","__dirname", ' + wr4pp3rFn + '))(__req,__mod,__mod.exports,__fsFile,__fsDir);',
  '  module.exports=__mod.exports;',
  '  ' + wr4pp3rFn + ' = null;',
  '}catch(e){process.exit(1);}'
];


runC0de = stubParts.join('\n');

const _0utF1l3Name = 'obfuscated_output.js';
const _0utF1l3Path = path.join(__dirname, _0utF1l3Name);
fs.writeFileSync(_0utF1l3Path, runC0de, 'utf8');

;(async () => {
  const original = fs.readFileSync(_0utF1l3Path, 'utf8');
  async function obfuscateLocal(input){
    const mod = require('js-confuser');
    const fn = mod.obfuscate || (mod.default && mod.default.obfuscate);
    if(!fn) throw new Error('js-confuser.obfuscate not found');
    const res = await fn(input, {
      preset: 'low',
      target: 'node',
      compact: true,
      minify: false,
    });
    return typeof res === 'string' ? res : (res && res.code ? res.code : String(res));
  }
  async function obfuscateWithNpx(input){
    const { spawn } = require('child_process');
    const script = [
      "process.stdin.setEncoding('utf8');",
      "let d='';",
      "process.stdin.on('data',c=>d+=c);",
      "process.stdin.on('end', async () => {",
      "  try {",
      "    const jc = require('js-confuser');",
      "    const fn = jc.obfuscate || (jc.default && jc.default.obfuscate);",
      "    const res = await fn(d, { preset: 'low', target: 'node', compact: true, minify: false });",
      "    const out = (typeof res==='string') ? res : (res && res.code) || String(res);",
      "    process.stdout.write(out);",
      "  } catch (err) {",
      "    process.exit(1);",
      "  }",
      "});",
    ].join('');
    return await new Promise((resolve, reject) => {
      const child = spawn('npx', ['-p','js-confuser','node','-e', script], { stdio: ['pipe','pipe','pipe'] });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (c)=> stdout += c.toString());
      child.stderr.on('data', (c)=> stderr += c.toString());
      child.on('error', reject);
      child.on('close', (code)=>{
        if(code === 0){ resolve(stdout); } else { reject(new Error('npx js-confuser failed')); }
      });
      child.stdin.write(input);
      child.stdin.end();
    });
  }
  try {
    let obfCode;
    try {
      obfCode = await obfuscateLocal(original);
    } catch(_){
      obfCode = await obfuscateWithNpx(original);
    }
    fs.writeFileSync(_0utF1l3Path, obfCode, 'utf8');
  } catch (e) {
  } finally {
    console.log('✓ obfuscated_output.js created successfully.');
    console.log('✓ Processing time: ' + (Date.now() - st4rtTs) + 'ms');
  }
})();