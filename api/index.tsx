import { Button, Frog, TextInput } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = 'NEYNAR_FROG_FM'; // Replace with your actual Neynar API key
const MASKS_BALANCE_API_URL = 'https://app.masks.wtf/api/balance';
const MASKS_PER_TIP_API_URL = 'https://app.masks.wtf/api/masksPerTip';
const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';
const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Masks Tipping Frame',
})

app.use(neynar({ apiKey: NEYNAR_API_KEY, features: [] }));

async function getFarcasterUserDetails(fid: string): Promise<any> {
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
  const { buttonValue, status, inputText } = c;

  if (status === 'initial') {
    return c.res({
      image: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(to right, #432889, #17101F)' }}>
          <div style={{ color: 'white', fontSize: 60, fontStyle: 'normal', letterSpacing: '-0.025em', lineHeight: 1.4, padding: '0 120px', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
            Masks Tipping Frame
          </div>
        </div>
      ),
      intents: [
        <Button value="fetch_user">Fetch User Details</Button>,
      ],
    });
  }

  if (buttonValue === 'fetch_user') {
    return c.res({
      image: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(to right, #432889, #17101F)' }}>
          <div style={{ color: 'white', fontSize: 40, fontStyle: 'normal', letterSpacing: '-0.025em', lineHeight: 1.4, padding: '0 120px', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
            Enter Farcaster ID (fid) to fetch user details:
          </div>
        </div>
      ),
      intents: [
        <TextInput placeholder="Enter fid (e.g., 7472)" />,
        <Button value="get_user_details">Get User Details</Button>,
        <Button.Reset>Reset</Button.Reset>,
      ],
    });
  }

  if (buttonValue === 'get_user_details' && inputText) {
    try {
      const userDetails = await getFarcasterUserDetails(inputText);
      const balanceResponse = await fetch(`${MASKS_BALANCE_API_URL}?fid=${inputText}`);
      const balanceData = await balanceResponse.json();
      const masksPerTip = await getMasksPerTip();

      return c.res({
        image: (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(to right, #432889, #17101F)', padding: '40px' }}>
            <div style={{ color: 'white', fontSize: 32, fontStyle: 'normal', letterSpacing: '-0.025em', lineHeight: 1.4, whiteSpace: 'pre-wrap', textAlign: 'left', width: '100%' }}>
              <div style={{ fontSize: 40, fontWeight: 'bold', marginBottom: '20px' }}>User Details for FID {inputText}:</div>
              <div>Username: {userDetails.userId}</div>
              <div>Followers: {userDetails.followerCount}</div>
              <div>Following: {userDetails.followingCount}</div>
              <div style={{ marginTop: '20px', fontSize: 36, fontWeight: 'bold' }}>Account Balance:</div>
              <div>MASK: {balanceData.MASK || 'N/A'}</div>
              <div>ETH: {balanceData.ETH || 'N/A'}</div>
              <div>WETH: {balanceData.WETH || 'N/A'}</div>
              <div style={{ marginTop: '20px', fontSize: 36, fontWeight: 'bold' }}>Tipping Info:</div>
              <div>$MASKS per tip: {masksPerTip}</div>
            </div>
          </div>
        ),
        intents: [
          <Button value="tip_user">Tip User</Button>,
          <Button value="fetch_user">Check Another User</Button>,
          <Button.Reset>Reset</Button.Reset>,
        ],
      });
    } catch (error) {
      return c.res({
        image: (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(to right, #FF0000, #8B0000)' }}>
            <div style={{ color: 'white', fontSize: 40, fontStyle: 'normal', letterSpacing: '-0.025em', lineHeight: 1.4, padding: '0 120px', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
              Error fetching user data. Please try again.
            </div>
          </div>
        ),
        intents: [
          <Button value="fetch_user">Try Again</Button>,
          <Button.Reset>Reset</Button.Reset>,
        ],
      });
    }
  }

  if (buttonValue === 'tip_user') {
    return c.res({
      image: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(to right, #432889, #17101F)' }}>
          <div style={{ color: 'white', fontSize: 40, fontStyle: 'normal', letterSpacing: '-0.025em', lineHeight: 1.4, padding: '0 120px', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
            Tipping functionality not yet implemented.
          </div>
        </div>
      ),
      intents: [
        <Button value="fetch_user">Check Another User</Button>,
        <Button.Reset>Reset</Button.Reset>,
      ],
    });
  }

  // Default response if no conditions are met
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(to right, #432889, #17101F)' }}>
        <div style={{ color: 'white', fontSize: 60, fontStyle: 'normal', letterSpacing: '-0.025em', lineHeight: 1.4, padding: '0 120px', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
          Unexpected State
        </div>
      </div>
    ),
    intents: [
      <Button.Reset>Reset</Button.Reset>,
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);