"""Apply the user's explicit specification confirmation and the bounded catalog audit."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'data/catalog-source.json';data=json.loads(path.read_text(encoding='utf-8'))
byid={m['id']:m for m in data['models']}
assert len(byid)==52
assert byid['sets-1']['model']['code']=='01-BXH650/1300/2250ml'
assert byid['sets-1']['model']['details'][2]['size']=='24.8 x 19.3 x 8.2 cm'
counts={'sets1_copies':0,'rc2000_copies':0,'sets3_copies':0,'tri_ply_series_copies':0}
def visit(node):
 if isinstance(node,dict):
  if node.get('code')=='01-BXH650/1300/2250ml' and isinstance(node.get('details'),list):
   assert len(node['details'])==3
   node['capacity']='650ml / 22oz / 2.7cup + 1300ml / 44oz / 5.5cup + 2500ml / 85oz / 10.6cup'
   for detail,amount,units in zip(node['details'],['650 ml','1,300 ml','2,500 ml'],['22 oz / 2.7 cup','44 oz / 5.5 cup','85 oz / 10.6 cup']):
    detail['capacity']=amount;detail['unitReference']=units
   node.pop('capacityNote',None)
   if 'components' in node and '2' in node['components']:node['components']['2']['capacity']='2,500 ml'
   counts['sets1_copies']+=1
  if node.get('code')=='01RC2000' and isinstance(node.get('details'),list):
   node['capacity']='2000ml / 68oz / 8.4cup'
   node['details'][0]['capacity']='2,000 ml';node['details'][0]['unitReference']='68 oz / 8.4 cup (catalog cup)'
   counts['rc2000_copies']+=1
  if node.get('code')=='01-KP650*2/2500ml' and isinstance(node.get('details'),list):
   node['size']=node['size'].replace('29.8 x 21.4 x 7.5cm','29.8 x 21.4 x 7cm').replace('29.8 x 21.4 x 7.5 cm','29.8 x 21.4 x 7 cm')
   for detail in node['details']:
    detail['size']=detail['size'].replace('29.8 x 21.4 x 7.5cm','29.8 x 21.4 x 7cm').replace('29.8 x 21.4 x 7.5 cm','29.8 x 21.4 x 7 cm')
   counts['sets3_copies']+=1
  if node.get('id')=='cookware-tri-ply' and 'specs'in node:
   next(s for s in node['specs'] if s['label']=='Dimensions')['value']='Inner diameter × height: shallow pan 26 × 4.8 / 28 × 5 / 30 × 5.3 / 32 × 5.6 cm; wok 30 × 9 / 32 × 9.5 cm'
   counts['tri_ply_series_copies']+=1
  for child in list(node.values()):visit(child)
 elif isinstance(node,list):
  for child in node:visit(child)
visit(data)
byid['divided-18']['model']['details'][0]['unitReference']='32 oz / 4.6 cup (catalog reference)'
assert counts['sets1_copies']==5,counts
assert byid['rectangular-5']['model']['code']=='01RC2250'
assert byid['rectangular-5']['model']['details'][0]['capacity']=='2,250 ml'
assert not any('to confirm' in d['capacity'].lower() for m in data['models'] for d in m['model']['details'])
path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
report={'user_confirmed_set':'01-BXH650/1300/2250ml','components':byid['sets-1']['model']['details'],'core_storage_entries':len(data['models']),'specification_components':sum(len(m['model']['details']) for m in data['models']),'unresolved_core_capacity_fields':0,'corrected_copies':counts,'policy':'The displayed model code is unchanged. Component 3 is 2500 ml per the user-provided table. Cup values for 01RC2000 and the 960 ml divided model carry printed-catalog labels, not calculated conversion claims.'}
(ROOT/'review/spec-corrections.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
