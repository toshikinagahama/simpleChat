package database

import (
	"chat/model"

	"github.com/jinzhu/gorm"
)

var db *gorm.DB

func Init() {
	var err error
	db, err = gorm.Open("sqlite3", "chat.sqlite3")
	if err != nil {
		panic(err)
	}

	//Migrate
	db.AutoMigrate(&model.User{})
	db.AutoMigrate(&model.Room{})
	db.AutoMigrate(&model.Message{})

}

func GetDB() *gorm.DB {
	return db
}

func Close() {
	if err := db.Close(); err != nil {
		panic(err)
	}
}
