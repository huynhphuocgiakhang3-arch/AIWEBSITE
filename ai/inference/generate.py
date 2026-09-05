import torch


def _prepare_prompt(tokenizer, prompt, device):
    ids = tokenizer.encode(prompt)
    if not ids:
        ids = [32]
    return torch.tensor([ids], dtype=torch.long, device=device)


def generate(model, tokenizer, prompt, device, max_new_tokens=160, temperature=0.8, top_k=50):
    x = _prepare_prompt(tokenizer, prompt, device)
    out = model.generate(x, max_new_tokens=max_new_tokens, temperature=temperature, top_k=top_k)
    return tokenizer.decode(out[0].tolist())


def stream_generate(model, tokenizer, prompt, device, max_new_tokens=160, temperature=0.8, top_k=50):
    """Yield cumulative decoded text after each generated token.

    The client can replace its current assistant text with each chunk. This avoids
    pretending the small local model has token-level server streaming when it does not.
    """
    x = _prepare_prompt(tokenizer, prompt, device)
    prompt_len = x.shape[1]
    model.eval()
    with torch.no_grad():
        for _ in range(max_new_tokens):
            context = x[:, -model.cfg.block_size:]
            logits, _ = model(context)
            logits = logits[:, -1, :] / max(temperature, 1e-5)
            if top_k:
                values, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < values[:, [-1]]] = float('-inf')
            probs = torch.softmax(logits, dim=-1)
            next_id = torch.multinomial(probs, 1)
            x = torch.cat([x, next_id], dim=1)
            yield tokenizer.decode(x[0, prompt_len:].tolist())
