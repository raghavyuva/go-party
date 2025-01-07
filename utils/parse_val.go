package utils

import "encoding/json"

func ParseVal(val string) string {
	var value any
	if val == "" {
		return "null"
	}
	err := json.Unmarshal([]byte(val), &value)
	if err != nil {
		return "null"
	}
	return value.(string)
}
