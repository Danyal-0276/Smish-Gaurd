from pathlib import Path
import json,re,unicodedata,pdfplumber
rs=json.loads(Path('tmp/paper_limitations/papers.json').read_text(encoding='utf8'))
def norm(t):
 t=unicodedata.normalize('NFKC',t).replace('\u00ad','')
 t=re.sub(r'(?<=\w)-\n(?=\w)', '',t)
 return re.sub(r'\s+',' ',t).strip()
for r in rs:
 if r['id'] in (5,14):
  with pdfplumber.open(Path('C:/Users/DONI BUTT/Downloads')/r['file']) as pdf:
   for j,p in enumerate(pdf.pages):
    if j>=21: break
    w,h=p.width,p.height
    top,bottom=(50,h-45) if r['id']==5 else (0,h)
    r['pages'][j]='\n'.join(p.crop(box).extract_text(x_tolerance=1) or '' for box in [(0,top,w/2,bottom),(w/2,top,w,bottom)])
 r['clean']=[]
 for t in r['pages']:
  t=re.sub(r'(?m)^\d+\s*$', '',t)
  t=re.sub(r'(?m)^.*(?:Multimedia Tools and Applications \(2024\)|J\. Cybersecur\. Priv\. 2025|M\. Q\. Alnabhan, P\. Branco: Fake News Detection|Zhiwei Liu et al\.:Preprint submitted|VOLUME 12, 2024).*$','',t)
  t=re.sub(r'(?m)^Emotion detection for misinformation\s*$','',t)
  r['clean'].append(norm(t).replace('N o i s y','Noisy'))
 Path(f'tmp/paper_limitations/{r["id"]:02d}_clean.txt').write_text('\n\n'.join(f'PAGE {j+1}\n{t}' for j,t in enumerate(r['clean'])),encoding='utf8')
Path('tmp/paper_limitations/clean.json').write_text(json.dumps(rs,ensure_ascii=False,indent=2),encoding='utf8')
print('Prepared readable pages')
