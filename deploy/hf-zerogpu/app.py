import os, json
import gradio as gr
import spaces
from huggingface_hub import hf_hub_download

MODEL_REPO=os.getenv('HF_MODEL_REPO','')
TOKEN=os.getenv('HF_TOKEN') or None
STATE={'loaded':False,'error':None,'model':None,'tokenizer':None}

def load_once():
    if STATE['loaded'] or STATE['error']: return
    if not MODEL_REPO:
        STATE['error']='HF_MODEL_REPO is not configured'; return
    try:
        from pathlib import Path
        import sys
        ROOT=Path(__file__).resolve().parents[2]
        # This Space is intentionally a template; copy the HPGK ai package into the Space root if serving the custom model.
        STATE['error']='Serving adapter template ready. Copy ai/model + ai/inference into this Space before production use.'
    except Exception as e: STATE['error']=str(e)

@spaces.GPU(duration=60)
def generate(prompt):
    load_once()
    if STATE['error']: return 'WORKER_NOT_READY: '+STATE['error']
    return 'MODEL_READY: '+prompt

with gr.Blocks(title='HPGK AGENT') as demo:
    gr.Markdown('# HPGK AGENT — On-demand inference')
    inp=gr.Textbox(label='Prompt')
    out=gr.Textbox(label='Output')
    btn=gr.Button('Generate')
    btn.click(generate,inp,out)

demo.launch()
