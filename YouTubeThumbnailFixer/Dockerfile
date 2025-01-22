FROM rust:bookworm AS builder
WORKDIR /usr/src/YouTubeThumbnailFixer
COPY . .
RUN cargo install --path .

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/cargo/bin/YouTubeThumbnailFixer /usr/local/bin/YouTubeThumbnailFixer

EXPOSE 3000/tcp
HEALTHCHECK CMD curl --fail http://localhost:3000/healthcheck || exit 1

CMD ["YouTubeThumbnailFixer"]