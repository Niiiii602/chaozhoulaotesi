import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const project=process.cwd();
const release=path.join(project,'sandbox-maylendy-steel/release');
const {default:worker}=await import(pathToFileURL(path.join(release,'worker.mjs')));
const routes=JSON.parse(readFileSync(path.join(project,'sandbox-maylendy-steel/launch/public-routes.json'),'utf8'));
function env(){return {ASSETS:{fetch:async request=>new Response('asset:'+new URL(request.url).pathname)},ANALYTICS_ADMIN_TOKEN:'mock-admin',OUTREACH_KV:{get:async()=>null,put:async()=>{throw Error('Unexpected write')}}};}
for(const [source,url] of Object.entries(routes)){
 const canonical=new URL(url).pathname;
 test('canonical '+canonical,async()=>{const response=await worker.fetch(new Request(url),env());assert.equal(response.status,200);assert.equal(await response.text(),'asset:'+canonical)});
 test('source alias '+source,async()=>{const response=await worker.fetch(new Request('https://maylendy.com/'+source+'?q=1500'),env());assert.equal(response.status,301);assert.equal(response.headers.get('location'),'https://maylendy.com'+canonical+'?q=1500')});
}
test('MayLendy www stays on MayLendy',async()=>{const res=await worker.fetch(new Request('https://www.maylendy.com/manufacturing.html?source=legacy'),env());assert.equal(res.status,301);assert.equal(res.headers.get('location'),'https://maylendy.com/factory-tour?source=legacy')});
for(const page of ['','products','factory-tour','quality-delivery','about-us','qa','contact','analytics','styles.css','script.js','assets/factory-workshop-clean.mp4'])test('LAOTES independent '+page,async()=>{const r=await worker.fetch(new Request('https://laotes.com/'+page),env());assert.equal(r.status,200);assert.equal(r.headers.get('location'),null);assert.equal(await r.text(),'asset:/__laotes'+(page?'/'+page:''))});
test('LAOTES www alias stays on www without caching',async()=>{const r=await worker.fetch(new Request('https://www.laotes.com/products.html?q=steel'),env());assert.equal(r.status,302);assert.equal(r.headers.get('location'),'https://www.laotes.com/products?q=steel');assert.equal(r.headers.get('Cache-Control'),'no-store')});
test('LAOTES HTTP stays LAOTES',async()=>{const r=await worker.fetch(new Request('http://laotes.com/'),env());assert.equal(r.headers.get('location'),'https://laotes.com/')});
for(const host of ['laotes.com','maylendy.com'])test('private asset namespace not public '+host,async()=>{const r=await worker.fetch(new Request('https://'+host+'/__laotes/index.html'),env());assert.equal(r.status,404)});
for(const route of ['/review.html','/review/owner.json','/tools/build.py','/data/owner-approved.json','/launch/Configure-DeployCredentials.ps1','/sandbox-maylendy-steel/index.html','/MayLendy-Steel-Review.zip'])test('private excluded '+route,async()=>{const r=await worker.fetch(new Request('https://maylendy.com'+route),env());assert.equal(r.status,404);assert.equal(r.headers.get('X-Robots-Tag'),'noindex')});
test('quote API preserved',async()=>{const r=await worker.fetch(new Request('https://laotes.com/api/quote'),env());assert.equal(r.status,405);assert.equal(r.headers.get('location'),null)});
test('analytics access stays protected',async()=>{const r=await worker.fetch(new Request('https://maylendy.com/api/analytics'),env());assert.equal(r.status,401)});
test('selected backend bytes preserved',()=>{const report=JSON.parse(readFileSync(path.join(release,'build-report.json'),'utf8'));assert.equal(createHash('sha256').update(readFileSync(path.join(release,'legacy-worker.mjs'))).digest('hex'),report.workerSourceSha256)});
test('source and product JSON remain unchanged',()=>{const html=readFileSync(path.join(release,'public/products.html'),'utf8');assert.match(html,/2,500 ml \/ 85 oz \/ 10\.6 cup/);assert.match(html,/68 oz/);assert.doesNotMatch(html,/<meta name="robots" content="noindex,follow">/)});
for (const [range,status,expected] of [[null,200,'0123456789'],['bytes=0-3',206,'0123'],['bytes=5-',206,'56789'],['bytes=-3',206,'789'],['bytes=99-',416,''],['bytes=4-1',416,''],['bytes=0-1,4-5',416,'']]) test('video range '+range,async()=>{const bindings=env();bindings.ASSETS.fetch=async()=>new Response('0123456789',{headers:{'Content-Type':'video/mp4','Content-Length':'10','ETag':'"fixture"'}});const r=await worker.fetch(new Request('https://maylendy.com/assets/factory-workshop-maylendy.mp4',{headers:range?{Range:range}:{}}),bindings);assert.equal(r.status,status);assert.equal(await r.text(),expected);assert.equal(r.headers.get('Accept-Ranges'),'bytes')});
for(const host of ['laotes.com','www.laotes.com'])test('LAOTES direct root and cache recovery '+host,async()=>{const bindings=env();bindings.ASSETS.fetch=async()=>new Response('LAOTESI',{headers:{'Content-Type':'text/html'}});const ordinary=await worker.fetch(new Request('https://'+host+'/'),bindings);assert.equal(ordinary.status,200);assert.equal(ordinary.headers.get('Location'),null);assert.equal(ordinary.headers.get('Cache-Control'),'no-store');assert.equal(ordinary.headers.get('Clear-Site-Data'),null);const recovered=await worker.fetch(new Request('https://'+host+'/?refresh=laotes'),bindings);assert.equal(recovered.status,200);assert.equal(recovered.headers.get('Clear-Site-Data'),'"cache"');assert.equal(await recovered.text(),'LAOTESI')});
