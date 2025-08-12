import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border/50 shadow-soft">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              DataFlow Analytics
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/all-files" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                All Files
              </Link>
            </nav>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;