function configuredOrigin(value: string | undefined, name: string): string | undefined {
  const configured = value?.trim();
  if (!configured) return undefined;

  try {
    const url = new URL(configured.includes("://") ? configured : `https://${configured}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    return url.origin;
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) URL or hostname.`);
  }
}

export function getDeploymentOrigins() {
  const site = configuredOrigin(process.env.NEXT_PUBLIC_SITE_URL, "NEXT_PUBLIC_SITE_URL");
  const auth = configuredOrigin(process.env.BETTER_AUTH_URL, "BETTER_AUTH_URL");
  const production = configuredOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    "VERCEL_PROJECT_PRODUCTION_URL",
  );
  const deployment = configuredOrigin(process.env.VERCEL_URL, "VERCEL_URL");
  const trusted = [site, auth, production, deployment].filter((origin): origin is string => origin !== undefined);
  return { canonical: site ?? auth ?? production ?? deployment, trusted: [...new Set(trusted)] };
}
