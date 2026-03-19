import * as React from "react"
import { cn } from "@/lib/utils"

const Dialog = ({
  open,
  onOpenChange,
  children,
  position = "center",
  topOffset = 0,
  zIndex = "z-50",
  ...props
}) => {
  if (!open) return null;

  const isTop = position === "top";
  const wrapperAlign = isTop ? "items-start" : "items-center";

  return (
    <div
      className={`fixed inset-0 flex justify-center ${wrapperAlign} ${zIndex}`}
      style={isTop ? { paddingTop: topOffset } : undefined}
    >
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50" {...props}>
        {children}
      </div>
    </div>
  );
};

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-card text-card-foreground rounded-lg border shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("mb-4", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-2xl font-semibold", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-2", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 mt-6", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };

