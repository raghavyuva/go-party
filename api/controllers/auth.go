package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/raghavyuva/go-party/storage"
	"github.com/raghavyuva/go-party/types"
	"github.com/raghavyuva/go-party/utils"
)

type AuthController struct {
	store storage.Storage
}

func NewAuthController(store storage.Storage) *AuthController {
	return &AuthController{
		store: store,
	}
}

func (c *AuthController) HandleGetUserByEmail(w http.ResponseWriter, r *http.Request) {
	utils.HandleRequest[types.UserRequest, *types.User](w, r, http.MethodGet, func(req types.UserRequest) (*types.User, error) {
		if req.Email == "" {
			return nil, utils.NewHTTPError("user email is required", http.StatusBadRequest)
		}
		var user types.User
		val := c.store.Get("user:" + req.Email)
		err := json.Unmarshal([]byte(val), &user)
		if err != nil {
			fmt.Printf("Error in unmarshalling user data: %v\n", err)
			return nil, utils.NewHTTPError("Invalid user data", http.StatusInternalServerError)
		}

		return &user, nil
	})
}

func (c *AuthController) HandleLogin(w http.ResponseWriter, r *http.Request) {
	utils.HandleRequest[types.LoginRequest, *types.User](w, r, http.MethodPost, func(req types.LoginRequest) (*types.User, error) {
		if req.Email == "" {
			return nil, utils.NewHTTPError("user email is required", http.StatusBadRequest)
		}

		if req.Password == "" {
			return nil, utils.NewHTTPError("password is required", http.StatusBadRequest)
		}

		val := c.store.Get("user:" + req.Email)
		var user types.User
		if err := json.Unmarshal([]byte(val), &user); err != nil {
			fmt.Printf("Error in unmarshalling user data: %v\n", err)
			return nil, utils.NewHTTPError("Invalid user data", http.StatusInternalServerError)
		}
		if user.Password != req.Password {
			return nil, utils.NewHTTPError("Invalid credentials", http.StatusUnauthorized)
		}

		return &user, nil
	})
}
