# load custom ENV variables
if [ -f ".env" ]; then
  source .env
fi

ARCH_PLATTFORM=${ARCH_PLATTFORM:=linux/amd64}

if [ -z "$BUILD_IMAGE" ]; then
	echo "BUILD_IMAGE is not set. Please set it in the .env file."
	exit 1
fi

build() {
  docker build --platform=$ARCH_PLATTFORM --no-cache -t $BUILD_IMAGE:20.17.0 -f .gitlab/Dockerfile-20.17.0 .
	docker build --platform=$ARCH_PLATTFORM --no-cache -t $BUILD_IMAGE:22.13.0 -f .gitlab/Dockerfile-22.13.0 .
	docker build --platform=$ARCH_PLATTFORM --no-cache -t $BUILD_IMAGE:24.0.0 -f .gitlab/Dockerfile-24.0.0 .
}

push() {
  docker push $BUILD_IMAGE:20.17.0
	docker push $BUILD_IMAGE:22.13.0
	docker push $BUILD_IMAGE:24.0.0
}

if [ "$1" = "build" ]; then build; fi
if [ "$1" = "push" ]; then push; fi