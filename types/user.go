package types

type User struct {
	Email    string `json:"email"`
	ID       int    `json:"id"`
	UserName string `json:"name"`
	Password string `json:"password"`
	Token    string `json:"token"`
}

func ValidateUser(user *User) bool {
	return true
}

type UserRequest struct {
	Email string `json:"email"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
