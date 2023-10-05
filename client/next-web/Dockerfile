# We are using a Node.js base image
FROM node:alpine as build

# Working directory be app
WORKDIR /app

ARG REACT_APP_BUILD_NUMBER
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ARG NEXT_PUBLIC_API_HOST
ARG API_HOST

ENV REACT_APP_BUILD_NUMBER $REACT_APP_BUILD_NUMBER
ENV NEXT_PUBLIC_FIREBASE_API_KEY $NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN $NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID $NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET $NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID $NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID $NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID $NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ARG NEXT_PUBLIC_API_HOST $NEXT_PUBLIC_API_HOST
ENV API_HOST $API_HOST


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

