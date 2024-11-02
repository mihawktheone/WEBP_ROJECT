FROM oven/bun
WORKDIR /app/frontend
COPY ./package*.json ./
RUN bun install
COPY . .
EXPOSE 5173
CMD ["bun", "run", "dev", "--host"]
