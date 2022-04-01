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
    com.docker.desktop.extension.icon="https://github.com/redhat-developer/vscode-openshift-tools/blob/main/images/openshift_extension.png?raw=true"

RUN apt update && apt install curl unzip -y
WORKDIR /tools/linux
ENV OC_VERSION=4.10.6
RUN curl https://mirror.openshift.com/pub/openshift-v4/x86_64/clients/ocp/${OC_VERSION}/openshift-client-linux-${OC_VERSION}.tar.gz -O
RUN tar -xvf openshift-client-linux-${OC_VERSION}.tar.gz
WORKDIR /tools/windows
RUN curl https://mirror.openshift.com/pub/openshift-v4/x86_64/clients/ocp/${OC_VERSION}/openshift-client-windows-${OC_VERSION}.zip -O
RUN unzip openshift-client-windows-${OC_VERSION}.zip
WORKDIR /tools/mac
RUN curl https://mirror.openshift.com/pub/openshift-v4/x86_64/clients/ocp/${OC_VERSION}/openshift-client-mac-arm64-${OC_VERSION}.tar.gz -O
RUN tar -xvf openshift-client-mac-arm64-${OC_VERSION}.tar.gz  
WORKDIR /
COPY openshift.svg .
COPY metadata.json .
COPY --from=client-builder /app/client/dist ui