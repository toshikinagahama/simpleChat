package handler

import (
	"chat/config"
	"chat/database"
	"chat/model"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	jwtv3 "github.com/dgrijalva/jwt-go"
	"github.com/dgrijalva/jwt-go/v4"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
)

// 接続されるクライアント
var clients = make(map[*websocket.Conn]*model.Auth)

//アップグレーダー
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// メッセージブロードキャストチャネル
var broadcast = make(chan model.APIMessage)

// Parse は jwt トークンから元になった認証情報を取り出す。
func getAuthenticate(tokenstring string) (*model.Auth, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("config is not valid")
	}

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
		return nil, fmt.Errorf("not found token in %s ", tokenstring)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("not found claims in %s ", tokenstring)
	}

	user_id, ok := claims["id"].(float64)
	if !ok {
		return nil, fmt.Errorf("not found user_id in %s ", tokenstring)
	}

	room_ids := []uint{}
	room_ids_interface := claims["room_ids"].([]interface{})
	for _, r := range room_ids_interface {
		room_ids = append(room_ids, uint(r.(float64)))
	}

	return &model.Auth{
		UserID:  (uint)(user_id),
		RoomIDs: room_ids,
	}, nil
}

func Websocket(c echo.Context) error {
	fmt.Println("websocket handler")

	ws, err := upgrader.Upgrade(c.Response().Writer, c.Request(), nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()
	// Write
	if err != nil {
		c.Logger().Error(err)
	}
	fmt.Println("---")
	//最初に認証の処理を行う
	fmt.Println("websocket authenticate start")
	// _, token, err := ws.ReadMessage()
	type Data struct {
		Token string `json:"token"`
	}
	type Res struct {
		Command uint `json:"command"`
		Data    Data `json:"data"`
	}
	var res Res
	err = ws.ReadJSON(&res)
	if err != nil {
		fmt.Println(err)
		panic(err)
	}
	auth, err2 := getAuthenticate(string(res.Data.Token))
	if err2 != nil {
		fmt.Println(err)
		panic(err2)
	}
	fmt.Printf("ID: %d\n", auth.UserID)
	fmt.Println("websocket authenticate end")
	// クライアントを登録
	clients[ws] = auth
	err = ws.WriteJSON(echo.Map{"command": 0, "result": 0})
	// err = ws.WriteMessage(websocket.TextMessage, []byte("Hello Client"))
	if err != nil {
		fmt.Println(err)
		return nil
	}

	db := database.GetDB()

	for {
		type Res struct {
			Command uint             `json:"command"`
			APIMsg  model.APIMessage `json:"message"`
		}
		var res Res
		err := ws.ReadJSON(&res)
		fmt.Println(res)
		if err != nil {
			log.Printf("error: %v", err)
			delete(clients, ws)
			break
		}
		//データベースに追加
		message := model.Message{
			Message:   res.APIMsg.Message,
			ReadCount: 0,
			UserID:    res.APIMsg.UserID,
			RoomID:    res.APIMsg.RoomID}

		db.Create(&message)
		broadcast <- res.APIMsg
	}
	// if auth != nil {
	// 	reportProblem := func(ev pq.ListenerEventType, err error) {
	// 		if err != nil {
	// 			fmt.Println(err.Error())
	// 		}
	// 	}
	// 	cfg, err := config.Load()
	// 	listener := pq.NewListener(cfg.DBConnect, 10*time.Second, time.Minute, reportProblem)
	// 	err = listener.Listen("messages")
	// 	if err != nil {
	// 		panic(err)
	// 	}

	// go func() {
	// 	for {
	// 		select {
	// 		case n := <-listener.Notify:
	// 			type Result struct {
	// 				ID        uint      `json:"ID"`
	// 				CreatedAt time.Time `json:"CreatedAt"`
	// 				UpdatedAt time.Time `json:"UpdatedAt"`
	// 				DeletedAt time.Time `json:"DeletedAt"`
	// 				UserID    uint      `json:"user_id"`
	// 				RoomID    uint      `json:"room_id"`
	// 				ReadCount uint      `json:"read_count"`
	// 				Message   string    `json:"message"`
	// 			}
	// 			var res Result
	// 			fmt.Println(n.Extra)
	// 			err = json.Unmarshal([]byte(n.Extra), &res)
	// 			if auth.UserID != res.UserID {
	// 				continue
	// 			}
	// 			if err != nil {
	// 				fmt.Println(err)
	// 			}
	// 			res_json := echo.Map{
	// 				"command": 1,
	// 				"data":    res,
	// 			}
	// 			res_str, err := json.Marshal(res_json)
	// 			if err != nil {
	// 				fmt.Println(err)
	// 			}
	// 			err = websocket.Message.Send(ws, string(res_str))
	// 			if err != nil {
	// 				fmt.Println(err)
	// 			}

	// 		}
	// 	}
	// }()
	// for {
	// 	// Read
	// 	msg := ""
	// 	err = websocket.Message.Receive(ws, &msg)
	// 	if err != nil {
	// 		c.Logger().Error(err)
	// 		break
	// 	}
	// 	fmt.Printf("%s\n", msg)
	// 	json_map := make(map[string]interface{})
	// 	err = json.Unmarshal([]byte(msg), &json_map)

	// 	if err != nil {
	// 	} else {
	// 		//var message model.Message
	// 		command_data := json_map["command"]
	// 		command, _ := command_data.(string)
	// 		message_data := json_map["message"]
	// 		message, _ := message_data.(string)
	// 		user_id_data := json_map["user_id"]
	// 		user_id, _ := user_id_data.(uint)

	// 		fmt.Println(command)
	// 		fmt.Println(message)
	// 		fmt.Println(user_id_data)
	// 		fmt.Println(user_id)

	// 		switch command {
	// 		case "get_room_message":
	// 		default:
	// 		}

	// 		// if command == "1" {
	// 		// 	db.Create(&model.Message{Message: message, UserID: user_id, RoomID: 1})
	// 		// }
	// 	}
	// }
	// }
	return nil
}

func Contains(s []uint, e uint) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

func WebsocketMessages() {
	for {
		msg := <-broadcast
		fmt.Println(msg)

		for client, auth := range clients {
			isContain := Contains(auth.RoomIDs, msg.RoomID)
			fmt.Println(auth.RoomIDs)
			fmt.Printf("RoomID: %d\n", msg.RoomID)
			if !isContain {
				continue
			}
			err := client.WriteMessage(websocket.TextMessage, []byte(msg.Message))
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
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

		err = db.Table("user_rooms").Where("user_id = ?", user.ID).Find(&user_rooms).Error
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
	room_ids := claims.RoomIDs

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
		"user": echo.Map{
			"id":       id,
			"icon":     auth_user.Icon,
			"room_ids": room_ids,
			"name":     name,
		},
	})
}

func GetUsers(c echo.Context) error {
	db := database.GetDB()

	json_map := make(map[string]interface{})
	err := json.NewDecoder(c.Request().Body).Decode(&json_map)
	if err != nil {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -1,
		})

	}
	fmt.Println(json_map["user_ids"])
	user_ids := json_map["user_ids"]
	var users []model.APIUser
	err = db.Model(&model.User{}).Find(&users, user_ids).Error
	if err != nil {
		//ユーザーが見つからなかった場合
		return c.JSON(http.StatusOK, echo.Map{
			"result": -1,
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"result": 0,
		"users":  users,
	})
}

