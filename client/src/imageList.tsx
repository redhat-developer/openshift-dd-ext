import React from 'react';
import ReactDOM from 'react-dom';

import { VariableSizeList as ImageList } from 'react-window';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Box, Button } from '@mui/material';

const { useState, useEffect } = React;
const ddClient = createDockerDesktopClient();


export function DockerImageList() {
    const [selectedImage, setSelectedImage] = useState('');
    const [images, setImages] = useState([]);
    const [originalImages, setOriginalImages] = useState([]);
    const [loading, setLoading] = useState(true);


    async function loadImages(): Promise<void> {
        const data: any = await ddClient.docker.listImages();
        const items = data.map((i: { RepoTags: any; }) => i.RepoTags).flat().filter((i: string | null) => i != null && '<none>:<none>' !== i).flat();
        const options = items.map((d: any) => ({
          value: d,
          label: d
        }))
        setLoading(false);
        setImages(options);
        setOriginalImages(options);
        return;
    }

    useEffect(()=> {
        if (loading) {
            loadImages();
        }
    }, [loading]);

    function handleDeploy(image: {label: string, value: string}) {
        ddClient.desktopUI.toast.success(`Deployed ${image.label}!`);
    }

    function handleSearch(event: any) {
        const trimmedValue = event.target.value.trim();
        if(trimmedValue.length > 0) {
            setImages(originalImages.filter((value: {label: string, value: string})=>value.label.includes(trimmedValue)));
        } else {
            setImages(originalImages)
        }
    }

    const Row = (item: { index:number, style: any }): JSX.Element  => {
        return ( 
            <div style={item.style}>
                {(images[item.index] as any).label}<Button onClick={()=>handleDeploy(images[item.index])}>Deploy</Button>
            </div>
      )};    

    if (loading) {
        return ( <p>Loading list of images.</p>)
    }
    return (
        <>
            <Box margin="15px 0px 15px 0px">Search: <input type="text" onChange={handleSearch}/></Box>
            <div style={{ flex: '1 1 auto' }}>
            <AutoSizer onResize={(size) => console.log(size)}>
                {({width, height}) => (
                    <ImageList
                        itemCount={images.length}
                        width={width}
                        itemSize={()=>35}
                        height={height}>
                        {Row}
                    </ImageList>
                )}
            </AutoSizer>
            </div> 
        </>
    )
}




