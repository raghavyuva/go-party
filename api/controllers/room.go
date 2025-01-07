package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/raghavyuva/go-party/types"
	"github.com/raghavyuva/go-party/utils"
)

func (s *SocketServer) CreateRoom(conn *websocket.Conn, createData types.CreateRoomRequest) (*types.Room, error) {
	var user *types.User
	val := s.storage.Get("user:" + createData.Email)
	if err := json.Unmarshal([]byte(val), &user); err != nil {
		return nil, utils.NewHTTPError("Invalid user data", http.StatusInternalServerError)
	}

	id := uuid.New()

	room := types.NewRoom(
		id,
		user.Email,
		createData.VideoSource,
		createData.Timestamp,
	)

	s.conns.Store(conn, createData.Email)

	initialPeer := &types.Peer{
		Email:      createData.Email,
		JoinedAt:   time.Now(),
		Connection: conn.RemoteAddr().String(),
		LastPing:   time.Now(),
	}

	fmt.Printf("Created room: %v\n", room)

	if err := room.AddPeer(initialPeer); err != nil {
		s.conns.Delete(conn)
		return nil, fmt.Errorf("failed to add initial peer: %v", err)
	}

	fmt.Printf("Added initial peer: %v\n", initialPeer)

	if err := s.setRoom(id.String(), room); err != nil {
		s.conns.Delete(conn)
		return nil, fmt.Errorf("failed to store room: %v", err)
	}
	s.rooms.Store(id.String(), room)

	fmt.Printf("Stored room: %v\n", room)
	s.broadcastToRoom(id.String(), types.Message{
		Action: "user_joined",
		Data: map[string]interface{}{
			"peer":  initialPeer,
			"peers": room.GetPeers(),
			"room":  room,
		},
	})
	return room, nil
}

func (s *SocketServer) ValidateCreateRoomRequest(msg types.Message) (types.CreateRoomRequest, error) {
	data, ok := msg.Data.(map[string]interface{})
	if !ok {
		return types.CreateRoomRequest{}, fmt.Errorf("invalid request format")
	}

	email, ok := data["email"].(string)
	if !ok || email == "" {
		return types.CreateRoomRequest{}, fmt.Errorf("invalid email")
	}

	timestampData, ok := data["timestamp"].(map[string]interface{})
	if !ok {
		return types.CreateRoomRequest{}, fmt.Errorf("invalid timestamp data")
	}

	start, ok := timestampData["start"].(float64)
	if !ok || start < 0 {
		return types.CreateRoomRequest{}, fmt.Errorf("invalid start timestamp")
	}

	end, ok := timestampData["end"].(float64)
	if !ok || end == 0 {
		return types.CreateRoomRequest{}, fmt.Errorf("invalid end timestamp")
	}

	current, ok := timestampData["current"].(float64)
	if !ok || current < start || current > end {
		return types.CreateRoomRequest{}, fmt.Errorf("invalid current timestamp")
	}

	videoSource, ok := data["video_source"].(string)
	if !ok || videoSource == "" {
		return types.CreateRoomRequest{}, fmt.Errorf("invalid video source")
	}

	return types.CreateRoomRequest{
		Email:       email,
		VideoSource: videoSource,
		Timestamp: types.TimeStamp{
			Start:   start,
			End:     end,
			Current: current,
		},
	}, nil
}

func (s *SocketServer) GetRoom(id string) (*types.Room, error) {
	roomStr := s.storage.Get("room:" + id)
	if roomStr == "" {
		return nil, types.ErrRoomNotFound
	}

	var room *types.Room
	if err := json.Unmarshal([]byte(roomStr), &room); err != nil {
		return nil, fmt.Errorf("failed to unmarshal room: %v", err)
	}

	return room, nil
}

func (s *SocketServer) setRoom(id string, room *types.Room) error {
	data, err := json.Marshal(room)
	if err != nil {
		return fmt.Errorf("failed to marshal room: %v", err)
	}

	s.storage.Set("room:"+id, string(data))

	return nil
}

