from pathlib import Path
import json,re
from docx import Document
from docx.shared import Inches,Pt,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

src=Path('tmp/paper_limitations/selected.json')
rs=json.loads(src.read_text(encoding='utf8'))
# Restore only visible word spacing and compound hyphens lost by PDF extraction.
rep={'Word2V ec':'Word2Vec','GloV e':'GloVe','Y et':'Yet','V olkova':'Volkova',
 'somethingfalse':'something false','decisionmaking':'decision-making',
 'posthoc':'post-hoc','cherrypicking':'cherry-picking','crosslingual':'cross-lingual',
 'realworld':'real-world','shortrange':'short-range','broadcoverage':'broad-coverage',
 'finetuned':'fine-tuned','shorttext':'short-text','aclosed-domain':'a closed-domain',
 'assumptionand':'assumption and','chess”is':'chess” is',
 '‘‘half true’’ .':'‘‘half true’’.','“backfire”- effect':'“backfire”-effect'}
def cleanup(t):
 for a,b in rep.items(): t=t.replace(a,b)
 t=re.sub(r'\[\s+(\d)',r'[\1',t)
 t=re.sub(r'\(\s+(\d)',r'(\1',t)
 return t

doc=Document()
sec=doc.sections[0]
sec.page_width=Inches(8.27);sec.page_height=Inches(11.69)
sec.top_margin=sec.bottom_margin=Inches(.8)
sec.left_margin=sec.right_margin=Inches(.85)
normal=doc.styles['Normal'];normal.font.name='Times New Roman';normal.font.size=Pt(11)
normal.paragraph_format.line_spacing=1.1
normal.paragraph_format.space_after=Pt(6)
normal.paragraph_format.widow_control=True
for name,size in [('Title',21),('Heading 1',13)]:
 st=doc.styles[name];st.font.name='Times New Roman';st.font.size=Pt(size);st.font.color.rgb=RGBColor(0,0,0)
 st.font.bold=True
 st.paragraph_format.space_before=Pt(16 if name=='Heading 1' else 0)
 st.paragraph_format.space_after=Pt(9 if name=='Heading 1' else 14)
 st.paragraph_format.keep_with_next=True
doc.add_paragraph('Limitations from Research Papers','Title')
expected=[]
for r in rs:
 assert r['excerpts']
 doc.add_paragraph(f"{r['id']}. {r['title']}",'Heading 1')
 for idx,e in enumerate(r['excerpts']):
  t=cleanup(e['text'])
  assert 'MISSING' not in t and not any(ord(c)<32 for c in t)
  assert t[-1] in '.!?”’',repr(t)
  # Retain the authors' lettered dataset items as distinct paragraphs.
  parts=re.split(r' (?=[a-j]\) [A-Z])',t) if r['id']==1 and re.match(r'[a-j]\)',t) else [t]
  for part in parts:
   paragraph=doc.add_paragraph(part)
   if sum(len(x['text'].split()) for x in r['excerpts'])<150 and idx<len(r['excerpts'])-1:
    paragraph.paragraph_format.keep_with_next=True
   expected.append(part)
  e['final_text']=t

# Page numbers provide navigation without adding commentary to the body.
footer=sec.footer.paragraphs[0];footer.alignment=2
run=footer.add_run();run.font.name='Times New Roman';run.font.size=Pt(9)
field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');run._r.addnext(field)
doc.core_properties.title='Limitations from Research Papers'
doc.core_properties.subject='Extracted limitation statements'
doc.core_properties.author=''
# Remove inherited template decoration and theme font overrides.
for root in (doc._element,doc.styles.element):
 for border in list(root.iter(qn('w:pBdr'))):
  border.getparent().remove(border)
 for fonts in root.iter(qn('w:rFonts')):
  for attr in ('asciiTheme','hAnsiTheme','eastAsiaTheme','cstheme','csTheme'):
   fonts.attrib.pop(qn('w:'+attr),None)
target=Path('output/doc/Research_Paper_Limitations.docx');doc.save(target)
check=Document(target)
actual=[p.text for p in check.paragraphs if p.style.name=='Normal']
assert actual==expected
assert sum(p.style.name=='Heading 1' for p in check.paragraphs)==16
Path('tmp/paper_limitations/final_audit.json').write_text(json.dumps(rs,ensure_ascii=False,indent=2),encoding='utf8')
print(f'Created {target.resolve()} | 16 paper entries | {len(actual)} excerpt paragraphs | {sum(len(x.split()) for x in actual)} words')
