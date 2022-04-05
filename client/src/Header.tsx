export default function Header() {
  const logo = 'images/logo.png';

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
    <div style={{ textAlign: 'center' }}>
      <div style={iconContainer}>
        <img src={logo} style={logoStyle} />
        <h1 >Deploy to OpenShift</h1>
      </div>
    </div >
  );
}