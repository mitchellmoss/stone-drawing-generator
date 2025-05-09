"use client"

import { useState, useEffect } from 'react'

// Define a generic type for the useLocalStorage hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  
  // Initialize with stored value or initial value
  useEffect(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      setStoredValue(item ? JSON.parse(item) : initialValue)
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error)
      setStoredValue(initialValue)
    }
  }, [key, initialValue])
  
  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }
  
  return [storedValue, setValue] as const
}

// Function to clear all application data from localStorage
export function clearAllStoredData() {
  try {
    // Clear all keys related to the application
    const keysToRemove = [
      'stone-mockup-generator:savedPieces',
      'stone-mockup-generator:currentSpecs',
      'stone-mockup-generator:currentNotes',
      'stone-mockup-generator:displayOptions'
    ]
    
    keysToRemove.forEach(key => {
      window.localStorage.removeItem(key)
    })
    
    return true
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    return false
  }
}
