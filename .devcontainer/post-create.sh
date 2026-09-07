#!/usr/bin/env bash
set -euo pipefail

go mod download
julia --project=julia -e 'using Pkg; Pkg.instantiate()'

echo "Virtual laboratory is ready."
echo "Run 'make check' to test every database connection."
