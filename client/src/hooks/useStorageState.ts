import { useState, useEffect } from "react";

class UseStorageState {
  storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getStorageValue<T>(key: string, defaultValue: T) {
    // getting stored value
    const saved = this.storage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
    return defaultValue;
  }

  useStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState(() => {
      const result = this.getStorageValue(key, defaultValue);
      console.log('Hook getting default value:', result);
      return result;
    });

    useEffect(() => {
      // storing key/value pair
      console.log('Storing value:', value)
      this.storage.setItem(key, JSON.stringify(value));
      console.log('Value in storage:', this.storage.getItem(key));
    }, [key, value]);

    return [value, setValue];
  };
}

const useLocalStorage = new UseStorageState(localStorage);
const useSessionStorage = new UseStorageState(sessionStorage);

/**
 * Returns a stateful value, and a function to update it, bound to the local storage (i.e. survives restarts).
 * 
 * @param key the key to store/read the value under
 * @param defaultValue the default value to use if the key is not found
 * @returns a stateful value, and a function to update it
 */
export function useLocalState<T>(key: string, defaultValue: T) {
  return useLocalStorage.useStorage(key, defaultValue);
}


/**
 * Returns a stateful value, and a function to update it, bound to the session storage (i.e. does not survive restarts).
 * 
 * @param key the key to store/read the value under
 * @param defaultValue the default value to use if the key is not found
 * @returns a stateful value, and a function to update it
 */
export function useSessionState<T>(key: string, defaultValue: T) {
  return useSessionStorage.useStorage(key, defaultValue);
}
