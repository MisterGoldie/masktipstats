import { Button, Frog, TextInput } from 'frog';
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

  const baseStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to right, #432889, #17101F)',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  };

  if (status === 'initial') {
    return c.res({
      image: (
        <div style={baseStyle}>
          <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold', marginBottom: '20px' }}>Masks Tipping Frame</div>
          <div style={{ display: 'flex', fontSize: 24 }}>Click to fetch user details</div>
        </div>
      ),
      intents: [<Button value="fetch_user">Fetch User Details</Button>],
    });
  }

  if (buttonValue === 'fetch_user') {
    return c.res({
      image: (
        <div style={baseStyle}>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', marginBottom: '20px' }}>Enter Farcaster ID (fid)</div>
          <div style={{ display: 'flex', fontSize: 24 }}>to fetch user details</div>
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
          <div style={baseStyle}>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: 'bold', marginBottom: '20px' }}>User Details for FID {inputText}</div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex' }}>Username: {userDetails.userId}</div>
                <div style={{ display: 'flex' }}>Followers: {userDetails.followerCount}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex' }}>Following: {userDetails.followingCount}</div>
                <div style={{ display: 'flex' }}>$MASKS per tip: {masksPerTip}</div>
              </div>
              <div style={{ display: 'flex', fontSize: 24, fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>Account Balance:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex' }}>MASK: {balanceData.MASK || 'N/A'}</div>
                <div style={{ display: 'flex' }}>ETH: {balanceData.ETH || 'N/A'}</div>
                <div style={{ display: 'flex' }}>WETH: {balanceData.WETH || 'N/A'}</div>
              </div>
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
          <div style={baseStyle}>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', marginBottom: '20px' }}>Error fetching user data</div>
            <div style={{ display: 'flex', fontSize: 24 }}>Please try again</div>
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
        <div style={baseStyle}>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', marginBottom: '20px' }}>Tipping functionality</div>
          <div style={{ display: 'flex', fontSize: 24 }}>not yet implemented</div>
        </div>
      ),
      intents: [
        <Button value="fetch_user">Check Another User</Button>,
        <Button.Reset>Reset</Button.Reset>,
      ],
    });
  }

  return c.res({
    image: (
      <div style={baseStyle}>
        <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold', marginBottom: '20px' }}>Unexpected State</div>
        <div style={{ display: 'flex', fontSize: 24 }}>Please reset and try again</div>
      </div>
    ),
    intents: [<Button.Reset>Reset</Button.Reset>],
  });
});

export const GET = handle(app);
export const POST = handle(app);