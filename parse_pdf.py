import glob,re,json,unicodedata,pdfplumber
AR={'(':')',')':'(','[':']',']':'['}
def fix(s):
    for k,v in {'ﻻ':'ال','ﻼ':'ال','ﻷ':'أل','ﻸ':'أل','ﻹ':'إل','ﻺ':'إل','ﻵ':'آل','ﻶ':'آل'}.items(): s=s.replace(k,v)
    s=unicodedata.normalize('NFKC',s)
    s=s[::-1]
    s=re.sub(r'[0-9A-Za-z./]+',lambda m:m.group(0)[::-1],s)
    return ''.join(AR.get(c,c) for c in s)
# strings: per-line fix (cell may have \n)
def fixcell(c): return '\n'.join(fix(l) for l in (c or '').split('\n'))
def dur(s):
    mx=re.search(r'(\d+)×(\d+)\s*د\s*$',s.strip())
    if mx: return int(mx.group(1))*int(mx.group(2))
    h=re.search(r'(\d+)\s*(?:ساعة|ساعات|س)',s);m=re.search(r'(\d+)\s*(?:دقيقة|دقائق|د)',s)
    if not h and 'ساعة' in s and not re.search(r'\d\s*(?:ساعة|ساعات)',s): h=None
    return (int(h.group(1))*60 if h else 0)+(int(m.group(1)) if m else 0)
d=pdfplumber.open(glob.glob('/mnt/user-data/uploads/*.pdf')[0])
MON='نوفمبر ديسمبر يناير فبراير مارس أبريل مايو يونيو'.split()
MN={'نوفمبر':(2026,11),'ديسمبر':(2026,12),'يناير':(2027,1),'فبراير':(2027,2),'مارس':(2027,3),'أبريل':(2027,4),'مايو':(2027,5),'يونيو':(2027,6)}
dre=re.compile(r'^(السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)\s+(\d+)\s+('+'|'.join(MON)+r')\s+\d{4}')
def norm(s): return s.replace('أ','أ').replace('إ','إ').replace('آ','آ')
days=[];cur=None;weeks=[]
for pn,p in enumerate(d.pages):
    items=[]
    tbs=p.find_tables()
    for t in tbs: items.append((t.bbox[1],'T',t))
    # heading lines outside tables
    for ln in p.extract_text_lines():
        txt=fix(ln['text']).strip()
        if any(t.bbox[1]-2<=ln['top']<=t.bbox[3]+2 for t in tbs): continue
        items.append((ln['top'],'L',txt))
    items.sort(key=lambda x:x[0])
    for _,k,v in items:
        if k=='L':
            v=v.replace('ا','ا')
            m=re.search(r'(السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)\s+(\d+)\s+(%s)\s+(\d{4})'%'|'.join(MON),v) or re.search(r'(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)',v) and None
            # normalise hamza forms for matching
            vv=v.replace('\u0623','ا').replace('\u0625','ا')
            m=re.match(r'^\W*(السبت|الاحد|الاثنين|الثلاثاء|الاربعاء|الخميس|الجمعة)\s+(\d+)\s+(%s)\s+(\d{4})(.*)$'%'|'.join(x.replace('أ','ا') for x in MON),vv)
            if m:
                y,mo=MN[[x for x in MON if x.replace('أ','ا')==m.group(3)][0]]
                cur={'date':'%d-%02d-%02d'%(y,mo,int(m.group(2))),'weekday':v.split()[0] if not v.startswith(':') else '','off':'إجازة' in v,'tasks':[],'page':pn+1}
                days.append(cur)
            elif v.startswith('الأسبوع') or v.startswith('الاسبوع') : weeks.append(v)
        else:
            rows=v.extract()
            for r in rows:
                if not r or len(r)<2: continue
                a,b=fixcell(r[0]),fixcell(r[1])
                if b.strip() in('المهمة','') : continue
                if 'اإلجمالي' in b or 'الإجمالي' in b:
                    if cur is not None: cur['total']=dur(a)
                    continue
                if cur is None: continue
                # progress table rows skip
                if not ('·' in b): continue
                head,_,body=b.replace('\n',' ').partition(':')
                subj,_,lec=[x.strip() for x in head.partition('·')]
                parts=[x.strip() for x in re.split('؛',body) if x.strip()]
                its=[]
                for x in parts:
                    mm=re.match(r'^(.*)—\s*(.+)$',x)
                    its.append({'t':mm.group(1).strip(),'m':dur(mm.group(2))} if mm else {'t':x,'m':0})
                cur['tasks'].append({'subj':subj,'lec':lec,'items':its,'rowmin':dur(a)})
json.dump({'days':days},open('raw.json','w'),ensure_ascii=False)
print(len(days),sum(len(x['tasks']) for x in days))
