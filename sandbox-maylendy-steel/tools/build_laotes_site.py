"""Build the original LAOTES website in an isolated asset namespace."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re, json, hashlib
PAGES=['index.html','products.html','factory-tour.html','quality-delivery.html','about-us.html','qa.html','contact.html','analytics.html']
NAMESPACE='__laotes'
class Refs(HTMLParser):
 def __init__(self,text):super().__init__();self.refs=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  values=dict(attrs)
  for key in ['src','href','poster','data-src']:
   if values.get(key):self.refs.append(values[key])
def build_laotes(project,public):
 dest=public/NAMESPACE;dest.mkdir(parents=True,exist_ok=True);pending=set(PAGES+['styles.css','script.js','products.css','products.js','about-us.css','about-us.js','qa.css','qa.js','analytics.js','analytics-dashboard.css','analytics-dashboard.js']);copied=set();issues=[]
 pending.update(p.relative_to(project).as_posix() for p in (project/'assets/catalog-white').glob('*.webp'))
 while pending-copied:
  name=sorted(pending-copied)[0];source=project/name
  if not source.is_file():raise FileNotFoundError('LAOTES resource missing: '+name)
  if source.suffix in ['.json','.md','.toml','.ps1','.cmd','.py'] or source.resolve().is_relative_to(project/'.git'):raise ValueError('Private LAOTES resource blocked: '+name)
  target=dest/name;target.parent.mkdir(parents=True,exist_ok=True)
  if source.suffix in ['.html','.css','.js','.svg']:
   text=source.read_text(encoding='utf-8').replace('https://maylendy.com','https://laotes.com').replace('http://maylendy.com','https://laotes.com')
   target.write_text(text,encoding='utf-8')
   refs=Refs(text).refs if source.suffix=='.html' else []
   refs+=re.findall(r'assets/[A-Za-z0-9_./-]+\.(?:webp|png|jpg|jpeg|mp4|svg|pdf|woff2?|ttf)',text)
   refs+=re.findall(r'url\([\"\']?([^\)\"\']+)',text)
   for ref in refs:
    parsed=urlsplit(ref)
    if parsed.scheme or ref.startswith('//') or not parsed.path or parsed.path.startswith('/api/'):continue
    path=unquote(parsed.path).lstrip('/')
    if not Path(path).suffix:continue
    resolved=(project/path) if parsed.path.startswith('/') else source.parent/path
    if not resolved.is_file():issues.append(name+': '+ref);continue
    relative=resolved.resolve().relative_to(project.resolve()).as_posix()
    pending.add(relative)
  else:target.write_bytes(source.read_bytes())
  copied.add(name)
 # Keep both sites' search identity independent.
 sitemap=(project/'sitemap.xml').read_text(encoding='utf-8').replace('https://maylendy.com','https://laotes.com');(dest/'sitemap.xml').write_text(sitemap,encoding='utf-8')
 (dest/'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /analytics\nDisallow: /__laotes/\nDisallow: /review/\nDisallow: /tools/\n\nSitemap: https://laotes.com/sitemap.xml\n',encoding='utf-8')
 (dest/'404.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | LAOTESI</title></head><body><h1>Page not found.</h1><a href="/">Return to LAOTESI</a></body></html>',encoding='utf-8')
 assert not issues,issues
 files={p.relative_to(dest).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in dest.rglob('*') if p.is_file()}
 return {'publicPages':7,'privateDashboardPages':1,'files':len(files),'fileHashes':files,'issues':issues,'namespace':NAMESPACE}
