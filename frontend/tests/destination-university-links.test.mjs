import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import {destinations} from '../lib/destination-content.ts';
import {homeUniversities} from '../lib/home-universities.ts';
const ts=createRequire(import.meta.url)('typescript');
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../components/destination-page.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{
 module,exports:module.exports,require(name){
 if(name==='react')return {useState:()=>[null,()=>{}],useRef:()=>({current:null}),useEffect:()=>{}};
 if(name==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
 if(name==='next/link')return 'a';
 if(name.endsWith('.css'))return new Proxy({},{get:(_,key)=>key==='__esModule'?false:String(key)});
 if(name.includes('destination-collages'))return {destinationCollages:()=>({})};
 return {};
 }
});
function walk(node,out=[]){if(Array.isArray(node))node.forEach(n=>walk(n,out));else if(node&&typeof node==='object'){out.push(node);walk(node.props?.children,out)}return out}
for(const locale of ['fa','en'])test(`every destination university card opens its own localized profile (${locale})`,()=>{
 for(const destination of destinations){
 const universities=homeUniversities.filter(u=>u.country===destination.slug);
 const tree=module.exports.DestinationPage({destination,locale,universities,relatedDestinations:[],faqs:[],consultation:`/${locale}/consultation`});
 const cards=walk(tree).filter(n=>n.props?.className==='universityCard');
 assert.equal(cards.length,universities.length);
 cards.forEach((card,i)=>{assert.equal(card.type,'a');assert.equal(card.props.href,`/${locale}/universities/${universities[i].slug}`);assert.ok(card.props['aria-label'].includes(universities[i].name));});
 }
});
