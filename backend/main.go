package main

import (
	pgnb "chat/PGNotifyBuilder"
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
	log.Println("--")
	log.Println(cfg.Version)
	log.Println("--")

	database.Init()
	defer database.Close()

	pgnb.Serve(&pgnb.Receive{
		DBConnect: cfg.DBConnect,
		EventName: "message_created",
		Table:     "messages",
		SqlMethod: "INSERT",
		Payload: `
        'ID', NEW.id,
        'CreatedAt', NEW.created_at,
        'UpdatedAt', NEW.updated_at,
        'DeletedAt', NEW.deleted_at,
		'user_id', NEW.user_id,
		'room_id', NEW.room_id,
		'read_count', NEW.read_count,
        'message', NEW.message
        `,
	})

	router, _ := router.NewRouter()
	router.Logger.Fatal(router.Start(":1323"))

}
