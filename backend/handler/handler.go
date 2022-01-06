package handler

import (
	"chat/database"
	"chat/model"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/net/websocket"
)

func Websocket(c echo.Context) error {
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
			json_map := make(map[string]interface{})
			err = json.Unmarshal([]byte(msg), &json_map)

			if err != nil {
			} else {
				//var message model.Message
				command_data := json_map["command"]
				command, _ := command_data.(string)
				message_data := json_map["message"]
				message, _ := message_data.(string)
				user_id_data := json_map["user_id"]
				user_id, _ := user_id_data.(uint)

				fmt.Println(command)
				fmt.Println(message)
				fmt.Println(user_id_data)
				fmt.Println(user_id)

				// if command == "1" {
				// 	db.Create(&model.Message{Message: message, UserID: user_id, RoomID: 1})
				// }
			}
		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}

func GetUser(c echo.Context) error {
	db := database.GetDB()

	json_map := make(map[string]interface{})
	err := json.NewDecoder(c.Request().Body).Decode(&json_map)
	if err != nil {
		return err
	} else {
		//json_map has the JSON Payload decoded into a map
		name := json_map["username"]
		password := json_map["password"]
		var user model.User
		err := db.Preload("Messages").Preload("Rooms").Where("name = ?", name).First(&user).Select("Users.Name, Rooms.Name").Error
		if err != nil {
			return c.JSON(http.StatusNotFound, nil)
		} else {
			if user.Password == password {
				user.Password = ""
				if len(user.Rooms) > 0 {
					for i := range user.Rooms {
						user.Rooms[i].Password = ""
					}

				}
				return c.JSON(http.StatusOK, user)
			} else {
				return c.JSON(http.StatusNotFound, nil)
			}
		}
	}
}

// func createUser(c echo.Context) error {
// 	user := model.User{}
// 	if err := c.Bind(&user); err != nil {
// 		return err
// 	}
// 	if user.Name != "" && user.Password != "" {
// 		hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
// 		if err != nil {
// 			return err
// 		}
// 		user.Password = string(hash)
// 		db.Create(&user)
// 		return c.JSON(http.StatusCreated, user)
// 	} else {
// 		map_data := map[string]interface{}{
// 			"result": "error 1",
// 		}
// 		return c.JSON(http.StatusOK, map_data)
// 	}
// }

// func deleteUser(c echo.Context) error {
// 	id := c.Param("id")
// 	db.Delete(&model.User{}, id)
// 	return c.NoContent(http.StatusNoContent)
// }

func Login(c echo.Context) error {
	db := database.GetDB()
	username := c.FormValue("username")
	password := c.FormValue("password")
	var user model.User

	db.Where("name = ?", username).Find(&user)
	fmt.Println(user)
	auth_err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if auth_err != nil {
		return echo.ErrUnauthorized
	}
	claims := &model.JwtCustomClaims{
		username,
		jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 72).Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString([]byte("toshiki.nagahama.satomi.0819"))
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, echo.Map{
		"token": t,
	})
}

func Restricted(c echo.Context) error {
	user := c.Get("user").(*jwt.Token)
	claims := user.Claims.(*model.JwtCustomClaims)
	name := claims.Name
	return c.String(http.StatusOK, "Welcome "+name+"!")
}
