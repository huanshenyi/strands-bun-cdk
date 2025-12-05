FROM --platform=linux/arm64 oven/bun:latest

WORKDIR /app

# Copy source code
COPY . ./

# Install dependencies
RUN bun install

# Build TypeScript
RUN bun run build

# Expose port
EXPOSE 8080

# Start the application
CMD ["bun", "run", "start"]
