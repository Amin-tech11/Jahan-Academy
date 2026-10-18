# Real S3 policy enforcement for disposable CI tests. Community images were removed.
# Official RELEASE.2025-10-15T17-29-55Z, pinned to its source commit.
FROM golang:1.24.8-alpine AS build
ENV CGO_ENABLED=0
RUN GOBIN=/out go install github.com/minio/minio@9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a

FROM alpine:3.22
RUN apk add --no-cache ca-certificates && mkdir /data && chown 10001:10001 /data
COPY --from=build /out/minio /usr/local/bin/minio
USER 10001:10001
EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/minio"]
CMD ["server", "/data"]
