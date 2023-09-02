# We are using a Node.js base image
FROM node:alpine as build

# Working directory be app
WORKDIR /app

ARG REACT_APP_BUILD_NUMBER
ENV REACT_APP_BUILD_NUMBER $REACT_APP_BUILD_NUMBER

# Copy package.json and package-lock.json before other files
# Utilise Docker cache to save re-installing dependencies if unchanged
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY ./ ./

# Build app
RUN npm run build

# Run phase
FROM node:alpine

# Install Nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy over the built app files
COPY --from=build /app ./

# Install production dependencies
RUN npm ci --only=production

# Nginx config
COPY nginx_root.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the Docker host, so we can access it
# from the outside
EXPOSE 80

# Start command will start both Nginx and the Next.js app
CMD ["sh", "-c", "nginx && npm start"]

