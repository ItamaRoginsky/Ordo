// Auth0 Management API client — used for inviting users and blocking accounts.
// Requires AUTH0_MGMT_CLIENT_ID and AUTH0_MGMT_CLIENT_SECRET in .env.local

const domain = process.env.AUTH0_DOMAIN!;
const clientId = process.env.AUTH0_MGMT_CLIENT_ID!;
const clientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET!;

async function getManagementToken(): Promise<string> {
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export async function inviteUser(email: string): Promise<void> {
  const token = await getManagementToken();
  await fetch(`https://${domain}/api/v2/tickets/password-change`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      connection_id: "con_default", // update with your Auth0 connection ID
      ttl_sec: 604800, // 7 days
    }),
  });
}

export async function blockUser(auth0Id: string): Promise<void> {
  const token = await getManagementToken();
  await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(auth0Id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ blocked: true }),
  });
}

export async function unblockUser(auth0Id: string): Promise<void> {
  const token = await getManagementToken();
  await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(auth0Id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ blocked: false }),
  });
}
