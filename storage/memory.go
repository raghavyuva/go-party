package storage

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

type RedisOpts struct {
	Address  string
	Password string
	DB       int
}

type RedisStorage struct {
	client *redis.Client
}

func NewRedisStorage(opts RedisOpts) *RedisStorage {
	client := redis.NewClient(&redis.Options{
		Addr:     opts.Address,
		Password: opts.Password,
		DB:       opts.DB,
	})
	return &RedisStorage{
		client: client,
	}
}

func (s *RedisStorage) Get(key string) string {
    val, err := s.client.Get(ctx, key).Result()
    if err != nil {
        fmt.Println("Error in getting value from redis", err)
        return ""  
    }
    return val
}

func (s *RedisStorage) Set(key string, value string) {
	err := s.client.Set(ctx, key, value, 0).Err()
	if err != nil {
		fmt.Println("Error in setting value in redis", err)
	}
}

func (s *RedisStorage) Delete(key string) {
	err := s.client.Del(ctx, key).Err()
	if err != nil {
		fmt.Println("Error in deleting value from redis", err)
	}
}

func (s *RedisStorage) Close() {
	err := s.client.Close()
	if err != nil {
		fmt.Println("Error in closing redis client", err)
	}
}

func (s *RedisStorage) Ping() error {
	return s.client.Ping(ctx).Err()
}