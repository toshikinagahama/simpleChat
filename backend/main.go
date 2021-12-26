package main

import (
	"chat/model"
	"fmt"

	"chat/config"

	"github.com/jinzhu/gorm"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/net/websocket"
)

func hello(c echo.Context) error {
	c.Request().Header.Set( "Access-Control-Allow-Origin", c.Request().RemoteAddr)
	c.Request().Header.Set( "Access-Control-Allow-Credentials", "true" )
    c.Request().Header.Set( "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization" )
    c.Request().Header.Set( "Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS" )
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()
		for {
			// Write
			err := websocket.Message.Send(ws, "Hello, Client!")
			if err != nil {
				c.Logger().Error(err)
			}

			// Read
			msg := ""
			err = websocket.Message.Receive(ws, &msg)
			if err != nil {
				c.Logger().Error(err)
				break
			}
			fmt.Printf("%s\n", msg)
		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	fmt.Println(cfg.Version)
	db, err := gorm.Open("sqlite3", "chat.sqlite3")
	if err != nil {
		panic(err.Error())
	}

	db.AutoMigrate(&model.User{})
	db.Create(&model.User{Name: "toshiki"})
	var currentUser model.User
	db.First(&currentUser)

	fmt.Println(currentUser)

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Static("/", "../frontend")
	e.GET("/ws", hello)
	e.Logger.Fatal(e.Start(":1323"))
}
