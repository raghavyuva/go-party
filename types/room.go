package types

import (
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
)

var (
	ErrRoomFull          = errors.New("room is at maximum capacity")
	ErrRoomInactive      = errors.New("room is inactive")
	ErrRoomClosed        = errors.New("room is closed")
	ErrPeerExists        = errors.New("peer already exists in room")
	ErrPeerNotFound      = errors.New("peer not found in room")
	ErrInvalidTransition = errors.New("invalid room state transition")
	ErrInvalidPeer       = errors.New("invalid peer data")
	ErrRoomNotFound      = errors.New("room not found")
)

type CreateRoomRequest struct {
	Email       string    `json:"email"`
	VideoSource string    `json:"video_source"`
	Timestamp   TimeStamp `json:"timestamp"`
}

type DeleteRoomRequest struct {
	Status RoomState `json:"status"`
}

type Message struct {
	Action string      `json:"action"`
	Data   interface{} `json:"data"`
}

type JoinRoomData struct {
	RoomID string `json:"room_id"`
	Email  string `json:"email"`
}

type LeaveRoomData struct {
	RoomID string `json:"room_id"`
	Email  string `json:"email"`
}

type PlayerStateData struct {
	RoomID string `json:"room_id"`
	Email  string `json:"email"`
	State  bool   `json:"state"`
}

type VideoSyncData struct {
	RoomID    string  `json:"room_id"`
	Email     string  `json:"email"`
	Timestamp float64 `json:"timestamp"`
	Seeking   bool    `json:"seeking"`
}

type ChatMessageData struct {
	RoomID string `json:"room_id"`
	ID    string `json:"id"`
	Email  string `json:"email"`
	Message string `json:"message"`
	TimeStamp time.Time `json:"timestamp"`
}

type PingData struct {
	Email string `json:"email"`
}

type TimeStamp struct {
	Start   float64 `json:"start"`
	End     float64 `json:"end"`
	Current float64 `json:"current"`
}

type Peer struct {
	Email      string    `json:"email"`
	JoinedAt   time.Time `json:"joined_at"`
	Connection string    `json:"connection"`
	LastPing   time.Time `json:"last_ping"`
}

func (p *Peer) Validate() error {
	if p.Email == "" {
		return errors.New("email is required")
	}
	if p.Connection == "" {
		return errors.New("connection is required")
	}
	return nil
}

type RoomState int32

const (
	RoomStateActive RoomState = iota
	RoomStateInactive
	RoomStateClosed
)

func (s RoomState) String() string {
	switch s {
	case RoomStateActive:
		return "active"
	case RoomStateInactive:
		return "inactive"
	case RoomStateClosed:
		return "closed"
	default:
		return "unknown"
	}
}

type Room struct {
	ID          uuid.UUID `json:"id"`
	URL         string    `json:"url"`
	Peers       *sync.Map `json:"peers"`
	peerCount   int32     `json:"-"`
	state       int32     `json:"-"`
	VideoSource string    `json:"video_source"`
	Timestamp   TimeStamp `json:"timestamp"`
	CreatedBy   string    `json:"created_by"`
	CreatedOn   time.Time `json:"created_on"`
	MaxCapacity int32     `json:"max_capacity"`

	peerJoined   chan *Peer
	peerLeft     chan string
	stateChanged chan RoomState
}

func NewRoom(id uuid.UUID, createdBy string, videoSource string, timestamp TimeStamp) *Room {
	room := &Room{
		ID:           id,
		Peers:        &sync.Map{},
		VideoSource:  videoSource,
		Timestamp:    timestamp,
		CreatedBy:    createdBy,
		CreatedOn:    time.Now(),
		MaxCapacity:  10,
		peerJoined:   make(chan *Peer, 1),
		peerLeft:     make(chan string, 1),
		stateChanged: make(chan RoomState, 1),
	}
	atomic.StoreInt32(&room.state, int32(RoomStateActive))
	return room
}

