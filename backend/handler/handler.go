package handler

import (
	"chat/config"
	"chat/database"
	"chat/model"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	jwtv3 "github.com/dgrijalva/jwt-go"
	"github.com/dgrijalva/jwt-go/v4"
	"github.com/labstack/echo"
	"github.com/lib/pq"
	"golang.org/x/net/websocket"
)

// Parse は jwt トークンから元になった認証情報を取り出す。
func getAuthenticate(tokenstring string) (*model.Auth, error) {
	cfg, err := config.Load()

	token, err := jwt.Parse(tokenstring, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.SercretKey), nil
	})

	if err != nil {
		if ve, ok := err.(*jwtv3.ValidationError); ok {
			if ve.Errors&jwtv3.ValidationErrorExpired != 0 {
				return nil, fmt.Errorf("%s is expired", tokenstring)
			} else {
				return nil, fmt.Errorf("%s is invalid", tokenstring)
			}
		} else {
			return nil, fmt.Errorf("%s is invalid", tokenstring)
		}
	}

	if token == nil {
		return nil, fmt.Errorf("not found token in %s:", tokenstring)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	userID, ok := claims["id"].(float64)
	if !ok {
		return nil, fmt.Errorf("not found id in %s:", tokenstring)
	}

	return &model.Auth{
		UserID: (uint)(userID),
	}, nil
}

func Websocket(c echo.Context) error {
	// db := database.GetDB()

	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()
		// Write
		err := websocket.Message.Send(ws, "Hello, Client!")
		if err != nil {
			c.Logger().Error(err)
		}
		//最初に認証の処理を行う
		fmt.Println("websocket authenticate start")
		token := ""
		err = websocket.Message.Receive(ws, &token)
		if err != nil {
			panic(err)
		}
		auth, err2 := getAuthenticate(token)
		fmt.Println("websocket authenticate end")
		if err2 != nil {
			panic(err2)
		}
		fmt.Println(auth.UserID)
		if auth != nil {
			reportProblem := func(ev pq.ListenerEventType, err error) {
				if err != nil {
					fmt.Println(err.Error())
				}
			}
			cfg, err := config.Load()
			listener := pq.NewListener(cfg.DBConnect, 10*time.Second, time.Minute, reportProblem)
			err = listener.Listen("messages")
			if err != nil {
				panic(err)
			}

			go func() {
				for {
					select {
					case n := <-listener.Notify:
						type Result struct {
							ID        uint      `json:"ID"`
							CreatedAt time.Time `json:"CreatedAt"`
							UpdatedAt time.Time `json:"UpdatedAt"`
							DeletedAt time.Time `json:"DeletedAt"`
							UserID    uint      `json:"user_id"`
							RoomID    uint      `json:"room_id"`
							ReadCount uint      `json:"read_count"`
							Message   string    `json:"message"`
						}
						var res Result
						fmt.Println(n.Extra)
						err = json.Unmarshal([]byte(n.Extra), &res)
						if auth.UserID != res.UserID {
							continue
						}
						if err != nil {
							fmt.Println(err)
						}
						res_json := echo.Map{
							"command": 1,
							"data":    res,
						}
						res_str, err := json.Marshal(res_json)
						if err != nil {
							fmt.Println(err)
						}
						err = websocket.Message.Send(ws, string(res_str))
						if err != nil {
							fmt.Println(err)
						}

					}
				}
			}()
			for {
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

					switch command {
					case "get_room_message":
					default:
					}

					// if command == "1" {
					// 	db.Create(&model.Message{Message: message, UserID: user_id, RoomID: 1})
					// }
				}
			}
		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}

