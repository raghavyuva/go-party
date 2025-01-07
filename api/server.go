package api

import (
	"log"
	"net/http"
	"time"

	"github.com/raghavyuva/go-party/api/controllers"
	"github.com/raghavyuva/go-party/storage"
)

type Server struct {
	ListenAddr     string
	store          storage.Storage
	authController *controllers.AuthController
}

func NewServer(listenAddr string, store storage.Storage) *Server {
	return &Server{
		ListenAddr:     listenAddr,
		store:          store,
		authController: controllers.NewAuthController(store),
	}
}

func (s *Server) CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token, Sec-WebSocket-Extensions, Sec-WebSocket-Key, Sec-WebSocket-Version")
		w.Header().Set("Access-Control-Expose-Headers", "Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "300")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		if r.Header.Get("Upgrade") == "websocket" {
			next.ServeHTTP(w, r)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) Start() error {
	mux := http.NewServeMux()

	s.setupRoutes(mux)

	server := &http.Server{
		Addr:         s.ListenAddr,
		Handler:      s.CORSMiddleware(mux),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("Server starting on %s", s.ListenAddr)
	return server.ListenAndServe()
}

func (s *Server) setupRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/user", s.authController.HandleGetUserByEmail)
	mux.HandleFunc("/api/v1/login", s.authController.HandleLogin)

	wsServer, err := controllers.NewSocketServer()
	if err != nil {
		log.Fatal(err)
	}

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		wsServer.HandleHTTP(w, r)
	})
}