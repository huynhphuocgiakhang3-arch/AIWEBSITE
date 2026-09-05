# Security baseline
Uploads are untrusted. Production ZIP extraction must reject absolute paths, traversal, unsafe symlinks, decompression bombs, excessive entries and oversized extraction.
Never expose model/database secrets in client bundles. Authorization belongs on the server. Bound autonomous loops.
