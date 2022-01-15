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
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
	"golang.org/x/crypto/bcrypt"
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

func Contains(s []uuid.UUID, e uuid.UUID) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

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

	// log.Println(claims["id"])
	user_id_str, ok := claims["id"].(string)
	user_id := uuid.MustParse(user_id_str)
	if !ok {
		return nil, fmt.Errorf("not found user_id in %s ", tokenstring)
	}

	room_ids := []uuid.UUID{}
	room_ids_interface := claims["room_ids"].([]interface{})
	for _, r := range room_ids_interface {

		room_ids = append(room_ids, uuid.MustParse(r.(string)))
	}

	return &model.Auth{
		UserID:  uuid.UUID(user_id),
		RoomIDs: room_ids,
	}, nil
}

func Websocket(c echo.Context) error {
	log.Println("websocket handler")

	ws, err := upgrader.Upgrade(c.Response().Writer, c.Request(), nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()
	// Write
	if err != nil {
		c.Logger().Error(err)
	}
	//最初に認証の処理を行う
	// _, token, err := ws.ReadMessage()
	type Data struct {
		Token string `json:"token"`
	}
	type Res struct {
		Command uint `json:"command"`
		Data    Data `json:"data"`
	}
	var res Res
	log.Println("---!")
	err = ws.ReadJSON(&res)
	// log.Println(res)
	if err != nil {
		log.Println(err)
		panic(err)
	}
	log.Println("websocket authenticate start")
	auth, err2 := getAuthenticate(string(res.Data.Token))
	if err2 != nil {
		log.Println(err2)
		panic(err2)
	}
	log.Printf("ID: %s\n", auth.UserID.String())
	log.Println("websocket authenticate end")
	// クライアントを登録
	clients[ws] = auth
	err = ws.WriteJSON(echo.Map{"command": 0, "result": 0})
	// err = ws.WriteMessage(websocket.TextMessage, []byte("Hello Client"))
	if err != nil {
		log.Println(err)
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
		if err != nil {
			log.Printf("error: %v", err)
			delete(clients, ws)
			break
		}
		if res.APIMsg.Text != "" {
			//データベースに追加
			message := model.Message{
				Text:      res.APIMsg.Text,
				ReadCount: 0,
				UserID:    res.APIMsg.UserID,
				RoomID:    res.APIMsg.RoomID,
			}

			err := db.Debug().Model(model.Message{}).Create(&message).Error
			if err == nil {
				broadcast <- res.APIMsg
			}
		}
	}

	return nil
}

func WebsocketMessages() {
	for {
		msg := <-broadcast

		for client, auth := range clients {
			isContain := Contains(auth.RoomIDs, msg.RoomID)
			if !isContain {
				continue
			}
			//log.Println(msg)
			//log.Println(auth)
			err := client.WriteJSON(echo.Map{
				"command": 1,
				"result":  0,
				"message": msg})
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
		password_byte := []byte(password.(string))
		hashed, _ := bcrypt.GenerateFromPassword(password_byte, 10)

		log.Println(string(hashed))
		var user model.User
		err := db.Where("name = ?", name).First(&user).Select("Users.Name, Rooms.Name").Error
		if err != nil {
			log.Println(err)
			return c.JSON(http.StatusUnauthorized, nil)
		}
		//ルームIDもtokenに含む。
		type UserRooms struct {
			RoomID uuid.UUID
			UserID uuid.UUID
		}
		var user_rooms []UserRooms

		err = db.Table("user_rooms").Where("user_id = ?", user.ID).Find(&user_rooms).Error
		if err != nil {
			log.Println(err)
			return c.JSON(http.StatusUnauthorized, nil)
		}
		//RoomIDから、Roomを取得
		var room_ids []uuid.UUID
		for i := range user_rooms {
			room_ids = append(room_ids, user_rooms[i].RoomID)
		}

		if err != nil {
			log.Println(err)
			return c.JSON(http.StatusUnauthorized, nil)
		} else {
			err = bcrypt.CompareHashAndPassword([]byte(user.Password), password_byte)
			if err == nil {
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
					log.Println(err)
					return err
				}

				return c.JSON(http.StatusOK, echo.Map{
					"token": t,
				})

			} else {
				log.Println(err)
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
	// log.Println(auth_user)
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

func Signup(c echo.Context) error {
	db := database.GetDB()

	json_map := make(map[string]interface{})
	err := json.NewDecoder(c.Request().Body).Decode(&json_map)
	log.Println(json_map)
	if err != nil {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -1,
		})
	}
	log.Println(json_map["username"])
	username, _ := json_map["username"].(string)
	// email := json_map["email"]
	password := json_map["password"]
	password_byte := []byte(password.(string))
	hashed, _ := bcrypt.GenerateFromPassword(password_byte, 10)
	sercret_key := json_map["sercret_key"]
	if username == "" {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -5,
		})
	}
	if sercret_key != "localhost" {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -2,
		})
	}
	var users []model.User
	err = db.Debug().Where("name = ?", username).Find(&users).Error
	log.Println(len(users))
	if err != nil {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -3,
		})
	}
	if len(users) == 0 {
		//ユーザーが見つからなかった場合
		//登録処理
		user := model.User{
			Name:     username,
			Icon:     "",
			Password: string(hashed),
		}
		db.Create(&user)
	} else {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -4,
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"result": 0,
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
	log.Println(json_map["user_ids"])
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
	room_id_str, _ := json_map["room_id"].(string)
	room_id := uuid.MustParse(room_id_str)
	var user_rooms []model.UserRoom
	user_ids := []uuid.UUID{}
	err = db.Debug().Model(&model.UserRoom{}).Where("room_id = ?", uuid.UUID(room_id)).Find(&user_rooms).Error
	if err != nil {
		log.Println(err)
		//ユーザーが見つからなかった場合
		return c.JSON(http.StatusOK, echo.Map{
			"result": -1,
		})
	}
	for _, user_room := range user_rooms {
		user_ids = append(user_ids, user_room.UserID)
	}
	var users []model.APIUser
	err = db.Model(&model.User{}).Find(&users, user_ids).Error
	if err != nil {
		log.Println(err)
		//ユーザーが見つからなかった場合
		return c.JSON(http.StatusOK, echo.Map{
			"result": -2,
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"result": 0,
		"users":  users,
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
	room_ids := []uuid.UUID{}
	room_ids_interface, ok := json_map["room_ids"].([]interface{})
	if !ok {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -2,
		})
	}
	room_valid_ids := claims.RoomIDs //正しいroom_ids
	for _, tmp_id := range room_ids_interface {
		//リクエストされたroom_idが本当にその人が持つroom_idかチェック
		tmp_uuid := uuid.MustParse(tmp_id.(string))
		isContains := Contains(room_valid_ids, tmp_uuid)
		if !isContains {
			continue
		}
		room_ids = append(room_ids, tmp_uuid)
	}

	var rooms []model.APIRoom

	if len(room_ids) > 0 {
		err := db.Model(&model.Room{}).Find(&rooms, room_ids).Error
		if err != nil {
			log.Println(err)
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

	json_map := make(map[string]interface{})
	err := json.NewDecoder(c.Request().Body).Decode(&json_map)
	if err != nil {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -1,
		})
	}

	user := c.Get("user").(*jwtv3.Token)
	claims := user.Claims.(*model.JwtCustomClaims)
	room_ids := []uuid.UUID{}
	room_ids_interface, ok := json_map["room_ids"].([]interface{})
	if !ok {
		return c.JSON(http.StatusOK, echo.Map{
			"result": -2,
		})
	}
	room_valid_ids := claims.RoomIDs //正しいroom_ids
	for _, tmp_id := range room_ids_interface {
		//リクエストされたroom_idが本当にその人が持つroom_idかチェック
		tmp_uuid_str, _ := tmp_id.(string)
		isContains := Contains(room_valid_ids, uuid.MustParse(tmp_uuid_str))
		if !isContains {
			continue
		}
		room_ids = append(room_ids, uuid.MustParse(tmp_uuid_str))
	}

	var messages []model.Message

	if len(room_ids) > 0 {
		err := db.Model(&model.Message{}).Where("room_id = ?", room_ids).Find(&messages).Error
		if err != nil {
			log.Println(err)
			return c.JSON(http.StatusOK, echo.Map{
				"result": -3,
			})
		}
	} else {
		messages = []model.Message{}
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
