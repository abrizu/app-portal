# 1. Use a lightweight Node.js image
FROM node:20-alpine

# 2. Set the working directory
WORKDIR /app

# 3. Copy package files and install dependencies
# We do this first to leverage Docker caching
COPY package*.json ./
RUN npm install

# 4. Copy the rest of the frontend source code
COPY . .

# 5. Expose the default Vite port
EXPOSE 5173

# 6. Start the development server
# The '--host' flag is required for the container to be accessible
CMD ["npm", "run", "dev", "--", "--host"]
