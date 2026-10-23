import re,base64,os
P=os.path.expanduser('~/Downloads/ai-2027-graphic/')
css=open('out/embed.css').read()
def b64(path,mime): return 'data:%s;base64,%s'%(mime,base64.b64encode(open(path,'rb').read()).decode())
css=re.sub(r'url\((/Users[^)]*)\)',lambda m:'url(%s)'%b64(m.group(1),'font/woff2' if m.group(1).endswith('2') else 'font/woff'),css)
js=open('out/embed.js').read()
seen=[]
def pub(m):
    q,name=m.group(1),m.group(2)
    f=P+'public/'+name
    if os.path.isfile(f) and os.path.getsize(f)<300000:
        seen.append(name); return q+b64(f,'image/svg+xml' if name.endswith('svg') else 'image/png')+q
    return m.group(0)
js=re.sub(r'(["\'`])/([\w./-]+\.(?:svg|png))\1',pub,js)
# LW's widget save path decodes HTML entities inside scripts (e.g. `&&gt(` becomes `&&>(`), so ship the bundle as base64.
js='new Function(new TextDecoder().decode(Uint8Array.from(atob("%s"),c=>c.charCodeAt(0))))()' % base64.b64encode(js.encode()).decode()
print('inlined',len(seen),seen[:20])
html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="lw-scrolly" content="panel"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI 2027 dashboard</title><style>{css}</style></head><body><div id="root"></div><script>{js}</script></body></html>'''
open('out/ai2027-widget.html','w').write(html); print(len(html))
