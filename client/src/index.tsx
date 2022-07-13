import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';
import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';
import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import { App } from './App';

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