func Login(c echo.Context) error {
	db := database.GetDB()

	json_map := make(map[string]interface{})
	err := json.NewDecoder(c.Request().Body).Decode(&json_map)
	if err != nil {
		return err
	} else {
		name := json_map["username"]
		password := json_map["password"]
		var user model.User
		err := db.Where("name = ?", name).First(&user).Select("Users.Name, Rooms.Name").Error
		if err != nil {
			return c.JSON(http.StatusUnauthorized, nil)
		}
		//ルームIDもtokenに含む。
		type UserRooms struct {
			RoomID uint
			UserID uint
		}
		var user_rooms []UserRooms

		err = db.Debug().Table("user_rooms").Where("user_id = ?", user.ID).Find(&user_rooms).Error
		//RoomIDから、Roomを取得
		var room_ids []uint
		for i := range user_rooms {
			room_ids = append(room_ids, user_rooms[i].RoomID)
		}

		if err != nil {
			return c.JSON(http.StatusUnauthorized, nil)
		} else {
			if user.Password == password {
				user.Password = ""
				if len(user.Rooms) > 0 {
					for i := range user.Rooms {
						user.Rooms[i].Password = ""
					}

				}
				claims := &model.JwtCustomClaims{
					ID:      user.ID,
					Name:    user.Name,
					RoomIDs: room_ids,
					StandardClaims: jwtv3.StandardClaims{
						ExpiresAt: time.Now().Add(time.Hour * 72).Unix(),
					},
				}
				cfg, err := config.Load()

				token := jwtv3.NewWithClaims(jwt.SigningMethodHS256, claims)
				t, err := token.SignedString([]byte(cfg.SercretKey))
				if err != nil {
					return err
				}

				return c.JSON(http.StatusOK, echo.Map{
					"token": t,
				})

			} else {
				return c.JSON(http.StatusUnauthorized, nil)
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

func GetAuthenticatedUser(c echo.Context) error {
	db := database.GetDB()

	user := c.Get("user").(*jwtv3.Token)
	claims := user.Claims.(*model.JwtCustomClaims)
	id := claims.ID
	name := claims.Name

	var auth_user model.User
	err := db.First(&auth_user, id).Error
	// fmt.Println(auth_user)
	if err != nil {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -1,
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"result": 0,
		"id":     id,
		"icon":   auth_user.Icon,
		"name":   name,
	})
}

func GetUsers(c echo.Context) error {
	db := database.GetDB()

	json_map := make(map[string]interface{})
	err := json.NewDecoder(c.Request().Body).Decode(&json_map)
	if err != nil {
		return c.JSON(http.StatusOK, echo.Map{
			"result": err,
		})

	} else {
		fmt.Println(json_map["user_ids"])
		user_ids := json_map["user_ids"]
		var users []model.APIUser
		err = db.Model(&model.User{}).Find(&users, user_ids).Error
		if err != nil {
			return c.JSON(http.StatusOK, echo.Map{
				"result": -1,
			})
		}
		return c.JSON(http.StatusOK, echo.Map{
			"result": 0,
			"users":  users,
		})
	}
}

func GetRooms(c echo.Context) error {
	db := database.GetDB()

	user := c.Get("user").(*jwtv3.Token)
	claims := user.Claims.(*model.JwtCustomClaims)
	// id := claims.ID
	room_ids := claims.RoomIDs
	var rooms []model.APIRoom
	fmt.Println("------")
	fmt.Println(room_ids)
	fmt.Println("------")

	if len(room_ids) > 0 {
		err := db.Debug().Model(&model.Room{}).Find(&rooms, room_ids).Error
		if err != nil {
			fmt.Println(err)
			return c.JSON(http.StatusOK, echo.Map{
				"result": -1,
			})
		}
	} else {
		rooms = []model.APIRoom{}
	}

	return c.JSON(http.StatusOK, echo.Map{
		"result": 0,
		"rooms":  rooms,
	})
}

func GetMessages(c echo.Context) error {
	db := database.GetDB()

	user := c.Get("user").(*jwtv3.Token)
	claims := user.Claims.(*model.JwtCustomClaims)
	id := claims.ID
	var messages []model.Message
	err := db.Debug().Model(&model.Message{}).Where("user_id = ?", id).Find(&messages).Error
	if err != nil {
		fmt.Println(err)
	}
	return c.JSON(http.StatusOK, echo.Map{
		"result":   0,
		"messages": messages,
	})
}

func Restricted(c echo.Context) error {
	user := c.Get("user").(*jwtv3.Token)
	claims := user.Claims.(*model.JwtCustomClaims)
	name := claims.Name
	return c.String(http.StatusOK, "Welcome "+name+"!")
}
