# HPGK AGENT — Google Colab Free trainer

Mở `notebooks/colab/HPGK_AGENT_v0.6_Colab.ipynb` trong Google Colab.

Workflow:
1. Chỉnh `REPO_URL` nếu repo khác.
2. Mount Google Drive.
3. Notebook clone `main` mới nhất.
4. Kiểm tra GPU + dataset.
5. Không có checkpoint → train from zero.
6. Có checkpoint trong Drive → tự resume.
7. Checkpoint nằm ở `MyDrive/HPGK-AGENT/checkpoints/`.

Colab Free có quota và phiên có thể bị ngắt; checkpoint giúp chạy tiếp.
