package main

import (
	"chat/config"
	"chat/database"
	"chat/router"
	"log"
)

func main() {
	log.SetFlags(log.Flags() | log.Llongfile)
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	log.Println(cfg.Version)

	database.Init()
	defer database.Close()
	router, _ := router.NewRouter()
	router.Logger.Fatal(router.Start(":1323"))
}
