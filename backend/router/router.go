package router

import (
	"chat/handler"
	"chat/model"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func NewRouter() (*echo.Echo, error) {

	router := echo.New()
	router.Use(middleware.CORS())
	router.Use(middleware.Logger())
	router.Use(middleware.Recover())
	router.Static("/", "../frontend")
	router.GET("/ws", handler.Websocket)
	router.POST("/login", handler.Login)
	router_group := router.Group("/restricted")

	config := middleware.JWTConfig{
		Claims:     &model.JwtCustomClaims{},
		SigningKey: []byte("toshiki.nagahama.satomi.0819"),
	}
	router_group.Use(middleware.JWTWithConfig(config))
	router_group.GET("/auth_user", handler.GetAuthenticatedUser)
	router_group.POST("/get_users", handler.GetUsers)
	router_group.GET("/get_rooms", handler.GetRooms)
	// router_group.GET("", handler.Restricted)

	return router, nil

}
