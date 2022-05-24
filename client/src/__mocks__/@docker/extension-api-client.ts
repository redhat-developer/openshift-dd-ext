import { jest } from '@jest/globals';

module.exports = {
  createDockerDesktopClient: function f() {
    return {
      desktopUI: {
        toast: function () { }
      },
      docker: {
        listImages: function () {
          return [];
        }
      }
    }
  }
};