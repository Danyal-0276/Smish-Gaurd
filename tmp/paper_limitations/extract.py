from pathlib import Path
from pypdf import PdfReader
import json, hashlib, re
names = ['WELFake__Word_Embedding_over_Linguistic_Features_for_Fake_News_Detection.pdf','jcp-05-00043.pdf','D18-1003 (1).pdf','D17-1317.pdf','d6cf2169-5355-4c31-89d0-e6e37c651a40.pdf','s11042-023-17470-8.pdf','43b0fe45-d64f-4f31-a09a-bc3009f84fa0.pdf','main.pdf','2021.eacl-main.56.pdf','Fake_News_Detection_Using_Deep_Learning_A_Systemat.pdf','P17-2067.pdf','D18-1003.pdf','D19-1475.pdf','2009.01047v2.pdf','2022.tacl-1.11.pdf','00226-ChoudhryA.pdf']
base=Path('C:/Users/DONI BUTT/Downloads'); out=Path('tmp/paper_limitations')
records=[]
for i,n in enumerate(names,1):
 p=base/n
 r=PdfReader(p)
 pages=[x.extract_text() for x in r.pages]
 rec=dict(id=i,file=n,hash=hashlib.sha256(p.read_bytes()).hexdigest(),pages=pages,metadata=str(r.metadata))
 records.append(rec)
 (out/f'{i:02d}.txt').write_text('\n\n'.join(f'=== PDF PAGE {j+1} ===\n{t}' for j,t in enumerate(pages)),encoding='utf-8')
 print(i,n,len(pages),rec['hash'][:12], '\n',pages[0][:650].replace('\n',' '))
(out/'papers.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
with (out/'hits.txt').open('w',encoding='utf-8') as f:
 for rec in records:
  f.write('\n\n######## '+str(rec['id'])+' '+rec['file']+' ########\n')
  for j,t in enumerate(rec['pages']):
   for m in re.finditer(r'\blimit(?:ation\w*|ed|ing|s)?\b|\bdrawback\w*|\bshortcoming\w*|\bcaveat\w*|\bweakness\w*',t,re.I):
    f.write(f'\nPAGE {j+1}: '+t[max(0,m.start()-350):m.end()+1100].replace('\n',' ')+'\n')
