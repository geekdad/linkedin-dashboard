   import React from 'react';
   import { Slot } from '@radix-ui/react-slot';

   export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     asChild?: boolean;
   }

   export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
     ({ asChild = false, ...props }, ref) => {
       const Comp = asChild ? Slot : "button";
       return <Comp ref={ref} {...props} />;
     }
   );
   Button.displayName = "Button";