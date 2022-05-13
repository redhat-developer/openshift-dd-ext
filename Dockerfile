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

FROM debian:stable-slim AS tools-download
RUN apt update && apt install curl unzip -y
ENV OC_VERSION=4.10.9
ENV OC_DOWNLOAD_URL=https://mirror.openshift.com/pub/openshift-v4/x86_64/clients/ocp/${OC_VERSION}
WORKDIR /tools/linux
RUN curl ${OC_DOWNLOAD_URL}/openshift-client-linux.tar.gz | tar -xz
WORKDIR /tools/windows
RUN curl ${OC_DOWNLOAD_URL}/openshift-client-windows.zip -o client.zip && unzip client.zip && rm client.zip
WORKDIR /tools/mac
RUN curl ${OC_DOWNLOAD_URL}/openshift-client-mac.tar.gz | tar -xz
WORKDIR /

FROM debian:bullseye-slim
LABEL org.opencontainers.image.title="OpenShift" \
    org.opencontainers.image.description="Easily deploy and test applications onto OpenShift." \
    org.opencontainers.image.vendor="Red Hat Inc." \
    com.docker.desktop.extension.api.version=">= 0.2.0" \
    com.docker.desktop.extension.icon="https://raw.githubusercontent.com/redhat-developer/vscode-openshift-tools/main/images/openshift_extension.png" \
    com.docker.extension.screenshots="[ \
        { \
            \"alt\": \"Welcome Page\", \
            \"url\": \"https://raw.githubusercontent.com/redhat-developer/openshift-dd-ext/v0.0.1/images/welcome-page.png\" \
        }, { \
            \"alt\": \"Login Using Username and Password\", \
            \"url\": \"https://raw.githubusercontent.com/redhat-developer/openshift-dd-ext/v0.0.1/images/deploy-page-login-password.png\" \
        }, { \
            \"alt\": \"Login Using Bearer Token\", \
            \"url\": \"https://raw.githubusercontent.com/redhat-developer/openshift-dd-ext/v0.0.1/images/deploy-page-login-token.png\" \
        }, { \
            \"alt\": \"Deployment Page Initial State\", \
            \"url\": \"https://raw.githubusercontent.com/redhat-developer/openshift-dd-ext/v0.0.1/images/deploy-page-initial-state.png\" \
        }, { \
            \"alt\": \"Deployment Page Image Selected\", \
            \"url\": \"https://raw.githubusercontent.com/redhat-developer/openshift-dd-ext/v0.0.1/images/deploy-page-image-selected.png\" \
        }, { \
            \"alt\": \"Deployment Page Image Deployed\", \
            \"url\": \"https://raw.githubusercontent.com/redhat-developer/openshift-dd-ext/v0.0.1/images/deploy-page-image-deployed.png\" \
        } \
    ]" \
    com.docker.extension.detailed-description=" \
        <p>The Red Hat OpenShift extension enables developers who are working with OpenShift to deploy and test their apps from Docker Desktop with ease.  \
        You choose your target environment, the project you want to deploy to, you select the image of your app from the ones available on Docker Desktop and it deploys the application on OpenShift. \
        Capabilities provided at the moment: \
        <ul> \
        <li> <b>Detection of Kubernetes environments:</b> scan your defined kubeconfigs on your local environment and preselect your current default kubernetes environment. You can also easily switch from one environment to another one. </li> \
        <li> <b>Login into Clusters:</b> you can connect to a new Kubernetes environment not yet configured on your local workstation by directly connecting to it with the connection details. </li> \
        <li> <b>Listing of projects (namespace):</b> browse and select the project in which you want to deploy your application. </li> \
        <li> <b>Selection of container image:</b> pick and choose the container image you already have built and deployed on a container registry. </li> \
        <li> <b>Deployment of container image:</b> container image gets deployed by building the resources needed with the automatic creation of the route to expose the application outside of the cluster. Once deployed, the application opens in a new browser tab. </li> \
        </ul> \
        </p> \
        <p><h2>Need an OpenShift cluster?</h2> \
        You can get a free, private OpenShift cluster, available for 30-days, with the [Developer Sandbox for Red Hat OpenShift](https://red.ht/3l2o59m). \
        </p> \
        <p><h2>How do I learn more and get involved?</h2> \
        Please submit questions, issues and feedbacks directly on the extension's repository: <a href="https://github.com/redhat-developer/openshift-dd-ext">OpenShift Docker Desktop Extension Repository</a> \
        </p> \ 
    "
COPY openshift.svg .
COPY metadata.json .
COPY --from=client-builder /app/client/dist ui
COPY --from=tools-download /tools tools