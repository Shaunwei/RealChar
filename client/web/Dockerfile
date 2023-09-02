# We are using a Node.js base image
FROM node:alpine as build

# Working directory be app
WORKDIR /app

ARG REACT_APP_BUILD_NUMBER
ENV REACT_APP_BUILD_NUMBER $REACT_APP_BUILD_NUMBER
ARG REACT_APP_API_HOST
ENV REACT_APP_API_HOST $REACT_APP_API_HOST

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

# Here we use a smaller Nginx base image
FROM nginx:stable-alpine

# Copy over the built app files
COPY --from=build /app/build /usr/share/nginx/html

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the Docker host, so we can access it
# from the outside
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]

