import os

import psycopg
import torch

with psycopg.connect(os.environ["DATABASE_URL"]) as connection:
    with connection.cursor() as cursor:
        cursor.execute("SELECT message FROM experiments ORDER BY id LIMIT 1")
        message = cursor.fetchone()[0]

print(f"Python connected to PostgreSQL: {message}")
print(f"PyTorch {torch.__version__}: tensor sum = {torch.tensor([1, 2, 3]).sum().item()}")
