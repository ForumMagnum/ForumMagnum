FROM alpine:3.20
RUN apk add --no-cache postgresql15-client bash ca-certificates tzdata
WORKDIR /app
COPY refresh_dev.sh /app/refresh_dev.sh
RUN chmod +x /app/refresh_dev.sh
ENTRYPOINT ["/app/refresh_dev.sh"]
