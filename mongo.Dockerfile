FROM mongo:5.0

RUN apt-get update && apt-get install -y stress-ng