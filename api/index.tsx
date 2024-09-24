import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = 'NEYNAR_FROG_FM';
const MASKS_BALANCE_API_URL = 'https://app.masks.wtf/api/balance';
const MASKS_PER_TIP_API_URL = 'https://app.masks.wtf/api/masksPerTip';
const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';
const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Masks Tipping Frame',
});

app.use(
  neynar({
    apiKey: NEYNAR_API_KEY,
    features: ['interactor', 'cast'],
  })
);

async function getFarcasterUserDetails(fid: string) {
  const query = `
    query GetFarcasterUserDetails {
      Socials(
        input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: "${fid}"}}, blockchain: ethereum}
      ) {
        Social {
          dappName
          userId
          profileImage
          followerCount
          followingCount
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

async function getMasksPerTip(): Promise<number> {
  const response = await fetch(MASKS_PER_TIP_API_URL);
  const data = await response.json();
  return data.masksPerTip;
}

app.frame('/', async (c) => {
  const { buttonValue } = c;
  const fid = c.frameData?.fid?.toString();

  if (buttonValue === 'get_user_details' && fid) {
    try {
      const userDetails = await getFarcasterUserDetails(fid);
      const balanceResponse = await fetch(`${MASKS_BALANCE_API_URL}?fid=${fid}`);
      const balanceData = await balanceResponse.json();
      const masksPerTip = await getMasksPerTip();

      return c.res({
        image: (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'linear-gradient(to right, #432889, #17101F)', color: 'white', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: 'bold', marginBottom: '20px' }}>User Details for FID {fid}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>Username: {userDetails.userId || 'Unknown'}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>Followers: {userDetails.followerCount}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>Following: {userDetails.followingCount}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>MASK Balance: {balanceData.MASK || 'N/A'}</div>
            <div style={{ display: 'flex', fontSize: 24, marginBottom: '10px' }}>$MASKS per tip: {masksPerTip}</div>
          </div>
        ),
        intents: [
          <Button value="tip_user">Tip User</Button>,
          <Button value="refresh">Refresh Data</Button>,
        ],
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      return c.res({
        image: (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(to right, #FF0000, #8B0000)', color: 'white', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', marginBottom: '20px' }}>Error fetching user data</div>
            <div style={{ display: 'flex', fontSize: 24 }}>Please try again</div>
          </div>
        ),
        intents: [
          <Button value="get_user_details">Try Again</Button>,
        ],
      });
    }
  }

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(to right, #432889, #17101F)', color: 'white', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold', marginBottom: '20px' }}>Masks Tipping Frame</div>
        <div style={{ display: 'flex', fontSize: 24 }}>Click to fetch your details</div>
      </div>
    ),
    intents: [<Button value="get_user_details">Get User Details</Button>],
  });
});

export const GET = handle(app);
export const POST = handle(app);