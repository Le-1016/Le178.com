.PHONY: check check-python check-go check-julia jupyter api

check: check-python check-go check-julia

check-python:
	python python/check_db.py

check-go:
	go run ./go

check-julia:
	julia --project=julia julia/check_db.jl

jupyter:
	jupyter lab --ip=0.0.0.0 --port=8888 --no-browser

api:
	go run ./go/cmd/api
