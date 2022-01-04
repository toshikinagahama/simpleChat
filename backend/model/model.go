package model

import "github.com/jinzhu/gorm"

type User struct {
	gorm.Model
	Name     string
	Password string
	Rooms    []*Room `gorm:"many2many:user_rooms;"`
	Messages []Message
}

type Room struct {
	gorm.Model
	Name     string
	Password string
	Users    []*User `gorm:"many2many:user_rooms;"`
	Messages []Message
}

type Message struct {
	gorm.Model
	Message string
	UserID  uint
	RoomID  uint
}
