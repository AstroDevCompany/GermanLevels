import { ViewTransition } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition name="page-main">
      <div className="flex-1">{children}</div>
    </ViewTransition>
  );
}
