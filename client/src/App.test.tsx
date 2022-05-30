import { render } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { App } from './App';

jest.mock('@docker/extension-api-client');
jest.mock("./imageSelector"); // TODO: Figure out how to deal with component state update in useEffect callback

describe('Welcome page', function () {
  beforeAll(function () {
  });
  test('is shown if \'deployPage\' is empty', function () {
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue('');
    const div = document.createElement('div');
    const application = render(<RecoilRoot><App /></RecoilRoot>);
    const deployToOpenShiftBtn = application.queryByText('Deploy to OpenShift');
    expect(deployToOpenShiftBtn).toBeTruthy;
  });
  test('is not shown if \'deployPage\' is \'true\'', function () {
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue('true');
    const div = document.createElement('div');
    const application = render(<RecoilRoot><App /></RecoilRoot>);
    const deployToOpenShiftBtn = application.queryByText('Deploy to OpenShift');
    expect(deployToOpenShiftBtn).toBeFalsy;
  });
  afterAll(function () {
    localStorage.__proto__.getItem.mockRestore();
  });
});