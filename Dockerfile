FROM alpine:3.18 as env-builder
ARG REDIS_PASSWORD
ARG REDIS_ADDRESS

RUN echo "REDIS_PASSWORD=${REDIS_PASSWORD}" > .env && \
    echo "REDIS_ADDRESS=${REDIS_ADDRESS}" >> .env

FROM golang:1.23.1-alpine AS builder
ARG REDIS_PASSWORD
ENV REDIS_PASSWORD=$REDIS_PASSWORD
ARG REDIS_ADDRESS
ENV REDIS_ADDRESS=$REDIS_ADDRESS

RUN apk add --no-cache make git

WORKDIR /app

COPY --from=env-builder .env .

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN make build

FROM alpine:3.18

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/bin/go-party .
COPY --from=env-builder .env .

ENTRYPOINT ["./go-party"]