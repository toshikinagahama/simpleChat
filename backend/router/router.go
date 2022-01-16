package router

import (
	"chat/config"
	"chat/handler"
	"chat/model"
	"log"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func NewRouter() (*echo.Echo, error) {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}

	log.Println(cfg.StaticPath)

	router := echo.New()
	router.Use(middleware.CORS())
	router.Use(middleware.Logger())
	router.Use(middleware.Recover())
	//"../frontend/simple_chat/out"
	router.Static("/web", cfg.StaticPath)
	router.File("/web", cfg.StaticPath+"/index.html")
	router.File("/web/user", cfg.StaticPath+"/user.html")
	router.File("/web/room/*", cfg.StaticPath+"/room/[id].html")
	router.File("/web/add_user_to_room", cfg.StaticPath+"/add_user_to_room.html")
	router.File("/web/create_room", cfg.StaticPath+"/create_room.html")
	router.File("/web/signup", cfg.StaticPath+"/signup.html")
	router.File("/web/user_setting", cfg.StaticPath+"/user_setting.html")

	router.GET("/backend/ws", handler.Websocket)
	go handler.WebsocketMessages()
	router.POST("/backend/login", handler.Login)
	router.POST("/backend/signup", handler.Signup)
	router_group := router.Group("/backend/restricted")

	config := middleware.JWTConfig{
		Claims:     &model.JwtCustomClaims{},
		SigningKey: []byte(cfg.SercretKey),
	}
	router_group.Use(middleware.JWTWithConfig(config))
	router_group.GET("/auth_user", handler.GetAuthenticatedUser)
	router_group.POST("/get_roomusers", handler.GetRoomUsers)
	router_group.POST("/get_rooms", handler.GetRooms)
	router_group.POST("/get_messages", handler.GetMessages)
	router_group.POST("/create_room", handler.CreateRoom)
	router_group.POST("/add_user_to_room", handler.AddUserToRoom)
	// router_group.GET("", handler.Restricted)

	return router, nil

}
