import axios from "axios";

export function waitOnUrl(url: string, timeout: number, interval: number, log = console.info): Promise<unknown> {
  let timeoutTimer: NodeJS.Timeout;
  let timedOut = false;
  let timeoutResolve: (...args: any) => any;
  function _waitOnUrl(url: string, whenAvailable: (...args: any) => void, whenStatusNot503: (error: any) => void) {
    setTimeout(
      () => {
        void axios.get(url, {
          timeout: interval,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }).then((value) => {
          console.log(value);
          clearTimeout(timeoutTimer);
          timeoutResolve();
          whenAvailable(value);
        }).catch((error) => {
          if (!timedOut) {
            if (error?.request?.status === 503) {
              log('.');
              _waitOnUrl(url, whenAvailable, whenStatusNot503);
            } else {
              clearTimeout(timeoutTimer);
              timeoutResolve();
              whenStatusNot503(error);
            }
          }
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
    _waitOnUrl(url, resolve, reject);
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