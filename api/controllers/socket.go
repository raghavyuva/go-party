package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/raghavyuva/go-party/storage"
	"github.com/raghavyuva/go-party/types"
)

const (
	maxMessageSize = 10 * 1024 * 1024
	pingInterval   = 10 * time.Second
	pingTimeout    = 60 * time.Second
	
	writeWait = 10 * time.Second
	pongWait  = 60 * time.Second
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type SocketServer struct {
	conns    *sync.Map
	rooms    *sync.Map
	storage  storage.Storage
	shutdown chan struct{}
}

func NewSocketServer() (*SocketServer, error) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	address := os.Getenv("REDIS_ADDRESS")
	password := os.Getenv("REDIS_PASSWORD")
	fmt.Printf("Using Redis at %s with password %s\n", address, password)
	storage := storage.NewRedisStorage(storage.RedisOpts{
		Address:  address,
		Password: password,
		DB:       0,
	})

	server := &SocketServer{
		conns:    &sync.Map{},
		rooms:    &sync.Map{},
		storage:  storage,
		shutdown: make(chan struct{}),
	}

	return server, nil
}

func (s *SocketServer) HandleHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}
	
	fmt.Println("New incoming connection from client:", conn.RemoteAddr())
	
	conn.SetReadLimit(maxMessageSize)
	// conn.SetReadDeadline(time.Now().Add(pongWait))
	// conn.SetPongHandler(func(string) error {
	// 	conn.SetReadDeadline(time.Now().Add(pongWait))
	// 	return nil
	// })
	
	s.conns.Store(conn, "")
	defer s.handleDisconnect(conn)
	s.readLoop(conn)
}

func (s *SocketServer) readLoop(conn *websocket.Conn) {
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			fmt.Printf("Error reading message: %v\n", err)
			s.sendError(conn, "Failed to read message")
			return
		}

		var msg types.Message
		if err := json.Unmarshal(message, &msg); err != nil {
			fmt.Printf("Error unmarshaling message: %v\n", err)
			s.sendError(conn, "Invalid message format")
			continue
		}

		fmt.Printf("Received message from %s: %v with payload %v\n", conn.RemoteAddr(), msg.Action, msg.Data)
		
		switch msg.Action {
		case "create_room", "join_room", "leave_room", "ping", "player_state", "update_timestamp", "chat_message":
			s.handleMessage(conn, msg)
		default:
			s.sendError(conn, "Unknown message action")
		}
	}
}

func (s *SocketServer) handleDisconnect(conn *websocket.Conn) {
	if email, ok := s.conns.Load(conn); ok {
		s.rooms.Range(func(roomID, roomVal interface{}) bool {
			room := roomVal.(*types.Room)
			if _, exists := room.GetPeers()[email.(string)]; exists {
				s.handleLeaveRoom(conn, roomID.(string), email.(string))
			}
			return true
		})
		s.conns.Delete(conn)
	}
	conn.Close()
}

func (s *SocketServer) broadcastToRoom(roomID string, msg types.Message) {
	roomVal, ok := s.rooms.Load(roomID)
	if !ok {
		fmt.Printf("Room %s not found\n", roomID)
		return
	}
	room := roomVal.(*types.Room)
	data, _ := json.Marshal(msg)

	fmt.Printf("\n=== Starting Broadcast ===\n")
	fmt.Printf("Room ID: %s\n", roomID)

	fmt.Println("\nPeers in room:")
	count := 0
	room.ForEachPeer(func(email string, peer *types.Peer) bool {
		count++
		fmt.Printf("Peer %d: %s\n", count, email)
		return true
	})
	fmt.Printf("Total peers found: %d\n", count)

	fmt.Println("\nActive connections:")
	connCount := 0
	s.conns.Range(func(conn, email interface{}) bool {
		connCount++
		fmt.Printf("Connection %d: %s -> %s\n",
			connCount,
			conn.(*websocket.Conn).RemoteAddr(),
			email.(string))
		return true
	})
	fmt.Printf("Total connections: %d\n", connCount)

	fmt.Println("\nAttempting to send messages:")
	room.ForEachPeer(func(email string, peer *types.Peer) bool {
		fmt.Printf("\nLooking for connections for peer: %s\n", email)
		matchFound := false

		s.conns.Range(func(conn, connEmail interface{}) bool {
			if connEmail.(string) == email {
				matchFound = true
				fmt.Printf("Found match! Sending to %s at %s\n",
					email,
					conn.(*websocket.Conn).RemoteAddr())
				
				conn.(*websocket.Conn).SetWriteDeadline(time.Now().Add(writeWait))
				if err := conn.(*websocket.Conn).WriteMessage(websocket.TextMessage, data); err != nil {
					log.Printf("Error broadcasting to %s: %v", email, err)
				}
			}
			return true
		})

		if !matchFound {
			fmt.Printf("No connection found for peer: %s\n", email)
		}
		return true
	})
	fmt.Printf("\n=== Broadcast Complete ===\n")
}

func (s *SocketServer) Shutdown() {
	close(s.shutdown)

	s.rooms.Range(func(_, roomVal interface{}) bool {
		room := roomVal.(*types.Room)
		room.SetState(types.RoomStateClosed)
		room.Close()
		return true
	})

	s.conns.Range(func(conn, _ interface{}) bool {
		conn.(*websocket.Conn).Close()
		return true
	})
}

func (s *SocketServer) handleMessage(conn *websocket.Conn, msg types.Message) {
	switch msg.Action {
	case "create_room":
		createData, err := s.ValidateCreateRoomRequest(msg)
		if err != nil {
			s.sendError(conn, fmt.Sprintf("Invalid create room request: %v", err))
			return
		}
		_, err = s.CreateRoom(conn, createData)
		if err != nil {
			s.sendError(conn, fmt.Sprintf("Failed to create room: %v", err))
			return
		}

	case "join_room":
		joinData, err := s.formatAndValidateJoinRoomData(msg)
		if err != nil {
			s.sendError(conn, fmt.Sprintf("Invalid join room data: %v", err))
			return
		}
		s.handleJoinRoom(conn, joinData)

	case "leave_room":
		leaveData, err := s.formatAndValidateLeaveRoomData(msg)
		if err != nil {
			s.sendError(conn, fmt.Sprintf("Invalid leave room data: %v", err))
			return
		}
		s.handleLeaveRoom(conn, leaveData.RoomID, leaveData.Email)

	case "ping":
		data, ok := msg.Data.(map[string]interface{})
		if !ok {
			s.sendError(conn, "Invalid data format")
			return
		}
		email, ok := data["email"].(string)
		if !ok || email == "" {
			s.sendError(conn, "Invalid email")
			return
		}
		s.handlePing(email)

	case "player_state":
		playerStateData, err := s.validatePlayerStateData(msg)
		if err != nil {
			s.sendError(conn, fmt.Sprintf("Invalid player state data: %v", err))
			return
		}
		s.handlePlayerState(conn, playerStateData)

	case "update_timestamp":
		updateTimestampData, err := s.validateVideoSyncData(msg)
		if err != nil {
			s.sendError(conn, fmt.Sprintf("Invalid update timestamp data: %v", err))
			return
		}
		s.handleVideoSync(conn, updateTimestampData)

	case "chat_message":
		chatMessageData, err := s.validateChatMessageData(msg)
		if err != nil {
			s.sendError(conn, fmt.Sprintf("Invalid chat message data: %v", err))
			return
		}
		s.handleChatMessage(conn, chatMessageData)
	}
}

func (s *SocketServer) handlePing(email string) {

}