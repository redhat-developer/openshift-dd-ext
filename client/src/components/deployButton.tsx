import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { Fragment, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { KubeContext } from '../models/KubeContext';
import { currentContextState, currentOpenShiftRegistryState } from '../state/currentContextState';


interface DeployButtonProps {
  onDeployClick: (mode: number, context: KubeContext, registry?: string) => void;
  disabled?: boolean;
}

export default function DeployButton(props: DeployButtonProps) {
  const onDeployClick = props.onDeployClick;
  const disabled = props.disabled;
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const registryUrl = useRecoilValue(currentOpenShiftRegistryState);
  const context = useRecoilValue(currentContextState);
  const disabledIndex = (registryUrl)?-1:2;
  const options = ['Deploy', 'Push to Hub and Deploy']
  if (registryUrl) {
    options.push('Push to OpenShift and Deploy');
  }
  if (selectedIndex > options.length -1) {
    setSelectedIndex(0);
  }
  const handleClick = () => {
    onDeployClick(selectedIndex, context, registryUrl);
  };

  const handleMenuItemClick = (
    _event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  return (
    <Fragment>
      <ButtonGroup 
        size="large" 
        style={{ marginLeft: '20px' }}
        variant="contained"
        ref={anchorRef}
        aria-label="Deploy button" 
        disabled={disabled} 
      >
        <Button onClick={handleClick}>{options[selectedIndex]}</Button>
        <Button
          size="small"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      disabled={index === disabledIndex}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Fragment>
  );
}