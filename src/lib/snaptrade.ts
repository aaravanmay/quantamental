import { Snaptrade } from "snaptrade-typescript-sdk";

let client: Snaptrade | null = null;

/**
 * Returns a singleton SnapTrade client initialized with env credentials.
 */
export function getClient(): Snaptrade {
  if (client) return client;

  const clientId = process.env.SNAPTRADE_CLIENT_ID;
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;

  if (!clientId || !consumerKey) {
    throw new Error(
      "Missing SNAPTRADE_CLIENT_ID or SNAPTRADE_CONSUMER_KEY environment variables"
    );
  }

  client = new Snaptrade({
    clientId,
    consumerKey,
  });

  return client;
}

/**
 * Register a new user with SnapTrade.
 * Returns the userId and userSecret needed for all subsequent calls.
 */
export async function registerUser(
  userId: string
): Promise<{ userId: string; userSecret: string }> {
  const snap = getClient();

  const response = await snap.authentication.registerSnapTradeUser({
    userId,
  });

  return {
    userId: response.data.userId ?? userId,
    userSecret: response.data.userSecret ?? "",
  };
}

/**
 * Generate an OAuth redirect URL so the user can connect their Fidelity account.
 */
export async function getLoginLink(
  userId: string,
  userSecret: string
): Promise<string> {
  const snap = getClient();

  const response = await snap.authentication.loginSnapTradeUser({
    userId,
    userSecret,
    broker: "FIDELITY",
  });

  const data = response.data as any;
  const redirectUri =
    data.redirectURI ?? data.loginRedirectURI ?? data.redirect_uri ?? data.login_redirect_uri ?? "";

  if (!redirectUri) {
    throw new Error("SnapTrade did not return a redirect URI");
  }

  return redirectUri;
}

/**
 * List all brokerage accounts connected for a user.
 */
export async function getAccounts(
  userId: string,
  userSecret: string
): Promise<
  Array<{
    id: string;
    name: string;
    number: string;
    institutionName: string;
  }>
> {
  const snap = getClient();

  const response = await snap.accountInformation.listUserAccounts({
    userId,
    userSecret,
  });

  return (response.data ?? []).map((account: any) => ({
    id: account.id ?? account.brokerage_account_id ?? "",
    name: account.name ?? account.brokerage_account_name ?? "Fidelity Account",
    number: account.number ?? account.brokerage_account_number ?? "",
    institutionName:
      account.institution_name ?? account.brokerage?.name ?? "Fidelity",
  }));
}

/**
 * Fetch holdings for a specific brokerage account.
 */
export async function getHoldings(
  userId: string,
  userSecret: string,
  accountId: string
): Promise<
  Array<{
    symbol: string;
    shares: number;
    averagePrice: number;
    currentPrice: number;
  }>
> {
  const snap = getClient();

  const response = await snap.accountInformation.getUserHoldings({
    userId,
    userSecret,
    accountId,
  });

  const positions = response.data?.positions ?? response.data ?? [];

  return (Array.isArray(positions) ? positions : []).map((pos: any) => {
    const symbol =
      pos.symbol?.symbol ??
      pos.symbol?.ticker ??
      pos.ticker ??
      pos.symbol ??
      "UNKNOWN";

    return {
      symbol: typeof symbol === "string" ? symbol : String(symbol),
      shares: Number(pos.units ?? pos.quantity ?? pos.shares ?? 0),
      averagePrice: Number(
        pos.average_purchase_price ?? pos.avg_cost ?? pos.averagePrice ?? 0
      ),
      currentPrice: Number(
        pos.price ?? pos.current_price ?? pos.currentPrice ?? 0
      ),
    };
  });
}

/**
 * Remove a user and all their connections from SnapTrade.
 */
export async function deleteUser(userId: string): Promise<void> {
  const snap = getClient();

  await snap.authentication.deleteSnapTradeUser({
    userId,
  });
}
