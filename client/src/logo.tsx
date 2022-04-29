import { Box, Link, Typography } from '@mui/material';
import logo from './images/logo.png';
import { useLocalState, useSessionState } from './hooks/useStorageState';

export interface LogoProps {
  handleOnClick: () => void;
  deployView: boolean;
}

export default function Logo(props: LogoProps) {

  // TODO use styles.
  const iconContainer = {
    height: 60,
    marginBottom: '3em',
    marginTop: '2em',
    width: '100%',
  };

  const logoStyle = {
    maxHeight: '100%',
    maxWidth: '100%'
  }
  return (
    <Box style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Box style={iconContainer}>
        {props.deployView && (
          <Link href='#' onClick={props.handleOnClick}><img src={logo} style={logoStyle} /></Link>
        )}
        {!props.deployView && (
          <img src={logo} style={logoStyle} />
        )}
      </Box>
    </Box >
  );
}