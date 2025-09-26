# Stage 1: Build the React application
FROM node:18-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine
COPY --from=build-stage /app/build /usr/share/nginx/html
# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf
# Copy custom Nginx configuration (optional, but recommended for single-page apps)
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
