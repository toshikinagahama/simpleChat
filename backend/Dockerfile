FROM alpine:3.15.0
COPY ./bin/main /bin/main
COPY ./config/environments/config.yaml  /config/environments/config.yaml
COPY ./out  /srv/myapp/
CMD ["/bin/main"]
