import { useState, type FormEvent } from "react";
import Logo from "./Logo";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "./ui/panel/panel";
import { Badge } from "./ui/badge/badge";
import { Button } from "./ui/button/button";
import { ArrowRight } from "lucide-react";
import { Input } from "./ui/input/input";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/store";

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (email.trim()) setUser({ email: email.trim().toLowerCase() });
    navigate("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Logo />
        </div>
        <Panel notch="md">
          <PanelHeader>
            <PanelTitle>ACCESS WORKSPACE</PanelTitle>
            <Badge variant="ACTIVE" className="ml-auto">
              READY
            </Badge>
          </PanelHeader>
          <PanelContent className="space-y-6 p-7">
            <div>
              <h1 className="text-2xl text-[var(--text-secondary)]">
                CODE DOCUMENTATION,
                <br />
                <span className="text-[var(--color-green)]">
                  WITHOUT THE HUNT.
                </span>
              </h1>
              <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
                Open a repository, browse its structure, and get clear answers
                grounded in the source.
              </p>
            </div>
            <form className="space-y-3" onSubmit={submit}>
              <Input
                label="EMAIL"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
              <Button type="submit" variant="EXEC" className="w-full">
                CONTINUE <ArrowRight size={14} />
              </Button>
            </form>
            <p className="text-[0.6rem] text-[var(--text-muted)]">
              NO PASSWORD // SAVED ON THIS DEVICE
            </p>
          </PanelContent>
        </Panel>
      </div>
    </main>
  );
}
