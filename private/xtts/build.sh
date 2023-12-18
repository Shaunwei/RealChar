set -e
docker build -t xtts-server .
docker tag xtts-server y1guo/xtts-server
docker push y1guo/xtts-server
