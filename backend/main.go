package main

import (
	"chat/config"
	"chat/database"
	"chat/router"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	fmt.Println(cfg.Version)

	database.Init()
	defer database.Close()

	router, _ := router.NewRouter()
	router.Logger.Fatal(router.Start(":1323"))

}