func (r *Room) AddPeer(peer *Peer) error {
	if peer == nil {
		return ErrInvalidPeer
	}

	if err := peer.Validate(); err != nil {
		return err
	}

	if RoomState(atomic.LoadInt32(&r.state)) != RoomStateActive {
		return ErrRoomInactive
	}

	currentCount := atomic.LoadInt32(&r.peerCount)
	if currentCount >= r.MaxCapacity {
		return ErrRoomFull
	}

	if _, loaded := r.Peers.LoadOrStore(peer.Email, peer); loaded {
		return ErrPeerExists
	}

	atomic.AddInt32(&r.peerCount, 1)

	select {
	case r.peerJoined <- peer:
	default:
	}

	return nil
}

func (r *Room) RemovePeer(email string) error {
	if email == "" {
		return errors.New("email is required")
	}

	if _, exists := r.Peers.LoadAndDelete(email); !exists {
		return ErrPeerNotFound
	}

	atomic.AddInt32(&r.peerCount, -1)

	select {
	case r.peerLeft <- email:
	default:
	}

	return nil
}

func (r *Room) UpdatePeerLastPing(email string) (*Peer, error) {
	if email == "" {
		return nil, errors.New("email is required")
	}

	value, ok := r.Peers.Load(email)
	if !ok {
		fmt.Printf("Debug: Peer not found for email %s\n", email)
		return nil, ErrPeerNotFound
	}

	peer := value.(*Peer)
	peer.LastPing = time.Now()
	r.Peers.Store(email, peer)

	fmt.Printf("Debug: Updated last ping for peer %s\n", email)
	return peer, nil
}

func (r *Room) GetPeers() map[string]*Peer {
	peers := make(map[string]*Peer)
	r.Peers.Range(func(key, value interface{}) bool {
		peers[key.(string)] = value.(*Peer)
		return true
	})
	return peers
}

func (r *Room) ForEachPeer(fn func(email string, peer *Peer) bool) {
	r.Peers.Range(func(key, value interface{}) bool {
		return fn(key.(string), value.(*Peer))
	})
}

func (r *Room) GetPeer(email string) (*Peer, error) {
	value, ok := r.Peers.Load(email)
	if !ok {
		return nil, ErrPeerNotFound
	}
	return value.(*Peer), nil
}

func (r *Room) SetState(newState RoomState) error {
	currentState := RoomState(atomic.LoadInt32(&r.state))

	if !r.isValidStateTransition(currentState, newState) {
		return ErrInvalidTransition
	}

	atomic.StoreInt32(&r.state, int32(newState))

	select {
	case r.stateChanged <- newState:
	default:
	}

	return nil
}

func (r *Room) isValidStateTransition(current, new RoomState) bool {
	switch current {
	case RoomStateActive:
		return new == RoomStateInactive || new == RoomStateClosed
	case RoomStateInactive:
		return new == RoomStateActive || new == RoomStateClosed
	case RoomStateClosed:
		return false
	default:
		return false
	}
}

func (r *Room) GetState() RoomState {
	return RoomState(atomic.LoadInt32(&r.state))
}

func (r *Room) IsEmpty() bool {
	return atomic.LoadInt32(&r.peerCount) == 0
}

func (r *Room) Close() {
	if RoomState(atomic.LoadInt32(&r.state)) != RoomStateClosed {
		atomic.StoreInt32(&r.state, int32(RoomStateClosed))

		close(r.peerJoined)
		close(r.peerLeft)
		close(r.stateChanged)

		r.Peers.Range(func(key, _ interface{}) bool {
			r.Peers.Delete(key)
			return true
		})
		atomic.StoreInt32(&r.peerCount, 0)
	}
}

func (r *Room) MarshalJSON() ([]byte, error) {
	type Alias Room
	return json.Marshal(&struct {
		*Alias
		State RoomState        `json:"status"`
		Peers map[string]*Peer `json:"peers"`
	}{
		Alias: (*Alias)(r),
		State: r.GetState(),
		Peers: r.GetPeers(),
	})
}
