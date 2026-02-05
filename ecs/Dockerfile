FROM alpine:3.23.3
RUN apk add --no-cache postgresql18-client bash ca-certificates tzdata
WORKDIR /app
COPY refresh_dev.sh /app/refresh_dev.sh
RUN chmod +x /app/refresh_dev.sh
ENTRYPOINT ["/app/refresh_dev.sh"]
