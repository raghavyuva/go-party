package storage

type Storage interface {
	Get(string) string
	Set(string, string)
	Delete(string)
	Close()
}