func (s *SocketServer) formatAndValidateJoinRoomData(msg types.Message) (types.JoinRoomData, error) {
	data, ok := msg.Data.(map[string]interface{})
	if !ok {
		return types.JoinRoomData{}, fmt.Errorf("invalid data format")
	}

	roomID, ok := data["room_id"].(string)
	if !ok || roomID == "" {
		return types.JoinRoomData{}, fmt.Errorf("invalid room_id")
	}

	email, ok := data["email"].(string)
	if !ok || email == "" {
		return types.JoinRoomData{}, fmt.Errorf("invalid email")
	}

	return types.JoinRoomData{RoomID: roomID, Email: email}, nil
}

func (s *SocketServer) formatAndValidateLeaveRoomData(msg types.Message) (types.JoinRoomData, error) {
	data, ok := msg.Data.(map[string]interface{})
	if !ok {
		return types.JoinRoomData{}, fmt.Errorf("invalid data format")
	}

	roomID, ok := data["room_id"].(string)
	if !ok || roomID == "" {
		return types.JoinRoomData{}, fmt.Errorf("invalid room_id")
	}

	email, ok := data["email"].(string)
	if !ok || email == "" {
		return types.JoinRoomData{}, fmt.Errorf("invalid email")
	}

	return types.JoinRoomData{RoomID: roomID, Email: email}, nil
}

func (s *SocketServer) validatePlayerStateData(msg types.Message) (types.PlayerStateData, error) {
	data, ok := msg.Data.(map[string]interface{})
	if !ok {
		return types.PlayerStateData{}, fmt.Errorf("invalid data format")
	}
	email, ok := data["email"].(string)
	if !ok || email == "" {
		return types.PlayerStateData{}, fmt.Errorf("invalid email")
	}
	paused, ok := data["paused"].(bool)
	if !ok {
		return types.PlayerStateData{}, fmt.Errorf("invalid state")
	}
	roomId, ok := data["room_id"].(string)
	if !ok || roomId == "" {
		fmt.Printf("roomId: %v\n", roomId)
		return types.PlayerStateData{}, fmt.Errorf("invalid room_id")
	}

	return types.PlayerStateData{RoomID: roomId, Email: email, State: paused}, nil
}

func (s *SocketServer) validateVideoSyncData(msg types.Message) (types.VideoSyncData, error) {
	data, ok := msg.Data.(map[string]interface{})
	if !ok {
		return types.VideoSyncData{}, fmt.Errorf("invalid data format")
	}
	email, ok := data["email"].(string)
	if !ok || email == "" {
		return types.VideoSyncData{}, fmt.Errorf("invalid email")
	}
	timestamp, ok := data["timestamp"].(float64)
	if !ok {
		return types.VideoSyncData{}, fmt.Errorf("invalid timestamp")
	}
	seeking, ok := data["seeking"].(bool)
	if !ok {
		return types.VideoSyncData{}, fmt.Errorf("invalid seeking")
	}
	roomId, ok := data["room_id"].(string)
	if !ok || roomId == "" {
		return types.VideoSyncData{}, fmt.Errorf("invalid room_id")
	}

	return types.VideoSyncData{RoomID: roomId, Email: email, Timestamp: timestamp, Seeking: seeking}, nil
}

func (s *SocketServer) validateChatMessageData(msg types.Message) (types.ChatMessageData, error) {
	data, ok := msg.Data.(map[string]interface{})
	if !ok {
		return types.ChatMessageData{}, fmt.Errorf("invalid data format")
	}
	email, ok := data["email"].(string)
	if !ok || email == "" {
		return types.ChatMessageData{}, fmt.Errorf("invalid email")
	}
	message, ok := data["message"].(string)
	if !ok || message == "" {
		return types.ChatMessageData{}, fmt.Errorf("invalid message")
	}
	roomId, ok := data["room_id"].(string)
	if !ok || roomId == "" {
		return types.ChatMessageData{}, fmt.Errorf("invalid room_id")
	}

	return types.ChatMessageData{RoomID: roomId, Email: email, Message: message}, nil
}

