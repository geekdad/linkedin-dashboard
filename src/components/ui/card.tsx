   import React from 'react';

   export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => <div {...props} />;
   export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => <div {...props} />;
   export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => <h2 {...props} />;
   export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = (props) => <p {...props} />;
   export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => <div {...props} />;