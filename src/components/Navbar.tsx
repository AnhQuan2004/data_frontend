import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border/50 shadow-soft">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              GFI WORKING SPACE
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Question Form
              </Link>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/visualize-data" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Visualize Data
              </Link>
              <a
                href="https://research.gfiresearch.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Deep Research
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user && (
              <>
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
