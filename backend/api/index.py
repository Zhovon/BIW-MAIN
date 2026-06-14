import sys
import os

# Add backend root to path so `from app.main import app` resolves on Vercel
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402