func (s *SocketServer) handleJoinRoom(conn *websocket.Conn, data types.JoinRoomData) {
	roomVal, ok := s.rooms.Load(data.RoomID)
	if !ok {
		s.sendError(conn, "Room not found")
		return
	}

	room := roomVal.(*types.Room)

	newPeer := &types.Peer{
		Email:      data.Email,
		JoinedAt:   time.Now(),
		Connection: conn.RemoteAddr().String(),
		LastPing:   time.Now(),
	}

	if err := room.AddPeer(newPeer); err != nil {
		switch err {
		case types.ErrRoomFull:
			s.sendError(conn, "Room is full")
		case types.ErrRoomInactive:
			s.sendError(conn, "Room is not active")
		case types.ErrPeerExists:
			s.sendError(conn, "Already in room")
		default:
			s.sendError(conn, fmt.Sprintf("Failed to join room: %v", err))
		}
		return
	}

	s.conns.Store(conn, data.Email)

	if err := s.setRoom(data.RoomID, room); err != nil {
		room.RemovePeer(data.Email)
		s.conns.Delete(conn)
		s.sendError(conn, "Failed to update room data")
		return
	}

	s.broadcastToRoom(room.ID.String(), types.Message{
		Action: "user_joined",
		Data: map[string]interface{}{
			"peer":  newPeer,
			"peers": room.GetPeers(),
			"room":  room,
		},
	})
}

func (s *SocketServer) handleLeaveRoom(conn *websocket.Conn, roomID string, email string) {
	roomVal, ok := s.rooms.Load(roomID)
	if !ok {
		return
	}

	room := roomVal.(*types.Room)

	if err := room.RemovePeer(email); err != nil {
		fmt.Printf("Error removing peer: %v\n", err)
		return
	}

	s.conns.Delete(conn)

	if room.IsEmpty() {
		room.SetState(types.RoomStateClosed)
		room.Close()
		s.rooms.Delete(roomID)
		s.storage.Delete("room:" + roomID)
		return
	}

	if err := s.setRoom(roomID, room); err != nil {
		fmt.Printf("Error updating room after peer left: %v\n", err)
	}

	s.broadcastToRoom(roomID, types.Message{
		Action: "user_left",
		Data: map[string]interface{}{
			"email": email,
			"peers": room.GetPeers(),
			"room":  room,
		},
	})
}

func (s *SocketServer) sendError(conn *websocket.Conn, message string) {
	errMsg := types.Message{
		Action: "error",
		Data: map[string]interface{}{
			"message": message,
		},
	}

	data, _ := json.Marshal(errMsg)
	conn.WriteMessage(websocket.TextMessage, data)
}

func (s *SocketServer) handlePlayerState(conn *websocket.Conn, playerStateData types.PlayerStateData) {
	roomID := playerStateData.RoomID
	_, ok := s.rooms.Load(roomID)
	if !ok {
		s.sendError(conn, "Room not found")
		return
	}

	msg := types.Message{
		Action: "update_player_state",
		Data: map[string]interface{}{
			"email": playerStateData.Email,
			"state": playerStateData.State,
			"room":  playerStateData.RoomID,
		},
	}
	s.broadcastToRoom(roomID, msg)
}

func (s *SocketServer) handleVideoSync(conn *websocket.Conn, videoSyncData types.VideoSyncData) {
	roomID := videoSyncData.RoomID
	_, ok := s.rooms.Load(roomID)
	if !ok {
		s.sendError(conn, "Room not found")
		return
	}

	msg := types.Message{
		Action: "update_timestamp",
		Data: map[string]interface{}{
			"email":     videoSyncData.Email,
			"timestamp": videoSyncData.Timestamp,
			"seeking":   videoSyncData.Seeking,
			"room":      videoSyncData.RoomID,
		},
	}
	s.broadcastToRoom(roomID, msg)
}

func (s *SocketServer) handleChatMessage(conn *websocket.Conn, chatMessageData types.ChatMessageData) {
	roomID := chatMessageData.RoomID
	_, ok := s.rooms.Load(roomID)
	if !ok {
		s.sendError(conn, "Room not found")
		return
	}

	msg := types.Message{
		Action: "chat_message",
		Data: map[string]interface{}{
			"email":   chatMessageData.Email,
			"message": chatMessageData.Message,
			"room":    chatMessageData.RoomID,
		},
	}
	s.broadcastToRoom(roomID, msg)
}
