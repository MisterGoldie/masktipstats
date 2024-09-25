import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';

const MASKS_BALANCE_API_URL = 'https://app.masks.wtf/api/balance';
const MASKS_PER_TIP_API_URL = 'https://app.masks.wtf/api/masksPerTip';
const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';
const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';

// Import the custom font
const fontFamily = "Inter, sans-serif";
const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
`;

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 628 },
  title: '$Masks Token Tracker',
  hub: {
    apiUrl: "https://hubs.airstack.xyz",
    fetchOptions: {
      headers: {
        "x-airstack-hubs": "103ba30da492d4a7e89e7026a6d3a234e",
      }
    }
  }
}).use(
  neynar({
    apiKey: 'NEYNAR_FROG_FM',
    features: ['interactor', 'cast'],
  })
);

interface ConnectedAddress {
  address: string;
  blockchain: string;
}

interface UserDetails {
  dappName: string;
  profileName: string;
  userId: string;
  followerCount: number;
  followingCount: number;
  connectedAddresses: ConnectedAddress[];
}

async function getFarcasterUserDetails(fid: string): Promise<UserDetails> {
  const query = `
    query GetUserConnectedWalletAddress {
      Socials(
        input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: "${fid}"}}, blockchain: ethereum}
      ) {
        Social {
          dappName
          profileName
          userId
          followerCount
          followingCount
          connectedAddresses {
            address
            blockchain
          }
        }
      }
    }
  `;

  const response = await fetch(AIRSTACK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': AIRSTACK_API_KEY,
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  return data.data.Socials.Social[0];
}

async function getMasksBalance(address: string): Promise<string> {
  const response = await fetch(`${MASKS_BALANCE_API_URL}?address=${address}`);
  const data = await response.json();
  return data.MASK || 'N/A';
}

async function getMasksPerTip(): Promise<number> {
  const response = await fetch(MASKS_PER_TIP_API_URL);
  const data = await response.json();
  return data.masksPerTip;
}

app.frame('/', async (c) => {
  const fid = c.frameData?.fid?.toString();

  if (fid) {
    try {
      const userDetails = await getFarcasterUserDetails(fid);
      const userAddress = userDetails.connectedAddresses?.find((addr: ConnectedAddress) => addr.blockchain === 'ethereum')?.address || 'N/A';
      const masksBalance = userAddress !== 'N/A' ? await getMasksBalance(userAddress) : 'N/A';
      const masksPerTip = await getMasksPerTip();

      return c.res({
        image: (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'linear-gradient(to right, #432889, #17101F)', color: 'white', fontFamily, padding: '20px' }}>
            <style>{fontImport}</style>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: 'bold', marginBottom: '20px' }}>User Details for FID {fid}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>Username: {userDetails.profileName || 'Unknown'}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>Wallet: {userAddress}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>Followers: {userDetails.followerCount}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>Following: {userDetails.followingCount}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>MASK Balance: {masksBalance}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>$MASKS per tip: {masksPerTip}</div>
          </div>
        ),
        intents: [
          <Button value="refresh">Refresh</Button>,
        ],
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      return c.res({
        image: (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(to right, #FF0000, #8B0000)', color: 'white', fontFamily, padding: '20px' }}>
            <style>{fontImport}</style>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', marginBottom: '20px' }}>Error fetching user data</div>
            <div style={{ display: 'flex', fontSize: 24 }}>Please try again</div>
          </div>
        ),
        intents: [
          <Button value="refresh">Try Again</Button>,
        ],
      });
    }
  }

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(to right, #432889, #17101F)', color: 'white', fontFamily, padding: '20px' }}>
        <style>{fontImport}</style>
        <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold', marginBottom: '20px' }}>Masks Tipping Frame</div>
        <div style={{ display: 'flex', fontSize: 24 }}>Click to fetch your details</div>
      </div>
    ),
    intents: [<Button value="refresh">Check $MASKS</Button>],
  });
});

export const GET = handle(app);
export const POST = handle(app);