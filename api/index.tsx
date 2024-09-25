import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';

const MASKS_BALANCE_API_URL = 'https://app.masks.wtf/api/balance';
const MASKS_PER_TIP_API_URL = 'https://app.masks.wtf/api/masksPerTip';
const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';
const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
const BACKGROUND_IMAGE_URL = 'https://bafybeiajbch2tb6veul2ydzqmzc62arz5vtpbycei3fcyehase5amv62we.ipfs.w3s.link/Frame%2059%20(5).png';

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 628 },
  title: '$Masks Token Tracker',
})
.use(
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

      const imageContent = `
        <svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <image href="${BACKGROUND_IMAGE_URL}" width="1200" height="628"/>
          <text x="50" y="80" font-family="Arial, sans-serif" font-size="32" fill="white" font-weight="bold">User Details for FID ${fid}</text>
          <text x="50" y="140" font-family="Arial, sans-serif" font-size="24" fill="white">Username: ${userDetails.profileName || 'Unknown'}</text>
          <text x="50" y="190" font-family="Arial, sans-serif" font-size="24" fill="white">Wallet: ${userAddress}</text>
          <text x="50" y="240" font-family="Arial, sans-serif" font-size="24" fill="white">Followers: ${userDetails.followerCount}</text>
          <text x="50" y="290" font-family="Arial, sans-serif" font-size="24" fill="white">Following: ${userDetails.followingCount}</text>
          <text x="50" y="340" font-family="Arial, sans-serif" font-size="24" fill="white">MASK Balance: ${masksBalance}</text>
          <text x="50" y="390" font-family="Arial, sans-serif" font-size="24" fill="white">$MASKS per tip: ${masksPerTip}</text>
        </svg>
      `;

      return c.res({
        image: imageContent,
        intents: [
          <Button value="refresh">Refresh</Button>,
        ],
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      return c.res({
        image: `
          <svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <image href="${BACKGROUND_IMAGE_URL}" width="1200" height="628"/>
            <text x="600" y="300" font-family="Arial, sans-serif" font-size="36" fill="white" text-anchor="middle">Error fetching user data</text>
            <text x="600" y="350" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">Please try again</text>
          </svg>
        `,
        intents: [
          <Button value="refresh">Try Again</Button>,
        ],
      });
    }
  }

  return c.res({
    image: `
      <svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image href="${BACKGROUND_IMAGE_URL}" width="1200" height="628"/>
        <text x="600" y="300" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" font-weight="bold">Masks Tipping Frame</text>
        <text x="600" y="360" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">Click to fetch your details</text>
      </svg>
    `,
    intents: [<Button value="refresh">Check $MASKS</Button>],
  });
});

export const GET = handle(app);
export const POST = handle(app);