import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";

let _app: App | null = null;

function getApp(): App {
  if (!_app) {
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, "\n");
    _app = new App({
      appId: process.env.GITHUB_APP_ID!,
      privateKey,
      Octokit,
      webhooks: { secret: process.env.GITHUB_APP_WEBHOOK_SECRET! },
      oauth: {
        clientId: process.env.GITHUB_APP_CLIENT_ID!,
        clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
      },
    });
  }
  return _app;
}

/**
 * Returns a fresh Octokit instance authenticated as the installation.
 * Never cached — installation tokens expire after 1 hour.
 */
export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  const app = getApp();
  return app.getInstallationOctokit(installationId) as Promise<Octokit>;
}

export function getGitHubApp(): App {
  return getApp();
}
