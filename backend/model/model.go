package model

import (
	"github.com/golang-jwt/jwt"
	"github.com/jinzhu/gorm"
)

type JwtCustomClaims struct {
	Name string `json:"name"`
	jwt.StandardClaims
}

type User struct {
	gorm.Model
	Name     string    `json:"name"`
	Password string    `json:"password"`
	Rooms    []*Room   `json:"rooms" gorm:"many2many:user_rooms;"`
	Messages []Message `json:"messages"`
}

type Room struct {
	gorm.Model
	Name     string  `json:"name"`
	Password string  `json:"password"`
	Users    []*User `json:"users" gorm:"many2many:user_rooms;"`
	Messages []Message
}

type Message struct {
	gorm.Model
	Message string `json:"message"`
	UserID  uint   `json:"user_id"`
	RoomID  uint   `json:"room_id"`
}
