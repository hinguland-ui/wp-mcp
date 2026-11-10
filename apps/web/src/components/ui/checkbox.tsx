import * as React from 'react';
import { cn } from '@/lib/utils';

/** shadcn-styled native checkbox (works directly with React Hook Form `register`). */
const Checkbox = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<'input'>, 'type'>>(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn('h-4 w-4 shrink-0 rounded-sm border border-primary accent-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50', className)}
    {...props}
  />
));
Checkbox.displayName = 'Checkbox';

export { Checkbox };
