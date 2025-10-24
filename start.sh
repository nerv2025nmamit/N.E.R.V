#!/bin/bash
# Start FastAPI on Render
uvicorn chtbt_api:app --host 0.0.0.0 --port 10000
