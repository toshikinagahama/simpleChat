package model

import (
	jwtv3 "github.com/dgrijalva/jwt-go"
	"gorm.io/gorm"
)

type JwtCustomClaims struct {
	ID      uint   `json:"id"`
	Name    string `json:"name"`
	RoomIDs []uint `json:"room_id"` //room_idもトークンに含む
	jwtv3.StandardClaims
}

type Auth struct {
	UserID uint `json:"user_id"`
}
type User struct {
	gorm.Model
	Name     string    `json:"name"`
	Password string    `json:"password"`
	Icon     string    `json:"icon" gorm:"size:100000; default:''"`
	Rooms    []Room    `json:"rooms" gorm:"many2many:user_rooms;"`
	Messages []Message `json:"messages"`
}

type APIUser struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Icon string `json:"icon" gorm:"size:100000; default:''"`
}

type Room struct {
	gorm.Model
	Name     string `json:"name"`
	Password string `json:"password"`
	Icon     string `json:"icon" gorm:"size:100000; default:''"`
	Users    []User `json:"users" gorm:"many2many:user_rooms;"`
	Messages []Message
}

type APIRoom struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Icon string `json:"icon"`
}

type Message struct {
	gorm.Model
	Message   string `json:"message"`
	ReadCount uint   `json:"read_count"`
	UserID    uint   `json:"user_id"`
	RoomID    uint   `json:"room_id"`
}
