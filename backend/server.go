package main

import (
	"chat/config"
	"chat/graph"
	"chat/graph/generated"
	"chat/model"
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	db, _ := gorm.Open(postgres.New(postgres.Config{
		DSN:                  cfg.DBConnect,
		PreferSimpleProtocol: true, // disables implicit prepared statement usage
	}), &gorm.Config{})

	//Migrate
	db.AutoMigrate(&model.User{})
	db.AutoMigrate(&model.Room{})
	db.AutoMigrate(&model.Message{})

	// srv := handler.NewDefaultServer(
	// 	generated.NewExecutableSchema(generated.Config{Resolvers: &graph.Resolver{DB: db}}))
	srv := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: graph.NewResolver()}))
	http.Handle("/", playground.Handler("GraphQL playground", "/query"))
	http.Handle("/query", srv)

	log.Printf("connect to http://localhost:%s/ for GraphQL playground", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
