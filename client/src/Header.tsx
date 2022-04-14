import { Box, Typography } from '@mui/material';
import logo from './images/logo.png';

export default function Header() {

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
        <img src={logo} style={logoStyle} />
      </Box>
      <Typography variant='h5' component='div'>Deploy to OpenShift</Typography>
    </Box >
  );
}