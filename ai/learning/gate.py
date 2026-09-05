def validate(item):
    content=item.get("content","").strip()
    source=item.get("source","").strip()
    if len(content)<80:return False,"too_short"
    if not source:return False,"missing_source"
    return True,"validated"
