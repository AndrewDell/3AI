import * as ToastPrimitive from '@radix-ui/react-toast'
import { clsx } from 'clsx'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
}

export const Toast = ({ message, type = 'success' }: ToastProps) => {
  return (
    <ToastPrimitive.Provider>
      <ToastPrimitive.Root
        className={clsx(
          'fixed bottom-4 right-4 z-50',
          'rounded-lg shadow-lg',
          'p-4 text-sm',
          {
            'bg-green-100 text-green-900': type === 'success',
            'bg-red-100 text-red-900': type === 'error',
          }
        )}
      >
        {message}
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport />
    </ToastPrimitive.Provider>
  )
}

export const toast = {
  success: (message: string) => {
    // Implement toast showing logic
  },
  error: (message: string) => {
    // Implement toast showing logic
  }
} 