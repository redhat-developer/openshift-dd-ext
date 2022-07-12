import { Box, Link } from '@mui/material';
import logo from '../images/logo.png';

export interface LogoProps {
  onClick: () => void;
  clickable: boolean;
}

export default function Logo(props: LogoProps) {

  // TODO use styles.
  const iconContainer = {
    height: 60,
    marginBottom: '1em',
    marginTop: '0.5em',
    width: '100%',
  };

  const logoStyle = {
    maxHeight: '100%',
    maxWidth: '100%'
  }
  return (
    <Box style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Box style={iconContainer}>
        {props.clickable && (
          <Link href='#' onClick={props.onClick}><img src={logo} style={logoStyle} /></Link>
        )}
        {!props.clickable && (
          <img src={logo} style={logoStyle} />
        )}
      </Box>
    </Box >
  );
}