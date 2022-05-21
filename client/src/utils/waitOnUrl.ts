import axios from "axios";

export function waitOnUrl(url: string, timeout: number, interval: number, log = console.info): Promise<unknown> {
  let timeoutTimer: NodeJS.Timeout;
  let timedOut = false;
  let timeoutResolve: (...args: any) => any;
  function _waitOnUrl(url: string, whenAvailable: (...args: any) => void) {
    setTimeout(
      () => {
        void axios.get(url, {
          timeout: interval
        }).then((value) => {
          clearTimeout(timeoutTimer);
          timeoutResolve();
          whenAvailable();
        }).catch((error) => {
          if (timedOut) return;
          log('.');
          _waitOnUrl(url, whenAvailable);
        });
      },
      interval
    );
  }

  const timeoutPromise = new Promise<void>((resolve, reject) => {
    timeoutResolve = resolve;
    timeoutTimer = setTimeout(() => {
      timedOut = true;
      reject();
    },
      timeout
    )
  });

  const workerPromise = new Promise((resolve, reject) => {
    _waitOnUrl(url, resolve);
  });

  return Promise.all([
    timeoutPromise,
    workerPromise
  ]);
}

// waitOnUrl('http://localhost:3000', 30000, 1000).then((value) => {
//   console.info('Available!');
// }).catch((err) => {
//   console.info('Waiting timed out!')
// });