# build image that should be used in pipeline-linux.yml
FROM node:20.17.0

RUN apt-get update && apt-get install -y \
		jq \
		&& rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node"]