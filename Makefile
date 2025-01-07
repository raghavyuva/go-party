APP_NAME=go-party
build: 
	@go build -o bin/$(APP_NAME)

run: build
	@./bin/$(APP_NAME)

test:
	@go test -v ./...