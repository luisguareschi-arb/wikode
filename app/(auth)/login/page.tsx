import { signIn } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github, Chrome } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--app-sidebar))]">
      <Card className="w-full max-w-md border-[hsl(var(--border))] shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--app-text))]">
            <span className="text-xl font-bold text-white">W</span>
          </div>
          <CardTitle className="text-2xl text-[hsl(var(--app-text))]">
            Sign in to Wikode
          </CardTitle>
          <CardDescription className="text-[hsl(var(--app-text-muted))]">
            AI chat for your private codebases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/chat" });
            }}
          >
            <Button type="submit" variant="outline" className="w-full gap-2">
              <Github className="h-4 w-4" />
              Continue with GitHub
            </Button>
          </form>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/chat" });
            }}
          >
            <Button type="submit" variant="outline" className="w-full gap-2">
              <Chrome className="h-4 w-4" />
              Continue with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
