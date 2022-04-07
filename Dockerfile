FROM node:17.7-alpine3.14 AS client-builder
WORKDIR /app/client
# cache packages in layer
COPY client/package.json /app/client/package.json
COPY client/yarn.lock /app/client/yarn.lock
ARG TARGETARCH
RUN yarn config set cache-folder /usr/local/share/.cache/yarn-${TARGETARCH}
RUN yarn config set network-timeout 120000

RUN --mount=type=cache,target=/usr/local/share/.cache/yarn-${TARGETARCH} yarn
# install
COPY client /app/client
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn-${TARGETARCH} yarn build

FROM debian:bullseye-slim
LABEL org.opencontainers.image.title="OpenShift" \
    org.opencontainers.image.description="Deploy Docker images to OpenShift" \
    org.opencontainers.image.vendor="Red Hat Inc." \
    com.docker.desktop.extension.api.version=">= 0.2.0" \
    com.docker.desktop.extension.icon="https://raw.githubusercontent.com/redhat-developer/vscode-openshift-tools/main/images/openshift_extension.png"
RUN apt update && apt install curl unzip -y
ENV OC_VERSION=4.10.9
ENV OC_DOWNLOAD_URL=https://mirror.openshift.com/pub/openshift-v4/x86_64/clients/ocp/${OC_VERSION}
WORKDIR /tools/linux
RUN curl ${OC_DOWNLOAD_URL}/openshift-client-linux.tar.gz | tar -xz
WORKDIR /tools/windows
RUN curl ${OC_DOWNLOAD_URL}/openshift-client-windows.zip -o client.zip && unzip client.zip
WORKDIR /tools/mac
RUN curl ${OC_DOWNLOAD_URL}/openshift-client-mac.tar.gz | tar -xz
WORKDIR /
COPY openshift.svg .
COPY metadata.json .
COPY --from=client-builder /app/client/dist ui