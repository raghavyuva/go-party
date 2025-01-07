package utils

import (
	"encoding/json"
	"io"
	"net/http"
)

type ResponseWriter struct {
	http.ResponseWriter
}


func (w *ResponseWriter) WriteJSON(status int, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(data)
}


func (w *ResponseWriter) WriteError(status int, message string) {
	http.Error(w, message, status)
}


type RequestReader struct {
	*http.Request
}


func (r *RequestReader) ReadJSON(target interface{}) error {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}
	defer r.Body.Close()

	return json.Unmarshal(body, target)
}


func (r *RequestReader) ValidateMethod(method string) error {
	if r.Method != method {
		return ErrMethodNotAllowed
	}
	return nil
}


var (
	ErrMethodNotAllowed = NewHTTPError("Method not allowed", http.StatusMethodNotAllowed)
	ErrInvalidJSON     = NewHTTPError("Invalid JSON format", http.StatusBadRequest)
	ErrReadingBody     = NewHTTPError("Error reading request body", http.StatusBadRequest)
)

type HTTPError struct {
	Message    string
	StatusCode int
}

func (e *HTTPError) Error() string {
	return e.Message
}


func NewHTTPError(message string, status int) *HTTPError {
	return &HTTPError{
		Message:    message,
		StatusCode: status,
	}
}


func HandleRequest[T any, R any](w http.ResponseWriter, r *http.Request, method string, handler func(T) (R, error)) {
	writer := &ResponseWriter{ResponseWriter: w}
	reader := &RequestReader{Request: r}

	if err := reader.ValidateMethod(method); err != nil {
		writer.WriteError(err.(*HTTPError).StatusCode, err.Error())
		return
	}

	var request T
	if err := reader.ReadJSON(&request); err != nil {
		writer.WriteError(http.StatusBadRequest, ErrInvalidJSON.Error())
		return
	}

	response, err := handler(request)
	if err != nil {
		if httpErr, ok := err.(*HTTPError); ok {
			writer.WriteError(httpErr.StatusCode, httpErr.Message)
		} else {
			writer.WriteError(http.StatusInternalServerError, "Internal server error")
		}
		return
	}

	if err := writer.WriteJSON(http.StatusOK, response); err != nil {
		writer.WriteError(http.StatusInternalServerError, "Error encoding response")
	}
}