func GetRoomUsers(c echo.Context) error {
	db := database.GetDB()

	json_map := make(map[string]interface{})
	err := json.NewDecoder(c.Request().Body).Decode(&json_map)
	if err != nil {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -1,
		})

	}
	fmt.Println(json_map["room_id"])
	room_id := json_map["room_id"]
	var user_ids []uint
	err = db.Model(&model.UserRoom{}).Where("room_id = ?", room_id).Find(&user_ids).Error
	if err != nil {
		//ユーザーが見つからなかった場合
		return c.JSON(http.StatusOK, echo.Map{
			"result": -1,
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"result":   0,
		"user_ids": user_ids,
	})
}

func GetRooms(c echo.Context) error {
	db := database.GetDB()

	json_map := make(map[string]interface{})
	err := json.NewDecoder(c.Request().Body).Decode(&json_map)
	if err != nil {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -1,
		})
	}

	user := c.Get("user").(*jwtv3.Token)
	claims := user.Claims.(*model.JwtCustomClaims)
	// id := claims.ID
	room_ids := []uint{}
	room_ids_interface, ok := json_map["room_ids"].([]interface{})
	fmt.Println("---------")
	fmt.Println(json_map["room_ids"])
	fmt.Println("---------")
	if !ok {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -2,
		})
	}
	room_valid_ids := claims.RoomIDs //正しいroom_ids
	for _, tmp_id := range room_ids_interface {
		//リクエストされたroom_idが本当にその人が持つroom_idかチェック
		isContains := Contains(room_valid_ids, uint(tmp_id.(float64)))
		if !isContains {
			continue
		}
		room_ids = append(room_ids, uint(tmp_id.(float64)))
	}

	var rooms []model.APIRoom

	if len(room_ids) > 0 {
		err := db.Model(&model.Room{}).Find(&rooms, room_ids).Error
		if err != nil {
			fmt.Println(err)
			return c.JSON(http.StatusOK, echo.Map{
				"result": -3,
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
	err := db.Model(&model.Message{}).Where("user_id = ?", id).Find(&messages).Error
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
