FROM julia:1.11-bookworm AS julia

FROM mcr.microsoft.com/devcontainers/python:1-3.12-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY --from=julia /usr/local/julia /usr/local/julia
RUN ln -s /usr/local/julia/bin/julia /usr/local/bin/julia

COPY python/requirements.txt /tmp/requirements.txt
RUN python -m pip install --no-cache-dir -r /tmp/requirements.txt \
    && python -m pip install --no-cache-dir torch==2.8.0 \
       --index-url https://download.pytorch.org/whl/cpu

USER vscode
