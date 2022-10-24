import { KubeContext } from "../models/KubeContext";
import { OcOptions } from "../models/OcOptions";
import { buildTag, getLocalImageInspectionJson, pushImage, removeTag, tagImage } from "./DockerUtils";
import { getMessage } from "./ErrorUtils";
import ExecListener from "./execListener";
import { createImageStream, deployImage, exposeService, getAppName, getProjectRoute, registryLogin } from "./OcUtils";

export enum DeploymentMode {
    deploy = 0,
    pushToHubAndDeploy = 1,
    pushToOpenShiftAndDeploy = 2
}

interface DeploymentData {
    image: string;
    imageStream?: string;
}

export interface DeploymentListener {
    onMessage(message: string): void;
    onFailure(message: string, error:any): void;
    onNotExposed(message: string): void;
    onRoute(route?: string): void;
}

export class Deployer {
    
    execListener: ExecListener;

    constructor(private ocOptions: OcOptions, private mode = DeploymentMode.deploy, private listener?: DeploymentListener){
        this.execListener =  {
            onOutput: (line: string) => {
              this.listener?.onMessage(line);
            },
            onError: (line: string) => {
              this.listener?.onMessage(line);
            }
        };
    }

    public async deploy(image: string, context: KubeContext, registry?:string): Promise<void> {
        let imageStream: string|undefined;
        switch (this.mode) {
            case DeploymentMode.deploy:
                // Nothing to do at that point
                break;
            case DeploymentMode.pushToHubAndDeploy:
                await this.pushToHub(image);
                break;
            case DeploymentMode.pushToOpenShiftAndDeploy:
                imageStream = await this.pushToOpenShift(image, context, registry);
                break;
            default:
                throw new Error("Unknown deployment mode");
        }
        return this.deployToOpenShift({image, imageStream});
    }

    private async pushToOpenShift(image: string, context: KubeContext, registry?:string): Promise<string|undefined>  {
        if (!registry) {
            throw new Error("No OpenShift registry is available");
        }
        this.execListener.onOutput(`Logging to ${registry}...`);
        await registryLogin(this.ocOptions, this.execListener);
        
        const imageStream = getAppName(image);
        this.execListener.onOutput(`Creating image stream ${imageStream}...`);
        try {
            await createImageStream(this.ocOptions, imageStream);
        } catch (error: any) {
            if (getMessage(error).includes("already exists")) {
                this.execListener.onOutput(`Image stream ${getAppName(image)} already exists, proceeding...`);
            } else {
                throw error;
            }
        }

        const newTag = buildTag(registry, context.project!, image);
        this.execListener.onOutput(`Tagging  ${newTag}...`);
        await tagImage(image, newTag);
        this.execListener.onOutput(`Pushing ${newTag} to remote registry...`);
        await pushImage(newTag, this.execListener);
        this.execListener.onOutput(`Removing tag ${newTag}`);
        await removeTag(newTag);
        return imageStream;
    }

    private async pushToHub(image: string): Promise<void> {
        this.listener?.onMessage(`Pushing ${image} to Docker Hub...`);
        await pushImage(image, this.execListener);
        this.listener?.onMessage(`Image ${image} pushed successfully`);
    }

    private async deployToOpenShift(deployment: DeploymentData): Promise<void> {
        const image = deployment.image;
        const imageStream = deployment.imageStream;
        this.listener?.onMessage(`Deploying ${image} to OpenShift...`);
        try {
            await deployImage(this.ocOptions, imageStream?imageStream:image, this.execListener);
        } catch (err) {
            this.listener?.onFailure(`Failed to deploy ${image}`, err);
            return;
        }
        
        let exposedPorts = await this.getExposedPorts(image);

        const hasExposedPorts = exposedPorts && Object.keys(exposedPorts).length > 0;
        if (!hasExposedPorts) {
            this.listener?.onNotExposed(`No exposed ports found, so no route is created for ${image}`);
            return;
        }
        
        const appName = getAppName(image);
        try {
            const result = await exposeService(this.ocOptions, appName);
            this.listener?.onMessage(result);
        } catch (e) {
            this.listener?.onFailure(`Failed to expose ${appName} for ${image}`, e);
            // return; //should we bail out here?
        }

        const route = await getProjectRoute(this.ocOptions, appName);
        if (route) {
            this.listener?.onMessage(`Application ${appName} exposed at ${route}`);
        } 
        this.listener?.onRoute(route);
    }

    async getExposedPorts(image: string): Promise<any> {
        const inspectionData = await getLocalImageInspectionJson(image);
        const exposedPorts = inspectionData?.[0].Config.ExposedPorts;
        return exposedPorts;
    }
}