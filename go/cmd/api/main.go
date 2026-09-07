package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type experiment struct {
	ID      int64  `json:"id"`
	Message string `json:"message"`
}

func main() {
	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	http.HandleFunc("/health", func(response http.ResponseWriter, request *http.Request) {
		if err := pool.Ping(request.Context()); err != nil {
			http.Error(response, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		response.WriteHeader(http.StatusOK)
		_, _ = response.Write([]byte("ok\n"))
	})

	http.HandleFunc("/experiments", func(response http.ResponseWriter, request *http.Request) {
		rows, err := pool.Query(request.Context(), "SELECT id, message FROM experiments ORDER BY id")
		if err != nil {
			http.Error(response, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		experiments := make([]experiment, 0)
		for rows.Next() {
			var item experiment
			if err := rows.Scan(&item.ID, &item.Message); err != nil {
				http.Error(response, err.Error(), http.StatusInternalServerError)
				return
			}
			experiments = append(experiments, item)
		}

		response.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(response).Encode(experiments); err != nil {
			log.Printf("encode response: %v", err)
		}
	})

	log.Println("Go API listening on http://0.0.0.0:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
