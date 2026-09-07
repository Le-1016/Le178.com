package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
)

func main() {
	connection, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer connection.Close(context.Background())

	var message string
	if err := connection.QueryRow(context.Background(), "SELECT message FROM experiments ORDER BY id LIMIT 1").Scan(&message); err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Go connected to PostgreSQL: %s\n", message)
}
