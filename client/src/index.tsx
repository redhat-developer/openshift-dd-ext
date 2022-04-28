import React from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';
import { App } from './App';
import { RecoilRoot } from 'recoil';

ReactDOM.render(
  <React.StrictMode>
    <DockerMuiThemeProvider>
      <CssBaseline />
      <RecoilRoot>
        <App />
      </RecoilRoot>
    </DockerMuiThemeProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
