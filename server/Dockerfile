# ---- Builder ----
FROM python:3.14-slim AS builder

RUN pip install --no-cache-dir uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# ---- Runtime ----
FROM python:3.14-slim
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY . .

# Use venv
ENV PATH="/app/.venv/bin:$PATH"

CMD ["python", "main.py"]