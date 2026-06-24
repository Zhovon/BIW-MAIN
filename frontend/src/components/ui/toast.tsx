"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";

const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      width: "390px",
      maxWidth: "100vw",
      margin: 0,
      listStyle: "none",
      zIndex: 2147483647,
      outline: "none",
    }}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "grid",
        gridTemplateAreas: '"title action" "description action"',
        gridTemplateColumns: "auto max-content",
        columnGap: "15px",
        alignItems: "center",
        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.3)",
        backdropFilter: "blur(12px)",
        // Custom micro animations via class if needed, or inline
      }}
      className={`ToastRoot ${className || ""}`}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    style={{ gridArea: "title", fontWeight: 600, color: "var(--text)", fontSize: "0.95rem" }}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    style={{ gridArea: "description", margin: 0, color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;


export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastPrimitives,
};
