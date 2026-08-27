/** Code Atlas Editorial: public entrance and protected learning workspace stay visually coherent. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import LearningHub from "@/pages/LearningHub";
import FreePathLesson from "@/pages/FreePathLesson";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <Switch><Route path="/" component={LearningHub} /><Route path="/learn" component={LearningHub} /><Route path="/learn/:language/:lesson" component={FreePathLesson} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
