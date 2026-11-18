from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re,hashlib,shutil,os,argparse
from build_laotes_site import build_laotes
ROOT=Path(__file__).resolve().parents[1];PROJECT=ROOT.parent;OUT=ROOT/'release';PUBLIC=OUT/'public'
FILES=['site.css','countup.css','showcase.css','guides.css','fonts.css','app.js','showcase.js']
ROUTES=json.loads((ROOT/'launch/public-routes.json').read_text(encoding='utf-8'))
URLS={name:urlsplit(url).path for name,url in ROUTES.items()}
LINK_RE=re.compile(r'(?P<page>\b(?:'+ '|'.join(re.escape(n) for n in sorted(URLS,key=len,reverse=True))+r'))(?=[?#\s\"\'<>]|$)')
def rewrite(text):return LINK_RE.sub(lambda m:URLS[m['page']],text)
def write(path,text):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text,encoding='utf-8')
class Refs(HTMLParser):
 def __init__(self,text):super().__init__();self.refs=[];self.ids=set();self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id'in a:self.ids.add(a['id'])
  for key in ['src','href','poster','data-src','data-image']:
   if a.get(key):self.refs.append(a[key])
def build():
 if OUT.exists():
  if not (OUT/'.generated-maylendy-release').is_file():raise RuntimeError('Refusing to overwrite an unrecognized output directory')
  shutil.rmtree(OUT)
 OUT.mkdir();write(OUT/'.generated-maylendy-release','Generated production build. No credentials.\n')
 PUBLIC.mkdir();output_names={}
 for name in ROUTES:
  text=(ROOT/name).read_text(encoding='utf-8')
  text=text.replace('<meta name="robots" content="noindex,follow">','<meta name="robots" content="index,follow">')
  if name=='contact.html':
   text=text.replace('action="#quote" method="get"','action="/api/quote" method="post" enctype="multipart/form-data"')
   text=text.replace('<div class="form-heading">','<label class="form-honeypot" aria-hidden="true">Leave empty<input name="_honey" tabindex="-1" autocomplete="off"></label><input type="hidden" name="_visitor"><div class="form-heading">')
   text=text.replace('Local design preview. No enquiry will be sent.','Send product requirements and reference files to our team. Attachments: up to 4 MiB total.')
   text=text.replace('Preview enquiry','Send enquiry').replace('Brief ready to review.','Enquiry status').replace('Your information has been checked locally. No enquiry has been sent.','Review the status of your enquiry below.')
   text=text.replace('Add your requirements below; nothing has been sent.','Add your requirements below before submitting.')
  text=rewrite(text)
  # URLs in the embedded model index have been rewritten; all local resources stay root-relative.
  text=re.sub(r'((?:src|href|poster|data-src)=[\"\'])(assets/|(?:site|countup|showcase|guides|fonts)\.css|(?:app|showcase)\.js)',lambda m:m[1]+'/'+m[2],text)
  text=text.replace('</head>','<script src="/analytics.js" defer></script><script src="/production.js" defer></script></head>')
  target=(URLS[name].strip('/') or 'index')+'.html';write(PUBLIC/target,text);output_names[name]=target
 for name in FILES:write(PUBLIC/name,rewrite((ROOT/name).read_text(encoding='utf-8')))
 write(PUBLIC/'site.css',(PUBLIC/'site.css').read_text(encoding='utf-8')+'\n.form-honeypot{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}.form-result[data-state=error]{border:1px solid #ab3934;background:#fff4f2}.form-result[data-state=success]{border:1px solid #28644f;background:#eef6f1}\n')
 for name in ['analytics.js','analytics.html','analytics-dashboard.js','analytics-dashboard.css']:
  shutil.copy2(PROJECT/name,PUBLIC/name)
 shutil.copy2(ROOT/'launch/production.js',PUBLIC/'production.js')
 # Find referenced assets in initial HTML, inline JSON, CSS and JS. Unused owner files never enter public/.
 asset_paths=set();scanned=set()
 def scan(text):
  for ref in re.findall(r'(?:/?assets/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+)',text):asset_paths.add(ref.lstrip('/'))
  for ref in re.findall(r'url\([\"\']?([^\)\"\']+)',text):
   if ref.startswith(('data:','http:','https:')):continue
   if ref.startswith('assets/'):asset_paths.add(ref)
 for p in PUBLIC.iterdir():
  if p.suffix in ('.html','.css','.js'):scan(p.read_text(encoding='utf-8'))
 while asset_paths-scanned:
  name=sorted(asset_paths-scanned)[0];scanned.add(name);src=ROOT/name
  if not src.is_file():raise FileNotFoundError('Referenced asset missing: '+name)
  if name.endswith('factory-workshop-clean.mp4') or name.startswith('assets/factory-source/') and any(key in name for key in ['factory-forming','tooling','material-control','inspection','facility-exterior','shipment-staging','finished-stock','forming-close','sheet-stock']):
   raise RuntimeError('Unwatermarked factory source was referenced: '+name)
  dest=PUBLIC/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
  if src.suffix in ('.css','.js','.svg'):scan(src.read_text(encoding='utf-8'))
 shutil.copy2(ROOT/'launch/sitemap.xml',PUBLIC/'sitemap.xml')
 write(PUBLIC/'robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /r/\nDisallow: /o/\nDisallow: /analytics\nDisallow: /review/\nDisallow: /data/\nDisallow: /tools/\nDisallow: /launch/\n\nSitemap: https://maylendy.com/sitemap.xml\n')
 write(PUBLIC/'404.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | MayLendy</title><link rel="stylesheet" href="/fonts.css"><link rel="stylesheet" href="/site.css"></head><body><main class="section wrap"><span class="eyebrow">MayLendy</span><h1>Page not found.</h1><p>Explore our stainless steel kitchenware range or contact the factory team.</p><a class="text-link" href="/">Return to MayLendy</a></main></body></html>')
 aliases={}
 for src,target in URLS.items():
  for candidate in ['/'+src,'/'+src.removesuffix('.html'),target+'.html',target+'/']:
   if candidate!=target:aliases[candidate]=target
 aliases.update({'/index':'/','/index/':'/','/index.html/':'/','/oem-tooling':'/quality-delivery','/oem-tooling.html':'/quality-delivery','/analytics.html':'/analytics','/analytics/':'/analytics'})
 worker=(ROOT/'launch/release-worker.mjs').read_text(encoding='utf-8').replace('/*RELEASE_ALIASES*/',json.dumps(aliases,ensure_ascii=False))
 write(OUT/'worker.mjs',worker);shutil.copy2(BACKEND,OUT/'legacy-worker.mjs')
 # Existing runtime bindings and secrets must be checked from Cloudflare before uploading.
 config={'name':'chaozhoulaotesi','main':'worker.mjs','compatibility_date':'2026-09-04','keep_vars':True,'assets':{'directory':'./public','binding':'ASSETS','not_found_handling':'404-page','html_handling':'drop-trailing-slash','run_worker_first':True},'kv_namespaces':[{'binding':'WEBMAIL_KV','id':'c6db3c144f7f4f62af86874ce9d2381b'},{'binding':'OUTREACH_KV','id':'10be3512c1204d5c8b3a3cfd9e13814d'}]}
 write(OUT/'wrangler.json',json.dumps(config,indent=2))
 issues=[]
 for p in PUBLIC.glob('*.html'):
  doc=Refs(p.read_text(encoding='utf-8'))
  for ref in doc.refs:
   u=urlsplit(ref)
   if u.scheme or not u.path:continue
   target=PUBLIC/unquote(u.path.lstrip('/'))
   if not target.is_file() and target.suffix=='':target=target.with_suffix('.html') if u.path!='/' else PUBLIC/'index.html'
   if u.path.startswith('/api/'):continue
   if not target.is_file():issues.append(p.name+': '+ref)
   elif u.fragment and target.suffix=='.html' and unquote(u.fragment) not in Refs(target.read_text(encoding='utf-8')).ids:issues.append(p.name+': missing anchor '+ref)
 if issues:raise RuntimeError(json.dumps(issues,ensure_ascii=False))
 laotes=build_laotes(PROJECT,PUBLIC)
 files={p.relative_to(PUBLIC).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(PUBLIC.rglob('*')) if p.is_file()}
 report={'publicPages':len(ROUTES),'assets':len(asset_paths),'publicFiles':len(files),'totalBytes':sum(p.stat().st_size for p in PUBLIC.rglob('*') if p.is_file()),'files':files,'routeMap':URLS,'internalLinkIssues':issues,'deployStatus':'prepared-not-deployed','laotes':laotes,'workerSourceSha256':hashlib.sha256((OUT/'legacy-worker.mjs').read_bytes()).hexdigest()}
 write(OUT/'build-report.json',json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps({k:v for k,v in report.items() if k not in ['files','routeMap','laotes']},ensure_ascii=False))
 print(json.dumps({'laotesFiles':laotes['files'],'laotesPublicPages':laotes['publicPages'],'laotesIssues':laotes['issues']}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--backend-file',type=Path,default=PROJECT/'worker.js')
 BACKEND=parser.parse_args().backend_file.resolve()
 if not BACKEND.is_file():raise FileNotFoundError('Backend source must exist before building')
 build()
