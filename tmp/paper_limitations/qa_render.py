from pathlib import Path
from pdf2image import convert_from_path
from PIL import Image,ImageOps,ImageDraw
from pypdf import PdfReader
import json,re
base=Path('tmp/paper_limitations'); rd=base/'render';rd.mkdir(exist_ok=True)
pages=convert_from_path(base/'word_render.pdf',dpi=125,fmt='png',thread_count=4)
for n,img in enumerate(pages,1): img.save(rd/f'page-{n}.png')
for k in range(0,len(pages),2):
 thumbs=[]
 for j,p in enumerate(pages[k:k+2],k+1):
  p=p.copy();p.thumbnail((850,1200))
  tile=Image.new('RGB',(870,1240),'#eeeeee');tile.paste(p,((870-p.width)//2,25))
  ImageDraw.Draw(tile).text((15,8),f'Page {j}',fill='black');thumbs.append(tile)
 sheet=Image.new('RGB',(870*len(thumbs),1240),'white')
 for j,p in enumerate(thumbs):sheet.paste(p,(870*j,0))
 sheet.save(rd/f'review-{k//2+1}.png')
pdf=PdfReader(base/'word_render.pdf')
for j,p in enumerate(pdf.pages,1):
 t=p.extract_text()
 print(j,len(t.split()),repr(t[:95]),repr(t[-70:]))

# Read-only source-page renders for inspection of extraction and typography.
sources=[(5,20),(5,21),(6,45),(8,20),(14,6),(16,2)]
rs=json.loads((base/'papers.json').read_text(encoding='utf8'))
for i,p in sources:
 path=Path('C:/Users/DONI BUTT/Downloads')/rs[i-1]['file']
 img=convert_from_path(path,dpi=125,first_page=p,last_page=p,fmt='png')[0]
 img.save(rd/f'source-{i}-{p}.png')
print('Rendered',len(pages),'document pages and',len(sources),'source pages')
