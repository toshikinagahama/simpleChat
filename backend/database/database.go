package database

import (
	"chat/config"
	"chat/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func Init() {
	// db, err = gorm.Open(sqlite.Open("chat.sqlite3"), &gorm.Config{})
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	db, err = gorm.Open(postgres.New(postgres.Config{
		DSN:                  cfg.DBConnect,
		PreferSimpleProtocol: true, // disables implicit prepared statement usage
	}), &gorm.Config{})
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
	db_v2, _ := db.DB()
	if err := db_v2.Close(); err != nil {
		panic(err)
	}
}
