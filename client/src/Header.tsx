import { Box, Typography } from '@mui/material';
import logo from './images/logo.png';

export default function Header() {

  // TODO use styles.
  return (
    <Box style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Typography variant='h5' component='div'>Deploy to OpenShift</Typography>
    </Box >
  );
}