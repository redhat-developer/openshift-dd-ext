import { getLocalImageInspectionJson, pushImage } from "./DockerUtils";
import ExecListener from "./execListener";
import { deployImage, exposeService, getAppName, getProjectRoute } from "./OcUtils"

export enum DeploymentMode {
    deploy = 0,
    pushToHubAndDeploy = 1,
    pushToOpenShiftAndDeploy = 2
}

export interface DeploymentListener {
    onMessage(message: string): void;
    onFailure(message: string, error:any): void;
    onNotExposed(message: string): void;
    onRoute(route?: string): void;
}

export class Deployer {
    
    execListener: ExecListener;

    constructor(private mode = DeploymentMode.deploy, private listener?: DeploymentListener){
        this.execListener =  {
            onOutput: (line: string) => {
              this.listener?.onMessage(line);
            },
            onError: (line: string) => {
              this.listener?.onMessage(line);
            }
        };
    }

    public async deploy(image: string): Promise<void> {
        switch (this.mode) {
            case DeploymentMode.deploy:
                // Nothing to do at that point
                break;
            case DeploymentMode.pushToHubAndDeploy:
                await this.pushToHub(image);
                break;
            case DeploymentMode.pushToOpenShiftAndDeploy:
                await this.pushToOpenShift(image);
                break;
            default:
                throw new Error("Unknown deployment mode");
        }
        return this.deployToOpenShift(image);
    }

    private pushToOpenShift(image: string): Promise<void>  {
        throw new Error("Method not implemented.");
    }

    private async pushToHub(image: string): Promise<void> {
        this.listener?.onMessage(`Pushing ${image} to Docker Hub...`);
        await pushImage(image, this.execListener);
        this.listener?.onMessage(`Image ${image} pushed successfully`);
    }

    private async deployToOpenShift(image: string): Promise<void> {
        this.listener?.onMessage(`Deploying ${image} to OpenShift...`);
        try {
            await deployImage(image, this.execListener);
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
            const result = await exposeService(appName);
            this.listener?.onMessage(result);
        } catch (e) {
            this.listener?.onFailure(`Failed to expose ${appName} for ${image}`, e);
            // return; //should we bail out here?
        }

        const route = await getProjectRoute(appName);
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