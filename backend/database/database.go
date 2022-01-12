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

	//Insert sample data
	{
		var user model.User
		//db.Unscoped().Delete(model.User{}, "id >= ?", 0)
		//db.Unscoped().Delete(model.Room{}, "id >= ?", 0)
		err = db.Where("name = ?", "test_user1").First(&user).Error
		if err != nil {
			user := model.User{Name: "test_user1", Password: "test_user1"}
			db.Create(&user)
		}
	}
	{
		var user model.User
		err = db.Where("name = ?", "test_user2").First(&user).Error
		if err != nil {
			user := model.User{Name: "test_user2", Password: "test_user2"}
			db.Create(&user)
		}
	}
	{
		var room model.Room
		err = db.Where("name = ?", "test_room1").First(&room).Error
		if err != nil {
			room := model.Room{Name: "test_room1", Password: "test_room1"}
			db.Create(&room)
		}
	}
	{
		var room model.Room
		err = db.Where("name = ?", "test_room2").First(&room).Error
		if err != nil {
			room := model.Room{Name: "test_room2", Password: "test_room2"}
			db.Create(&room)
		}
	}

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
