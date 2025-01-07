package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/raghavyuva/go-party/api"
	"github.com/raghavyuva/go-party/storage"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	listenAddr := flag.String("listenaddr", ":8080", "HTTP listen address")
	flag.Parse()
	address := os.Getenv("REDIS_ADDRESS")
	password := os.Getenv("REDIS_PASSWORD")
	fmt.Printf("Using Redis at %s with password %s\n", address, password)
	store := storage.NewRedisStorage(storage.RedisOpts{
		Address:  address,
		Password: password,
		DB:       0,
	})
	server := api.NewServer(*listenAddr, store)
	fmt.Printf("Starting server on %s\n", *listenAddr)
	log.Fatal(server.Start())
	select {}
}
