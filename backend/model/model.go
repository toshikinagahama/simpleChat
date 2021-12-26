package model

import "github.com/jinzhu/gorm"

// User is struct of user
type User struct {
	gorm.Model
	Name string
	Password string
}
