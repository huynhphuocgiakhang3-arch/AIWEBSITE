import ast,re

def python_syntax(code):
    try: ast.parse(code); return True,"syntax_ok"
    except SyntaxError as e: return False,str(e)

def web_checks(code,kind):
    c=code.lower()
    if kind=="html": return "<button" in c and "type=" in c,"html_smoke"
    if kind=="css": return "display" in c and "flex" in c,"css_smoke"
    return True,"basic_smoke"

def keyword_score(code,checks):
    c=code.lower()
    return sum(x.lower() in c for x in checks)/max(1,len(checks))
